/**
 * NAVI // PARTITION.SYS - CENTRAL REACTIVE STATE STORE
 * Manages player finances, room environment, electrical grid, disk hardware, progression & saves.
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

    // Economy & Player stats
    this.money = 450.00; // PLN
    this.crypto = 0.0000; // Ⓦ WiredCoin
    this.cryptoRate = 2400.00; // PLN per 1 Ⓦ
    this.hunger = 15; // 0-100%
    this.energy = 95; // 0-100%
    this.rentDueDays = 6;
    this.rentAmount = 500.00;
    this.powerKwhRate = 0.95; // PLN per kWh
    this.powerKwhAccrued = 0.0;
    this.powerBillAmount = 0.0;

    // Room Environment & Electrical Grid
    this.roomTier = 1; // 1 to 4 (Lain's NAVI shrine at 4)
    this.roomTemp = 21.5; // °C
    this.ambientTemp = 19.0; // Outdoor °C
    this.windowOpen = false;
    this.coolingPumpActive = false;
    this.coolingFluidLevel = 100; // %
    this.fuseTripped = false;
    this.fuseMaxWatts = 400; // Tier 1 standard apartment circuit
    this.currentWatts = 80; // Baseline PC idle power

    // Law Enforcement & Security
    this.policeThreat = 0; // 0-100%
    this.policeRaidPending = false;

    // Tooling Progression (1=fdisk CLI, 2=GUI Partition Wizard, 3=LVM/GPT Pro, 4=NAVI Hyper-Storage)
    this.toolTier = 1;
    this.reputation = 0;

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
            isSystem: true
          }
        ]
      }
    ];

    // Selected disk in UI
    this.selectedDiskId = "disk-0";
    this.selectedPartId = null;

    // Active & Registered Services
    this.services = [];

    // Contracts Board
    this.contracts = [];
    this.activeContract = null;

    // View state
    this.activeView = "room"; // "room" or "desktop"
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notify() {
    for (const cb of this.subscribers) {
      cb(this);
    }
  }

  // Save / Load via LocalStorage
  saveGame() {
    try {
      const data = {
        time: this.inGameTime,
        money: this.money,
        crypto: this.crypto,
        hunger: this.hunger,
        energy: this.energy,
        rentDueDays: this.rentDueDays,
        powerBillAmount: this.powerBillAmount,
        roomTier: this.roomTier,
        roomTemp: this.roomTemp,
        windowOpen: this.windowOpen,
        coolingPumpActive: this.coolingPumpActive,
        coolingFluidLevel: this.coolingFluidLevel,
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
        policeThreat: this.policeThreat
      };
      localStorage.setItem("NAVI_PARTITION_SAVE", JSON.stringify(data));
      window.gameUI?.showToast("Stan gry został pomyślnie zapisany.", "success");
    } catch (e) {
      console.error("Save error:", e);
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem("NAVI_PARTITION_SAVE");
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.inGameTime = data.time || this.inGameTime;
      this.money = data.money ?? this.money;
      this.crypto = data.crypto ?? this.crypto;
      this.hunger = data.hunger ?? this.hunger;
      this.energy = data.energy ?? this.energy;
      this.rentDueDays = data.rentDueDays ?? this.rentDueDays;
      this.powerBillAmount = data.powerBillAmount ?? this.powerBillAmount;
      this.roomTier = data.roomTier ?? this.roomTier;
      this.roomTemp = data.roomTemp ?? this.roomTemp;
      this.windowOpen = data.windowOpen ?? this.windowOpen;
      this.coolingPumpActive = data.coolingPumpActive ?? this.coolingPumpActive;
      this.coolingFluidLevel = data.coolingFluidLevel ?? this.coolingFluidLevel;
      this.fuseTripped = data.fuseTripped ?? this.fuseTripped;
      this.fuseMaxWatts = data.fuseMaxWatts ?? this.fuseMaxWatts;
      this.toolTier = data.toolTier ?? this.toolTier;
      this.reputation = data.reputation ?? this.reputation;
      this.tutorialStep = data.tutorialStep ?? this.tutorialStep;
      this.tutorialCompleted = data.tutorialCompleted ?? this.tutorialCompleted;
      this.tutorialHidden = data.tutorialHidden ?? this.tutorialHidden;
      this.disks = data.disks || this.disks;
      // Guarantee system partition protection even on legacy saves
      for (const d of this.disks) {
        for (const p of d.partitions) {
          if (p.mount === '/' || p.label === 'SYSTEM_OS') {
            p.isSystem = true;
            p.mount = '/';
          }
        }
      }
      this.services = data.services || this.services;
      this.contracts = data.contracts || this.contracts;
      this.policeThreat = data.policeThreat ?? this.policeThreat;
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
