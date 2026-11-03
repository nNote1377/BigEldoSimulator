/**
 * NAVI // PARTITION.SYS - MAIN GAME LOOP & CONTROLLER
 * Coordinates time ticks, biological needs, rent deadlines, police checks and event dispatch.
 */

class GameEngine {
  constructor() {
    this.state = window.gameState;
    this.tickInterval = null;
    this.autoSaveTimer = null;
    this.init();
  }

  init() {
    // Initialize 2D Canvas Room
    window.roomView = new window.RoomView('room-canvas', this.state);

    // Initialize Desktop UI & Windows
    window.gameUI = new window.DesktopUI(this.state);

    // Try loading existing save
    this.state.loadGame();

    // Start master game loop timer (1000ms / speed)
    this.setupTickTimer();

    // Start autosave every 30s
    this.autoSaveTimer = setInterval(() => {
      this.state.saveGame();
    }, 30000);

    // First user gesture initializes Web Audio
    const startAudioOnGesture = () => {
      window.audioEngine?.init();
      window.removeEventListener('click', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
    };
    window.addEventListener('click', startAudioOnGesture);
    window.addEventListener('keydown', startAudioOnGesture);

    // Welcome toast
    setTimeout(() => {
      window.gameUI.showToast("Witaj w NAVI // PARTITION.SYS. Spacja przełącza widok.", "success");
    }, 600);
  }

  setupTickTimer() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => {
      const speed = this.state.timeSpeed;
      if (speed > 0) {
        for (let i = 0; i < speed; i++) {
          this.tick();
        }
      }
    }, 1000);
  }

  tick() {
    // 1 tick = 10 in-game minutes
    const t = this.state.inGameTime;
    t.minute += 10;
    if (t.minute >= 60) {
      t.minute = 0;
      t.hour += 1;
      this.hourlyTick();
      if (t.hour >= 24) {
        t.hour = 0;
        t.day += 1;
        this.dailyTick();
      }
    }

    // Biological needs: Hunger & Fatigue
    this.state.hunger = Math.min(100, this.state.hunger + 0.35);
    const fatigueRate = this.state.hunger > 70 ? 0.6 : 0.3;
    this.state.energy = Math.max(0, this.state.energy - fatigueRate);

    // Exhaustion blackout
    if (this.state.energy <= 0) {
      this.state.energy = 50;
      this.state.inGameTime.hour = (this.state.inGameTime.hour + 8) % 24;
      window.gameUI?.showToast("MDLEJESZ Z WYCIEŃCZENIA! Ocknąłeś się po 8 godzinach snu na podłodze.", "error");
    }

    // Process storage and services engine
    window.servicesEngine.tickProcess();

    // Process random events
    this.checkRandomEvents();

    // Notify state listeners (HUD tick only)
    this.state.notify('tick');
  }

  hourlyTick() {
    // Hourly ambient adjustments
  }

  dailyTick() {
    // Countdown rent deadline
    this.state.rentDueDays -= 1;
    if (this.state.rentDueDays < 0) {
      // Overdue rent penalty
      this.state.money -= 100;
      window.audioEngine?.playAlert();
      window.gameUI?.showToast("ZALEGŁY CZYNSZ! Właściciel mieszkania naliczył karę 100 PLN i grozi eksmisją!", "error");
      if (this.state.rentDueDays <= -3) {
        // Game Over Eviction
        alert("GAME OVER: Zostałeś eksmitowany z mieszkania za niepłacenie czynszu! Twoje stanowisko NAVI zostało zarekwirowane.");
        this.state.resetToDefaults();
        this.state.notify();
        return;
      }
    } else if (this.state.rentDueDays === 1) {
      window.gameUI?.showToast("OSTRZEŻENIE: Jutro mija termin opłaty czynszu za mieszkanie (500 PLN)!", "error");
    }

    // Daily market refresh / small price fluctuation
    this.state.cryptoRate = Math.round(2200 + Math.random() * 600);
  }

  checkRandomEvents() {
    // Random police network sweep
    if (Math.random() < 0.03 && this.state.policeThreat > 20) {
      this.state.policeThreat = Math.min(100, this.state.policeThreat + 5);
      window.audioEngine?.playBeep(350, 0.1);
      window.gameUI?.showToast("Wykryto automatyczny skan portów policji cybernetycznej. Zagrożenie wzrasta!");
    }

    // If police raid pending countdown
    if (this.state.policeRaidPending) {
      if (Math.random() < 0.15) {
        // Raid executed!
        this.executePoliceRaid();
      }
    }
  }

  executePoliceRaid() {
    this.state.policeRaidPending = false;
    let foundIllegal = false;

    // Check if any partition contains unencrypted darknet data
    for (const disk of this.state.disks) {
      for (const p of disk.partitions) {
        if (p.serviceId === 'darknet_mirror' && !p.encrypted && p.fs !== 'LUKS') {
          foundIllegal = true;
          break;
        }
      }
    }

    if (foundIllegal) {
      window.audioEngine?.playAlert();
      alert("NALOT CYBERPOLICJI: Funkcjonariusze weszli do mieszkania! Wykryto niezaszyfrowane nielegalne bazy danych na dyskach! Skonfiskowano sprzęt i nałożono 600 PLN grzywny.");
      this.state.money = Math.max(0, this.state.money - 600);
      this.state.policeThreat = 0;
      // Stop all services
      this.state.services = [];
      this.state.disks.forEach(d => d.partitions.forEach(p => p.serviceId = null));
    } else {
      window.audioEngine?.playBeep(880, 0.1);
      window.gameUI?.showToast("Nalot policji nie wykrył dowodów! Twoje szyfrowanie LUKS i formatowanie wytrzymały inspekcję.", "success");
      this.state.policeThreat = 0;
    }
    this.state.notify();
  }
}

// Launch the game engine once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
