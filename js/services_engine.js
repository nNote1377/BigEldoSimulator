/**
 * NAVI // PARTITION.SYS - THE WIRED SERVICES & DAEMONS ENGINE
 * Manages background daemons, partition requirements, cluster efficiency, income & police suspicion.
 */

class ServicesEngine {
  constructor(state) {
    this.state = state;
    this.serviceCatalog = [
      {
        id: "wired_relay",
        name: "Węzeł Przekaźnikowy The Wired",
        desc: "Podstawowy routing pakietów sieciowych w The Wired. Wymaga stabilnego systemu plików i partycji min. 15 GB.",
        minSizeGB: 15,
        requiredFs: ["EXT4", "NTFS", "ZFS"],
        preferredClusters: ["4KB", "16KB"],
        requiredMount: "/mnt/wired",
        powerWatts: 35,
        heatRate: 0.15,
        incomePerTick: 0.90, // PLN per 10 in-game minutes
        cryptoPerTick: 0.00008,
        illegal: false
      },
      {
        id: "scraper_bot",
        name: "Sieciowy Scraper Danych & Indeksator",
        desc: "Pobiera miliony mikroskopijnych plików i logów z sieci. Wymaga małych klastrów (512B lub 1KB), inaczej slack space zapycha dysk!",
        minSizeGB: 20,
        requiredFs: ["FAT32", "EXT4", "NTFS"],
        preferredClusters: ["512B", "1KB"],
        requiredMount: "/mnt/storage",
        powerWatts: 45,
        heatRate: 0.20,
        incomePerTick: 1.50,
        cryptoPerTick: 0.00015,
        illegal: false
      },
      {
        id: "p2p_seeder",
        name: "P2P Warez & Anime Mirror",
        desc: "Nocny seedbox dla cyfrowego podziemia. Lekki, działa nawet na starym FAT32, generuje stały drobny dochód.",
        minSizeGB: 10,
        requiredFs: ["FAT32", "NTFS", "EXT4"],
        preferredClusters: ["16KB", "64KB"],
        requiredMount: "/mnt/storage",
        powerWatts: 20,
        heatRate: 0.10,
        incomePerTick: 0.65,
        cryptoPerTick: 0.00005,
        illegal: false
      },
      {
        id: "crypto_validator",
        name: "Węzeł Walidacyjny WiredCoin (Mining)",
        desc: "Koparka i walidator transakcji kryptograficznych. Wysoki pobór mocy i ciepła! Wymaga klastrów 16KB lub 64KB.",
        minSizeGB: 35,
        requiredFs: ["EXT4", "ZFS", "NTFS"],
        preferredClusters: ["16KB", "64KB"],
        requiredMount: "/mnt/crypto",
        powerWatts: 110,
        heatRate: 0.55,
        incomePerTick: 0.30,
        cryptoPerTick: 0.00085,
        illegal: false
      },
      {
        id: "darknet_mirror",
        name: "Hosting Lustrzany DarkNetu",
        desc: "Nielegalny węzeł darknetu. Ogromne zyski, ale przyciąga policję! Wymaga szyfrowania LUKS, inaczej nalot to kwestia czasu.",
        minSizeGB: 30,
        requiredFs: ["LUKS", "EXT4", "ZFS"],
        preferredClusters: ["4KB"],
        requiredMount: "/mnt/darknet",
        powerWatts: 60,
        heatRate: 0.35,
        incomePerTick: 3.80,
        cryptoPerTick: 0.0018,
        illegal: true
      },
      {
        id: "corporate_vault",
        name: "Skarbiec Kopii Zapasowych Tachibana",
        desc: "Płatny bezpieczny skarbiec danych korporacyjnych. Wymaga odpornego na awarie systemu ZFS lub NTFS.",
        minSizeGB: 50,
        requiredFs: ["ZFS", "NTFS"],
        preferredClusters: ["4KB", "16KB"],
        requiredMount: "/mnt/vault",
        powerWatts: 50,
        heatRate: 0.25,
        incomePerTick: 2.80,
        cryptoPerTick: 0.0005,
        illegal: false
      }
    ];
  }

  // Find all partitions available in all disks
  getAllPartitions() {
    const list = [];
    for (const disk of this.state.disks) {
      for (const part of disk.partitions) {
        list.push({ disk, part });
      }
    }
    return list;
  }

  // Check detailed diagnostics for a partition against a service
  getPartitionDiagnostics(serviceDef, part) {
    if (!part) return null;
    const sizeOk = part.sizeGB >= serviceDef.minSizeGB;
    const fsOk = serviceDef.requiredFs.includes(part.fs);
    const mountOk = part.mount === serviceDef.requiredMount;
    const clusterIdeal = serviceDef.preferredClusters.includes(part.clusterSize);
    const willTripFuse = (this.state.currentWatts + serviceDef.powerWatts) > this.state.fuseMaxWatts;

    return {
      size: { ok: sizeOk, msg: `${part.sizeGB} GB (min. ${serviceDef.minSizeGB} GB)` },
      fs: { ok: fsOk, msg: `${part.fs} (wymagane: ${serviceDef.requiredFs.join(', ')})` },
      mount: { ok: mountOk, msg: `${part.mount} (wymagane: ${serviceDef.requiredMount})` },
      cluster: { ok: clusterIdeal, msg: `${part.clusterSize} ${clusterIdeal ? '(optymalne)' : '(-20% wydajności)'}` },
      power: { ok: !willTripFuse, msg: `+${serviceDef.powerWatts}W ${willTripFuse ? '⚠️ WYBIJE KORKI!' : '(w normie)'}` },
      allValid: sizeOk && fsOk && mountOk
    };
  }

  // Check if a partition meets service requirements
  validatePartitionForService(serviceDef, part) {
    if (part.sizeGB < serviceDef.minSizeGB) {
      return { 
        valid: false, 
        reason: `Za mały rozmiar partycji (${part.sizeGB} GB < ${serviceDef.minSizeGB} GB). Rozwiązanie: Stwórz w Menedżerze Dysków partycję o rozmiarze min. ${serviceDef.minSizeGB} GB.` 
      };
    }
    if (!serviceDef.requiredFs.includes(part.fs)) {
      return { 
        valid: false, 
        reason: `Nieobsługiwany system plików (${part.fs}). Usługa wymaga: ${serviceDef.requiredFs.join(' lub ')}. Rozwiązanie: W Menedżerze Dysków kliknij 'Formatuj' i wybierz ${serviceDef.requiredFs[0]}.` 
      };
    }
    if (part.mount !== serviceDef.requiredMount) {
      return { 
        valid: false, 
        reason: `Nieprawidłowy punkt montowania (${part.mount}). Usługa wymaga montowania w '${serviceDef.requiredMount}'. Rozwiązanie: W Menedżerze Dysków kliknij 'Formatuj' i zmień Punkt Montowania na '${serviceDef.requiredMount}'.` 
      };
    }

    // Cluster efficiency factor (0.5 to 1.2x)
    let clusterMultiplier = 1.0;
    if (serviceDef.preferredClusters.includes(part.clusterSize)) {
      clusterMultiplier = 1.2; // Bonus for ideal allocation unit size
    } else {
      clusterMultiplier = 0.8; // Penalty for slack space or random access latency
    }

    return { valid: true, clusterMultiplier };
  }

  // Start a service on a partition
  startService(serviceId, partId) {
    const def = this.serviceCatalog.find(s => s.id === serviceId);
    if (!def) return { success: false, msg: "Nie znaleziono usługi." };

    const all = this.getAllPartitions();
    const entry = all.find(e => e.part.id === partId);
    if (!entry) return { success: false, msg: "Nie znaleziono wybranej partycji." };

    const validation = this.validatePartitionForService(def, entry.part);
    if (!validation.valid) {
      return { success: false, msg: validation.reason };
    }

    // Detach from previous partition if running
    this.stopService(serviceId);

    // Attach to partition
    entry.part.serviceId = serviceId;

    this.state.services.push({
      serviceId: serviceId,
      diskId: entry.disk.id,
      partId: partId,
      clusterMultiplier: validation.clusterMultiplier,
      trafficMBps: (1.5 + Math.random() * 8.0).toFixed(1)
    });

    window.audioEngine?.playHddSeek(1.2);
    window.gameUI?.showToast(`Uruchomiono usługę: ${def.name}`, "success");
    this.state.notify();
    return { success: true };
  }

  // Stop running service
  stopService(serviceId) {
    const index = this.state.services.findIndex(s => s.serviceId === serviceId);
    if (index !== -1) {
      const running = this.state.services[index];
      const all = this.getAllPartitions();
      const entry = all.find(e => e.part.id === running.partId);
      if (entry) {
        entry.part.serviceId = null;
      }
      this.state.services.splice(index, 1);
      this.state.notify();
    }
  }

  // Tick calculation for economy, power and heat
  tickProcess() {
    if (this.state.fuseTripped) return; // No power, no services

    let totalWatts = 50; // Baseline PC idle
    let totalHeat = 0.05; // Ambient baseline heat
    let totalIncome = 0;
    let totalCrypto = 0;

    // Disks idle power & heat
    for (const disk of this.state.disks) {
      totalWatts += disk.powerWatts;
      totalHeat += disk.heatRate;
    }

    // Running services power, heat, and income
    for (const s of this.state.services) {
      const def = this.serviceCatalog.find(c => c.id === s.serviceId);
      if (!def) continue;

      totalWatts += def.powerWatts;
      totalHeat += def.heatRate;

      const earnedPLN = def.incomePerTick * s.clusterMultiplier;
      const earnedCrypto = def.cryptoPerTick * s.clusterMultiplier;

      totalIncome += earnedPLN;
      totalCrypto += earnedCrypto;

      // Check illegal status and police threat
      if (def.illegal) {
        const all = this.getAllPartitions();
        const entry = all.find(e => e.part.id === s.partId);
        if (entry && !entry.part.encrypted && entry.part.fs !== "LUKS") {
          // Unencrypted darknet data increases police suspicion!
          this.state.policeThreat = Math.min(100, this.state.policeThreat + 1.2);
        } else {
          // Encrypted LUKS partition is safe from automated sniffer!
          this.state.policeThreat = Math.max(0, this.state.policeThreat - 0.2);
        }
      }

      // Random I/O sound effect
      if (Math.random() < 0.25) {
        window.audioEngine?.playHddSeek(0.4);
      }
    }

    // Cooling pump power draw
    if (this.state.coolingPumpActive) {
      totalWatts += 40;
    }

    this.state.currentWatts = totalWatts;
    this.state.money += totalIncome;
    this.state.crypto += totalCrypto;

    // Power bill accrual (kWh = Watts * hours / 1000; 1 tick = 1/6th hour)
    const kwhDelta = (totalWatts * (1 / 6)) / 1000;
    this.state.powerKwhAccrued += kwhDelta;
    this.state.powerBillAmount += kwhDelta * this.state.powerKwhRate;

    // Circuit breaker overload check!
    if (this.state.currentWatts > this.state.fuseMaxWatts) {
      this.state.fuseTripped = true;
      window.audioEngine?.playFuseTrip();
      window.gameUI?.showToast(`WYBIŁO BEZPIECZNIK! Pobór (${Math.round(this.state.currentWatts)}W) przekroczył limit (${this.state.fuseMaxWatts}W)!`, "error");
      return;
    }

    // Thermal simulation
    let tempDelta = (totalHeat * (1 / 6));
    if (this.state.windowOpen) {
      // Room cools towards ambient temp (19°C)
      const diff = this.state.roomTemp - this.state.ambientTemp;
      tempDelta -= diff * 0.08;
    }
    if (this.state.coolingPumpActive && this.state.coolingFluidLevel > 0) {
      tempDelta -= 0.18;
      this.state.coolingFluidLevel = Math.max(0, this.state.coolingFluidLevel - 0.05);
    }
    this.state.roomTemp = Math.max(16.0, this.state.roomTemp + tempDelta);

    // Update dynamic fan speed sound based on load & temp
    const loadFrac = Math.min(1.0, this.state.currentWatts / this.state.fuseMaxWatts);
    window.audioEngine?.updateFanSpeed(loadFrac, this.state.roomTemp);

    // Thermal throttling & drive damage warning
    if (this.state.roomTemp > 45.0 && Math.random() < 0.2) {
      const damagedDisk = this.state.disks[Math.floor(Math.random() * this.state.disks.length)];
      if (damagedDisk) {
        damagedDisk.health = Math.max(5, damagedDisk.health - 2);
        const badIdx = Math.floor(Math.random() * 128);
        if (!damagedDisk.badSectors.includes(badIdx)) damagedDisk.badSectors.push(badIdx);
        window.gameUI?.showToast(`PRZEGRZANIE (${this.state.roomTemp.toFixed(1)}°C)! Dysk ${damagedDisk.model} ulega degradacji termicznej!`, "error");
      }
    }

    // Police Raid check if threat reaches 100%
    if (this.state.policeThreat >= 100 && !this.state.policeRaidPending) {
      this.state.policeRaidPending = true;
      window.audioEngine?.playAlert();
      window.gameUI?.showToast("ALARM: Wykryto nakaz przeszukania policji cybernetycznej! Masz 1 minutę na szyfrowanie lub czyszczenie dysków (/dev/zero)!", "error");
    }
  }
}

// Global services engine singleton
window.servicesEngine = new ServicesEngine(window.gameState);
