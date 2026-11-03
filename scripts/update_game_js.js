const fs = require('fs');
const path = require('path');

const gamePath = path.join(__dirname, '..', 'js', 'game.js');
let code = fs.readFileSync(gamePath, 'utf-8');

const oldDaily = `    // Daily market refresh / small price fluctuation
    this.state.cryptoRate = Math.round(2200 + Math.random() * 600);
  }`;

const newDaily = `    // Daily market refresh / small price fluctuation
    this.state.cryptoRate = Math.round(2200 + Math.random() * 600);

    // Bank Debt & Usury Daily Interest (5%)
    if (this.state.debtBalance > 0) {
      const interest = Math.round(this.state.debtBalance * 0.05 * 100) / 100;
      this.state.debtBalance += interest;
      this.state.debtDaysRemaining -= 1;
      window.audioEngine?.playAlert();
      window.gameUI?.showToast(\`E-BANK: Naliczone dzienne odsetki 5% (+\${interest.toFixed(2)} PLN). Pozostało \${this.state.debtDaysRemaining} dni do egzekucji komorniczej!\`, "error");

      if (this.state.debtDaysRemaining <= 0) {
        this.executeDebtCollection();
      }
    }

    // Rollover daily P&L metrics
    this.state.pnlMetrics.yesterdayIncome = this.state.pnlMetrics.todayIncome;
    this.state.pnlMetrics.yesterdayExpenses = this.state.pnlMetrics.todayExpenses;
    this.state.pnlMetrics.todayIncome = 0;
    this.state.pnlMetrics.todayExpenses = 0;
  }

  executeDebtCollection() {
    window.audioEngine?.playAlert();
    // Find non-system disk to seize
    const nonSysDiskIdx = this.state.disks.findIndex(d => !d.partitions.some(p => p.isSystem || p.mount === '/'));
    if (nonSysDiskIdx !== -1) {
      const removedDisk = this.state.disks.splice(nonSysDiskIdx, 1)[0];
      const creditValue = Math.min(this.state.debtBalance, removedDisk.sizeGB * 1.5);
      this.state.debtBalance = Math.max(0, this.state.debtBalance - creditValue);
      this.state.debtDaysRemaining = 5;
      alert(\`KOMORNIK SĄDOWY: Wkroczył do mieszkania i zajął nośnik \${removedDisk.dev} (\${removedDisk.model}) na poczet długu bankowego (- \${creditValue.toFixed(2)} PLN długu)!\`);
    } else {
      // Seize all cash and crypto
      this.state.money = 0;
      this.state.crypto = 0;
      this.state.debtDaysRemaining = 3;
      alert("KOMORNIK SĄDOWY: Brak nośników do zajęcia! Zabezpieczono wszystkie środki z konta bankowego i portfela Wired. Wyznaczono ostateczny 3-dniowy termin spłaty!");
    }
    this.state.notify();
  }`;

code = code.replace(oldDaily, newDaily);
fs.writeFileSync(gamePath, code, 'utf-8');
console.log('Successfully updated game.js');
