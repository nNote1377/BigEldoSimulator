const fs = require('fs');
const path = require('path');

const uiPath = path.join(__dirname, '..', 'js', 'desktop_ui.js');
let code = fs.readFileSync(uiPath, 'utf-8');

// 1. Update constructor to include new binders
const oldCtorBinds = `    this.bindPowerActions();
    this.bindBankActions();
    this.bindTerminal();
    this.serviceSelectedPart = {};
    this.bindTutorial();
    this.renderAll();`;

const newCtorBinds = `    this.bindPowerActions();
    this.bindBankActions();
    this.bindTerminal();
    this.pendingBreach = null;
    this.bindLeaseBreachActions();
    this.bindRaidActions();
    this.bindForensicsActions();
    this.bindDefenderActions();
    this.serviceSelectedPart = {};
    this.bindTutorial();
    this.renderAll();`;

code = code.replace(oldCtorBinds, newCtorBinds);

// 2. In bindDiskManagerActions: update delete button handling for lease breach
const oldDelPart = `    // Delete partition
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
    });`;

const newDelPart = `    // Delete partition
    btnDelPart.addEventListener('click', () => {
      const disk = window.diskEngine.getActiveDisk();
      if (!this.state.selectedPartId) {
        this.showToast("Zaznacz partycję do usunięcia!", "error");
        return;
      }
      const res = window.diskEngine.deletePartition(disk.id, this.state.selectedPartId);
      if (res.requiresBreachConfirmation) {
        this.openLeaseBreachModal(res);
        return;
      }
      if (!res.success) {
        this.showToast(res.msg, "error");
      } else {
        this.showToast("Partycja została usunięta.", "success");
      }
    });`;

code = code.replace(oldDelPart, newDelPart);

// 3. In handleModalConfirm: update for lease breach
const oldModalConfirm = `    let res;
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
    }`;

const newModalConfirm = `    let res;
    if (this.modalMode === 'create') {
      res = window.diskEngine.createPartition(disk.id, label, size, fs, cluster, mount);
    } else {
      res = window.diskEngine.formatPartition(disk.id, this.modalTargetPart.id, fs, cluster, mount);
    }

    if (res.requiresBreachConfirmation) {
      this.modalPartition.classList.add('hidden');
      this.openLeaseBreachModal(res);
      return;
    }

    if (!res.success) {
      this.showToast(res.msg, "error");
    } else {
      this.modalPartition.classList.add('hidden');
      this.showToast(this.modalMode === 'create' ? "Utworzono nową partycję!" : "Partycja została sformatowana.", "success");
    }`;

code = code.replace(oldModalConfirm, newModalConfirm);

// 4. Update fulfillContract to attach lease and recurring SLA
const oldFulfill = `    c.completed = true;
    this.state.money += c.rewardPLN;
    this.state.crypto += c.rewardCrypto;
    this.state.reputation += 10;
    window.audioEngine?.playBeep(1100, 0.2);
    this.showToast(\`Zlecenie zrealizowane! Otrzymano +\${c.rewardPLN} PLN!\`, "success");
    this.renderActiveContract(c);
    this.renderContracts();
    this.state.notify();`;

const newFulfill = `    c.completed = true;
    match.part.leasedContractId = c.id;
    const lease = {
      id: c.id,
      client: c.client,
      partId: match.part.id,
      dailyRent: Math.round(c.rewardPLN * 0.25),
      penaltyAmount: Math.round(c.rewardPLN * 1.5),
      durationDays: 7,
      daysRemaining: 7,
      uptimeTicks: 0,
      totalTicks: 0
    };
    this.state.leasedContracts.push(lease);

    this.state.money += c.rewardPLN;
    this.state.crypto += c.rewardCrypto;
    this.state.reputation += 10;
    window.audioEngine?.playBeep(1100, 0.2);
    this.showToast(\`Zlecenie zrealizowane! Wynajęto wolumen klientowi (\${c.client}). Dzienny czynsz: +\${lease.dailyRent} PLN. Kara za usunięcie: \${lease.penaltyAmount} PLN!\`, "success");
    this.renderActiveContract(c);
    this.renderContracts();
    this.state.notify();`;

code = code.replace(oldFulfill, newFulfill);

// 5. Update bindBankActions to add debt repayment
const oldBankPay = `    document.getElementById('btn-pay-rent').addEventListener('click', () => {`;

const newBankPay = `    const btnRepayDebt = document.getElementById('btn-repay-debt');
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
          this.showToast(\`Brak wystarczających środków! Masz tylko \${this.state.money.toFixed(2)} PLN.\`, "error");
          return;
        }
        this.state.money -= repayAmt;
        this.state.debtBalance -= repayAmt;
        if (this.state.debtBalance <= 0) {
          this.state.debtBalance = 0;
          this.state.debtDaysRemaining = 0;
        }
        window.audioEngine?.playBeep(920, 0.1);
        this.showToast(\`Spłacono \${repayAmt.toFixed(2)} PLN długu bankowego!\`, "success");
        this.renderBank();
        this.state.notify();
      });
    }

    document.getElementById('btn-pay-rent').addEventListener('click', () => {`;

code = code.replace(oldBankPay, newBankPay);

// 6. Update renderBank to show debt
const oldRenderBank = `  renderBank() {
    document.getElementById('bank-pln-val').innerText = \`\${this.state.money.toFixed(2)} PLN\`;
    document.getElementById('bank-crypto-val').innerText = \`\${this.state.crypto.toFixed(4)} Ⓦ\`;
    document.getElementById('bill-rent-days').innerText = \`Płatne za: \${this.state.rentDueDays} dni\`;
    document.getElementById('bill-power-amount').innerText = \`\${this.state.powerBillAmount.toFixed(2)} PLN (\${this.state.powerKwhAccrued.toFixed(2)} kWh)\`;
  }`;

const newRenderBank = `  renderBank() {
    const plnEl = document.getElementById('bank-pln-val');
    if (plnEl) plnEl.innerText = \`\${this.state.money.toFixed(2)} PLN\`;
    const crEl = document.getElementById('bank-crypto-val');
    if (crEl) crEl.innerText = \`\${this.state.crypto.toFixed(4)} Ⓦ\`;
    const rentDaysEl = document.getElementById('bill-rent-days');
    if (rentDaysEl) rentDaysEl.innerText = \`Płatne za: \${this.state.rentDueDays} dni\`;
    const pwrEl = document.getElementById('bill-power-amount');
    if (pwrEl) pwrEl.innerText = \`\${this.state.powerBillAmount.toFixed(2)} PLN (\${this.state.powerKwhAccrued.toFixed(2)} kWh)\`;

    const debtAmt = document.getElementById('bank-debt-amount');
    const debtDeadline = document.getElementById('bank-debt-deadline');
    if (debtAmt) debtAmt.innerText = \`\${this.state.debtBalance.toFixed(2)} PLN\`;
    if (debtDeadline) {
      if (this.state.debtBalance > 0) {
        debtDeadline.innerText = \`\${this.state.debtDaysRemaining} dni (Wizyta Komornika)\`;
      } else {
        debtDeadline.innerText = 'Brak zadłużenia';
      }
    }
  }`;

code = code.replace(oldRenderBank, newRenderBank);

// 7. Update renderTopStatus to update debt-pill and weather-display
const oldRenderTop = `    // Room dock statuses`;

const newRenderTop = `    const debtPill = document.getElementById('debt-pill');
    if (debtPill) {
      if (this.state.debtBalance > 0) {
        debtPill.classList.remove('hidden');
        document.getElementById('debt-display').innerText = \`\${this.state.debtBalance.toFixed(2)} PLN\`;
      } else {
        debtPill.classList.add('hidden');
      }
    }
    const weatherDisplay = document.getElementById('weather-display');
    if (weatherDisplay) {
      weatherDisplay.innerText = \`\${this.state.outdoorTemp.toFixed(1)}°C\`;
    }

    // Room dock statuses`;

code = code.replace(oldRenderTop, newRenderTop);

// 8. Update renderAll and renderTickHUD
const oldRenderAll = `  // --- RENDER ALL UI SECTIONS ---
  renderAll() {
    this.renderTopStatus();
    this.renderDiskManager();
    this.renderServices();
    this.renderPowerGrid();
    this.renderBank();
    this.updateTaskbar();
    this.renderTutorial();
    this.checkTutorialProgress();
  }

  // Fast HUD-only update on ticks (avoids destroying active dropdowns or selections)
  renderTickHUD() {
    this.renderTopStatus();
    this.renderPowerGrid();
    this.renderBank();
    this.checkTutorialProgress();
  }`;

const newRenderAll = `  // --- RENDER ALL UI SECTIONS ---
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
  }`;

code = code.replace(oldRenderAll, newRenderAll);

// 9. Update catalog in renderBazaarContent and buyStoreItem
const oldCatalog = `    const catalog = {
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
    };`;

const newCatalog = `    const catalog = {
      disks: [
        { id: 'scrap_hitachi_40', name: 'Hitachi Deskstar 40GB [ZE ZŁOMU]', desc: 'Tani dysk ze złomowiska. Posiada bad sectory i pozostałości starych plików do odzyskania.', type: 'HDD', size: 40, iface: 'IDE', watts: 22, price: 35, isScrap: true, health: 65, hasHiddenData: true },
        { id: 'scrap_samsung_80', name: 'Samsung SpinPoint 80GB [ZE ZŁOMU]', desc: 'Dysk z odzysku. Wymaga remapowania sektorów, kryje wrażliwe archiwa!', type: 'HDD', size: 80, iface: 'SATA', watts: 24, price: 65, isScrap: true, health: 70, hasHiddenData: true },
        { id: 'wd_160', name: 'Western Digital Caviar 160GB', type: 'HDD', size: 160, iface: 'SATA', watts: 20, price: 120, tier: 1 },
        { id: 'seagate_500', name: 'Seagate Barracuda 500GB 7200RPM', type: 'HDD', size: 500, iface: 'SATA', watts: 25, price: 280, tier: 1 },
        { id: 'maxtor_scsi', name: 'Maxtor Atlas 300GB Ultra320 SCSI', type: 'SCSI', size: 300, iface: 'SCSI', watts: 38, price: 420, tier: 2 },
        { id: 'intel_ssd', name: 'Intel X25-M 80GB SATA-II SSD', type: 'SSD', size: 80, iface: 'SATA', watts: 6, price: 350, tier: 2 },
        { id: 'wd_red_2tb', name: 'WD Red Pro 2TB NAS Storage', type: 'HDD', size: 2048, iface: 'SATA', watts: 30, price: 890, tier: 3 },
        { id: 'tachibana_quantum', name: 'Tachibana Cyber-Drive 10TB Hyper-Array', type: 'QUANTUM', size: 10240, iface: 'NVME', watts: 45, price: 3400, tier: 4 }
      ],
      cooling: [
        { id: 'compressed_air', name: 'Sprężone Powietrze & Filtry', desc: 'Czyści cały kurz z radiatorów (zeruje wskaźnik zapylenia do 0%).', price: 40, isCleaner: true },
        { id: 'fan_silent', name: 'Wentylator Biurkowy Silent 120mm', desc: 'Obniża temperaturę pokoju o ~0.08°C/h.', watts: 8, price: 45 },
        { id: 'fan_exhaust', name: 'Przemysłowy Wentylator Wyciągowy', desc: 'Potężny wyciąg ciepła z obudowy i okna.', watts: 25, price: 180 },
        { id: 'portable_ac', name: 'Klimatyzator Przenośny (AC 450W)', desc: 'Mocne aktywne chłodzenie! Niezbędne podczas letnich upałów w południe.', watts: 450, price: 650, isAc: true },
        { id: 'liquid_kit', name: 'Zestaw Chłodzenia Cieczą Lain-V1', desc: 'Instaluje pompę i rurki chłodzenia na podłodze.', watts: 40, price: 650, unlockTier: 3 },
        { id: 'coolant_refill', name: 'Kanister Płynu Chłodzącego (5L)', desc: 'Uzupełnia zbiornik chłodzenia do 100%.', price: 90 }
      ],
      power: [
        { id: 'pcie_sata_2', name: 'Karta PCIe: Kontroler SATA 2-portowy', desc: 'Rozszerza płytę główną o +2 sloty na dyski (obecny limit: ' + this.state.maxDiskSlots + ').', price: 220, addSlots: 2 },
        { id: 'pcie_sata_4', name: 'Karta PCIe: Kontroler SAS/SATA 4-portowy', desc: 'Profesjonalny kontroler serwerowy. Dodaje +4 porty dyskowe.', price: 480, addSlots: 4 },
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
    };`;

code = code.replace(oldCatalog, newCatalog);

// 10. In buyStoreItem check disk limit and handle new items
const oldBuyDisks = `    if (category === 'disks') {
      const nextLetter = String.fromCharCode(98 + this.state.disks.length); // sdb, sdc, sdd...
      const newDisk = {
        id: \`disk-\${Date.now()}\`,
        dev: \`/dev/sd\${nextLetter}\`,
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
      this.showToast(\`Zamontowano nowy nośnik: \${newDisk.dev} (\${newDisk.model})!\`, "success");`;

const newBuyDisks = `    if (category === 'disks') {
      if (this.state.disks.length >= this.state.maxDiskSlots) {
        this.showToast(\`Brak wolnych portów na płycie głównej! Limit: \${this.state.maxDiskSlots} dyski. Dokup kontroler PCIe SATA w dziale Zasilanie.\`, "error");
        return;
      }
      const nextLetter = String.fromCharCode(98 + this.state.disks.length); // sdb, sdc, sdd...
      const newDisk = {
        id: \`disk-\${Date.now()}\`,
        dev: \`/dev/sd\${nextLetter}\`,
        model: item.name,
        type: item.type,
        interface: item.iface,
        sizeGB: item.size,
        tableType: item.size > 2048 ? 'GPT' : 'MBR',
        powerWatts: item.watts,
        heatRate: item.watts * 0.005,
        health: item.isScrap ? item.health : 100,
        badSectors: item.isScrap ? [14, 42, 87] : [],
        remappedSectors: [],
        hasHiddenData: !!item.hasHiddenData,
        partitions: []
      };
      this.state.disks.push(newDisk);
      this.showToast(\`Zamontowano nośnik: \${newDisk.dev} (\${newDisk.model})\${item.isScrap ? ' [Stan złomu: uruchom Data Carving!]' : ''}!\`, "success");`;

code = code.replace(oldBuyDisks, newBuyDisks);

// 11. In buyStoreItem cooling and power handlers
const oldBuyCooling = `      if (item.id === 'liquid_kit') {
        this.state.roomTier = Math.max(3, this.state.roomTier);
        this.state.coolingFluidLevel = 100;
        this.showToast("Zainstalowano zestaw chłodzenia cieczą!", "success");
      } else if (item.id === 'coolant_refill') {
        this.state.coolingFluidLevel = 100;
        this.showToast("Napełniono zbiornik płynu chłodzącego do 100%.", "success");
      } else {
        this.showToast(\`Kupiono i zainstalowano: \${item.name}!\`, "success");
      }`;

const newBuyCooling = `      if (item.id === 'liquid_kit') {
        this.state.roomTier = Math.max(3, this.state.roomTier);
        this.state.coolingFluidLevel = 100;
        this.showToast("Zainstalowano zestaw chłodzenia cieczą!", "success");
      } else if (item.id === 'coolant_refill') {
        this.state.coolingFluidLevel = 100;
        this.showToast("Napełniono zbiornik płynu chłodzącego do 100%.", "success");
      } else if (item.isAc) {
        this.state.acInstalled = true;
        this.state.acActive = true;
        this.showToast("Zainstalowano klimatyzator (AC) w pokoju! Silne chłodzenie aktywne.", "success");
      } else if (item.isCleaner) {
        this.state.dustLevel = 0;
        this.showToast("Przedmuchano obudowę sprężonym powietrzem. Kurz usunięty!", "success");
      } else {
        this.showToast(\`Kupiono i zainstalowano: \${item.name}!\`, "success");
      }`;

code = code.replace(oldBuyCooling, newBuyCooling);

const oldBuyPower = `    } else if (category === 'power') {
      this.state.fuseMaxWatts = item.maxWatts;
      this.showToast(\`Zmodernizowano sieć elektryczną! Nowy limit: \${item.maxWatts}W.\`, "success");`;

const newBuyPower = `    } else if (category === 'power') {
      if (item.addSlots) {
        this.state.maxDiskSlots += item.addSlots;
        this.showToast(\`Zainstalowano kontroler PCIe! Maksymalna liczba dysków wzrosła do \${this.state.maxDiskSlots}!\`, "success");
      } else if (item.maxWatts) {
        this.state.fuseMaxWatts = item.maxWatts;
        this.showToast(\`Zmodernizowano sieć elektryczną! Nowy limit: \${item.maxWatts}W.\`, "success");
      }`;

code = code.replace(oldBuyPower, newBuyPower);

// 12. Add new methods at the end of class DesktopUI (before closing brace)
const closingBrace = `  renderBank() {
    const plnEl = document.getElementById('bank-pln-val');`;

const newMethods = `  // --- LEASE BREACH MODAL HANDLER ---
  openLeaseBreachModal(breachData) {
    this.pendingBreach = breachData;
    const clientEl = document.getElementById('breach-client-name');
    const penaltyEl = document.getElementById('breach-penalty-val');
    if (clientEl) clientEl.innerText = breachData.client || "Klient Korporacyjny";
    if (penaltyEl) penaltyEl.innerText = \`\${breachData.penalty.toFixed(2)} PLN\`;
    const modal = document.getElementById('modal-lease-breach');
    if (modal) modal.classList.remove('hidden');
    window.audioEngine?.playAlert();
  }

  bindLeaseBreachActions() {
    const modal = document.getElementById('modal-lease-breach');
    if (!modal) return;
    modal.querySelectorAll('.modal-breach-close, #btn-breach-cancel').forEach(b => {
      b.addEventListener('click', () => {
        modal.classList.add('hidden');
        this.pendingBreach = null;
      });
    });

    const confirmBtn = document.getElementById('btn-breach-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (!this.pendingBreach) return;
        const b = this.pendingBreach;
        modal.classList.add('hidden');

        if (b.actionType === 'delete') {
          window.diskEngine.deletePartition(b.diskId, b.partId, true);
          this.showToast(\`Zerwano umowę najmu! Naliczono karę \${b.penalty.toFixed(2)} PLN oraz -20 REP.\`, "error");
        } else if (b.actionType === 'format') {
          const p = b.formatParams;
          window.diskEngine.formatPartition(b.diskId, b.partId, p.fs, p.clusterSize, p.mount, p.encrypted, true);
          this.showToast(\`Zerwano umowę najmu i sformatowano wolumen! Naliczono karę \${b.penalty.toFixed(2)} PLN.\`, "error");
        }
        this.pendingBreach = null;
      });
    }
  }

  // --- P&L FINANCIAL AUDIT ---
  renderPnL() {
    const p = this.state.pnlMetrics;
    const todayNet = p.todayIncome - p.todayExpenses;
    const yestNet = p.yesterdayIncome - p.yesterdayExpenses;

    const cashVal = document.getElementById('pnl-cash-val');
    if (cashVal) cashVal.innerText = \`\${this.state.money.toFixed(2)} PLN\`;

    const debtVal = document.getElementById('pnl-debt-val');
    const debtDays = document.getElementById('pnl-debt-days');
    if (debtVal) debtVal.innerText = \`\${this.state.debtBalance.toFixed(2)} PLN\`;
    if (debtDays) debtDays.innerText = this.state.debtBalance > 0 ? \`Do egzekucji: \${this.state.debtDaysRemaining} dni\` : 'Brak zadłużenia';

    const todayNetEl = document.getElementById('pnl-today-net');
    if (todayNetEl) {
      todayNetEl.innerText = \`\${todayNet >= 0 ? '+' : ''}\${todayNet.toFixed(2)} PLN\`;
      todayNetEl.style.color = todayNet >= 0 ? 'var(--crt-green)' : 'var(--crt-red)';
    }

    const yestNetEl = document.getElementById('pnl-yesterday-net');
    if (yestNetEl) {
      yestNetEl.innerText = \`\${yestNet >= 0 ? '+' : ''}\${yestNet.toFixed(2)} PLN\`;
      yestNetEl.style.color = yestNet >= 0 ? 'var(--crt-green)' : 'var(--crt-red)';
    }

    const incServ = document.getElementById('pnl-inc-services');
    if (incServ) incServ.innerText = \`\${p.incomeServices.toFixed(2)} PLN\`;
    const incLease = document.getElementById('pnl-inc-leasing');
    if (incLease) incLease.innerText = \`\${p.incomeLeasing.toFixed(2)} PLN\`;
    const incMine = document.getElementById('pnl-inc-mining');
    if (incMine) incMine.innerText = \`\${p.incomeMining.toFixed(4)} Ⓦ\`;
    const incForensics = document.getElementById('pnl-inc-forensics');
    if (incForensics) incForensics.innerText = \`\${(p.incomeForensics || 0).toFixed(2)} PLN\`;

    const costPwr = document.getElementById('pnl-cost-power');
    if (costPwr) costPwr.innerText = \`\${p.costPower.toFixed(2)} PLN\`;
    const costWr = document.getElementById('pnl-cost-wear');
    if (costWr) costWr.innerText = \`\${p.costWear.toFixed(2)} PLN\`;
    const costPen = document.getElementById('pnl-cost-penalties');
    if (costPen) costPen.innerText = \`\${p.costPenalties.toFixed(2)} PLN\`;
    const costFine = document.getElementById('pnl-cost-fines');
    if (costFine) costFine.innerText = \`\${p.costFines.toFixed(2)} PLN\`;

    const noiseVal = document.getElementById('pnl-noise-val');
    if (noiseVal) noiseVal.innerText = \`\${this.state.noiseLevel} dB\`;
    const complaintsVal = document.getElementById('pnl-complaints-val');
    if (complaintsVal) complaintsVal.innerText = \`\${Math.round(this.state.neighborComplaints)}% skarg sąsiadów\`;
    const dustVal = document.getElementById('pnl-dust-val');
    if (dustVal) dustVal.innerText = \`\${Math.round(this.state.dustLevel)}%\`;
  }

  // --- RAID CREATOR ACTIONS & RENDER ---
  bindRaidActions() {
    const btnCreate = document.getElementById('btn-create-raid');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        const typeSelect = document.getElementById('raid-type-select');
        const level = typeSelect.value;
        const checkedBoxes = document.querySelectorAll('#raid-disks-select input[type="checkbox"]:checked');
        const diskIds = Array.from(checkedBoxes).map(cb => cb.value);

        if (diskIds.length < 2) {
          this.showToast("Wybierz co najmniej 2 wolne dyski do utworzenia macierzy RAID!", "error");
          return;
        }

        const res = window.diskEngine.createRaidArray(level, diskIds);
        if (!res.success) {
          this.showToast(res.msg, "error");
        } else {
          this.showToast(\`Utworzono macierz programową \${res.array.dev} (\${level})!\`, "success");
          this.renderRaid();
          this.renderDiskManager();
          this.state.notify();
        }
      });
    }
  }

  renderRaid() {
    const list = document.getElementById('raid-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.state.raidArrays.length === 0) {
      list.innerHTML = '<div style="color: #667e99; font-size: 12px; padding: 6px;">Brak aktywnych macierzy RAID. Wybierz dyski poniżej, aby połączyć je w /dev/md0.</div>';
    } else {
      this.state.raidArrays.forEach(arr => {
        const card = document.createElement('div');
        card.className = 'raid-card';
        card.innerHTML = \`
          <div>
            <div class="raid-card-title">\${arr.dev} [\${arr.level}]</div>
            <div style="font-size: 11px; color: #889;">
              Pojemność: \${arr.sizeGB} GB | Członkowie: \${arr.diskIds.length} dyski | Stan: \${arr.status}
            </div>
          </div>
          <button class="cyber-btn alert-tool-btn raid-dissolve-btn" data-id="\${arr.id}">Rozwiąż Macierz</button>
        \`;
        card.querySelector('.raid-dissolve-btn').addEventListener('click', () => {
          if (!confirm(\`Czy na pewno rozwiązać macierz \${arr.dev}? Dane zostaną zachowane na dyskach.\`)) return;
          const res = window.diskEngine.deleteRaidArray(arr.id);
          if (res.success) {
            this.showToast(\`Rozwiązano macierz \${arr.dev}.\`, "success");
            this.renderRaid();
            this.renderDiskManager();
            this.state.notify();
          }
        });
        list.appendChild(card);
      });
    }

    const container = document.getElementById('raid-disks-select');
    if (container) {
      container.innerHTML = '';
      const availableDisks = this.state.disks.filter(d => !d.inRaid && d.partitions.length === 0);
      if (availableDisks.length === 0) {
        container.innerHTML = '<span style="color:#667e99; font-size:11px;">Brak dostępnych czystych dysków. Usuń partycje z dysku lub dokup dysk na giełdzie.</span>';
      } else {
        availableDisks.forEach(d => {
          const row = document.createElement('label');
          row.className = 'raid-checkbox-item';
          row.innerHTML = \`
            <input type="checkbox" value="\${d.id}">
            <span>\${d.dev} [\${d.sizeGB} GB - \${d.model}]</span>
          \`;
          container.appendChild(row);
        });
      }
    }
  }

  // --- DATA FORENSICS & CARVING ---
  bindForensicsActions() {
    const btnCarve = document.getElementById('btn-start-carving');
    if (btnCarve) {
      btnCarve.addEventListener('click', () => {
        const select = document.getElementById('forensics-disk-select');
        const diskId = select.value;
        if (!diskId) {
          this.showToast("Wybierz nośnik do analizy carvingu!", "error");
          return;
        }
        const progBox = document.getElementById('forensics-progress');
        const progBar = document.getElementById('forensics-progress-bar');
        const statusText = document.getElementById('forensics-status-text');
        progBox.classList.remove('hidden');
        statusText.innerText = "Skanowanie surowych klastrów i nagłówków ELF/JPEG/DAT...";
        progBar.style.width = '0%';

        btnCarve.disabled = true;
        window.audioEngine?.playHddSeek(1.8);

        let progress = 0;
        const interval = setInterval(() => {
          progress += 25;
          progBar.style.width = \`\${progress}%\`;
          if (progress >= 100) {
            clearInterval(interval);
            btnCarve.disabled = false;
            progBox.classList.add('hidden');
            const res = window.diskEngine.scanForRecoverableData(diskId);
            if (res.found.length > 0) {
              window.audioEngine?.playBeep(1200, 0.2);
              this.showToast(\`SUKCES: Wyekstrahowano \${res.found.length} ukrytych plików ze złomu!\`, "success");
            } else {
              this.showToast("Brak pozostałości danych na tym dysku.", "normal");
            }
            this.renderForensics();
            this.state.notify();
          }
        }, 300);
      });
    }
  }

  renderForensics() {
    const select = document.getElementById('forensics-disk-select');
    if (select) {
      const prev = select.value;
      select.innerHTML = '';
      this.state.disks.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.innerText = \`\${d.dev} (\${d.model}, \${d.sizeGB}GB)\`;
        select.appendChild(opt);
      });
      if (prev) select.value = prev;
    }

    const fileList = document.getElementById('forensics-files-list');
    if (!fileList) return;
    fileList.innerHTML = '';

    if (this.state.recoveredDataFiles.length === 0) {
      fileList.innerHTML = '<div style="color: #667e99; font-size: 12px; padding: 6px;">Brak odzyskanych plików. Kup dysk ze złomu na giełdzie i uruchom Data Carving.</div>';
    } else {
      this.state.recoveredDataFiles.forEach(f => {
        const row = document.createElement('div');
        row.className = 'forensics-file-row';
        row.innerHTML = \`
          <div>
            <strong>\${f.name}</strong> (\${f.sizeMB} MB)
            <div style="font-size: 11px; color: #ffaa33;">Wartość rynkowa: ~\${f.valuePLN} PLN</div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="cyber-btn highlight-btn sell-file-btn" data-id="\${f.id}">💰 Sprzedaj</button>
            <button class="cyber-btn wipe-file-btn" data-id="\${f.id}">🗑️ Wyczyść</button>
          </div>
        \`;

        row.querySelector('.sell-file-btn').addEventListener('click', () => {
          const res = window.diskEngine.sellRecoveredData(f.id);
          if (res.success) {
            this.showToast(\`Sprzedano plik \${res.file.name} na czarnym rynku za +\${res.reward.toFixed(2)} PLN!\`, "success");
            this.renderForensics();
            this.state.notify();
          }
        });

        row.querySelector('.wipe-file-btn').addEventListener('click', () => {
          const idx = this.state.recoveredDataFiles.findIndex(df => df.id === f.id);
          if (idx !== -1) {
            this.state.recoveredDataFiles.splice(idx, 1);
            this.showToast(\`Usunięto plik \${f.name}.\`);
            this.renderForensics();
            this.state.notify();
          }
        });

        fileList.appendChild(row);
      });
    }
  }

  // --- DEFENDER & FIREWALL ---
  bindDefenderActions() {
    const btnFw = document.getElementById('btn-toggle-firewall');
    if (btnFw) {
      btnFw.addEventListener('click', () => {
        this.state.firewallActive = !this.state.firewallActive;
        btnFw.innerText = this.state.firewallActive ? "Firewall: WŁĄCZONY" : "Firewall: WYŁĄCZONY";
        btnFw.className = \`cyber-btn \${this.state.firewallActive ? 'active-btn' : ''}\`;
        window.audioEngine?.playBeep(this.state.firewallActive ? 800 : 350, 0.1);
        this.showToast(this.state.firewallActive ? "Zapora NAVI-WALL aktywna (-90% szans na infekcję)." : "Zapora sieciowa wyłączona!");
        this.state.notify();
      });
    }

    const btnClean = document.getElementById('btn-clean-all-threats');
    if (btnClean) {
      btnClean.addEventListener('click', () => {
        if (this.state.malwareActive.length === 0) {
          this.showToast("Brak zagrożeń w systemie.");
          return;
        }
        if (this.state.money < 30) {
          this.showToast("Brak środków na dezynfekcję systemu (wymagane 30 PLN)!", "error");
          return;
        }
        this.state.money -= 30;
        const count = this.state.malwareActive.length;
        while (this.state.malwareActive.length > 0) {
          const m = this.state.malwareActive[0];
          window.servicesEngine.cleanMalware(m.id);
        }
        this.showToast(\`Pakiet dezynfekcyjny usunął \${count} infekcji (-30 PLN)!\`, "success");
        this.renderDefender();
        this.state.notify();
      });
    }
  }

  renderDefender() {
    const countEl = document.getElementById('defender-threats-count');
    const headline = document.getElementById('defender-status-headline');
    const sub = document.getElementById('defender-status-sub');
    const icon = document.getElementById('defender-shield-icon');
    const list = document.getElementById('defender-threats-list');
    const btnClean = document.getElementById('btn-clean-all-threats');

    if (!countEl) return;

    const count = this.state.malwareActive.length;
    countEl.innerText = count;

    if (count === 0) {
      headline.innerText = "Ochrona Aktywna";
      sub.innerText = "Brak wykrytych zagrożeń i malware. System bezpieczny.";
      icon.innerText = "🛡️";
      list.innerHTML = '<span style="color:#667e99; font-size:12px;">Brak aktywnych infekcji.</span>';
      if (btnClean) btnClean.disabled = true;
    } else {
      headline.innerText = "WYKRYTO ZAGROŻENIE!";
      sub.innerText = \`System jest zainfekowany przez \${count} proces(y) malware! Kradną moc i psują klastry.\`;
      icon.innerText = "☣️";
      if (btnClean) btnClean.disabled = false;
      list.innerHTML = '';
      this.state.malwareActive.forEach(m => {
        const item = document.createElement('div');
        item.className = 'threat-badge';
        item.innerHTML = \`
          <strong>[\${m.name}]</strong> na partycji \${m.targetDev} | Pobór: +\${m.drainWatts}W
        \`;
        list.appendChild(item);
      });
    }
  }

  renderBank() {
    const plnEl = document.getElementById('bank-pln-val');`;

code = code.replace(closingBrace, newMethods);

fs.writeFileSync(uiPath, code, 'utf-8');
console.log('Successfully updated desktop_ui.js');
