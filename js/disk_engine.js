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
    if (sizeGB <= 0) {
      return { allowed: false, reason: "Rozmiar partycji musi być większy niż 0 GB!" };
    }
    if (sizeGB > unallocated) {
      return { 
        allowed: false, 
        reason: `Brak wystarczającej ilości miejsca! Żądasz ${sizeGB} GB, a na dysku ${disk.dev} wolne jest tylko ${unallocated} GB. Zmniejsz rozmiar suwakiem.` 
      };
    }

    if (disk.tableType === "MBR") {
      if (disk.partitions.length >= 4) {
        return { 
          allowed: false, 
          reason: "Limit tablicy MBR: Standard MBR obsługuje maksymalnie 4 partycje podstawowe! Aby mieć więcej partycji, przekonwertuj inny dysk na GPT lub usuń zbędną partycję." 
        };
      }
      if (disk.sizeGB > 2048) {
        return { allowed: false, reason: "Tablica MBR nie obsługuje dysków powyżej 2 TB (2048 GB). Wymagana tablica GPT!" };
      }
    }

    // Progression tier validation with clear instructions where to buy
    if (requestedFs === "NTFS" || requestedFs === "EXT4" || requestedFs === "SWAP") {
      if (this.state.toolTier < 2) {
        return { 
          allowed: false, 
          reason: "Twój podstawowy program fdisk 1.0 obsługuje tylko FAT16/FAT32. Aby formatować w NTFS/EXT4/SWAP, kup licencję 'Partition Wizard 98 (Tier 2)' na Giełdzie w zakładce Narzędzia & Licencje!" 
        };
      }
    } else if (requestedFs === "ZFS") {
      if (this.state.toolTier < 3) {
        return { 
          allowed: false, 
          reason: "Zaawansowany system plików ZFS wymaga pakietu 'GParted LVM & ZFS Pro (Tier 3)'. Kup go na Giełdzie w zakładce Narzędzia & Licencje!" 
        };
      }
    } else if (requestedFs === "LUKS") {
      if (this.state.toolTier < 4) {
        return { 
          allowed: false, 
          reason: "Wojskowe szyfrowanie partycji LUKS wymaga modułu 'NAVI Hyper-Storage (Tier 4)'. Kup go na Giełdzie w zakładce Narzędzia & Licencje!" 
        };
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
    if (part.isSystem || part.mount === "/" || part.label === "SYSTEM_OS") {
      return { 
        success: false, 
        msg: "BLOKADA JĄDRA: Nie możesz usunąć partycji systemowej (SYSTEM_OS)! Bez niej Twój komputer ulegnie natychmiastowej awarii (Kernel Panic)." 
      };
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

    // Protect system partition from being broken
    if (part.isSystem || part.mount === "/" || part.label === "SYSTEM_OS") {
      if (fs === "SWAP") {
        return { 
          success: false, 
          msg: "BŁĄD: Partycja systemowa nie może być przestrzenią SWAP! System operacyjny wymaga partycji ze strukturą plików (EXT4, NTFS lub ZFS)." 
        };
      }
      mount = "/"; // Force keep root mount
    }

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

    const hasSystemPart = disk.partitions.some(p => p.isSystem || p.mount === "/" || p.label === "SYSTEM_OS");
    if (hasSystemPart) {
      return { 
        success: false, 
        msg: "BLOKADA JĄDRA: Dysk zawiera partycję systemową (SYSTEM_OS). Zmiana tablicy partycji skasowałaby system operacyjny!" 
      };
    }

    if (newType === "GPT" && this.state.toolTier < 3) {
      return { success: false, msg: "Tablica GPT wymaga narzędzi GParted LVM Pro (Tier 3)! Kup licencję na Giełdzie w zakładce Narzędzia & Licencje." };
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

    const hasSystemPart = disk.partitions.some(p => p.isSystem || p.mount === "/" || p.label === "SYSTEM_OS");
    if (hasSystemPart) {
      return { 
        success: false, 
        msg: "BLOKADA BEZPIECZEŃSTWA: Dysk /dev/sda zawiera partycję systemową Copland OS. Nie możesz wyzerować własnego systemu operacyjnego!" 
      };
    }

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
