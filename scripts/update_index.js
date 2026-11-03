const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf-8');

// 1. Update quick-status bar
const oldStatus = `<div class="stat-pill"><span class="label">CZAS:</span> <span id="time-display">Dzień 1, 08:00</span></div>
        <div class="stat-pill"><span class="label">ŚRODKI:</span> <span id="money-display" class="cash-value">450.00 PLN</span></div>
        <div class="stat-pill"><span class="label">KRYPTO:</span> <span id="crypto-display" class="crypto-value">0.0000 Ⓦ</span></div>
        <div class="stat-pill alert-pill"><span class="label">CZYNSZ:</span> <span id="rent-timer">Za 6 dni (500 PLN)</span></div>
        <div class="stat-pill" id="power-pill"><span class="label">MOC:</span> <span id="power-display">120W / 400W</span></div>
        <div class="stat-pill" id="temp-pill"><span class="label">TEMP:</span> <span id="temp-display">21.5°C</span></div>`;

const newStatus = `<div class="stat-pill"><span class="label">CZAS:</span> <span id="time-display">Dzień 1, 08:00</span></div>
        <div class="stat-pill"><span class="label">ŚRODKI:</span> <span id="money-display" class="cash-value">150.00 PLN</span></div>
        <div class="stat-pill"><span class="label">KRYPTO:</span> <span id="crypto-display" class="crypto-value">0.0000 Ⓦ</span></div>
        <div class="stat-pill alert-pill hidden" id="debt-pill"><span class="label">DŁUG:</span> <span id="debt-display" class="cash-value">0.00 PLN</span></div>
        <div class="stat-pill" id="weather-pill"><span class="label">DWÓR:</span> <span id="weather-display">20.0°C</span></div>
        <div class="stat-pill alert-pill"><span class="label">CZYNSZ:</span> <span id="rent-timer">Za 6 dni (500 PLN)</span></div>
        <div class="stat-pill" id="power-pill"><span class="label">MOC:</span> <span id="power-display">120W / 400W</span></div>
        <div class="stat-pill" id="temp-pill"><span class="label">TEMP:</span> <span id="temp-display">21.5°C</span></div>`;

if (content.includes(oldStatus)) {
  content = content.replace(oldStatus, newStatus);
} else {
  // Try CRLF normalized
  const normOld = oldStatus.replace(/\n/g, '\r\n');
  const normNew = newStatus.replace(/\n/g, '\r\n');
  content = content.replace(normOld, normNew);
}

// 2. Add desktop icons
const oldIconsEnd = `<div class="desktop-icon" data-app="app-guide">
          <div class="icon-img icon-doc"></div>
          <span>Instrukcja.txt</span>
        </div>`;

const newIcons = `<div class="desktop-icon" data-app="app-guide">
          <div class="icon-img icon-doc"></div>
          <span>Instrukcja.txt</span>
        </div>
        <div class="desktop-icon" data-app="app-pnl">
          <div class="icon-img icon-pnl"></div>
          <span>Finanse & P&L</span>
        </div>
        <div class="desktop-icon" data-app="app-raid">
          <div class="icon-img icon-raid"></div>
          <span>Kreator RAID</span>
        </div>
        <div class="desktop-icon" data-app="app-forensics">
          <div class="icon-img icon-forensics"></div>
          <span>Odzysk Danych</span>
        </div>
        <div class="desktop-icon" data-app="app-defender">
          <div class="icon-img icon-defender"></div>
          <span>Firewall & AV</span>
        </div>`;

if (content.includes(oldIconsEnd)) {
  content = content.replace(oldIconsEnd, newIcons);
} else {
  const normOld = oldIconsEnd.replace(/\n/g, '\r\n');
  const normNew = newIcons.replace(/\n/g, '\r\n');
  content = content.replace(normOld, normNew);
}

// 3. Add Bank Debt section in Bank Window
const oldBankCard = `<div class="bills-card">
              <h3>Nadchodzące Zobowiązania</h3>`;

const newBankDebtCard = `<div class="debt-box" id="bank-debt-section" style="margin-bottom:12px; padding:10px; border:1px solid #ff4455; background:rgba(255,50,50,0.08); border-radius:4px;">
              <h3 style="color:#ff4455; margin-top:0;">Dług Bankowy & Linia Kredytowa</h3>
              <div class="acc-row"><span>Stan Zadłużenia:</span> <strong id="bank-debt-amount" style="color:#ff4455;">0.00 PLN</strong></div>
              <div class="acc-row"><span>Oprocentowanie Dziennie:</span> <strong>5.0% (Lichwa)</strong></div>
              <div class="acc-row"><span>Termin przed Komornikiem:</span> <strong id="bank-debt-deadline">Brak zadłużenia</strong></div>
              <div class="crypto-exchange-row" style="margin-top:8px;">
                <input type="number" id="debt-repay-amount" value="50" min="1" step="10">
                <button id="btn-repay-debt" class="tool-btn">Spłać Część / Całość Długu</button>
              </div>
            </div>

            <div class="bills-card">
              <h3>Nadchodzące Zobowiązania</h3>`;

if (content.includes(oldBankCard)) {
  content = content.replace(oldBankCard, newBankDebtCard);
} else {
  const normOld = oldBankCard.replace(/\n/g, '\r\n');
  const normNew = newBankDebtCard.replace(/\n/g, '\r\n');
  content = content.replace(normOld, normNew);
}

// 4. Add the 4 new windows before closing of windows-container
const windowsContainerClose = `      </div>

      <!-- Desktop Bottom Taskbar -->`;

const newWindowsHtml = `        <!-- WINDOW: P&L FINANCIAL AUDIT -->
        <div id="app-pnl" class="cyber-window minimized" style="top: 40px; left: 160px; width: 680px; height: 500px;">
          <div class="window-header">
            <div class="window-title"><span class="win-icon">📊</span> FINANSE // AUDYT PRZYCHODÓW, KOSZTÓW & P&L</div>
            <div class="window-controls">
              <button class="win-btn win-minimize">_</button>
              <button class="win-btn win-close">✕</button>
            </div>
          </div>
          <div class="window-body pnl-layout">
            <div class="pnl-summary-grid">
              <div class="pnl-card">
                <span class="pnl-label">Gotówka PLN:</span>
                <strong id="pnl-cash-val" class="cash-value">150.00 PLN</strong>
              </div>
              <div class="pnl-card alert-card">
                <span class="pnl-label">Dług Bankowy (5%/d):</span>
                <strong id="pnl-debt-val">0.00 PLN</strong>
                <small id="pnl-debt-days">Brak zadłużenia</small>
              </div>
              <div class="pnl-card">
                <span class="pnl-label">Bilans Dzisiaj:</span>
                <strong id="pnl-today-net">+0.00 PLN</strong>
              </div>
              <div class="pnl-card">
                <span class="pnl-label">Wynik Wczorajszy:</span>
                <strong id="pnl-yesterday-net">+0.00 PLN</strong>
              </div>
            </div>

            <div class="pnl-details-section">
              <div class="pnl-column">
                <h4>🟢 Przychody (Suma)</h4>
                <div class="pnl-row"><span>Usługi The Wired:</span> <strong id="pnl-inc-services">0.00 PLN</strong></div>
                <div class="pnl-row"><span>Dzierżawa Wolumenów (SLA):</span> <strong id="pnl-inc-leasing">0.00 PLN</strong></div>
                <div class="pnl-row"><span>Koparka WiredCoin:</span> <strong id="pnl-inc-mining">0.0000 Ⓦ</strong></div>
                <div class="pnl-row"><span>Odzysk Danych (Złom):</span> <strong id="pnl-inc-forensics">0.00 PLN</strong></div>
              </div>
              <div class="pnl-column">
                <h4>🔴 Koszty i Kary</h4>
                <div class="pnl-row"><span>Energia Elektryczna:</span> <strong id="pnl-cost-power">0.00 PLN</strong></div>
                <div class="pnl-row"><span>Amortyzacja Dysków:</span> <strong id="pnl-cost-wear">0.00 PLN</strong></div>
                <div class="pnl-row"><span>Kary za Zerwanie SLA:</span> <strong id="pnl-cost-penalties">0.00 PLN</strong></div>
                <div class="pnl-row"><span>Mandaty za Hałas:</span> <strong id="pnl-cost-fines">0.00 PLN</strong></div>
              </div>
            </div>

            <div class="pnl-footer-bar">
              <span>Hałas Pokoju: <strong id="pnl-noise-val">12 dB</strong> (<span id="pnl-complaints-val">0% skarg sąsiadów</span>)</span>
              <span>Zapylenie: <strong id="pnl-dust-val">0%</strong></span>
            </div>
          </div>
        </div>

        <!-- WINDOW: RAID CONTROLLER -->
        <div id="app-raid" class="cyber-window minimized" style="top: 60px; left: 190px; width: 680px; height: 470px;">
          <div class="window-header">
            <div class="window-title"><span class="win-icon">🧱</span> MDADM // KREATOR MACIERZY PROGRAMOWYCH RAID</div>
            <div class="window-controls">
              <button class="win-btn win-minimize">_</button>
              <button class="win-btn win-close">✕</button>
            </div>
          </div>
          <div class="window-body raid-layout">
            <div class="raid-active-section">
              <h3>Aktywne Macierze RAID (/dev/md*)</h3>
              <div id="raid-list" class="raid-list">
                <!-- Dynamically populated -->
              </div>
            </div>

            <div class="raid-create-section">
              <h3>Utwórz Nową Macierz RAID</h3>
              <div class="form-group">
                <label>Poziom RAID:</label>
                <select id="raid-type-select">
                  <option value="RAID0">RAID 0 (Striping - 2x Prędkość I/O, 2x Bonus Koparki, 0 Redundancji)</option>
                  <option value="RAID1">RAID 1 (Mirroring - Pełna Kopia Lustrzana, Odporność na Awarię Dysku)</option>
                  <option value="JBOD">JBOD (Spanning - Połączenie Dysków w Jeden Wolumen)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Wybierz Dyski Składowe (min. 2 dyski bez partycji):</label>
                <div id="raid-disks-select" class="raid-disks-checkboxes">
                  <!-- Dynamically populated -->
                </div>
              </div>
              <button id="btn-create-raid" class="cyber-btn highlight-btn">Utwórz Macierz RAID</button>
            </div>
          </div>
        </div>

        <!-- WINDOW: DATA FORENSICS & CARVING -->
        <div id="app-forensics" class="cyber-window minimized" style="top: 80px; left: 220px; width: 680px; height: 480px;">
          <div class="window-header">
            <div class="window-title"><span class="win-icon">🔬</span> FORENSICS // EKSTRAKCJA DANYCH ZE ZŁOMU (CARVING)</div>
            <div class="window-controls">
              <button class="win-btn win-minimize">_</button>
              <button class="win-btn win-close">✕</button>
            </div>
          </div>
          <div class="window-body forensics-layout">
            <div class="forensics-scanner-bar">
              <label>Dysk do analizy:</label>
              <select id="forensics-disk-select"></select>
              <button id="btn-start-carving" class="cyber-btn highlight-btn">🔍 Uruchom Data Carving</button>
            </div>
            <div id="forensics-progress" class="forensics-status-box hidden">
              <span id="forensics-status-text">Skanowanie sektorów surowych...</span>
              <div class="progress-bar-wrap"><div id="forensics-progress-bar" style="width: 0%;"></div></div>
            </div>
            <div class="forensics-results-box">
              <h3>Odzyskane Pliki & Wrażliwe Dane</h3>
              <div id="forensics-files-list" class="forensics-files-table-wrapper">
                <!-- Dynamically populated files -->
              </div>
            </div>
          </div>
        </div>

        <!-- WINDOW: FIREWALL & DEFENDER -->
        <div id="app-defender" class="cyber-window minimized" style="top: 100px; left: 250px; width: 620px; height: 440px;">
          <div class="window-header">
            <div class="window-title"><span class="win-icon">🛡️</span> DEFENDER // TARCZA BEZPIECZEŃSTWA & FIREWALL</div>
            <div class="window-controls">
              <button class="win-btn win-minimize">_</button>
              <button class="win-btn win-close">✕</button>
            </div>
          </div>
          <div class="window-body defender-layout">
            <div class="defender-status-card">
              <div class="defender-status-icon" id="defender-shield-icon">🛡️</div>
              <div class="defender-status-text">
                <h3 id="defender-status-headline">Ochrona Aktywna</h3>
                <p id="defender-status-sub">Brak krytycznych naruszeń integralności partycji.</p>
              </div>
            </div>

            <div class="defender-firewall-toggle-box">
              <div>
                <strong>Zapora Sieciowa NAVI-WALL:</strong>
                <p>Filtruje złośliwe pakiety DarkNetu (-90% szansy na atak Ransomware).</p>
              </div>
              <button id="btn-toggle-firewall" class="cyber-btn active-btn">Firewall: WŁĄCZONY</button>
            </div>

            <div class="defender-threats-section">
              <h3>Wykryte Zagrożenia & Ransomware (<span id="defender-threats-count">0</span>)</h3>
              <div id="defender-threats-list" class="defender-threats-list">
                <!-- Injected threats -->
              </div>
              <button id="btn-clean-all-threats" class="cyber-btn alert-tool-btn">Kwarantanna & Usunięcie (30 PLN)</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Bottom Taskbar -->`;

if (content.includes(windowsContainerClose)) {
  content = content.replace(windowsContainerClose, newWindowsHtml);
} else {
  const normOld = windowsContainerClose.replace(/\n/g, '\r\n');
  const normNew = newWindowsHtml.replace(/\n/g, '\r\n');
  content = content.replace(normOld, normNew);
}

// 5. Add Modal Lease Breach before #tutorial-widget
const oldTutWidget = `    <!-- INTERACTIVE TUTORIAL WIDGET -->`;

const newLeaseModal = `    <!-- MODAL: LEASE BREACH CONFIRMATION -->
    <div id="modal-lease-breach" class="cyber-modal hidden">
      <div class="modal-dialog alert-dialog">
        <div class="modal-header alert-header">
          <span>⚠️ ZERWANIE UMOWY NAJMU PARTYCJI</span>
          <button class="win-btn modal-breach-close">✕</button>
        </div>
        <div class="modal-body">
          <p><strong>UWAGA:</strong> Ta partycja jest obecnie wynajmowana zewnętrznemu klientowi w ramach umowy SLA!</p>
          <div class="breach-info-card">
            <div><strong>Klient:</strong> <span id="breach-client-name">-</span></div>
            <div><strong>Kara umowna:</strong> <span id="breach-penalty-val" class="cash-value">-</span></div>
            <div><strong>Utrata reputacji:</strong> <span class="cash-value" style="color:var(--crt-red);">-20 REP</span></div>
          </div>
          <p class="breach-warning">
            Formatowanie lub usunięcie partycji przed końcem kontraktu zerwie umowę SLA. Jeśli nie posiadasz wystarczającej gotówki, kwota kary zostanie doliczona do <strong>długu w E-Banku z 5% dziennym oprocentowaniem lichwiarskim</strong>!
          </p>
        </div>
        <div class="modal-footer">
          <button id="btn-breach-cancel" class="cyber-btn">Anuluj (Zachowaj partycję)</button>
          <button id="btn-breach-confirm" class="cyber-btn alert-tool-btn">Potwierdź Zerwanie & Zapłać Karę</button>
        </div>
      </div>
    </div>

    <!-- INTERACTIVE TUTORIAL WIDGET -->`;

if (content.includes(oldTutWidget)) {
  content = content.replace(oldTutWidget, newLeaseModal);
} else {
  const normOld = oldTutWidget.replace(/\n/g, '\r\n');
  const normNew = newLeaseModal.replace(/\n/g, '\r\n');
  content = content.replace(normOld, normNew);
}

fs.writeFileSync(indexPath, content, 'utf-8');
console.log('Successfully updated index.html');
