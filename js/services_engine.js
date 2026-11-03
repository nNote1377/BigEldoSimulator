/**
 * NAVI // PARTITION.SYS 2.0 - WIRED SERVICES, LEASING & SIMULATION ENGINE
 * Handles daemons, dynamic weather, noise, dust, AC, dedicated crypto mining,
 * long-term volume leasing lifecycle, P&L financial auditing, and bank debt collectors.
 */

class ServicesEngine {
  constructor(state) {
    this.state = state;
    this.serviceCatalog = [
      {
        id: "wired_relay",
        name: "Węzeł Przekaźnikowy The Wired",
        desc: "Podstawowy routing pakietów sieciowych. Wymaga stabilnego systemu plików i min. 15 GB.",
        minSizeGB: 15,
        requiredFs: ["EXT4", "NTFS", "ZFS"],
        preferredClusters: ["4KB", "16KB"],
        requiredMount: "/mnt/wired",
        powerWatts: 30,
        heatRate: 0.12,
        incomePerTick: 0.40, // ~24 PLN / day (Rebalanced)
        cryptoPerTick: 0.0, // Standard services don't generate crypto magically!
        illegal: false
      },
      {
        id: "scraper_bot",
        name: "Sieciowy Scraper Danych & Indeksator",
        desc: "Pobiera tysiące mikroskopijnych plików i logów. Wymaga małych klastrów (512B lub 1KB).",
        minSizeGB: 20,
        requiredFs: ["FAT32", "EXT4", "NTFS"],
        preferredClusters: ["512B", "1KB"],
        requiredMount: "/mnt/storage",
        powerWatts: 45,
        heatRate: 0.18,
        incomePerTick: 0.65, // ~39 PLN / day
        cryptoPerTick: 0.0,
        illegal: false
      },
      {
        id: "p2p_seeder",
        name: "P2P Warez & Anime Mirror",
        desc: "Lekki seedbox podziemia. Działa nawet na FAT32, generuje stały drobny dochód.",
        minSizeGB: 10,
        requiredFs: ["FAT32", "NTFS", "EXT4"],
        preferredClusters: ["16KB", "64KB"],
        requiredMount: "/mnt/storage",
        powerWatts: 20,
        heatRate: 0.08,
        incomePerTick: 0.25, // ~15 PLN / day
        cryptoPerTick: 0.0,
        illegal: false
      },
      {
        id: "crypto_miner",
        name: "Węzeł Wydobywczy WiredCoin (Mining Pool)",
        desc: "Dedykowana koparka PoW/PoS! Pożera mnóstwo prądu (160W) i potężnie grzeje pokój. Wymaga klastrów 64KB. RAID 0 podwaja zysk!",
        minSizeGB: 35,
        requiredFs: ["EXT4", "ZFS", "NTFS"],
        preferredClusters: ["64KB"],
        requiredMount: "/mnt/crypto",
        powerWatts: 160, // Heavy wattage!
        heatRate: 0.70, // Heavy heat!
        incomePerTick: 0.05,
        cryptoPerTick: 0.0018, // Intentional source of crypto!
        illegal: false
      },
      {
        id: "darknet_mirror",
        name: "Hosting Lustrzany DarkNetu",
        desc: "Nielegalny węzeł darknetu. Bardzo wysoki zysk w PLN i Krypto, lecz przyciąga policję! Wymaga szyfrowania LUKS.",
        minSizeGB: 30,
        requiredFs: ["LUKS", "EXT4", "ZFS"],
        preferredClusters: ["4KB"],
        requiredMount: "/mnt/darknet",
        powerWatts: 65,
        heatRate: 0.30,
        incomePerTick: 2.20, // ~132 PLN / day
        cryptoPerTick: 0.0008,
        illegal: true
      },
      {
        id: "corporate_vault",
        name: "Skarbiec Kopii Zapasowych Tachibana",
        desc: "Przechowywanie danych korporacyjnych z sumami kontrolnymi. Wymaga odpornego systemu ZFS lub NTFS.",
        minSizeGB: 50,
        requiredFs: ["ZFS", "NTFS"],
        preferredClusters: ["4KB", "16KB"],
        requiredMount: "/mnt/vault",
        powerWatts: 50,
        heatRate: 0.20,
        incomePerTick: 1.40, // ~84 PLN / day
        cryptoPerTick: 0.0,
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
    const isLeased = part.leasedContractId != null;

    return {
      size: { ok: sizeOk, msg: `${part.sizeGB} GB (min. ${serviceDef.minSizeGB} GB)` },
      fs: { ok: fsOk, msg: `${part.fs} (wymagane: ${serviceDef.requiredFs.join(', ')})` },
      mount: { ok: mountOk, msg: `${part.mount} (wymagane: ${serviceDef.requiredMount})` },
      cluster: { ok: clusterIdeal, msg: `${part.clusterSize} ${clusterIdeal ? '(optymalne)' : '(-20% wydajności)'}` },
      power: { ok: !willTripFuse, msg: `+${serviceDef.powerWatts}W ${willTripFuse ? '⚠️ WYBIJE KORKI!' : '(w normie)'}` },
      leased: { ok: !isLeased, msg: isLeased ? '🔒 Wynajęta dla klienta' : 'Wolna' },
      allValid: sizeOk && fsOk && mountOk && !isLeased
    };
  }

  // Check if a partition meets service requirements
  validatePartitionForService(serviceDef, part) {
    if (part.leasedContractId) {
      return { valid: false, reason: "Partycja jest aktualnie wynajęta dla klienta! Nie możesz na niej uruchamiać własnych serwisów." };
    }
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
      clusterMultiplier = 1.2;
    } else {
      clusterMultiplier = 0.8;
    }

    // RAID 0 bonus
    if (part.inRaid && part.raidId) {
      const raid = this.state.raidArrays.find(r => r.id === part.raidId);
      if (raid && raid.type === 'RAID0') {
        clusterMultiplier *= 1.8; // RAID 0 Striping speed boost!
      }
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
      trafficMBps: (1.2 + Math.random() * 5.0).toFixed(1)
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

  // Calculate dynamic outdoor weather temperature based on time of day
  calculateOutdoorTemp(hour) {
    if (hour >= 0 && hour < 6) return 16.0;
    if (hour >= 6 && hour < 10) return 20.0 + (hour - 6) * 1.5;
    if (hour >= 10 && hour <= 16) return 31.0 + Math.sin((hour - 10) / 6 * Math.PI) * 4.0; // Midday heatwave up to 35°C!
    if (hour > 16 && hour < 21) return 28.0 - (hour - 16) * 2.0;
    return 18.0;
  }

  // Main simulation tick: Power, Thermal, Leasing SLA, P&L, Debt, Malware
  tickProcess() {
    const hour = this.state.inGameTime.hour;
    this.state.outdoorTemp = this.calculateOutdoorTemp(hour);

    let totalWatts = 50; // Baseline PC idle
    let totalHeat = 0.05; // Baseline ambient heat
    let totalNoise = 10;
    let incomeServices = 0;
    let incomeMining = 0;
    let incomeLeasing = 0;
    let costPower = 0;
    let costWear = 0;

    // Disks power, heat and wear
    for (const disk of this.state.disks) {
      totalWatts += disk.powerWatts;
      totalHeat += disk.heatRate;
      totalNoise += 3;
      costWear += 0.01; // Mechanical wear amortisation
    }

    // Fans & Coolers
    if (this.state.coolingPumpActive) {
      totalWatts += 40;
      totalNoise += 6;
    }
    if (this.state.acActive && this.state.acInstalled) {
      totalWatts += 450; // AC draws 450W!
      totalNoise += 12;
    }

    // Malware drain
    for (const m of this.state.malwareActive) {
      totalWatts += m.drainWatts || 30;
      totalHeat += 0.15;
    }

    // Running services calculation (Only if fuse is intact!)
    const isPowered = !this.state.fuseTripped;
    const isThrottled = this.state.roomTemp > 42.0;
    const throttleMultiplier = isThrottled ? 0.5 : 1.0;

    if (isPowered) {
      for (const s of this.state.services) {
        const def = this.serviceCatalog.find(c => c.id === s.serviceId);
        if (!def) continue;

        totalWatts += def.powerWatts;
        totalHeat += def.heatRate;
        totalNoise += 4;

        const earnedPLN = def.incomePerTick * s.clusterMultiplier * throttleMultiplier;
        const earnedCrypto = def.cryptoPerTick * s.clusterMultiplier * throttleMultiplier;

        if (def.id === 'crypto_miner') {
          incomeMining += earnedCrypto;
          this.state.crypto += earnedCrypto;
        } else {
          incomeServices += earnedPLN;
          this.state.money += earnedPLN;
        }

        // Darknet threat
        if (def.illegal) {
          const all = this.getAllPartitions();
          const entry = all.find(e => e.part.id === s.partId);
          if (entry && !entry.part.encrypted && entry.part.fs !== "LUKS") {
            this.state.policeThreat = Math.min(100, this.state.policeThreat + 1.2);
          } else {
            this.state.policeThreat = Math.max(0, this.state.policeThreat - 0.2);
          }
        }
      }

      // Leased Contracts processing
      for (const lease of this.state.leasedContracts) {
        lease.totalTicks = (lease.totalTicks || 0) + 1;
        if (!isThrottled) {
          lease.uptimeTicks = (lease.uptimeTicks || 0) + 1;
        }

        // Daily rent paid proportionally per tick
        const tickRent = lease.dailyRent / 144; // 144 ticks = 1 in-game day
        incomeLeasing += tickRent;
        this.state.money += tickRent;
      }
    }

    this.state.currentWatts = totalWatts;
    this.state.noiseLevel = totalNoise;

    // Power bill
    const kwhDelta = (totalWatts * (1 / 6)) / 1000;
    this.state.powerKwhAccrued += kwhDelta;
    costPower = kwhDelta * this.state.powerKwhRate;
    this.state.powerBillAmount += costPower;

    // Update P&L metrics
    this.state.pnlMetrics.todayIncome += (incomeServices + incomeLeasing);
    this.state.pnlMetrics.todayExpenses += (costPower + costWear);
    this.state.pnlMetrics.incomeServices += incomeServices;
    this.state.pnlMetrics.incomeLeasing += incomeLeasing;
    this.state.pnlMetrics.incomeMining += incomeMining;
    this.state.pnlMetrics.costPower += costPower;
    this.state.pnlMetrics.costWear += costWear;

    // Circuit Breaker Overload
    if (this.state.currentWatts > this.state.fuseMaxWatts && !this.state.fuseTripped) {
      this.state.fuseTripped = true;
      window.audioEngine?.playFuseTrip();
      window.gameUI?.showToast(`WYBIŁO BEZPIECZNIK! Pobór ${Math.round(this.state.currentWatts)}W przekroczył limit ${this.state.fuseMaxWatts}W!`, "error");
      return;
    }

    // THERMAL SIMULATION OVERHAUL
    let tempDelta = (totalHeat * (1 / 6));

    if (this.state.windowOpen) {
      // Moves towards outdoor weather temp
      const outdoorDiff = this.state.outdoorTemp - this.state.roomTemp;
      tempDelta += outdoorDiff * 0.06;

      // Dust accumulation from street
      this.state.dustLevel = Math.min(100, this.state.dustLevel + 0.05);

      // Neighbor complaints from noise
      if (this.state.noiseLevel > 28) {
        this.state.neighborComplaints = Math.min(100, this.state.neighborComplaints + 0.35);
        if (this.state.neighborComplaints >= 100) {
          this.state.neighborComplaints = 0;
          this.state.money = Math.max(0, this.state.money - 200);
          window.audioEngine?.playAlert();
          window.gameUI?.showToast("MANDAT ZE SPÓŁDZIELNI: Hałas pracujących dysków przez otwarte okno oburzył sąsiadów (-200 PLN)!", "error");
        }
      }
    } else {
      // Window closed reduces neighbor complaints
      this.state.neighborComplaints = Math.max(0, this.state.neighborComplaints - 0.2);
    }

    // Dust insulation penalty (reduces heat dissipation)
    tempDelta *= (1 + this.state.dustLevel / 150);

    // Liquid cooling pump
    if (this.state.coolingPumpActive && this.state.coolingFluidLevel > 0) {
      tempDelta -= 0.16;
      this.state.coolingFluidLevel = Math.max(0, this.state.coolingFluidLevel - 0.04);
    }

    // Air Conditioner (AC)
    if (this.state.acActive && this.state.acInstalled && isPowered) {
      tempDelta -= 0.32; // Strong cooling!
    }

    this.state.roomTemp = Math.max(15.0, this.state.roomTemp + tempDelta);

    // Audio fan speed update
    const loadFrac = Math.min(1.0, this.state.currentWatts / this.state.fuseMaxWatts);
    window.audioEngine?.updateFanSpeed(loadFrac, this.state.roomTemp);

    // Thermal damage & bad sectors if > 48°C
    if (this.state.roomTemp > 48.0 && Math.random() < 0.25) {
      const disk = this.state.disks[Math.floor(Math.random() * this.state.disks.length)];
      if (disk) {
        disk.health = Math.max(5, disk.health - 2);
        const badIdx = Math.floor(Math.random() * 128);
        if (!disk.badSectors.includes(badIdx)) disk.badSectors.push(badIdx);
        window.gameUI?.showToast(`KRYTYCZNY UPAŁ (${this.state.roomTemp.toFixed(1)}°C)! Dysk ${disk.model} łapie bad sectory!`, "error");
      }
    }

    // Random Cyber Malware Attack (1% chance per tick if online in Darknet)
    const hasDarknet = this.state.services.some(s => s.serviceId === 'darknet_mirror');
    if (hasDarknet && Math.random() < 0.008 && this.state.malwareActive.length === 0) {
      this.infectWithMalware();
    }
  }

  infectWithMalware() {
    const all = this.getAllPartitions().filter(e => !e.part.isSystem);
    if (all.length === 0) return;
    const target = all[Math.floor(Math.random() * all.length)].part;

    const malware = {
      id: `malware-${Date.now()}`,
      name: "Ransomware 'Crypt0Lain'",
      type: "ransomware",
      targetPartId: target.id,
      targetDev: target.dev,
      drainWatts: 45,
      ransomAmount: 350
    };

    target.corrupted = true;
    this.state.malwareActive.push(malware);
    window.audioEngine?.playAlert();
    window.gameUI?.showToast(`ALARM BEZPIECZEŃSTWA: Wykryto infekcję '${malware.name}' na partycji ${target.dev}! Użyj DEFENDER.EXE!`, "error");
    this.state.notify();
  }

  cleanMalware(malwareId) {
    const idx = this.state.malwareActive.findIndex(m => m.id === malwareId);
    if (idx === -1) return { success: false, msg: "Nie znaleziono zagrożenia." };
    const m = this.state.malwareActive[idx];

    const all = this.getAllPartitions();
    const target = all.find(e => e.part.id === m.targetPartId);
    if (target) {
      target.part.corrupted = false;
    }

    this.state.malwareActive.splice(idx, 1);
    window.audioEngine?.playBeep(980, 0.2);
    window.gameUI?.showToast(`Zneutralizowano złośliwe oprogramowanie: ${m.name}!`, "success");
    this.state.notify();
    return { success: true };
  }
}

// Global services engine singleton
window.servicesEngine = new ServicesEngine(window.gameState);
