const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'styles.css');
let content = fs.readFileSync(cssPath, 'utf-8');

const newStyles = `
/* --- 2.0 OVERHAUL ICONS --- */
.icon-pnl { background: #153322; border: 2px solid #33ffaa; border-radius: 4px; }
.icon-pnl::after { content: "P&L"; font-family: var(--pixel-font); font-size: 8px; color: #33ffaa; position: absolute; bottom: 4px; left: 6px; }

.icon-raid { background: #332211; border: 2px solid #ff9933; border-radius: 4px; }
.icon-raid::after { content: "RAID"; font-family: var(--pixel-font); font-size: 7px; color: #ff9933; position: absolute; bottom: 4px; left: 4px; }

.icon-forensics { background: #221533; border: 2px solid #cc44ff; border-radius: 4px; }
.icon-forensics::after { content: "CARV"; font-family: var(--pixel-font); font-size: 7px; color: #cc44ff; position: absolute; bottom: 4px; left: 4px; }

.icon-defender { background: #112233; border: 2px solid #44aaff; border-radius: 4px; }
.icon-defender::after { content: "SEC"; font-family: var(--pixel-font); font-size: 8px; color: #44aaff; position: absolute; bottom: 4px; left: 6px; }

/* --- P&L LAYOUT --- */
.pnl-layout {
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pnl-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.pnl-card {
  background: #0d121c;
  border: 1px solid #28364d;
  padding: 8px;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pnl-card.alert-card {
  border-color: #ff4455;
  background: rgba(255, 68, 85, 0.08);
}
.pnl-label {
  font-size: 11px;
  color: var(--text-dim);
}
.pnl-details-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.pnl-column {
  background: #0c1018;
  border: 1px solid #1f2b3e;
  padding: 10px;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pnl-column h4 {
  margin: 0 0 6px 0;
  font-size: 13px;
  border-bottom: 1px solid #28364d;
  padding-bottom: 4px;
}
.pnl-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.pnl-footer-bar {
  background: #090c14;
  border-top: 1px solid #222f42;
  padding: 8px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
}

/* --- RAID CONTROLLER LAYOUT --- */
.raid-layout {
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.raid-active-section, .raid-create-section {
  background: #0d121c;
  border: 1px solid #24334a;
  padding: 10px;
  border-radius: 4px;
}
.raid-card {
  background: #141c2a;
  border: 1px solid #3a4d6b;
  padding: 8px 10px;
  margin-bottom: 8px;
  border-radius: 3px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.raid-card-title {
  font-weight: bold;
  color: var(--crt-cyan);
}
.raid-disks-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #080b12;
  border: 1px solid #1e293b;
  padding: 8px;
  max-height: 120px;
  overflow-y: auto;
}
.raid-checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

/* --- FORENSICS LAYOUT --- */
.forensics-layout {
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.forensics-scanner-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  background: #0d121c;
  border: 1px solid #24334a;
  padding: 8px 10px;
}
.forensics-status-box {
  background: #060810;
  border: 1px solid #cc44ff;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.progress-bar-wrap {
  background: #111;
  border: 1px solid #333;
  height: 12px;
  border-radius: 2px;
  overflow: hidden;
}
#forensics-progress-bar {
  background: linear-gradient(90deg, #cc44ff, #00f0ff);
  height: 100%;
}
.forensics-files-table-wrapper {
  background: #080b12;
  border: 1px solid #1e293b;
  min-height: 140px;
  max-height: 220px;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.forensics-file-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #101724;
  border: 1px solid #28374d;
  padding: 5px 8px;
  border-radius: 3px;
}

/* --- DEFENDER & FIREWALL LAYOUT --- */
.defender-layout {
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.defender-status-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #0d1422;
  border: 1px solid #2a3c5a;
  padding: 12px;
  border-radius: 4px;
}
.defender-status-icon {
  font-size: 32px;
}
.defender-status-text h3 {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: var(--crt-cyan);
}
.defender-status-text p {
  margin: 0;
  font-size: 12px;
  color: var(--text-dim);
}
.defender-firewall-toggle-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #0d121c;
  border: 1px solid #24334a;
  padding: 10px;
  border-radius: 3px;
}
.defender-threats-section {
  background: #0c1018;
  border: 1px solid #222f42;
  padding: 10px;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.defender-threats-list {
  min-height: 60px;
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.threat-badge {
  background: rgba(255, 68, 85, 0.15);
  border: 1px solid #ff4455;
  color: #ff6677;
  padding: 4px 8px;
  border-radius: 2px;
  font-size: 11px;
}

/* --- LEASE BREACH MODAL --- */
.alert-dialog {
  border: 2px solid #ff3344 !important;
  box-shadow: 0 0 25px rgba(255, 51, 68, 0.5) !important;
}
.alert-header {
  background: #4a1118 !important;
  color: #ff4455 !important;
}
.breach-info-card {
  background: #140d10;
  border: 1px solid #4a1e24;
  padding: 8px 12px;
  margin: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
.breach-warning {
  color: #ffaa55;
  font-size: 12px;
  line-height: 1.4;
}
`;

content += newStyles;
fs.writeFileSync(cssPath, content, 'utf-8');
console.log('Successfully updated css/styles.css');
