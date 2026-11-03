/**
 * NAVI // PARTITION.SYS 2.0 - DISK & PARTITION ENGINE
 * Manages MBR/GPT tables, cluster sizes, file systems, S.M.A.R.T. bad sectors,
 * lease breach penalties, Software RAID 0/1/JBOD and Scrap Data Forensics.
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
      corrupted: false,
      isSystem: false,
      leasedContractId: null,
      inRaid: false,
      raidId: null
    };

    disk.partitions.push(newPart);
    this.state.selectedPartId = newPart.id;

    // Mechanical HDD sound
    window.audioEngine?.playHddSeek(1.2);
    this.state.notify();
    return { success: true, part: newPart };
  }

  // Delete partition (Checks for system protection and lease breach)
  deletePartition(diskId, partId, forceBreach = false) {
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

    // Check if part is in RAID
    if (part.inRaid) {
      return {
        success: false,
        msg: "Partycja jest częścią aktywnej macierzy RAID! Rozwiąż macierz w Kreatorze RAID przed jej usunięciem."
      };
    }

    // Check if part is leased to a client
    if (part.leasedContractId && !forceBreach) {
      const lease = this.state.leasedContracts.find(c => c.id === part.leasedContractId);
      return {
        requiresBreachConfirmation: true,
        actionType: 'delete',
        diskId: disk.id,
        partId: part.id,
        lease: lease,
        penalty: lease ? lease.penaltyAmount : 300,
        client: lease ? lease.client : "Klient Biznesowy"
      };
    }

    // If force breach confirmed by user
    if (part.leasedContractId && forceBreach) {
      this.breakLease(part.leasedContractId);
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

  // Format existing partition (Checks for system protection and lease breach)
  formatPartition(diskId, partId, fs, clusterSize, mount, encrypted = false, forceBreach = false) {
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

    // Check if part is in RAID
    if (part.inRaid) {
      return {
        success: false,
        msg: "Partycja jest częścią aktywnej macierzy RAID! Rozwiąż macierz w Kreatorze RAID przed jej formatowaniem."
      };
    }

    // Check if leased to a client
    if (part.leasedContractId && !forceBreach) {
      const lease = this.state.leasedContracts.find(c => c.id === part.leasedContractId);
      return {
        requiresBreachConfirmation: true,
        actionType: 'format',
        diskId: disk.id,
        partId: part.id,
        lease: lease,
        penalty: lease ? lease.penaltyAmount : 300,
        client: lease ? lease.client : "Klient Biznesowy",
        formatParams: { fs, clusterSize, mount, encrypted }
      };
    }

    // If force breach confirmed
    if (part.leasedContractId && forceBreach) {
      this.breakLease(part.leasedContractId);
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

  // Execute Lease Breach: charges penalty, enters debt if needed, drops reputation
  breakLease(leaseId) {
    const leaseIdx = this.state.leasedContracts.findIndex(c => c.id === leaseId);
    if (leaseIdx === -1) return;
    const lease = this.state.leasedContracts[leaseIdx];

    const penalty = lease.penaltyAmount || 350.0;
    this.state.money -= penalty;

    // Bank Debt Line if money is negative
    if (this.state.money < 0) {
      this.state.debtBalance += Math.abs(this.state.money);
      this.state.money = 0.0;
      this.state.debtDaysRemaining = 5;
    }

    this.state.reputation = Math.max(0, this.state.reputation - 20);

    // Unlink from partition
    for (const d of this.state.disks) {
      for (const p of d.partitions) {
        if (p.leasedContractId === leaseId) {
          p.leasedContractId = null;
        }
      }
    }

    this.state.leasedContracts.splice(leaseIdx, 1);
    window.audioEngine?.playAlert();
    window.gameUI?.showToast(`ZERWANO UMOWĘ Z KLIENTEM: Pobrano karę ${penalty.toFixed(2)} PLN! Reputacja -20 pkt.`, "error");
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

    const hasLeased = disk.partitions.some(p => p.leasedContractId != null);
    if (hasLeased) {
      return {
        success: false,
        msg: "BLOKADA: Dysk zawiera wynajęte partycje dla klientów! Zerwij lub dokończ umowy najmu przed konwersją tablicy dysku."
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

  // --- SOFTWARE RAID ENGINE ---
  createRaidArray(name, type, partId1, partId2) {
    if (this.state.toolTier < 3) {
      return { success: false, msg: "Tworzenie macierzy RAID wymaga pakietu GParted LVM & ZFS Pro (Tier 3)!" };
    }

    const all = window.servicesEngine.getAllPartitions();
    const entry1 = all.find(e => e.part.id === partId1);
    const entry2 = all.find(e => e.part.id === partId2);

    if (!entry1 || !entry2) {
      return { success: false, msg: "Nie znaleziono wskazanych partycji do macierzy." };
    }

    if (entry1.disk.id === entry2.disk.id && (type === 'RAID1' || type === 'RAID0')) {
      return { success: false, msg: "Zalecenie inżynieryjne: Macierz RAID powinna łączyć partycje z DWÓCH RÓŻNYCH fizycznych dysków dla zysku I/O lub bezpieczeństwa!" };
    }

    const p1 = entry1.part;
    const p2 = entry2.part;

    if (p1.isSystem || p2.isSystem) {
      return { success: false, msg: "Partycja systemowa nie może zostać włączona do macierzy RAID woluminów danych!" };
    }

    if (p1.leasedContractId || p2.leasedContractId) {
      return { success: false, msg: "Partycje wynajęte dla klientów nie mogą być modyfikowane w macierz RAID!" };
    }

    if (p1.inRaid || p2.inRaid) {
      return { success: false, msg: "Jedna z wybranych partycji jest już włączona do innej macierzy RAID!" };
    }

    if ((type === 'RAID0' || type === 'RAID1') && Math.abs(p1.sizeGB - p2.sizeGB) > 1) {
      return { success: false, msg: `Wymóg ${type}: Obie partycje muszą mieć identyczny rozmiar! (${p1.sizeGB} GB vs ${p2.sizeGB} GB)` };
    }

    const arrayId = `raid-${Date.now()}`;
    const effectiveSize = (type === 'RAID1') ? p1.sizeGB : (p1.sizeGB + p2.sizeGB);

    const newRaid = {
      id: arrayId,
      name: name.trim() || `MD_${type}_0`,
      type: type, // 'RAID0' | 'RAID1' | 'JBOD'
      partIds: [p1.id, p2.id],
      devNames: [p1.dev, p2.dev],
      sizeGB: effectiveSize,
      status: 'HEALTHY'
    };

    p1.inRaid = true;
    p1.raidId = arrayId;
    p2.inRaid = true;
    p2.raidId = arrayId;

    this.state.raidArrays.push(newRaid);
    window.audioEngine?.playHddSeek(2.0);
    this.state.notify();
    return { success: true, raid: newRaid };
  }

  deleteRaidArray(raidId) {
    const idx = this.state.raidArrays.findIndex(r => r.id === raidId);
    if (idx === -1) return { success: false, msg: "Nie znaleziono macierzy." };

    const raid = this.state.raidArrays[idx];
    const all = window.servicesEngine.getAllPartitions();
    all.forEach(e => {
      if (raid.partIds.includes(e.part.id)) {
        e.part.inRaid = false;
        e.part.raidId = null;
      }
    });

    this.state.raidArrays.splice(idx, 1);
    this.state.notify();
    return { success: true };
  }

  // --- DATA FORENSICS & SCRAP CARVING ---
  scanForRecoverableData(diskId) {
    const disk = this.state.disks.find(d => d.id === diskId);
    if (!disk) return { success: false, msg: "Nie znaleziono dysku." };

    window.audioEngine?.playHddSeek(2.8);

    const secretPool = [
      { name: "baza_klientow_tachibana.db", desc: "Poufna lista klientów korporacji z numerami kart.", valuePLN: 380, valueCrypto: 0.0012 },
      { name: "portfel_btc_2011.dat", desc: "Zapomniany stary portfel z odnalezionym kluczem prywatnym.", valuePLN: 150, valueCrypto: 0.0045 },
      { name: "raport_inwigilacji_policji.pdf", desc: "Tajny dokument operacyjny wydziału do walki z cyberprzestępczością.", valuePLN: 520, valueCrypto: 0.0008 },
      { name: "schemat_chlodzenia_v2.cad", desc: "Plany przemysłowego radiatora o podwyższonej wydajności.", valuePLN: 240, valueCrypto: 0.0003 }
    ];

    // 40% chance of carving a file on used/scrap disks if not previously carved
    if (Math.random() < 0.45) {
      const template = secretPool[Math.floor(Math.random() * secretPool.length)];
      const file = {
        id: `file-${Date.now()}`,
        name: template.name,
        desc: template.desc,
        valuePLN: template.valuePLN,
        valueCrypto: template.valueCrypto,
        sourceDisk: disk.dev,
        sold: false
      };
      this.state.recoveredDataFiles.push(file);
      this.state.notify();
      return { success: true, found: true, file: file };
    }

    return { success: true, found: false };
  }

  sellRecoveredData(fileId) {
    const file = this.state.recoveredDataFiles.find(f => f.id === fileId);
    if (!file || file.sold) return { success: false, msg: "Plik nie istnieje lub został już sprzedany." };

    file.sold = true;
    this.state.money += file.valuePLN;
    this.state.crypto += file.valueCrypto;
    window.audioEngine?.playBeep(980, 0.15);
    window.gameUI?.showToast(`Sprzedano na czarnym rynku: ${file.name} (+${file.valuePLN} PLN, +${file.valueCrypto} Ⓦ)!`, "success");
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
      if (p.leasedContractId) this.breakLease(p.leasedContractId);
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
