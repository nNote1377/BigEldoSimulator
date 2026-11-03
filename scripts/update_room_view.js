const fs = require('fs');
const path = require('path');

const roomPath = path.join(__dirname, '..', 'js', 'room_view.js');
let code = fs.readFileSync(roomPath, 'utf-8');

// 1. Update hotspots & triggerAction for AC
const oldHotspots = `    this.hotspots = [
      { id: 'pc', name: 'Stanowisko NAVI [Kliknij, by zasiąść]', x: 380, y: 180, w: 280, h: 260 },
      { id: 'fusebox', name: 'Skrzynka Bezpieczników [Reset / Stan]', x: 60, y: 120, w: 70, h: 90 },
      { id: 'window', name: 'Okno Pokoju [Otwórz/Zamknij]', x: 730, y: 90, w: 150, h: 180 },
      { id: 'bed', name: 'Materac / Łóżko [Odpocznij i zregeneruj siły]', x: 80, y: 340, w: 220, h: 140 },
      { id: 'fridge', name: 'Minilodówka & Zapasy [Zjedz / Kofeina]', x: 230, y: 220, w: 90, h: 110 },
      { id: 'coolant', name: 'Chłodzenie Wodne & Zbiornik [Pompa / Płyn]', x: 670, y: 380, w: 110, h: 110 }
    ];`;

const newHotspots = `    this.hotspots = [
      { id: 'pc', name: 'Stanowisko NAVI [Kliknij, by zasiąść]', x: 380, y: 180, w: 280, h: 260 },
      { id: 'fusebox', name: 'Skrzynka Bezpieczników [Reset / Stan]', x: 60, y: 120, w: 70, h: 90 },
      { id: 'window', name: 'Okno Pokoju [Otwórz/Zamknij]', x: 730, y: 90, w: 150, h: 180 },
      { id: 'bed', name: 'Materac / Łóżko [Odpocznij i zregeneruj siły]', x: 80, y: 340, w: 220, h: 140 },
      { id: 'fridge', name: 'Minilodówka & Zapasy [Zjedz / Kofeina]', x: 230, y: 220, w: 90, h: 110 },
      { id: 'coolant', name: 'Chłodzenie Wodne & Zbiornik [Pompa / Płyn]', x: 670, y: 380, w: 110, h: 110 },
      { id: 'ac', name: 'Klimatyzator Pokojowy [Włącz/Wyłącz]', x: 740, y: 275, w: 100, h: 42 }
    ];`;

code = code.replace(oldHotspots, newHotspots);

const oldTriggerAction = `      case 'coolant':
        this.toggleCoolingPump();
        break;`;

const newTriggerAction = `      case 'coolant':
        this.toggleCoolingPump();
        break;
      case 'ac':
        if (!this.state.acInstalled) {
          window.gameUI?.showToast("Brak klimatyzatora! Kup go na Giełdzie Sprzętu w dziale Chłodzenie.");
          return;
        }
        this.state.acActive = !this.state.acActive;
        window.audioEngine?.playBeep(this.state.acActive ? 850 : 350, 0.1);
        window.gameUI?.showToast(this.state.acActive ? "Włączono klimatyzator (AC) - mocny nawiew!" : "Wyłączono klimatyzator.");
        this.state.notify();
        break;`;

code = code.replace(oldTriggerAction, newTriggerAction);

// 2. Update renderWindow with midday heat, sun, and temperature text
const oldRenderWindowEnd = `    // Window panes
    ctx.strokeStyle = '#1b2230';
    ctx.lineWidth = 4;
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();

    // If window open: draw curtain flutter
    if (this.state.windowOpen) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const wave = Math.sin(this.animFrame * 0.08) * 8;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 15 + wave, wy + wh / 2, wx + 5, wy + wh);
      ctx.lineTo(wx, wy + wh);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();`;

const newRenderWindowEnd = `    // Sun and heat glare during hot hours
    if (!isNight && this.state.outdoorTemp > 26) {
      const sunY = isDusk ? wy + 60 : wy + 35;
      ctx.fillStyle = 'rgba(255, 220, 60, 0.3)';
      ctx.beginPath();
      ctx.arc(wx + 105, sunY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffee66';
      ctx.beginPath();
      ctx.arc(wx + 105, sunY, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Window panes
    ctx.strokeStyle = '#1b2230';
    ctx.lineWidth = 4;
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();

    // Temperature text on window sill
    ctx.fillStyle = '#ffaa33';
    ctx.font = '12px "Share Tech Mono"';
    ctx.fillText(\`DWÓR: \${this.state.outdoorTemp.toFixed(1)}°C\`, wx + 10, wy + wh - 8);

    // If window open: draw curtain flutter and street dust/air breeze
    if (this.state.windowOpen) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      const wave = Math.sin(this.animFrame * 0.08) * 8;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 15 + wave, wy + wh / 2, wx + 5, wy + wh);
      ctx.lineTo(wx, wy + wh);
      ctx.closePath();
      ctx.fill();

      // Incoming air heat/dust particles
      ctx.fillStyle = this.state.outdoorTemp > 28 ? 'rgba(255, 170, 50, 0.6)' : 'rgba(100, 200, 255, 0.6)';
      for (let d = 0; d < 4; d++) {
        const dx = wx + ((this.animFrame * 3 + d * 35) % ww);
        const dy = wy + 40 + (d * 30);
        ctx.fillRect(dx, dy, 2, 2);
      }
    }
    ctx.restore();`;

code = code.replace(oldRenderWindowEnd, newRenderWindowEnd);

// 3. Render AC unit and dust particles
const oldRender = `    // 9. Coolant Tank & Tubing (Tier 3 & 4)
    if (this.state.roomTier >= 3) {
      this.renderCoolantSystem(ctx);
    }

    // 10. Ambient Particles (Floating dust motes & Cyber data dust)
    this.renderParticles(ctx);`;

const newRender = `    // 9. Coolant Tank & Tubing (Tier 3 & 4)
    if (this.state.roomTier >= 3) {
      this.renderCoolantSystem(ctx);
    }

    // 9.5 AC Unit on Wall (If Installed)
    if (this.state.acInstalled) {
      this.renderAirConditioner(ctx);
    }

    // 10. Ambient Particles (Floating dust motes & Cyber data dust)
    this.renderParticles(ctx);`;

code = code.replace(oldRender, newRender);

// 4. Add renderAirConditioner method and enhance renderParticles with dustLevel
const oldParticles = `  renderParticles(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < 0) p.y = 540;
      if (p.x < 0) p.x = 960;
      if (p.x > 960) p.x = 0;

      ctx.fillStyle = \`rgba(0, 240, 255, \${p.alpha})\`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }`;

const newParticles = `  renderAirConditioner(ctx) {
    const ax = 740, ay = 275, aw = 100, ah = 36;
    // AC body
    ctx.fillStyle = '#e2e6eb';
    ctx.fillRect(ax, ay, aw, ah);
    ctx.strokeStyle = '#8fa0b5';
    ctx.lineWidth = 2;
    ctx.strokeRect(ax, ay, aw, ah);

    // Front vent grill
    ctx.fillStyle = '#1c2430';
    ctx.fillRect(ax + 10, ay + 20, aw - 20, 10);

    // LED display
    const isPowered = !this.state.fuseTripped;
    ctx.fillStyle = '#0a1018';
    ctx.fillRect(ax + aw - 32, ay + 6, 26, 10);
    ctx.font = '8px monospace';
    if (this.state.acActive && isPowered) {
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('18°C', ax + aw - 30, ay + 14);

      // Cool airflow wind lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      for (let w = 0; w < 3; w++) {
        const offset = ((this.animFrame * 2 + w * 15) % 40);
        ctx.beginPath();
        ctx.moveTo(ax + 20 + w * 25, ay + 32);
        ctx.lineTo(ax + 10 + w * 25 - offset * 0.4, ay + 55 + offset);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#ff3344';
      ctx.fillText('OFF', ax + aw - 28, ay + 14);
    }
  }

  renderParticles(ctx) {
    // Normal ambient particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < 0) p.y = 540;
      if (p.x < 0) p.x = 960;
      if (p.x > 960) p.x = 0;

      ctx.fillStyle = \`rgba(0, 240, 255, \${p.alpha})\`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    // Street dust particles scaling with dustLevel
    if (this.state.dustLevel > 10) {
      const dustCount = Math.floor(this.state.dustLevel * 0.5);
      ctx.fillStyle = 'rgba(210, 190, 140, 0.35)';
      for (let d = 0; d < dustCount; d++) {
        const dx = (d * 87 + this.animFrame * 0.3) % 960;
        const dy = (d * 53 + this.animFrame * 0.4) % 540;
        ctx.fillRect(dx, dy, 1.5, 1.5);
      }
    }
  }`;

code = code.replace(oldParticles, newParticles);

fs.writeFileSync(roomPath, code, 'utf-8');
console.log('Successfully updated room_view.js');
