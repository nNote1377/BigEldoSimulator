/**
 * NAVI // PARTITION.SYS - 2D PIXEL-ART ROOM VIEW (LAIN'S SANCTUARY)
 * Renders the protagonist's room, evolving from a sparse bedroom to a sprawling NAVI cyber-shrine.
 */

class RoomView {
  constructor(canvasId, state) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.state = state;
    this.tooltip = document.getElementById('room-tooltip');

    // Animation & rendering state
    this.animFrame = 0;
    this.particles = [];
    this.initParticles();

    // Hotspot bounding boxes for mouse interaction
    this.hotspots = [
      { id: 'pc', name: 'Stanowisko NAVI [Kliknij, by zasiąść]', x: 380, y: 180, w: 280, h: 260 },
      { id: 'fusebox', name: 'Skrzynka Bezpieczników [Reset / Stan]', x: 60, y: 120, w: 70, h: 90 },
      { id: 'window', name: 'Okno Pokoju [Otwórz/Zamknij]', x: 730, y: 90, w: 150, h: 180 },
      { id: 'bed', name: 'Materac / Łóżko [Odpocznij i zregeneruj siły]', x: 80, y: 340, w: 220, h: 140 },
      { id: 'fridge', name: 'Minilodówka & Zapasy [Zjedz / Kofeina]', x: 230, y: 220, w: 90, h: 110 },
      { id: 'coolant', name: 'Chłodzenie Wodne & Zbiornik [Pompa / Płyn]', x: 670, y: 380, w: 110, h: 110 },
      { id: 'ac', name: 'Klimatyzator Pokojowy [Włącz/Wyłącz]', x: 740, y: 275, w: 100, h: 42 }
    ];

    this.bindEvents();
    this.startLoop();
  }

  initParticles() {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.4
      });
    }
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.tooltip.classList.add('hidden');
    });
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      screenX: e.clientX,
      screenY: e.clientY
    };
  }

  handleMouseMove(e) {
    const { x, y, screenX, screenY } = this.getCanvasCoords(e);
    let hovered = null;
    for (const h of this.hotspots) {
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        hovered = h;
        break;
      }
    }

    if (hovered) {
      this.canvas.style.cursor = 'pointer';
      this.tooltip.innerText = hovered.name;
      this.tooltip.style.left = `${screenX + 15}px`;
      this.tooltip.style.top = `${screenY - 10}px`;
      this.tooltip.classList.remove('hidden');
    } else {
      this.canvas.style.cursor = 'crosshair';
      this.tooltip.classList.add('hidden');
    }
  }

  handleClick(e) {
    const { x, y } = this.getCanvasCoords(e);
    for (const h of this.hotspots) {
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        this.triggerAction(h.id);
        break;
      }
    }
  }

  triggerAction(actionId) {
    window.audioEngine?.playClick();
    switch (actionId) {
      case 'pc':
        window.gameUI?.switchView('desktop');
        break;
      case 'fusebox':
        if (this.state.fuseTripped) {
          this.state.fuseTripped = false;
          window.audioEngine?.playBeep(600, 0.1);
          window.gameUI?.showToast("Załączono bezpiecznik. Zasilanie przywrócone!", "success");
        } else {
          window.gameUI?.showToast(`Bezpiecznik sprawny. Aktualne obciążenie: ${Math.round(this.state.currentWatts)}W / ${this.state.fuseMaxWatts}W.`);
        }
        this.state.notify();
        break;
      case 'window':
        this.state.windowOpen = !this.state.windowOpen;
        window.audioEngine?.playBeep(this.state.windowOpen ? 700 : 400, 0.08);
        window.gameUI?.showToast(this.state.windowOpen ? "Otwarto okno. Chłodne powietrze napływa do pokoju." : "Zamknięto okno.");
        this.state.notify();
        break;
      case 'bed':
        this.sleepAndRecover();
        break;
      case 'fridge':
        this.eatAndDrink();
        break;
      case 'coolant':
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
        break;
    }
  }

  sleepAndRecover() {
    if (this.state.energy >= 95) {
      window.gameUI?.showToast("Nie jesteś zmęczony. Czas pracować nad partycjami!");
      return;
    }
    // Fast forward 6 hours
    for (let i = 0; i < 36; i++) {
      window.gameEngine?.tick();
    }
    this.state.energy = 100;
    this.state.hunger = Math.min(100, this.state.hunger + 25);
    window.audioEngine?.playBeep(520, 0.2);
    window.gameUI?.showToast("Przespałeś kilka godzin. Energia odzyskana!", "success");
    this.state.notify();
  }

  eatAndDrink() {
    if (this.state.money < 25) {
      window.gameUI?.showToast("Brak środków na jedzenie i napoje energetyczne (wymagane 25 PLN)!", "error");
      return;
    }
    this.state.money -= 25;
    this.state.hunger = Math.max(0, this.state.hunger - 40);
    this.state.energy = Math.min(100, this.state.energy + 20);
    window.audioEngine?.playBeep(880, 0.08);
    window.gameUI?.showToast("Zamówiono pizzę i Cyber-Colę (-25 PLN). Głód zaspokojony!", "success");
    this.state.notify();
  }

  toggleCoolingPump() {
    if (this.state.roomTier < 3) {
      window.gameUI?.showToast("Instalacja chłodzenia cieczą wymaga rozbudowy stanowiska do poziomu 3!");
      return;
    }
    this.state.coolingPumpActive = !this.state.coolingPumpActive;
    window.audioEngine?.playBeep(this.state.coolingPumpActive ? 900 : 350, 0.1);
    window.gameUI?.showToast(this.state.coolingPumpActive ? "Włączono pompę chłodzenia cieczą." : "Wyłączono pompę chłodzenia cieczą.");
    this.state.notify();
  }

  startLoop() {
    const loop = () => {
      this.render();
      this.animFrame++;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const hour = this.state.inGameTime.hour;
    const isNight = hour < 6 || hour >= 21;
    const isDusk = (hour >= 18 && hour < 21) || (hour >= 5 && hour < 7);

    // 1. Room Background Walls
    ctx.fillStyle = isNight ? '#070910' : (isDusk ? '#161320' : '#1c2230');
    ctx.fillRect(0, 0, w, 320);

    // Wallpaper subtle vertical stripes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let x = 0; x < w; x += 16) {
      ctx.fillRect(x, 0, 2, 320);
    }

    // Baseboard moulding
    ctx.fillStyle = '#0f131a';
    ctx.fillRect(0, 310, w, 12);

    // 2. Wooden Floorboards (Isometric perspective feel)
    const floorGrad = ctx.createLinearGradient(0, 320, 0, h);
    floorGrad.addColorStop(0, '#121622');
    floorGrad.addColorStop(1, '#080a10');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 322, w, h - 322);

    // Floorboard lines
    ctx.strokeStyle = '#1b2333';
    ctx.lineWidth = 1;
    for (let y = 322; y < h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Window (Sky & City Skyline)
    this.renderWindow(ctx, isNight, isDusk);

    // 4. Fuse Box (Left Wall)
    this.renderFusebox(ctx);

    // 5. Bed / Sleeping Futon (Bottom Left)
    this.renderBed(ctx);

    // 6. Mini Fridge & Food (Center Left)
    this.renderFridge(ctx);

    // 7. Cables on the floor (Density scales with room tier!)
    this.renderFloorCables(ctx);

    // 8. Workstation Desk & Hardware Towers
    this.renderWorkstation(ctx);

    // 9. Coolant Tank & Tubing (Tier 3 & 4)
    if (this.state.roomTier >= 3) {
      this.renderCoolantSystem(ctx);
    }

    // 9.5 AC Unit on Wall (If Installed)
    if (this.state.acInstalled) {
      this.renderAirConditioner(ctx);
    }

    // 10. Ambient Particles (Floating dust motes & Cyber data dust)
    this.renderParticles(ctx);

    // 11. Phosphor screen glow overlays
    this.renderScreenGlow(ctx);

    // 12. Power Outage darkness filter if fuse tripped
    if (this.state.fuseTripped) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff3344';
      ctx.font = '16px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('BRAK ZASILANIA // WYBIŁO BEZPIECZNIK!', w / 2, 60);
      ctx.font = '13px "Share Tech Mono"';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Kliknij skrzynkę bezpieczników po lewej stronie, aby zresetować.', w / 2, 85);
      ctx.textAlign = 'left';
    }
  }

  renderWindow(ctx, isNight, isDusk) {
    const wx = 730, wy = 80, ww = 150, wh = 180;
    // Window frame
    ctx.fillStyle = '#0d111a';
    ctx.fillRect(wx - 6, wy - 6, ww + 12, wh + 12);

    // Sky
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx, wy, ww, wh);
    ctx.clip();

    let skyColor = '#3a5a78';
    if (isNight) skyColor = '#060a14';
    else if (isDusk) skyColor = '#4a2542';
    ctx.fillStyle = skyColor;
    ctx.fillRect(wx, wy, ww, wh);

    // Stars at night
    if (isNight) {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 15; i++) {
        const sx = wx + ((i * 37) % ww);
        const sy = wy + ((i * 19) % (wh / 2));
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }

    // Distant city silhouette
    ctx.fillStyle = '#05070a';
    ctx.fillRect(wx + 10, wy + 90, 25, 90);
    ctx.fillRect(wx + 30, wy + 70, 35, 110);
    ctx.fillRect(wx + 75, wy + 85, 20, 95);
    ctx.fillRect(wx + 100, wy + 60, 40, 120);

    // Blinking city antennae red lights
    if (Math.floor(this.animFrame / 30) % 2 === 0) {
      ctx.fillStyle = '#ff2233';
      ctx.fillRect(wx + 47, wy + 65, 2, 2);
      ctx.fillRect(wx + 120, wy + 55, 2, 2);
    }

    // Sun and heat glare during hot hours
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
    ctx.fillText(`DWÓR: ${this.state.outdoorTemp.toFixed(1)}°C`, wx + 10, wy + wh - 8);

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
    ctx.restore();
  }

  renderFusebox(ctx) {
    const fx = 60, fy = 120, fw = 70, fh = 90;
    // Metal casing
    ctx.fillStyle = '#222938';
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = '#38465e';
    ctx.lineWidth = 2;
    ctx.strokeRect(fx, fy, fw, fh);

    // Warning lightning bolt
    ctx.fillStyle = '#ffaa00';
    ctx.font = '16px monospace';
    ctx.fillText('⚡', fx + 10, fy + 25);

    // Circuit breakers
    for (let i = 0; i < 4; i++) {
      const bx = fx + 35;
      const by = fy + 15 + i * 16;
      ctx.fillStyle = '#111620';
      ctx.fillRect(bx, by, 22, 10);
      // Switch handle
      const tripped = this.state.fuseTripped;
      ctx.fillStyle = tripped ? '#ff3344' : '#00ff88';
      ctx.fillRect(tripped ? bx + 2 : bx + 12, by + 1, 8, 8);
    }
  }

  renderBed(ctx) {
    const bx = 80, by = 350, bw = 200, bh = 110;
    // Mattress
    ctx.fillStyle = '#1c2233';
    ctx.fillRect(bx, by, bw, bh);
    // Blanket
    ctx.fillStyle = '#2a354d';
    ctx.fillRect(bx + 40, by, bw - 40, bh);
    // Pillow
    ctx.fillStyle = '#d0d8e8';
    ctx.fillRect(bx + 8, by + 15, 30, 45);
    // Headboard shadow
    ctx.fillStyle = '#101420';
    ctx.fillRect(bx, by + bh - 6, bw, 6);
  }

  renderFridge(ctx) {
    const rx = 230, ry = 220, rw = 80, rh = 100;
    // Mini fridge
    ctx.fillStyle = '#3a4457';
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#556480';
    ctx.strokeRect(rx, ry, rw, rh);
    // Handle
    ctx.fillStyle = '#0d1118';
    ctx.fillRect(rx + 68, ry + 30, 4, 25);

    // Pizza box & energy drink cans on top
    ctx.fillStyle = '#9e7344';
    ctx.fillRect(rx + 8, ry - 12, 45, 12);
    // Soda cans
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(rx + 60, ry - 14, 8, 14);
    ctx.fillStyle = '#ff2255';
    ctx.fillRect(rx + 70, ry - 14, 8, 14);
  }

  renderFloorCables(ctx) {
    const tier = this.state.roomTier;
    ctx.lineWidth = 3;

    // Cable cluster 1: From desk to wall/fusebox
    ctx.strokeStyle = '#05070a';
    ctx.beginPath();
    ctx.moveTo(380, 400);
    ctx.bezierCurveTo(280, 430, 180, 410, 100, 210);
    ctx.stroke();

    ctx.strokeStyle = '#0a0d14';
    ctx.beginPath();
    ctx.moveTo(400, 415);
    ctx.bezierCurveTo(320, 450, 200, 440, 110, 210);
    ctx.stroke();

    if (tier >= 2) {
      // More snake cables
      ctx.strokeStyle = '#141c29';
      ctx.beginPath();
      ctx.moveTo(450, 440);
      ctx.bezierCurveTo(550, 480, 680, 470, 720, 420);
      ctx.stroke();
    }

    if (tier >= 3) {
      // Thick power conduit
      ctx.strokeStyle = '#1f2d42';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(370, 450);
      ctx.bezierCurveTo(500, 510, 650, 500, 780, 460);
      ctx.stroke();
    }

    if (tier >= 4) {
      // Lain finale: Floor completely covered in web of cables!
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = i % 2 === 0 ? '#0b101a' : '#141c2c';
        ctx.beginPath();
        ctx.moveTo(320 + i * 40, 380);
        ctx.bezierCurveTo(250 + i * 30, 480 + (i % 3) * 15, 600 - i * 20, 520, 750, 440);
        ctx.stroke();
      }
    }
  }

  renderWorkstation(ctx) {
    const tier = this.state.roomTier;
    const dx = 420, dy = 260, dw = 240, dh = 150;

    // Wooden / Metal Desk
    ctx.fillStyle = '#1c1b18';
    ctx.fillRect(dx, dy, dw, 18);
    // Desk legs
    ctx.fillStyle = '#101010';
    ctx.fillRect(dx + 10, dy + 18, 12, dh);
    ctx.fillRect(dx + dw - 22, dy + 18, 12, dh);

    // Computer Case on the floor (Beige retro tower)
    const pcx = dx + 160, pcy = dy + 30;
    ctx.fillStyle = tier >= 3 ? '#151b26' : '#c2baaa';
    ctx.fillRect(pcx, pcy, 55, 95);
    // 5.25" and 3.5" drive bays
    ctx.fillStyle = '#222';
    ctx.fillRect(pcx + 8, pcy + 10, 39, 8);
    ctx.fillRect(pcx + 8, pcy + 22, 39, 8);
    // Power button & blinking activity LED
    ctx.fillStyle = '#555';
    ctx.fillRect(pcx + 12, pcy + 40, 6, 6);
    // HDD LED
    const hddLedBlink = Math.random() < 0.35 && !this.state.fuseTripped;
    ctx.fillStyle = hddLedBlink ? '#ffaa00' : '#442200';
    ctx.fillRect(pcx + 24, pcy + 42, 4, 4);

    // Primary CRT Monitor
    const mx = dx + 60, my = dy - 95, mw = 100, mh = 90;
    ctx.fillStyle = '#c5bea8';
    ctx.fillRect(mx, my, mw, mh);
    // Screen bezel
    ctx.fillStyle = '#22262d';
    ctx.fillRect(mx + 8, my + 8, mw - 16, mh - 24);
    // CRT screen content
    ctx.fillStyle = this.state.fuseTripped ? '#05070a' : '#0a331c';
    ctx.fillRect(mx + 11, my + 11, mw - 22, mh - 30);
    // Phosphor scan lines on monitor
    if (!this.state.fuseTripped) {
      ctx.fillStyle = '#33ff66';
      for (let l = 0; l < 4; l++) {
        const lw = 15 + ((this.animFrame + l * 12) % 35);
        ctx.fillRect(mx + 15, my + 16 + l * 8, lw, 3);
      }
    }
    // Monitor stand
    ctx.fillStyle = '#9e9784';
    ctx.fillRect(mx + 35, my + mh - 8, 30, 10);
    ctx.fillRect(mx + 25, my + mh + 2, 50, 4);

    // Keyboard & Mouse
    ctx.fillStyle = '#b8b09a';
    ctx.fillRect(dx + 55, dy + 4, 75, 10);
    ctx.fillRect(dx + 140, dy + 6, 12, 7);

    // Protagonist (Pixel avatar sitting in chair, facing screens, Lain style)
    this.renderProtagonist(ctx, dx + 70, dy + 2);

    // TIER EVOLUTIONS:
    if (tier >= 2) {
      // Secondary CRT Monitor on the left
      const m2x = dx - 30, m2y = dy - 80, m2w = 80, m2h = 75;
      ctx.fillStyle = '#2b3445';
      ctx.fillRect(m2x, m2y, m2w, m2h);
      ctx.fillStyle = this.state.fuseTripped ? '#05070a' : '#0d2238';
      ctx.fillRect(m2x + 6, m2y + 6, m2w - 12, m2h - 18);
      // Amber phosphor
      if (!this.state.fuseTripped) {
        ctx.fillStyle = '#ffaa22';
        ctx.fillRect(m2x + 10, m2y + 12, 40, 3);
        ctx.fillRect(m2x + 10, m2y + 20, 25, 3);
      }
      // Desk Fan spinning
      const fx = dx + 180, fy = dy - 40;
      ctx.fillStyle = '#111';
      ctx.fillRect(fx + 10, fy + 25, 10, 15);
      ctx.beginPath();
      ctx.arc(fx + 15, fy + 15, 18, 0, Math.PI * 2);
      ctx.strokeStyle = '#445566';
      ctx.stroke();
    }

    if (tier >= 3) {
      // Server Rack Tower stacked on the right
      const rx = dx + dw - 15, ry = dy - 130, rw = 75, rh = 145;
      ctx.fillStyle = '#10141e';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = '#28364f';
      ctx.strokeRect(rx, ry, rw, rh);
      // Hard Drive Caddies
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#1c2436';
        ctx.fillRect(rx + 5, ry + 8 + i * 22, rw - 10, 16);
        // Green / Red activity LEDs
        const ledOn = Math.random() < 0.6 && !this.state.fuseTripped;
        ctx.fillStyle = ledOn ? '#00f0ff' : '#003344';
        ctx.fillRect(rx + rw - 14, ry + 12 + i * 22, 4, 4);
      }
    }

    if (tier >= 4) {
      // TIER 4: Serial Experiments Lain FINALE SHRINE!
      // High hanging monitors suspended by metal arms
      const hmx = dx + 30, hmy = dy - 185;
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(hmx, hmy, 95, 75);
      ctx.fillStyle = this.state.fuseTripped ? '#000' : '#1a0528';
      ctx.fillRect(hmx + 6, hmy + 6, 83, 63);
      if (!this.state.fuseTripped) {
        ctx.fillStyle = '#bb55ff';
        ctx.fillText('THE WIRED', hmx + 12, hmy + 35);
      }

      // Overhead industrial cabling bundle
      ctx.strokeStyle = '#05070c';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(350, 0);
      ctx.bezierCurveTo(450, 80, 600, 70, 700, 0);
      ctx.stroke();
    }
  }

  renderProtagonist(ctx, px, py) {
    // Office chair backrest
    ctx.fillStyle = '#1a1f2c';
    ctx.fillRect(px + 10, py - 40, 45, 60);

    // Protagonist (Hair, headphones, silhouette viewed from slightly behind)
    // Dark brown/purple bob hair with side tuft (Lain motif)
    ctx.fillStyle = '#3d2b45';
    ctx.beginPath();
    ctx.arc(px + 32, py - 35, 14, 0, Math.PI * 2);
    ctx.fill();
    // Signature hair strand on left
    ctx.fillRect(px + 18, py - 35, 4, 18);

    // Headphones headband & earcups
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(px + 16, py - 38, 5, 8);
    ctx.fillRect(px + 43, py - 38, 5, 8);

    // Shoulders & hoodie
    ctx.fillStyle = '#222938';
    ctx.fillRect(px + 14, py - 20, 36, 40);
  }

  renderCoolantSystem(ctx) {
    const cx = 680, cy = 390, cw = 90, ch = 90;
    // Transparent reservoir tank
    ctx.fillStyle = '#101726';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = '#2d4263';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // Coolant Fluid (Glowing Cyan)
    const fluidHeight = (ch - 10) * (this.state.coolingFluidLevel / 100);
    const fluidGrad = ctx.createLinearGradient(cx, cy + ch - fluidHeight, cx, cy + ch);
    fluidGrad.addColorStop(0, '#00d4ff');
    fluidGrad.addColorStop(1, '#005577');
    ctx.fillStyle = fluidGrad;
    ctx.fillRect(cx + 4, cy + ch - fluidHeight, cw - 8, fluidHeight);

    // Bubbles if active
    if (this.state.coolingPumpActive && !this.state.fuseTripped) {
      ctx.fillStyle = '#ffffff';
      for (let b = 0; b < 5; b++) {
        const bx = cx + 15 + ((b * 23) % (cw - 30));
        const by = cy + ch - ((this.animFrame * 2 + b * 20) % Math.max(10, fluidHeight));
        ctx.fillRect(bx, by, 3, 3);
      }
    }

    // Clear tubes snaking to PC
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + 20, cy);
    ctx.bezierCurveTo(cx, cy - 40, cx - 100, cy - 60, 620, 340);
    ctx.stroke();
  }

  renderAirConditioner(ctx) {
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

      ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
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
  }

  renderScreenGlow(ctx) {
    if (this.state.fuseTripped) return;
    // Subtle radial light cast from CRT monitors into the dark room
    const glow = ctx.createRadialGradient(530, 210, 30, 530, 210, 220);
    glow.addColorStop(0, 'rgba(51, 255, 102, 0.12)');
    glow.addColorStop(0.5, 'rgba(0, 240, 255, 0.05)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(350, 80, 400, 300);
  }
}

// Global room view instance
window.RoomView = RoomView;
