/**
 * NAVI // PARTITION.SYS - RETRO DESKTOP UI & WINDOW MANAGER
 * Controls draggable windows, partition strips, services cards, bazaar store, contracts, terminal & HUD.
 */

class DesktopUI {
  constructor(state) {
    this.state = state;
    this.topZIndex = 100;
    this.activeWindow = null;
    this.initElements();
    this.bindWindowDragging();
    this.bindGlobalControls();
    this.bindDiskManagerActions();
    this.bindServicesActions();
    this.bindBazaarActions();
    this.bindContractsActions();
    this.bindPowerActions();
    this.bindBankActions();
    this.bindTerminal();
    this.serviceSelectedPart = {};
    this.bindTutorial();
    this.renderAll();

    // Subscribe to state changes (ticks only update HUD to prevent interrupting dropdowns)
    this.state.subscribe((state, type) => {
      if (type === 'tick') {
        this.renderTickHUD();
      } else {
        this.renderAll();
      }
    });
  }

  initElements() {
    this.viewRoom = document.getElementById('view-room');
    this.viewDesktop = document.getElementById('view-desktop');
    this.btnToggleView = document.getElementById('btn-toggle-view');
    this.toastContainer = document.getElementById('toast-container');
    this.modalPartition = document.getElementById('modal-partition');
  }

  showToast(message, type = 'normal') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : (type === 'success' ? 'toast-success' : '')}`;
    toast.innerText = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  switchView(targetView) {
    this.state.activeView = targetView;
    if (targetView === 'desktop') {
      this.viewRoom.classList.remove('active');
      this.viewDesktop.classList.add('active');
      this.btnToggleView.innerText = '🛏️ POKÓJ';
      this.btnToggleView.classList.remove('highlight-btn');
    } else {
      this.viewDesktop.classList.remove('active');
      this.viewRoom.classList.add('active');
      this.btnToggleView.innerText = '🖥️ PULPIT NAVI';
      this.btnToggleView.classList.add('highlight-btn');
    }
    window.audioEngine?.playClick();
    this.checkTutorialProgress();
  }

  bindGlobalControls() {
    this.btnToggleView.addEventListener('click', () => {
      this.switchView(this.state.activeView === 'room' ? 'desktop' : 'room');
    });

    // Time speed buttons
    const btnPause = document.getElementById('btn-speed-pause');
    const btn1x = document.getElementById('btn-speed-1x');
    const btn2x = document.getElementById('btn-speed-2x');
    const btn5x = document.getElementById('btn-speed-5x');
    const speedBtns = [btnPause, btn1x, btn2x, btn5x];

    const setSpeed = (spd, activeBtn) => {
      this.state.timeSpeed = spd;
      speedBtns.forEach(b => b.classList.remove('active-btn'));
      activeBtn.classList.add('active-btn');
      window.audioEngine?.playClick();
    };

    btnPause.addEventListener('click', () => setSpeed(0, btnPause));
    btn1x.addEventListener('click', () => setSpeed(1, btn1x));
    btn2x.addEventListener('click', () => setSpeed(2, btn2x));
    btn5x.addEventListener('click', () => setSpeed(5, btn5x));

    // Audio toggle
    const btnAudio = document.getElementById('btn-audio-toggle');
    btnAudio.addEventListener('click', () => {
      const unmuted = window.audioEngine?.toggleMute();
      btnAudio.innerText = unmuted ? '🔊' : '🔇';
      this.showToast(unmuted ? "Dźwięk włączony." : "Dźwięk wyciszony.");
    });

    // CRT toggle
    const btnCrt = document.getElementById('btn-crt-toggle');
    btnCrt.addEventListener('click', () => {
      document.body.classList.toggle('crt-enabled');
      this.showToast(document.body.classList.contains('crt-enabled') ? "Filtr CRT aktywny." : "Filtr CRT wyłączony.");
      window.audioEngine?.playClick();
    });

    // Help
    document.getElementById('btn-help').addEventListener('click', () => {
      this.openWindow('app-guide');
    });

    // Room dock buttons
    document.querySelectorAll('.dock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        window.roomView?.triggerAction(action);
      });
    });

    // Desktop icons click
    document.querySelectorAll('.desktop-icon').forEach(icon => {
      icon.addEventListener('click', () => {
        const appId = icon.dataset.app;
        this.openWindow(appId);
      });
    });

    // Start button
    document.getElementById('start-btn').addEventListener('click', () => {
      this.openWindow('app-guide');
    });

    // Keyboard shortcut: Space toggles between Room and Desktop
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.switchView(this.state.activeView === 'room' ? 'desktop' : 'room');
      }
    });
  }

  // --- WINDOW MANAGEMENT ---
  bindWindowDragging() {
    const windows = document.querySelectorAll('.cyber-window');
    windows.forEach(win => {
      const header = win.querySelector('.window-header');
      let isDragging = false;
      let startX, startY, initialLeft, initialTop;

      header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('win-btn')) return;
        this.focusWindow(win);
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = win.offsetLeft;
        initialTop = win.offsetTop;
        window.audioEngine?.playClick();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        win.style.left = `${Math.max(10, Math.min(window.innerWidth - win.offsetWidth - 10, initialLeft + dx))}px`;
        win.style.top = `${Math.max(45, Math.min(window.innerHeight - win.offsetHeight - 40, initialTop + dy))}px`;
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      win.addEventListener('mousedown', () => {
        this.focusWindow(win);
      });

      // Close and minimize buttons
      const btnClose = win.querySelector('.win-close');
      if (btnClose) {
        btnClose.addEventListener('click', () => {
          win.classList.add('minimized');
          this.updateTaskbar();
          window.audioEngine?.playClick();
        });
      }
      const btnMin = win.querySelector('.win-minimize');
      if (btnMin) {
        btnMin.addEventListener('click', () => {
          win.classList.add('minimized');
          this.updateTaskbar();
          window.audioEngine?.playClick();
        });
      }
    });
  }

  focusWindow(win) {
    if (this.activeWindow === win) return;
    this.topZIndex++;
    win.style.zIndex = this.topZIndex;
    document.querySelectorAll('.cyber-window').forEach(w => w.classList.remove('focused'));
    win.classList.remove('minimized');
    win.classList.add('focused');
    this.activeWindow = win;
    this.updateTaskbar();
  }

  openWindow(appId) {
    const win = document.getElementById(appId);
    if (!win) return;
    win.classList.remove('minimized');
    this.focusWindow(win);
    window.audioEngine?.playClick();
    this.checkTutorialProgress();
  }

  updateTaskbar() {
    const container = document.getElementById('taskbar-tasks');
    container.innerHTML = '';
    const windows = document.querySelectorAll('.cyber-window');
    windows.forEach(win => {
      const isMinimized = win.classList.contains('minimized');
      const isFocused = win.classList.contains('focused') && !isMinimized;
      const title = win.querySelector('.window-title').innerText.trim();

      const item = document.createElement('div');
      item.className = `task-item ${isFocused ? 'active' : ''}`;
      item.innerText = title;
      item.addEventListener('click', () => {
        if (isMinimized) {
          win.classList.remove('minimized');
          this.focusWindow(win);
        } else if (isFocused) {
          win.classList.add('minimized');
          this.updateTaskbar();
        } else {
          this.focusWindow(win);
        }
        window.audioEngine?.playClick();
      });
      container.appendChild(item);
    });
  }

  // --- DISK MANAGER UI & LOGIC ---
  bindDiskManagerActions() {
    const btnNewPart = document.getElementById('btn-new-partition');
    const btnDelPart = document.getElementById('btn-delete-partition');
    const btnFormatPart = document.getElementById('btn-format-partition');
    const btnChangeTable = document.getElementById('btn-change-table');
    const btnScanBad = document.getElementById('btn-scan-badsectors');
    const btnRemapBad = document.getElementById('btn-remap-bad');
    const btnWipeZero = document.getElementById('btn-wipe-zero');

    // New partition dialog open
    btnNewPart.addEventListener('click', () => {
      const disk = window.diskEngine.getActiveDisk();
      const { unallocated } = window.diskEngine.getDiskSpaceUsage(disk);
      if (unallocated <= 0) {
        this.showToast("Brak nieprzydzielonego miejsca na tym dysku!", "error");
        return;
      }
      this.openPartitionModal('create', unallocated);
    });

    // Format partition dialog open
    btnFormatPart.addEventListener('click', () => {
      const disk = window.diskEngine.getActiveDisk();
      const part = disk.partitions.find(p => p.id === this.state.selectedPartId);
      if (!part) {
        this.showToast("Wybierz najpierw partycję do sformatowania!", "error");
        return;
      }
      this.openPartitionModal('format', part.sizeGB, part);
    });

    // Delete partition
    btnDelPart.addEventListener('click', () => {
      const disk = window.diskEngine.getActiveDisk();
      if (!this.state.selectedPartId) {
        this.showToast("Zaznacz partycję do usunięcia!", "error");
        return;
      }
      const res = window.diskEngine.deletePartition(disk.id, this.state.selectedPartId);
      if (!res.success) {
        this.showToast(res.msg, "error");
      } else {
        this.showToast("Partycja została usunięta.", "success");
      }
    });

    // Change table type (MBR <-> GPT)
    btnChangeTable.addEventListener('click', () => {
      const disk = window.diskEngine.getActiveDisk();
      const targetType = disk.tableType === 'MBR' ? 'GPT' : 'MBR';
      if (!confirm(`UWAGA: Zmiana tablicy na ${targetType} skasuje WSZYSTKIE partycje i dane na dysku ${disk.dev}! Kontynuować?`)) {
        return;
      }
      const res = window.diskEngine.changeTableType(disk.id, targetType);
      if (!res.success) {
        this.showToast(res.msg, "error");
      } else {
        this.showToast(`Zmieniono tablicę partycji na ${targetType}.`, "success");
      }
    });

    // Scan bad sectors
    btnScanBad.addEventListener('click', () => {
      const disk = window.diskEngine.getActiveDisk();
      this.showToast(`Rozpoczęto skanowanie powierzchni ${disk.dev}...`);
      setTimeout(() => {
        const res = window.diskEngine.scanBadSectors(disk.id);
        this.showToast(`Skan zakończony: wykryto ${res.count} uszkodzonych sektorów. Stan S.M.A.R.T.: ${res.health}%.`);
      }, 1000);
    });

    // Remap bad sectors
    btnRemapBad.addEventListener('click', () => {
      const disk = window.diskEngine.getActiveDisk();
      const res = window.diskEngine.remapBadSectors(disk.id);
      if (!res.success) {
        this.showToast(res.msg, "error");
      } else {
        this.showToast(`Zremapowano ${res.count} uszkodzonych sektorów do puli rezerwowej!`, "success");
      }
    });

    // Panic Zero Wipe
    btnWipeZero.addEventListener('click', () => {
      const disk = window.diskEngine.getActiveDisk();
      if (!confirm(`CZY NA PEWNO chcesz wykonać natychmiastowe zerowanie /dev/zero dysku ${disk.dev}? Zniszczy to wszystkie dane, lecz usunie dowody przed policją!`)) {
        return;
      }
      window.diskEngine.panicZeroWipe(disk.id);
      this.showToast(`Wyzerowano nośnik ${disk.dev} (dd if=/dev/zero).`, "success");
    });

    // Modal partition controls
    const slider = document.getElementById('modal-part-size-slider');
    const valInput = document.getElementById('modal-part-size-val');
    slider.addEventListener('input', () => { valInput.value = slider.value; });
    valInput.addEventListener('input', () => { slider.value = valInput.value; });

    document.querySelectorAll('.modal-close, #btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        this.modalPartition.classList.add('hidden');
      });
    });

    document.getElementById('btn-modal-confirm').addEventListener('click', () => {
      this.handleModalConfirm();
    });
  }

  openPartitionModal(mode, maxSize, existingPart = null) {
    this.modalMode = mode;
    this.modalTargetPart = existingPart;
    const title = document.getElementById('modal-partition-title');
    const slider = document.getElementById('modal-part-size-slider');
    const valInput = document.getElementById('modal-part-size-val');
    const maxHint = document.getElementById('modal-part-max-hint');
    const labelInput = document.getElementById('modal-part-label');
    const fsSelect = document.getElementById('modal-part-fs');
    const clusterSelect = document.getElementById('modal-part-cluster');
    const mountSelect = document.getElementById('modal-part-mount');

    slider.max = maxSize;
    valInput.max = maxSize;
    maxHint.innerText = `Maksymalnie dostępne: ${maxSize} GB`;

    if (mode === 'create') {
      title.innerText = 'Utwórz Nową Partycję';
      slider.disabled = false;
      valInput.disabled = false;
      const initialSize = Math.max(1, Math.min(40, maxSize));
      slider.value = initialSize;
      valInput.value = initialSize;
      labelInput.value = 'WIRED_VOL';
    } else {
      title.innerText = `Formatuj Partycję [${existingPart.dev}]`;
      slider.disabled = true;
      valInput.disabled = true;
      slider.value = existingPart.sizeGB;
      valInput.value = existingPart.sizeGB;
      labelInput.value = existingPart.label;
      fsSelect.value = existingPart.fs;
      clusterSelect.value = existingPart.clusterSize;
      mountSelect.value = existingPart.mount;
    }

    this.modalPartition.classList.remove('hidden');
    window.audioEngine?.playClick();
  }

  handleModalConfirm() {
    const disk = window.diskEngine.getActiveDisk();
    const label = document.getElementById('modal-part-label').value;
    const size = parseFloat(document.getElementById('modal-part-size-val').value);
    const fs = document.getElementById('modal-part-fs').value;
    const cluster = document.getElementById('modal-part-cluster').value;
    const mount = document.getElementById('modal-part-mount').value;

    let res;
    if (this.modalMode === 'create') {
      res = window.diskEngine.createPartition(disk.id, label, size, fs, cluster, mount);
    } else {
      res = window.diskEngine.formatPartition(disk.id, this.modalTargetPart.id, fs, cluster, mount);
    }

    if (!res.success) {
      this.showToast(res.msg, "error");
    } else {
      this.modalPartition.classList.add('hidden');
      this.showToast(this.modalMode === 'create' ? "Utworzono nową partycję!" : "Partycja została sformatowana.", "success");
    }
  }

  // --- SERVICES UI BINDING ---
  bindServicesActions() {
    // Dynamic binding handled in renderServices
  }

  // --- HARDWARE BAZAAR ---
  bindBazaarActions() {
    const tabs = document.querySelectorAll('.bazaar-tabs .tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderBazaarContent(tab.dataset.tab);
        window.audioEngine?.playClick();
      });
    });
    this.renderBazaarContent('disks');
  }

  renderBazaarContent(category) {
    const container = document.getElementById('bazaar-catalog');
    container.innerHTML = '';

    const catalog = {
      disks: [
        { id: 'wd_160', name: 'Western Digital Caviar 160GB', type: 'HDD', size: 160, iface: 'SATA', watts: 20, price: 120, tier: 1 },
        { id: 'seagate_500', name: 'Seagate Barracuda 500GB 7200RPM', type: 'HDD', size: 500, iface: 'SATA', watts: 25, price: 280, tier: 1 },
        { id: 'maxtor_scsi', name: 'Maxtor Atlas 300GB Ultra320 SCSI', type: 'SCSI', size: 300, iface: 'SCSI', watts: 38, price: 420, tier: 2 },
        { id: 'intel_ssd', name: 'Intel X25-M 80GB SATA-II SSD', type: 'SSD', size: 80, iface: 'SATA', watts: 6, price: 350, tier: 2 },
        { id: 'wd_red_2tb', name: 'WD Red Pro 2TB NAS Storage', type: 'HDD', size: 2048, iface: 'SATA', watts: 30, price: 890, tier: 3 },
        { id: 'tachibana_quantum', name: 'Tachibana Cyber-Drive 10TB Hyper-Array', type: 'QUANTUM', size: 10240, iface: 'NVME', watts: 45, price: 3400, tier: 4 }
      ],
      cooling: [
        { id: 'fan_silent', name: 'Wentylator Biurkowy Silent 120mm', desc: 'Obniża temperaturę pokoju o ~0.08°C/h.', watts: 8, price: 45 },
        { id: 'fan_exhaust', name: 'Przemysłowy Wentylator Wyciągowy', desc: 'Potężny wyciąg ciepła z obudowy i okna.', watts: 25, price: 180 },
        { id: 'liquid_kit', name: 'Zestaw Chłodzenia Cieczą Lain-V1', desc: 'Instaluje pompę i rurki chłodzenia na podłodze.', watts: 40, price: 650, unlockTier: 3 },
        { id: 'coolant_refill', name: 'Kanister Płynu Chłodzącego (5L)', desc: 'Uzupełnia zbiornik chłodzenia do 100%.', price: 90 }
      ],
      power: [
        { id: 'fuse_b20', name: 'Wymiana Bezpiecznika na B20 (800W)', desc: 'Podwaja maksymalną moc instalacji w pokoju.', price: 150, maxWatts: 800 },
        { id: 'fuse_c25', name: 'Wzmocniona Linia Miedziana C25 (1600W)', desc: 'Pozwala zasilić ciężkie macierze dyskowe.', price: 480, maxWatts: 1600 },
        { id: 'fuse_3phase', name: 'Przyłącze Przemysłowe 3-Fazowe (3200W)', desc: 'Prawdziwe zasilanie serwerowni w mieszkaniu.', price: 1200, maxWatts: 3200 }
      ],
      software: [
        { id: 'license_wizard', name: 'Licencja: Partition Wizard 98 (Tier 2)', desc: 'Odblokowuje systemy plików NTFS, EXT4, SWAP i remapowanie S.M.A.R.T.', price: 200, tier: 2 },
        { id: 'license_gparted', name: 'Pakiet: GParted LVM & ZFS Pro (Tier 3)', desc: 'Odblokowuje tablice GPT, ZFS oraz zaawansowaną kontrolę klastrów.', price: 550, tier: 3 },
        { id: 'license_hyper', name: 'Kod Źródłowy: NAVI Hyper-Storage (Tier 4)', desc: 'Wojskowe szyfrowanie LUKS i zacieranie śladów przed policją.', price: 1500, tier: 4 },
        { id: 'room_upgrade_lain', name: 'Transformacja Pokoju: Sanktuarium NAVI', desc: 'Przekształca pokój w cybernetyczną świątynię z finału Lain!', price: 2500, roomTier: 4 }
      ]
    };

    const items = catalog[category] || [];
    items.forEach(item => {
      const owned = this.isItemOwned(item, category);
      const card = document.createElement('div');
      card.className = 'store-card';
      card.innerHTML = `
        <div class="store-title">${item.name} ${owned ? '<span class="system-badge">POSIADASZ</span>' : ''}</div>
        <div class="store-meta">${item.desc || `Pojemność: ${item.size} GB | Interfejs: ${item.iface} | Pobór: ${item.watts}W`}</div>
        <div class="store-price-row">
          <span class="store-price">${item.price.toFixed(2)} PLN</span>
          <button class="cyber-btn store-buy-btn" ${owned ? 'disabled style="opacity: 0.5;"' : ''}>
            ${owned ? 'ZAKUPIONO' : 'Kup'}
          </button>
        </div>
      `;

      card.querySelector('.store-buy-btn').addEventListener('click', () => {
        this.buyStoreItem(item, category);
      });

      container.appendChild(card);
    });
  }

  isItemOwned(item, category) {
    if (category === 'software') {
      if (item.tier && this.state.toolTier >= item.tier) return true;
      if (item.roomTier && this.state.roomTier >= item.roomTier) return true;
    }
    if (category === 'power') {
      if (item.maxWatts && this.state.fuseMaxWatts >= item.maxWatts) return true;
    }
    if (category === 'cooling' && item.id === 'liquid_kit') {
      if (this.state.roomTier >= 3) return true;
    }
    return false;
  }

  buyStoreItem(item, category) {
    if (this.isItemOwned(item, category)) {
      this.showToast(`To ulepszenie (${item.name}) zostało już zakupione!`, "error");
      return;
    }

    if (this.state.money < item.price) {
      this.showToast(`Niewystarczające środki! Potrzebujesz ${item.price} PLN.`, "error");
      return;
    }

    this.state.money -= item.price;
    window.audioEngine?.playBeep(980, 0.1);

    if (category === 'disks') {
      const nextLetter = String.fromCharCode(98 + this.state.disks.length); // sdb, sdc, sdd...
      const newDisk = {
        id: `disk-${Date.now()}`,
        dev: `/dev/sd${nextLetter}`,
        model: item.name,
        type: item.type,
        interface: item.iface,
        sizeGB: item.size,
        tableType: item.size > 2048 ? 'GPT' : 'MBR',
        powerWatts: item.watts,
        heatRate: item.watts * 0.005,
        health: 100,
        badSectors: [],
        remappedSectors: [],
        partitions: []
      };
      this.state.disks.push(newDisk);
      this.showToast(`Zamontowano nowy nośnik: ${newDisk.dev} (${newDisk.model})!`, "success");
    } else if (category === 'cooling') {
      if (item.id === 'liquid_kit') {
        this.state.roomTier = Math.max(3, this.state.roomTier);
        this.state.coolingFluidLevel = 100;
        this.showToast("Zainstalowano zestaw chłodzenia cieczą!", "success");
      } else if (item.id === 'coolant_refill') {
        this.state.coolingFluidLevel = 100;
        this.showToast("Napełniono zbiornik płynu chłodzącego do 100%.", "success");
      } else {
        this.showToast(`Kupiono i zainstalowano: ${item.name}!`, "success");
      }
    } else if (category === 'power') {
      this.state.fuseMaxWatts = item.maxWatts;
      this.showToast(`Zmodernizowano sieć elektryczną! Nowy limit: ${item.maxWatts}W.`, "success");
    } else if (category === 'software') {
      if (item.tier) {
        this.state.toolTier = Math.max(this.state.toolTier, item.tier);
        this.showToast(`Odblokowano poziom narzędzi ${item.tier}: ${item.name}!`, "success");
      } else if (item.roomTier) {
        this.state.roomTier = item.roomTier;
        this.showToast("POKÓJ PRZEKSZTAŁCONY W SANKTUARIUM NAVI! Witamy w The Wired.", "success");
      }
    }

    this.state.notify();
  }

  // --- CONTRACTS BOARD ---
  bindContractsActions() {
    this.initDefaultContracts();
    this.renderContracts();
  }

  initDefaultContracts() {
    if (this.state.contracts.length === 0) {
      this.state.contracts = [
        {
          id: 'c-1',
          client: 'Anonim z forum Warez.pl',
          title: 'Magazyn na archiwa multimediów',
          desc: 'Potrzebuję czystej partycji EXT4 lub NTFS o rozmiarze min. 25 GB z dużymi klastrami (16KB lub 64KB) do buforowania plików.',
          reqFs: ['EXT4', 'NTFS'],
          reqMinGB: 25,
          reqClusters: ['16KB', '64KB'],
          rewardPLN: 180,
          rewardCrypto: 0.0002,
          completed: false
        },
        {
          id: 'c-2',
          client: 'Syndykat Tachibana',
          title: 'Skarbiec korporacyjny ZFS',
          desc: 'Wymagane przygotowanie partycji ZFS o pojemności 50 GB pod bezpieczne sumy kontrolne.',
          reqFs: ['ZFS'],
          reqMinGB: 50,
          reqClusters: ['4KB', '16KB'],
          rewardPLN: 450,
          rewardCrypto: 0.0008,
          completed: false
        },
        {
          id: 'c-3',
          client: 'Cień The Wired',
          title: 'Szyfrowana skrytka LUKS',
          desc: 'Nie pytaj o zawartość. Przygotuj 30 GB z wojskowym szyfrowaniem LUKS i punktem montowania /mnt/darknet.',
          reqFs: ['LUKS'],
          reqMinGB: 30,
          reqClusters: ['4KB'],
          rewardPLN: 600,
          rewardCrypto: 0.0025,
          completed: false
        }
      ];
    }
  }

  renderContracts() {
    const list = document.getElementById('contracts-list');
    list.innerHTML = '';
    this.state.contracts.forEach(c => {
      const item = document.createElement('div');
      item.className = `contract-item ${c.completed ? 'completed' : ''} ${this.state.activeContract?.id === c.id ? 'active' : ''}`;
      item.innerHTML = `
        <div class="c-title">${c.title}</div>
        <div class="c-reward">${c.completed ? 'ZAKOŃCZONE' : `Nagroda: +${c.rewardPLN} PLN`}</div>
      `;
      item.addEventListener('click', () => {
        this.state.activeContract = c;
        this.renderActiveContract(c);
        this.renderContracts();
        window.audioEngine?.playClick();
      });
      list.appendChild(item);
    });
  }

  renderActiveContract(c) {
    const view = document.getElementById('contract-active-view');
    view.innerHTML = `
      <h3>${c.title}</h3>
      <div style="font-size: 11px; color: #889;">Nadawca: ${c.client}</div>
      <p style="margin: 8px 0; font-size: 12px;">${c.desc}</p>
      <div class="contract-spec-box">
        WYMOGI KLIENTA:<br>
        - System plików: ${c.reqFs.join(' lub ')}<br>
        - Minimalny rozmiar: ${c.reqMinGB} GB<br>
        - Dozwolone klastry: ${c.reqClusters.join(', ')}<br>
        - Nagroda: ${c.rewardPLN} PLN + ${c.rewardCrypto} Ⓦ
      </div>
      <div style="margin-top: 10px;">
        <button id="btn-fulfill-contract" class="cyber-btn highlight-btn" ${c.completed ? 'disabled' : ''}>
          ${c.completed ? 'Zlecenie Zrealizowane' : 'Zweryfikuj i Oddaj Zlecenie'}
        </button>
      </div>
    `;

    document.getElementById('btn-fulfill-contract')?.addEventListener('click', () => {
      this.fulfillContract(c);
    });
  }

  fulfillContract(c) {
    const all = window.servicesEngine.getAllPartitions();
    const match = all.find(e => {
      const p = e.part;
      return p.sizeGB >= c.reqMinGB && c.reqFs.includes(p.fs) && c.reqClusters.includes(p.clusterSize);
    });

    if (!match) {
      this.showToast("Brak spełniającej wymogi partycji w Twoim systemie!", "error");
      return;
    }

    c.completed = true;
    this.state.money += c.rewardPLN;
    this.state.crypto += c.rewardCrypto;
    this.state.reputation += 10;
    window.audioEngine?.playBeep(1100, 0.2);
    this.showToast(`Zlecenie zrealizowane! Otrzymano +${c.rewardPLN} PLN!`, "success");
    this.renderActiveContract(c);
    this.renderContracts();
    this.state.notify();
  }

  // --- POWER & CLIMATE WINDOW ---
  bindPowerActions() {
    document.getElementById('btn-toggle-window-os').addEventListener('click', () => {
      window.roomView?.triggerAction('window');
    });
    document.getElementById('btn-toggle-pump-os').addEventListener('click', () => {
      window.roomView?.triggerAction('coolant');
    });
    document.getElementById('btn-reset-fuse-os').addEventListener('click', () => {
      window.roomView?.triggerAction('fusebox');
    });
  }

  // --- BANK & BILLS ---
  bindBankActions() {
    document.getElementById('btn-exchange-crypto').addEventListener('click', () => {
      const input = document.getElementById('crypto-exchange-amount');
      const amount = parseFloat(input.value);
      if (isNaN(amount) || amount <= 0 || amount > this.state.crypto) {
        this.showToast("Nieprawidłowa ilość lub brak wystarczającej ilości Ⓦ!", "error");
        return;
      }
      this.state.crypto -= amount;
      const plnEarned = amount * this.state.cryptoRate;
      this.state.money += plnEarned;
      window.audioEngine?.playBeep(880, 0.1);
      this.showToast(`Wymieniono ${amount.toFixed(4)} Ⓦ na ${plnEarned.toFixed(2)} PLN!`, "success");
      this.state.notify();
    });

    const btnRepayDebt = document.getElementById('btn-repay-debt');
    if (btnRepayDebt) {
      btnRepayDebt.addEventListener('click', () => {
        if (this.state.debtBalance <= 0) {
          this.showToast("Brak zadłużenia w banku.");
          return;
        }
        const valInput = document.getElementById('debt-repay-amount');
        const amount = parseFloat(valInput.value);
        if (isNaN(amount) || amount <= 0) {
          this.showToast("Podaj prawidłową kwotę spłaty długu!", "error");
          return;
        }
        const repayAmt = Math.min(this.state.debtBalance, amount);
        if (this.state.money < repayAmt) {
          this.showToast(`Brak wystarczających środków! Masz tylko ${this.state.money.toFixed(2)} PLN.`, "error");
          return;
        }
        this.state.money -= repayAmt;
        this.state.debtBalance -= repayAmt;
        if (this.state.debtBalance <= 0) {
          this.state.debtBalance = 0;
          this.state.debtDaysRemaining = 0;
        }
        window.audioEngine?.playBeep(920, 0.1);
        this.showToast(`Spłacono ${repayAmt.toFixed(2)} PLN długu bankowego!`, "success");
        this.renderBank();
        this.state.notify();
      });
    }

    document.getElementById('btn-pay-rent').addEventListener('click', () => {
      if (this.state.money < this.state.rentAmount) {
        this.showToast(`Brak środków na opłacenie czynszu (${this.state.rentAmount} PLN)!`, "error");
        return;
      }
      this.state.money -= this.state.rentAmount;
      this.state.rentDueDays = 7;
      window.audioEngine?.playBeep(650, 0.15);
      this.showToast("Czynsz został opłacony na kolejne 7 dni!", "success");
      this.state.notify();
    });

    document.getElementById('btn-pay-power').addEventListener('click', () => {
      if (this.state.money < this.state.powerBillAmount) {
        this.showToast("Brak środków na opłacenie rachunku za prąd!", "error");
        return;
      }
      this.state.money -= this.state.powerBillAmount;
      this.state.powerBillAmount = 0.0;
      this.state.powerKwhAccrued = 0.0;
      window.audioEngine?.playBeep(650, 0.15);
      this.showToast("Uregulowano należność za energię elektryczną.", "success");
      this.state.notify();
    });
  }

  // --- TERMINAL CLI ---
  bindTerminal() {
    const input = document.getElementById('term-input');
    const output = document.getElementById('term-output');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        if (cmd) {
          this.executeTerminalCommand(cmd, output);
        }
        input.value = '';
        output.scrollTop = output.scrollHeight;
        window.audioEngine?.playClick();
      }
    });
  }

  executeTerminalCommand(cmd, output) {
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerText = `root@lain-navi:~# ${cmd}`;
    output.appendChild(line);

    const parts = cmd.split(' ');
    const root = parts[0].toLowerCase();

    const print = (text) => {
      const res = document.createElement('div');
      res.className = 'term-line';
      res.innerText = text;
      output.appendChild(res);
    };

    switch (root) {
      case 'help':
        print('Dostępne komendy:');
        print('  lsblk                - Wyświetla listę nośników i partycji');
        print('  fdisk -l             - Szczegółowy raport tablic partycji');
        print('  smartctl -a [dev]    - Diagnostyka S.M.A.R.T. dysku');
        print('  top                  - Monitor procesów i poboru mocy');
        print('  clear                - Czyści ekran konsoli');
        print('  reboot               - Restartuje środowisko systemu');
        break;
      case 'lsblk':
        print('NAME       SIZE  TYPE  FSTYPE   MOUNTPOINT');
        for (const disk of this.state.disks) {
          print(`${disk.dev.padEnd(10)} ${disk.sizeGB}G   disk  ${disk.tableType}`);
          for (const p of disk.partitions) {
            print(`  ${p.dev.padEnd(8)} ${p.sizeGB}G   part  ${p.fs.padEnd(8)} ${p.mount}`);
          }
        }
        break;
      case 'fdisk':
        for (const disk of this.state.disks) {
          print(`Dysk ${disk.dev}: ${disk.sizeGB} GB, model ${disk.model}, tablica: ${disk.tableType}`);
          print(`Partycje: ${disk.partitions.length}`);
        }
        break;
      case 'smartctl':
        const targetDisk = this.state.disks[0];
        print(`S.M.A.R.T. Raport dla ${targetDisk.dev}:`);
        print(`  Stan zdrowia: ${targetDisk.health}%`);
        print(`  Uszkodzone sektory: ${targetDisk.badSectors.length}`);
        print(`  Zremapowane sektory: ${targetDisk.remappedSectors.length}`);
        break;
      case 'top':
        print(`Pobór mocy: ${Math.round(this.state.currentWatts)}W / ${this.state.fuseMaxWatts}W`);
        print(`Temperatura: ${this.state.roomTemp.toFixed(1)}°C`);
        print(`Aktywne demony The Wired: ${this.state.services.length}`);
        break;
      case 'clear':
        output.innerHTML = '';
        break;
      case 'reboot':
        print('Restartowanie Copland OS...');
        window.audioEngine?.playBeep(440, 0.4);
        setTimeout(() => print('Copland OS uruchomiony ponownie.'), 1000);
        break;
      default:
        print(`Nieznane polecenie: '${root}'. Wpisz 'help'.`);
    }
  }

  // --- TUTORIAL LOGIC & STEP TRACKING ---
  bindTutorial() {
    this.tutorialWidget = document.getElementById('tutorial-widget');
    this.btnTutorialToggle = document.getElementById('btn-tutorial-toggle');
    this.btnTutorialMin = document.getElementById('btn-tutorial-min');
    this.btnTutorialClose = document.getElementById('btn-tutorial-close');
    this.btnTutorialPrev = document.getElementById('btn-tutorial-prev');
    this.btnTutorialNext = document.getElementById('btn-tutorial-next');

    this.tutorialSteps = [
      {
        step: 1,
        title: "1. Zasiądź do komputera NAVI",
        text: "Witaj w pokoju! Naciśnij klawisz <strong>[SPACJA]</strong> lub kliknij biurko NAVI w pokoju, aby usiąść przed pulpitem systemu operacyjnego.",
        check: () => this.state.activeView === 'desktop'
      },
      {
        step: 2,
        title: "2. Otwórz Menedżer Dysków",
        text: "Kliknij ikonę <strong>Menedżer Dysków</strong> na pulpicie. Zobaczysz swój dysk <code>/dev/sda</code> z chronioną partycją systemową <code>SYSTEM_OS</code> (oznaczoną tarczą 🛡️).",
        check: () => {
          const win = document.getElementById('app-disk-mgr');
          return win && !win.classList.contains('minimized');
        }
      },
      {
        step: 3,
        title: "3. Utwórz partycję dla The Wired",
        text: "W Menedżerze Dysków kliknij <strong>'➕ Nowa Partycja'</strong> (lub wolne szare pole). Wybierz rozmiar (np. <strong>30 GB</strong>), system <strong>EXT4</strong>, klastry <strong>4KB</strong> i punkt montowania <strong>/mnt/wired</strong>. Następnie kliknij 'Utwórz i Formatuj'.",
        check: () => {
          return this.state.disks.some(d => d.partitions.some(p => p.mount === '/mnt/wired' && p.sizeGB >= 15));
        }
      },
      {
        step: 4,
        title: "4. Uruchom usługę The Wired",
        text: "Otwórz okno <strong>'Węzły The Wired'</strong>. Przy usłudze 'Węzeł Przekaźnikowy The Wired' wybierz z listy nową partycję (zobaczysz zielone checkmarki ✓ w polu diagnozy) i kliknij <strong>'Uruchom'</strong>!",
        check: () => {
          return this.state.services.some(s => s.serviceId === 'wired_relay');
        }
      },
      {
        step: 5,
        title: "5. Pilnuj prądu i temperatury",
        text: "Świetnie! Węzeł zarabia gotówkę (+PLN), ale pobiera waty (W) i podgrzewa pokój. Wróć do pokoju <strong>[SPACJA]</strong>. Kliknij <strong>okno</strong>, aby je otworzyć i schłodzić nośniki powietrzem z zewnątrz.",
        check: () => this.state.windowOpen
      },
      {
        step: 6,
        title: "6. Ekonomia, Czynsz i Rozwój",
        text: "Pamiętaj: co 7 dni musisz opłacić <strong>500 PLN czynszu</strong> w oknie Banku! Kupuj większe dyski i licencje na Giełdzie Sprzętu, remapuj uszkodzone sektory i rozbuduj swoje sanktuarium NAVI. Samouczek ukończony!",
        check: () => this.state.tutorialCompleted
      }
    ];

    if (this.btnTutorialToggle) {
      this.btnTutorialToggle.addEventListener('click', () => {
        this.state.tutorialHidden = !this.state.tutorialHidden;
        this.renderTutorial();
        window.audioEngine?.playClick();
      });
    }

    if (this.btnTutorialMin) {
      this.btnTutorialMin.addEventListener('click', () => {
        this.tutorialWidget.classList.toggle('minimized');
        window.audioEngine?.playClick();
      });
    }

    if (this.btnTutorialClose) {
      this.btnTutorialClose.addEventListener('click', () => {
        this.state.tutorialHidden = true;
        this.renderTutorial();
        window.audioEngine?.playClick();
      });
    }

    if (this.btnTutorialPrev) {
      this.btnTutorialPrev.addEventListener('click', () => {
        if (this.state.tutorialStep > 1) {
          this.state.tutorialStep--;
          this.renderTutorial();
          window.audioEngine?.playClick();
        }
      });
    }

    if (this.btnTutorialNext) {
      this.btnTutorialNext.addEventListener('click', () => {
        if (this.state.tutorialStep < this.tutorialSteps.length) {
          this.state.tutorialStep++;
          this.renderTutorial();
          window.audioEngine?.playClick();
        } else {
          if (!this.state.tutorialCompleted) {
            this.state.tutorialCompleted = true;
            this.state.money += 100;
            window.audioEngine?.playBeep(1100, 0.25);
            this.showToast("Gratulacje! Samouczek ukończony. Otrzymujesz +100 PLN nagrody!", "success");
          }
          this.state.tutorialHidden = true;
          this.renderTutorial();
        }
      });
    }

    this.renderTutorial();
  }

  checkTutorialProgress() {
    if (this.state.tutorialCompleted || !this.tutorialSteps) return;
    const currentStep = this.tutorialSteps.find(s => s.step === this.state.tutorialStep);
    if (currentStep && currentStep.check()) {
      window.audioEngine?.playBeep(920, 0.15);
      this.showToast(`Krok samouczka ukończony: ${currentStep.title}!`, "success");
      if (this.state.tutorialStep < this.tutorialSteps.length) {
        this.state.tutorialStep++;
      } else {
        this.state.tutorialCompleted = true;
        this.state.money += 100;
        this.showToast("Samouczek w pełni ukończony! +100 PLN!", "success");
      }
      this.renderTutorial();
      this.state.notify();
    }
  }

  renderTutorial() {
    if (!this.tutorialWidget) return;
    if (this.state.tutorialHidden) {
      this.tutorialWidget.classList.add('hidden');
      return;
    }
    this.tutorialWidget.classList.remove('hidden');

    const cur = this.tutorialSteps.find(s => s.step === this.state.tutorialStep) || this.tutorialSteps[0];
    document.getElementById('tutorial-step-counter').innerText = `Krok ${cur.step} / ${this.tutorialSteps.length}`;
    document.getElementById('tutorial-title').innerText = cur.title;
    document.getElementById('tutorial-text').innerHTML = cur.text;

    const pct = (cur.step / this.tutorialSteps.length) * 100;
    document.getElementById('tutorial-progress-bar').style.width = `${pct}%`;

    const prevBtn = document.getElementById('btn-tutorial-prev');
    const nextBtn = document.getElementById('btn-tutorial-next');
    prevBtn.disabled = cur.step <= 1;
    if (cur.step === this.tutorialSteps.length) {
      nextBtn.innerText = 'Zakończ (+100 PLN)';
    } else {
      nextBtn.innerText = 'Dalej ▶';
    }
  }

  // --- RENDER ALL UI SECTIONS ---
  renderAll() {
    this.renderTopStatus();
    this.renderDiskManager();
    this.renderServices();
    this.renderPowerGrid();
    this.renderBank();
    this.renderPnL();
    this.renderRaid();
    this.renderForensics();
    this.renderDefender();
    this.updateTaskbar();
    this.renderTutorial();
    this.checkTutorialProgress();
  }

  // Fast HUD-only update on ticks (avoids destroying active dropdowns or selections)
  renderTickHUD() {
    this.renderTopStatus();
    this.renderPowerGrid();
    this.renderBank();
    this.renderPnL();
    this.renderDefender();
    this.checkTutorialProgress();
  }

  renderTopStatus() {
    const t = this.state.inGameTime;
    const timeStr = `Dzień ${t.day}, ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
    const clockStr = `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
    document.getElementById('time-display').innerText = timeStr;
    document.getElementById('tray-clock').innerText = clockStr;
    document.getElementById('money-display').innerText = `${this.state.money.toFixed(2)} PLN`;
    document.getElementById('crypto-display').innerText = `${this.state.crypto.toFixed(4)} Ⓦ`;
    document.getElementById('rent-timer').innerText = `Za ${this.state.rentDueDays} dni (${this.state.rentAmount} PLN)`;
    document.getElementById('power-display').innerText = `${Math.round(this.state.currentWatts)}W / ${this.state.fuseMaxWatts}W`;
    document.getElementById('temp-display').innerText = `${this.state.roomTemp.toFixed(1)}°C`;

    // Network I/O Speed in tray
    const totalTraffic = this.state.services.reduce((acc, s) => acc + parseFloat(s.trafficMBps || 0), 0);
    document.getElementById('tray-net-speed').innerText = `I/O: ${totalTraffic.toFixed(1)} MB/s`;

    // Threat indicator
    const trayThreat = document.getElementById('tray-police-threat');
    trayThreat.innerText = `POLICJA: ${Math.round(this.state.policeThreat)}%`;
    if (this.state.policeThreat > 60) {
      trayThreat.className = 'threat-indicator threat-warning';
    } else {
      trayThreat.className = 'threat-indicator';
    }

    const debtPill = document.getElementById('debt-pill');
    if (debtPill) {
      if (this.state.debtBalance > 0) {
        debtPill.classList.remove('hidden');
        document.getElementById('debt-display').innerText = `${this.state.debtBalance.toFixed(2)} PLN`;
      } else {
        debtPill.classList.add('hidden');
      }
    }
    const weatherDisplay = document.getElementById('weather-display');
    if (weatherDisplay) {
      weatherDisplay.innerText = `${this.state.outdoorTemp.toFixed(1)}°C`;
    }

    // Room dock statuses
    document.getElementById('dock-fuse-status').innerText = this.state.fuseTripped ? 'WYBITA!' : 'Sprawna';
    document.getElementById('dock-window-status').innerText = this.state.windowOpen ? 'Otwarte' : 'Zamknięte';
    document.getElementById('dock-food-status').innerText = `Głód: ${Math.round(this.state.hunger)}%`;
    document.getElementById('dock-energy-status').innerText = `Energia: ${Math.round(this.state.energy)}%`;
    document.getElementById('dock-coolant-status').innerText = `Zbiornik: ${Math.round(this.state.coolingFluidLevel)}%`;
  }

  renderDiskManager() {
    const disk = window.diskEngine.getActiveDisk();
    if (!disk) return;

    // Sidebar disk list
    const list = document.getElementById('disk-device-list');
    list.innerHTML = '';
    this.state.disks.forEach(d => {
      const item = document.createElement('div');
      item.className = `device-item ${d.id === disk.id ? 'active' : ''}`;
      item.innerHTML = `
        <div class="dev-name">${d.dev} [${d.sizeGB} GB]</div>
        <div class="dev-meta">${d.model} (${d.type})</div>
      `;
      item.addEventListener('click', () => {
        this.state.selectedDiskId = d.id;
        this.state.selectedPartId = null;
        this.renderDiskManager();
        window.audioEngine?.playClick();
      });
      list.appendChild(item);
    });

    // Specs
    document.getElementById('active-disk-specs').innerHTML = `
      <strong>Interfejs:</strong> ${disk.interface}<br>
      <strong>Tablica:</strong> ${disk.tableType}<br>
      <strong>S.M.A.R.T. Zdrowie:</strong> ${disk.health}%<br>
      <strong>Pobór:</strong> ${disk.powerWatts}W | <strong>Ogrzewanie:</strong> +${disk.heatRate.toFixed(2)}°C/h
    `;

    // Visual Strip Bar
    const strip = document.getElementById('disk-visual-strip');
    strip.innerHTML = '';
    const { allocated, unallocated } = window.diskEngine.getDiskSpaceUsage(disk);

    // Check if selected partition is system protected
    const selectedPart = disk.partitions.find(p => p.id === this.state.selectedPartId);
    const isSelectedPartSystem = selectedPart && (selectedPart.isSystem || selectedPart.mount === '/' || selectedPart.label === 'SYSTEM_OS');
    const btnDelPart = document.getElementById('btn-delete-partition');
    if (btnDelPart) {
      if (isSelectedPartSystem) {
        btnDelPart.disabled = true;
        btnDelPart.style.opacity = '0.35';
        btnDelPart.title = 'Partycja systemowa (OS) - zablokowana przed usunięciem!';
      } else {
        btnDelPart.disabled = false;
        btnDelPart.style.opacity = '1';
        btnDelPart.title = 'Usuń zaznaczoną partycję';
      }
    }

    document.getElementById('disk-bar-name').innerText = `${disk.dev} [${disk.sizeGB} GB ${disk.type}]`;
    document.getElementById('disk-bar-free').innerText = `Wolne: ${unallocated} GB / ${disk.sizeGB} GB`;

    disk.partitions.forEach(p => {
      const isSys = p.isSystem || p.mount === '/' || p.label === 'SYSTEM_OS';
      const block = document.createElement('div');
      const widthPct = (p.sizeGB / disk.sizeGB) * 100;
      block.className = `part-block col-${p.fs.toLowerCase()} ${p.id === this.state.selectedPartId ? 'selected' : ''}`;
      block.style.width = `${Math.max(4, widthPct)}%`;
      block.innerHTML = `
        <span class="block-label">${p.label} (${p.sizeGB}G) ${isSys ? '🛡️' : ''}</span>
        <span class="block-fs">${p.fs} [${p.clusterSize}]</span>
      `;
      block.addEventListener('click', () => {
        this.state.selectedPartId = p.id;
        this.renderDiskManager();
        window.audioEngine?.playClick();
      });
      strip.appendChild(block);
    });

    // Unallocated block if free space exists
    if (unallocated > 0) {
      const freeBlock = document.createElement('div');
      const widthPct = (unallocated / disk.sizeGB) * 100;
      freeBlock.className = 'part-block col-unalloc';
      freeBlock.style.width = `${Math.max(4, widthPct)}%`;
      freeBlock.innerHTML = `<span class="block-label">Nieprzydzielone (${unallocated} GB)</span>`;
      freeBlock.addEventListener('click', () => {
        this.openPartitionModal('create', unallocated);
      });
      strip.appendChild(freeBlock);
    }

    // Partitions Table
    const tbody = document.getElementById('partitions-tbody');
    tbody.innerHTML = '';
    disk.partitions.forEach(p => {
      const isSys = p.isSystem || p.mount === '/' || p.label === 'SYSTEM_OS';
      const tr = document.createElement('tr');
      if (p.id === this.state.selectedPartId) tr.className = 'selected';
      tr.innerHTML = `
        <td><strong>${p.dev}</strong> (${p.label}) ${isSys ? '<span class="system-badge">🛡️ SYSTEM OS</span>' : ''}</td>
        <td>${p.sizeGB} GB</td>
        <td><span class="color-box col-${p.fs.toLowerCase()}"></span> ${p.fs}</td>
        <td>${p.clusterSize}</td>
        <td>${p.mount}</td>
        <td>${p.serviceId ? '🟢 ' + p.serviceId : '—'}</td>
        <td>${p.encrypted ? '🔒 Szyfrowana' : (isSys ? 'Chroniona' : 'Standard')}</td>
      `;
      tr.addEventListener('click', () => {
        this.state.selectedPartId = p.id;
        this.renderDiskManager();
        window.audioEngine?.playClick();
      });
      tbody.appendChild(tr);
    });

    // Sector Grid (128 blocks)
    const sectorGrid = document.getElementById('sector-grid');
    sectorGrid.innerHTML = '';
    document.getElementById('bad-sectors-count').innerText = `${disk.badSectors.length} bad sectorów`;

    for (let i = 0; i < 128; i++) {
      const s = document.createElement('div');
      s.className = 'sector-block';
      if (disk.badSectors.includes(i)) {
        s.classList.add('bad');
      } else if (disk.remappedSectors.includes(i)) {
        s.classList.add('remapped');
      } else if (allocated > 0 && i < Math.floor((allocated / disk.sizeGB) * 128)) {
        s.classList.add('allocated');
      }
      sectorGrid.appendChild(s);
    }
  }

  renderServices() {
    const container = document.getElementById('services-grid-list');
    if (!container) return;
    const all = window.servicesEngine.getAllPartitions();

    if (!this.serviceSelectedPart) {
      this.serviceSelectedPart = {};
    }

    window.servicesEngine.serviceCatalog.forEach(def => {
      const isRunning = this.state.services.some(s => s.serviceId === def.id);
      const runningInstance = this.state.services.find(s => s.serviceId === def.id);
      let card = document.getElementById(`service-card-${def.id}`);

      // Build options HTML
      let partOptions = '<option value="">-- Wybierz partycję do montowania --</option>';
      all.forEach(({ disk, part }) => {
        partOptions += `<option value="${part.id}">${disk.dev} -> ${part.dev} (${part.label}, ${part.sizeGB}GB, ${part.fs}, ${part.clusterSize}, ${part.mount})</option>`;
      });

      if (!card) {
        card = document.createElement('div');
        card.id = `service-card-${def.id}`;
        card.className = `service-card ${isRunning ? 'running' : ''}`;
        card.innerHTML = `
          <div class="service-card-top">
            <span class="service-name">${def.name}</span>
            <span class="service-status-tag ${isRunning ? 'status-active' : 'status-stopped'}">
              ${isRunning ? 'AKTYWNY' : 'ZATRZYMANY'}
            </span>
          </div>
          <div class="service-desc">${def.desc}</div>
          <div class="service-requirements">
            Wymogi: Min ${def.minSizeGB} GB | FS: ${def.requiredFs.join('/')} | Klastry: ${def.preferredClusters.join('/')} | Mont: ${def.requiredMount}<br>
            Zysk: +${def.incomePerTick.toFixed(2)} PLN/cykl | Pobór: ${def.powerWatts}W | Ciepło: +${def.heatRate}°C/h
          </div>
          <div class="diag-box" id="diag-box-${def.id}"></div>
          <div class="service-actions">
            <select class="service-part-select" id="service-select-${def.id}" ${isRunning ? 'disabled' : ''}>
              ${partOptions}
            </select>
            <button class="cyber-btn service-toggle-btn ${isRunning ? '' : 'highlight-btn'}">
              ${isRunning ? 'Zatrzymaj' : 'Uruchom'}
            </button>
          </div>
        `;

        const select = card.querySelector('.service-part-select');
        const toggleBtn = card.querySelector('.service-toggle-btn');
        const diagBox = card.querySelector(`#diag-box-${def.id}`);

        const updateDiag = () => {
          const val = select.value;
          if (!val) {
            diagBox.innerHTML = '<span style="color: #667e99;">Wybierz partycję z listy poniżej, aby sprawdzić zgodność parametrów.</span>';
            return;
          }
          const entry = all.find(e => e.part.id === val);
          if (!entry) {
            diagBox.innerHTML = '';
            return;
          }
          const diag = window.servicesEngine.getPartitionDiagnostics(def, entry.part);
          if (!diag) return;

          diagBox.innerHTML = `
            <div class="diag-item ${diag.size.ok ? 'diag-ok' : 'diag-err'}">
              ${diag.size.ok ? '✓' : '✗'} <strong>Rozmiar:</strong> ${diag.size.msg}
            </div>
            <div class="diag-item ${diag.fs.ok ? 'diag-ok' : 'diag-err'}">
              ${diag.fs.ok ? '✓' : '✗'} <strong>System plików:</strong> ${diag.fs.msg}
            </div>
            <div class="diag-item ${diag.mount.ok ? 'diag-ok' : 'diag-err'}">
              ${diag.mount.ok ? '✓' : '✗'} <strong>Punkt montowania:</strong> ${diag.mount.msg}
            </div>
            <div class="diag-item ${diag.cluster.ok ? 'diag-ok' : 'diag-warn'}">
              ${diag.cluster.ok ? '✓' : 'ℹ'} <strong>Klastry:</strong> ${diag.cluster.msg}
            </div>
            <div class="diag-item ${diag.power.ok ? 'diag-ok' : 'diag-warn'}">
              ${diag.power.ok ? '✓' : '⚠️'} <strong>Zasilanie:</strong> ${diag.power.msg}
            </div>
          `;
        };

        select.addEventListener('change', () => {
          this.serviceSelectedPart[def.id] = select.value;
          updateDiag();
        });

        toggleBtn.addEventListener('click', () => {
          const currentlyRunning = this.state.services.some(s => s.serviceId === def.id);
          if (currentlyRunning) {
            window.servicesEngine.stopService(def.id);
            this.showToast(`Zatrzymano usługę: ${def.name}.`);
          } else {
            const partId = select.value;
            if (!partId) {
              this.showToast("Wybierz sformatowaną partycję z listy!", "error");
              return;
            }
            const res = window.servicesEngine.startService(def.id, partId);
            if (!res.success) {
              this.showToast(res.msg, "error");
            }
          }
        });

        // Set initial select value
        const initialVal = runningInstance ? runningInstance.partId : (this.serviceSelectedPart[def.id] || '');
        if (initialVal) {
          select.value = initialVal;
        }
        select.dataset.lastOptions = partOptions;
        updateDiag();

        container.appendChild(card);
      } else {
        // In-place update of existing card
        card.className = `service-card ${isRunning ? 'running' : ''}`;
        const statusTag = card.querySelector('.service-status-tag');
        if (statusTag) {
          statusTag.className = `service-status-tag ${isRunning ? 'status-active' : 'status-stopped'}`;
          statusTag.innerText = isRunning ? 'AKTYWNY' : 'ZATRZYMANY';
        }
        const toggleBtn = card.querySelector('.service-toggle-btn');
        if (toggleBtn) {
          toggleBtn.className = `cyber-btn service-toggle-btn ${isRunning ? '' : 'highlight-btn'}`;
          toggleBtn.innerText = isRunning ? 'Zatrzymaj' : 'Uruchom';
        }
        const select = card.querySelector('.service-part-select');
        if (select) {
          select.disabled = isRunning;
          // Only update options if they changed and select is not actively focused/open
          if (select.dataset.lastOptions !== partOptions && document.activeElement !== select) {
            const prevVal = select.value || (runningInstance ? runningInstance.partId : this.serviceSelectedPart[def.id]);
            select.innerHTML = partOptions;
            select.dataset.lastOptions = partOptions;
            if (prevVal) {
              select.value = prevVal;
            }
            const diagBox = card.querySelector(`#diag-box-${def.id}`);
            if (diagBox) {
              const val = select.value;
              const entry = all.find(e => e.part.id === val);
              if (entry) {
                const diag = window.servicesEngine.getPartitionDiagnostics(def, entry.part);
                if (diag) {
                  diagBox.innerHTML = `
                    <div class="diag-item ${diag.size.ok ? 'diag-ok' : 'diag-err'}">
                      ${diag.size.ok ? '✓' : '✗'} <strong>Rozmiar:</strong> ${diag.size.msg}
                    </div>
                    <div class="diag-item ${diag.fs.ok ? 'diag-ok' : 'diag-err'}">
                      ${diag.fs.ok ? '✓' : '✗'} <strong>System plików:</strong> ${diag.fs.msg}
                    </div>
                    <div class="diag-item ${diag.mount.ok ? 'diag-ok' : 'diag-err'}">
                      ${diag.mount.ok ? '✓' : '✗'} <strong>Punkt montowania:</strong> ${diag.mount.msg}
                    </div>
                    <div class="diag-item ${diag.cluster.ok ? 'diag-ok' : 'diag-warn'}">
                      ${diag.cluster.ok ? '✓' : 'ℹ'} <strong>Klastry:</strong> ${diag.cluster.msg}
                    </div>
                    <div class="diag-item ${diag.power.ok ? 'diag-ok' : 'diag-warn'}">
                      ${diag.power.ok ? '✓' : '⚠️'} <strong>Zasilanie:</strong> ${diag.power.msg}
                    </div>
                  `;
                }
              }
            }
          }
        }
      }
    });
  }

  renderPowerGrid() {
    const powerPct = Math.min(100, (this.state.currentWatts / this.state.fuseMaxWatts) * 100);
    document.getElementById('power-bar-fill').style.width = `${powerPct}%`;
    document.getElementById('power-val-detail').innerText = `${Math.round(this.state.currentWatts)}W`;
    document.getElementById('power-max-detail').innerText = `${this.state.fuseMaxWatts}W (Limit Bezpiecznika)`;

    const tempPct = Math.min(100, Math.max(0, (this.state.roomTemp - 15) / 40 * 100));
    document.getElementById('temp-bar-fill').style.width = `${tempPct}%`;
    document.getElementById('temp-val-detail').innerText = `${this.state.roomTemp.toFixed(1)}°C`;
  }

  renderBank() {
    document.getElementById('bank-pln-val').innerText = `${this.state.money.toFixed(2)} PLN`;
    document.getElementById('bank-crypto-val').innerText = `${this.state.crypto.toFixed(4)} Ⓦ`;
    document.getElementById('bill-rent-days').innerText = `Płatne za: ${this.state.rentDueDays} dni`;
    document.getElementById('bill-power-amount').innerText = `${this.state.powerBillAmount.toFixed(2)} PLN (${this.state.powerKwhAccrued.toFixed(2)} kWh)`;
  }
}

// Global UI instance
window.DesktopUI = DesktopUI;
