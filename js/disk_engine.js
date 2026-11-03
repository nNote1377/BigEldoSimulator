/**
 * NAVI // PARTITION.SYS - DISK & PARTITION ENGINE
 * Manages partition tables (MBR/GPT), cluster sizes, file systems, S.M.A.R.T. bad sectors & dd wipes.
 */

class DiskEngine {
  constructor(state) {
    this.state = state;
  }

  // Get active selected disk object
  getActiveDisk() {
    return this.state.disks.find(d => d.id === this.state.selectedDiskId) || this.state.disks[0];
  }

  // Calculate allocated and unallocated space in GB
  getDiskSpaceUsage(disk) {
    const allocated = disk.partitions.reduce((acc, p) => acc + p.sizeGB, 0);
    const unallocated = Math.max(0, disk.sizeGB - allocated);
    return { allocated, unallocated };
  }

  // Check if partition creation is valid under MBR / GPT constraints
  canCreatePartition(disk, sizeGB, requestedFs) {
    const { unallocated } = this.getDiskSpaceUsage(disk);
    if (sizeGB <= 0 || sizeGB > unallocated) {
      return { allowed: false, reason: `Brak wystarczającej ilości miejsca! Dostępne: ${unallocated} GB.` };
    }

    if (disk.tableType === "MBR") {
      if (disk.partitions.length >= 4) {
        return { allowed: false, reason: "Limit tablicy MBR: maksymalnie 4 partycje podstawowe! Przekonwertuj dysk na GPT." };
      }
      if (disk.sizeGB > 2048) {
        return { allowed: false, reason: "Tablica MBR nie obsługuje dysków powyżej 2 TB (2048 GB). Wymagane GPT!" };
      }
    }

    // Progression tier validation
    if (requestedFs === "NTFS" || requestedFs === "EXT4" || requestedFs === "SWAP") {
      if (this.state.toolTier < 2) {
        return { allowed: false, reason: "Twój system (fdisk 1.0) nie obsługuje jeszcze NTFS/EXT4. Wymagany Partition Wizard (Tier 2)!" };
      }
    } else if (requestedFs === "ZFS") {
      if (this.state.toolTier < 3) {
        return { allowed: false, reason: "System plików ZFS wymaga pakietu GParted Pro / LVM (Tier 3)!" };
      }
    } else if (requestedFs === "LUKS") {
      if (this.state.toolTier < 4) {
        return { allowed: false, reason: "Szyfrowanie wojskowe LUKS wymaga modułu NAVI Hyper-Storage (Tier 4)!" };
      }
    }

    return { allowed: true };
  }

  // Create a new partition on a disk
  createPartition(diskId, label, sizeGB, fs, clusterSize, mount, encrypted = false) {
    const disk = this.state.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, msg: "Nie znaleziono dysku." };

    const check = this.canCreatePartition(disk, sizeGB, fs);
    if (!check.allowed) {
      return { success: false, msg: check.reason };
    }

    const nextIndex = disk.partitions.length + 1;
    const devName = `${disk.dev}${nextIndex}`;
    const newPart = {
      id: `part-${disk.id}-${Date.now()}`,
      dev: devName,
      label: label.trim() || `PART_${nextIndex}`,
      sizeGB: parseFloat(sizeGB),
      fs: fs,
      clusterSize: clusterSize,
      mount: mount,
      encrypted: encrypted || (fs === "LUKS"),
      serviceId: null,
      corrupted: false
    };

    disk.partitions.push(newPart);
    this.state.selectedPartId = newPart.id;

    // Mechanical HDD sound
    window.audioEngine?.playHddSeek(1.2);
    this.state.notify();
    return { success: true, part: newPart };
  }

  // Delete partition
  deletePartition(diskId, partId) {
    const disk = this.state.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, msg: "Nie znaleziono dysku." };

    const index = disk.partitions.findIndex(p => p.id === partId);
    if (index === -1) return { success: false, msg: "Nie znaleziono partycji." };

    const part = disk.partitions[index];

    // Check if system root partition
    if (part.mount === "/") {
      return { success: false, msg: "Ostrzeżenie jądra: nie możesz usunąć partycji głównej systemu montowania (/)!" };
    }

    // Stop associated service if any
    if (part.serviceId) {
      window.servicesEngine?.stopService(part.serviceId);
    }

    disk.partitions.splice(index, 1);
    this.state.selectedPartId = null;

    window.audioEngine?.playHddSeek(0.8);
    this.state.notify();
    return { success: true };
  }

  // Format existing partition
  formatPartition(diskId, partId, fs, clusterSize, mount, encrypted = false) {
    const disk = this.state.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, msg: "Nie znaleziono dysku." };

    const part = disk.partitions.find(p => p.id === partId);
    if (!part) return { success: false, msg: "Nie znaleziono partycji." };

    // Stop service if running
    if (part.serviceId) {
      window.servicesEngine?.stopService(part.serviceId);
    }

    part.fs = fs;
    part.clusterSize = clusterSize;
    part.mount = mount;
    part.encrypted = encrypted || (fs === "LUKS");
    part.corrupted = false;

    window.audioEngine?.playHddSeek(1.5);
    this.state.notify();
    return { success: true };
  }

  // Convert partition table MBR <-> GPT
  changeTableType(diskId, newType) {
    const disk = this.state.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, msg: "Nie znaleziono dysku." };

    if (newType === "GPT" && this.state.toolTier < 3) {
      return { success: false, msg: "Tablica GPT wymaga narzędzi GParted LVM Pro (Tier 3)!" };
    }

    // Stop all running services on this disk
    disk.partitions.forEach(p => {
      if (p.serviceId) window.servicesEngine?.stopService(p.serviceId);
    });

    disk.tableType = newType;
    disk.partitions = []; // Partition table conversion wipes table entries
    this.state.selectedPartId = null;

    window.audioEngine?.playHddSeek(2.0);
    this.state.notify();
    return { success: true };
  }

  // Perform S.M.A.R.T. Surface Scan for bad sectors
  scanBadSectors(diskId) {
    const disk = this.state.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, msg: "Nie znaleziono dysku." };

    window.audioEngine?.playHddSeek(2.5);

    // Random chance of discovering new bad sector if health is low
    if (disk.health < 90 && Math.random() < 0.4) {
      const newBad = Math.floor(Math.random() * 128);
      if (!disk.badSectors.includes(newBad)) {
        disk.badSectors.push(newBad);
      }
    }

    this.state.notify();
    return { 
      success: true, 
      count: disk.badSectors.length,
      health: disk.health 
    };
  }

  // Remap bad sectors from spare sector reserve
  remapBadSectors(diskId) {
    const disk = this.state.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, msg: "Nie znaleziono dysku." };

    if (this.state.toolTier < 2) {
      return { success: false, msg: "Remapowanie S.M.A.R.T. wymaga co najmniej Partition Wizard (Tier 2)!" };
    }

    if (disk.badSectors.length === 0) {
      return { success: false, msg: "Brak uszkodzonych sektorów do remapowania." };
    }

    const remapped = [...disk.badSectors];
    disk.remappedSectors.push(...remapped);
    disk.badSectors = [];
    disk.health = Math.max(10, disk.health - (remapped.length * 2));

    window.audioEngine?.playHddSeek(1.8);
    this.state.notify();
    return { success: true, count: remapped.length };
  }

  // Panic Zero Wipe (/dev/zero) - Instant wipe to erase illegal data during police scan
  panicZeroWipe(diskId) {
    const disk = this.state.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, msg: "Nie znaleziono dysku." };

    // Stop all services
    disk.partitions.forEach(p => {
      if (p.serviceId) window.servicesEngine?.stopService(p.serviceId);
    });

    disk.partitions = [];
    this.state.selectedPartId = null;

    // Reset police threat for wiped data
    this.state.policeThreat = Math.max(0, this.state.policeThreat - 40);

    window.audioEngine?.playAlert();
    window.audioEngine?.playHddSeek(3.0);
    this.state.notify();
    return { success: true };
  }
}

// Global disk engine singleton
window.diskEngine = new DiskEngine(window.gameState);
