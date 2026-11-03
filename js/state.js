/**
 * NAVI // PARTITION.SYS 2.0 - CENTRAL REACTIVE STATE STORE
 * Manages player finances, bank debt, room environment, electrical grid, disk hardware,
 * leasing contracts, RAID arrays, cyber threats, data forensics, progression & saves.
 */

class GameState {
  constructor() {
    this.subscribers = [];
    this.resetToDefaults();
  }

  resetToDefaults() {
    this.timeSpeed = 1; // 0=pause, 1=1x, 2=2x, 5=5x
    this.inGameTime = {
      day: 1,
      hour: 8,
      minute: 0
    };

    // Economy & Player stats (Rebalanced hardcore start)
    this.money = 150.00; // PLN (Rebalanced from 450 to 150)
    this.crypto = 0.0000; // Ⓦ WiredCoin
    this.cryptoRate = 2400.00; // PLN per 1 Ⓦ
    this.hunger = 15; // 0-100%
    this.energy = 95; // 0-100%
    this.rentDueDays = 6;
    this.rentAmount = 500.00;
    this.powerKwhRate = 0.95; // PLN per kWh
    this.powerKwhAccrued = 0.0;
    this.powerBillAmount = 0.0;

    // Bank Debt & Usury / Debt Collector
    this.debtBalance = 0.0; // PLN
    this.debtDaysRemaining = 5;
    this.debtDailyInterestRate = 0.05; // 5% per day

    // Hardware Slots & Expansion
    this.maxDiskSlots = 2; // Starter motherboard has 2 SATA/IDE ports
    this.installedPCIeControllers = 0;

    // Room Environment, Weather & Electrical Grid
    this.roomTier = 1; // 1 to 4 (Lain's NAVI shrine at 4)
    this.roomTemp = 21.5; // °C
    this.outdoorTemp = 22.0; // Calculated dynamically by hour and heatwave
    this.windowOpen = false;
    this.noiseLevel = 15; // Noise in room
    this.neighborComplaints = 0; // 0-100%
    this.dustLevel = 5; // 0-100% (reduces cooling efficiency)
    this.coolingPumpActive = false;
    this.coolingFluidLevel = 100; // %
    this.acInstalled = false; // Air conditioner unit
    this.acActive = false;
    this.fuseTripped = false;
    this.fuseMaxWatts = 400; // Tier 1 standard apartment circuit
    this.currentWatts = 80; // Baseline PC idle power

    // Law Enforcement & Cyber Threats
    this.policeThreat = 0; // 0-100%
    this.policeRaidPending = false;
    this.malwareActive = []; // Array of { id, name, type, targetPartId, drainWatts, ransomAmount }
    this.firewallActive = true;

    // Tooling Progression (1=fdisk CLI, 2=GUI Partition Wizard, 3=LVM/GPT Pro, 4=NAVI Hyper-Storage)
    this.toolTier = 1;
    this.reputation = 20; // 0 to 1000

    // Interactive Tutorial state
    this.tutorialStep = 1;
    this.tutorialCompleted = false;
    this.tutorialHidden = false;

    // Disks (Populated with initial starter drive)
    this.disks = [
      {
        id: "disk-0",
        dev: "/dev/sda",
        model: "Quantum Fireball ST 80GB",
        type: "HDD",
        interface: "IDE",
        sizeGB: 80,
        tableType: "MBR", // "MBR" or "GPT"
        powerWatts: 25,
        heatRate: 0.12, // °C per in-game hour
        rpm: 5400,
        health: 96, // 0-100%
        badSectors: [14, 42, 89], // specific sector indices
        remappedSectors: [],
        partitions: [
          {
            id: "part-0-1",
            dev: "/dev/sda1",
            label: "SYSTEM_OS",
            sizeGB: 20,
            fs: "EXT4",
            clusterSize: "4KB",
            mount: "/",
            encrypted: false,
            serviceId: null,
            corrupted: false,
            isSystem: true,
            leasedContractId: null,
            inRaid: false,
            raidId: null
          }
        ]
      }
    ];

    // Selected disk in UI
    this.selectedDiskId = "disk-0";
    this.selectedPartId = null;

    // Active & Registered Services
    this.services = [];

    // Contracts Board & Active Leases
    this.contracts = [];
    this.activeContract = null;
    this.leasedContracts = []; // { id, client, title, partId, daysRemaining, totalDays, dailyRent, deposit, penaltyAmount, slaTarget, uptimeTicks, totalTicks }

    // RAID Arrays
    this.raidArrays = []; // { id, name, type: 'RAID0'|'RAID1'|'JBOD', partIds: [], sizeGB, status: 'HEALTHY' }

    // Data Forensics (Recovered scrap secrets)
    this.recoveredDataFiles = []; // { id, name, desc, valuePLN, valueCrypto, sold: false }

    // P&L Financial Audit Daily Tracking
    this.pnlMetrics = {
      todayIncome: 0,
      todayExpenses: 0,
      yesterdayIncome: 0,
      yesterdayExpenses: 0,
      incomeServices: 0,
      incomeLeasing: 0,
      incomeMining: 0,
      costPower: 0,
      costWear: 0,
      costDebt: 0
    };

    // View state
    this.activeView = "room"; // "room" or "desktop"
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notify(type = 'structural') {
    for (const cb of this.subscribers) {
      cb(this, type);
    }
  }

  // Save / Load via LocalStorage
  saveGame() {
    try {
      const data = {
        time: this.inGameTime,
        money: this.money,
        crypto: this.crypto,
        debtBalance: this.debtBalance,
        debtDaysRemaining: this.debtDaysRemaining,
        maxDiskSlots: this.maxDiskSlots,
        installedPCIeControllers: this.installedPCIeControllers,
        hunger: this.hunger,
        energy: this.energy,
        rentDueDays: this.rentDueDays,
        powerBillAmount: this.powerBillAmount,
        roomTier: this.roomTier,
        roomTemp: this.roomTemp,
        windowOpen: this.windowOpen,
        noiseLevel: this.noiseLevel,
        neighborComplaints: this.neighborComplaints,
        dustLevel: this.dustLevel,
        coolingPumpActive: this.coolingPumpActive,
        coolingFluidLevel: this.coolingFluidLevel,
        acInstalled: this.acInstalled,
        acActive: this.acActive,
        fuseTripped: this.fuseTripped,
        fuseMaxWatts: this.fuseMaxWatts,
        toolTier: this.toolTier,
        reputation: this.reputation,
        tutorialStep: this.tutorialStep,
        tutorialCompleted: this.tutorialCompleted,
        tutorialHidden: this.tutorialHidden,
        disks: this.disks,
        services: this.services,
        contracts: this.contracts,
        leasedContracts: this.leasedContracts,
        raidArrays: this.raidArrays,
        recoveredDataFiles: this.recoveredDataFiles,
        malwareActive: this.malwareActive,
        pnlMetrics: this.pnlMetrics,
        policeThreat: this.policeThreat
      };
      localStorage.setItem("NAVI_PARTITION_SAVE_V2", JSON.stringify(data));
      window.gameUI?.showToast("Stan gry został pomyślnie zapisany.", "success");
    } catch (e) {
      console.error("Save error:", e);
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem("NAVI_PARTITION_SAVE_V2") || localStorage.getItem("NAVI_PARTITION_SAVE");
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.inGameTime = data.time || this.inGameTime;
      this.money = data.money ?? this.money;
      this.crypto = data.crypto ?? this.crypto;
      this.debtBalance = data.debtBalance ?? this.debtBalance;
      this.debtDaysRemaining = data.debtDaysRemaining ?? this.debtDaysRemaining;
      this.maxDiskSlots = data.maxDiskSlots ?? this.maxDiskSlots;
      this.installedPCIeControllers = data.installedPCIeControllers ?? this.installedPCIeControllers;
      this.hunger = data.hunger ?? this.hunger;
      this.energy = data.energy ?? this.energy;
      this.rentDueDays = data.rentDueDays ?? this.rentDueDays;
      this.powerBillAmount = data.powerBillAmount ?? this.powerBillAmount;
      this.roomTier = data.roomTier ?? this.roomTier;
      this.roomTemp = data.roomTemp ?? this.roomTemp;
      this.windowOpen = data.windowOpen ?? this.windowOpen;
      this.noiseLevel = data.noiseLevel ?? this.noiseLevel;
      this.neighborComplaints = data.neighborComplaints ?? this.neighborComplaints;
      this.dustLevel = data.dustLevel ?? this.dustLevel;
      this.coolingPumpActive = data.coolingPumpActive ?? this.coolingPumpActive;
      this.coolingFluidLevel = data.coolingFluidLevel ?? this.coolingFluidLevel;
      this.acInstalled = data.acInstalled ?? this.acInstalled;
      this.acActive = data.acActive ?? this.acActive;
      this.fuseTripped = data.fuseTripped ?? this.fuseTripped;
      this.fuseMaxWatts = data.fuseMaxWatts ?? this.fuseMaxWatts;
      this.toolTier = data.toolTier ?? this.toolTier;
      this.reputation = data.reputation ?? this.reputation;
      this.tutorialStep = data.tutorialStep ?? this.tutorialStep;
      this.tutorialCompleted = data.tutorialCompleted ?? this.tutorialCompleted;
      this.tutorialHidden = data.tutorialHidden ?? this.tutorialHidden;
      this.disks = data.disks || this.disks;
      this.services = data.services || this.services;
      this.contracts = data.contracts || this.contracts;
      this.leasedContracts = data.leasedContracts || this.leasedContracts;
      this.raidArrays = data.raidArrays || this.raidArrays;
      this.recoveredDataFiles = data.recoveredDataFiles || this.recoveredDataFiles;
      this.malwareActive = data.malwareActive || this.malwareActive;
      this.pnlMetrics = data.pnlMetrics || this.pnlMetrics;
      this.policeThreat = data.policeThreat ?? this.policeThreat;

      // Guarantee system partition protection even on legacy saves
      for (const d of this.disks) {
        for (const p of d.partitions) {
          if (p.mount === '/' || p.label === 'SYSTEM_OS') {
            p.isSystem = true;
            p.mount = '/';
          }
        }
      }

      this.notify();
      window.gameUI?.showToast("Wczytano zapis gry.", "success");
      return true;
    } catch (e) {
      console.error("Load error:", e);
      return false;
    }
  }
}

// Global state singleton
window.gameState = new GameState();
