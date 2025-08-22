interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  text: string;
  life: number;
}

export default class CookieClicker {
  private container: HTMLElement | null = null;
  private cookies: number = 0;
  private cookiesPerSecond: number = 0;
  private cookiesPerClick: number = 1;
  private totalCookies: number = 0;
  
  // Upgrades
  private upgrades = {
    cursor: { count: 0, baseCost: 15, cps: 0.1 },
    grandma: { count: 0, baseCost: 100, cps: 1 },
    farm: { count: 0, baseCost: 1100, cps: 8 },
    mine: { count: 0, baseCost: 12000, cps: 47 },
    factory: { count: 0, baseCost: 130000, cps: 260 },
    bank: { count: 0, baseCost: 1400000, cps: 1400 },
  };
  
  private clickUpgrades = {
    doubleClick: { purchased: false, cost: 100, multiplier: 2 },
    tripleClick: { purchased: false, cost: 1000, multiplier: 3 },
    megaClick: { purchased: false, cost: 10000, multiplier: 10 },
  };
  
  private saveInterval: number | null = null;
  private updateInterval: number | null = null;
  
  // Cookie animation
  private cookieScale: number = 1;
  private particles: Particle[] = [];

  constructor() {
    this.loadGame();
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.render();
    this.startIntervals();
  }

  unmount() {
    if (this.saveInterval) clearInterval(this.saveInterval);
    if (this.updateInterval) clearInterval(this.updateInterval);
    this.saveGame();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  private render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="cookie-clicker-game" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, #8B4513, #D2691E);
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: relative;
        overflow: hidden;
      ">
        <h1 style="
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        ">Cookie Clicker</h1>
        
        <div class="stats" style="
          text-align: center;
          color: white;
          margin-bottom: 30px;
          background: rgba(0,0,0,0.3);
          padding: 20px;
          border-radius: 10px;
        ">
          <div style="font-size: 36px; font-weight: bold;" id="cookie-count">${this.formatNumber(this.cookies)} cookies</div>
          <div style="font-size: 18px; margin-top: 10px;">per second: <span id="cps">${this.formatNumber(this.cookiesPerSecond)}</span></div>
        </div>

        <div class="main-game" style="
          display: flex;
          gap: 50px;
          align-items: flex-start;
        ">
          <div class="cookie-section" style="text-align: center;">
            <div id="cookie" style="
              width: 300px;
              height: 300px;
              background: radial-gradient(circle, #D2691E, #8B4513);
              border-radius: 50%;
              cursor: pointer;
              position: relative;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
              transition: transform 0.1s;
              transform: scale(${this.cookieScale});
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 150px;
              user-select: none;
            ">
              🍪
            </div>
            
            <div style="margin-top: 20px; color: white;">
              <div>Cookies per click: <span id="cpc">${this.formatNumber(this.cookiesPerClick)}</span></div>
              <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
                Total cookies: <span id="total">${this.formatNumber(this.totalCookies)}</span>
              </div>
            </div>
          </div>

          <div class="shop-section" style="
            width: 400px;
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 10px;
            max-height: 600px;
            overflow-y: auto;
          ">
            <h2 style="color: white; margin-bottom: 20px;">Shop</h2>
            
            <div class="buildings" style="margin-bottom: 30px;">
              <h3 style="color: white; font-size: 18px; margin-bottom: 15px;">Buildings</h3>
              <div id="buildings-list"></div>
            </div>
            
            <div class="click-upgrades">
              <h3 style="color: white; font-size: 18px; margin-bottom: 15px;">Click Upgrades</h3>
              <div id="click-upgrades-list"></div>
            </div>
          </div>
        </div>

        <div id="particles" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        "></div>
      </div>
    `;

    // Add event listeners
    const cookie = document.getElementById('cookie');
    cookie?.addEventListener('click', (e) => this.clickCookie(e));
    cookie?.addEventListener('mousedown', () => {
      if (cookie) cookie.style.transform = 'scale(0.95)';
    });
    cookie?.addEventListener('mouseup', () => {
      if (cookie) cookie.style.transform = 'scale(1)';
    });

    this.updateDisplay();
    this.renderShop();
  }

  private clickCookie(e: MouseEvent) {
    this.cookies += this.cookiesPerClick;
    this.totalCookies += this.cookiesPerClick;
    
    // Create particle effect
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.createParticle(x + rect.left, y + rect.top, `+${this.formatNumber(this.cookiesPerClick)}`);
    
    this.updateDisplay();
  }

  private createParticle(x: number, y: number, text: string) {
    this.particles.push({
      x,
      y,
      dx: (Math.random() - 0.5) * 2,
      dy: -3,
      text,
      life: 1
    });
  }

  private updateParticles() {
    const particlesEl = document.getElementById('particles');
    if (!particlesEl) return;
    
    particlesEl.innerHTML = '';
    
    this.particles = this.particles.filter(particle => {
      particle.x += particle.dx;
      particle.y += particle.dy;
      particle.dy += 0.1;
      particle.life -= 0.02;
      
      if (particle.life > 0) {
        const div = document.createElement('div');
        div.style.cssText = `
          position: absolute;
          left: ${particle.x}px;
          top: ${particle.y}px;
          color: white;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          opacity: ${particle.life};
          pointer-events: none;
        `;
        div.textContent = particle.text;
        particlesEl.appendChild(div);
        return true;
      }
      return false;
    });
  }

  private renderShop() {
    // Render buildings
    const buildingsList = document.getElementById('buildings-list');
    if (buildingsList) {
      buildingsList.innerHTML = '';
      
      for (const [key, building] of Object.entries(this.upgrades)) {
        const cost = this.getUpgradeCost(key);
        const canAfford = this.cookies >= cost;
        
        const div = document.createElement('div');
        div.style.cssText = `
          background: ${canAfford ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)'};
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 5px;
          cursor: ${canAfford ? 'pointer' : 'not-allowed'};
          color: ${canAfford ? 'white' : '#888'};
          transition: all 0.2s;
        `;
        
        if (canAfford) {
          div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.3)';
          div.onmouseout = () => div.style.background = 'rgba(255,255,255,0.2)';
          div.onclick = () => this.buyUpgrade(key);
        }
        
        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: bold; text-transform: capitalize;">${key}</div>
              <div style="font-size: 14px; opacity: 0.8;">Cost: ${this.formatNumber(cost)} cookies</div>
              <div style="font-size: 12px; opacity: 0.6;">Each gives ${building.cps} CPS</div>
            </div>
            <div style="font-size: 24px; font-weight: bold;">${building.count}</div>
          </div>
        `;
        
        buildingsList.appendChild(div);
      }
    }
    
    // Render click upgrades
    const clickUpgradesList = document.getElementById('click-upgrades-list');
    if (clickUpgradesList) {
      clickUpgradesList.innerHTML = '';
      
      for (const [key, upgrade] of Object.entries(this.clickUpgrades)) {
        if (upgrade.purchased) continue;
        
        const canAfford = this.cookies >= upgrade.cost;
        
        const div = document.createElement('div');
        div.style.cssText = `
          background: ${canAfford ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)'};
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 5px;
          cursor: ${canAfford ? 'pointer' : 'not-allowed'};
          color: ${canAfford ? 'white' : '#888'};
          transition: all 0.2s;
        `;
        
        if (canAfford) {
          div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.3)';
          div.onmouseout = () => div.style.background = 'rgba(255,255,255,0.2)';
          div.onclick = () => this.buyClickUpgrade(key);
        }
        
        div.innerHTML = `
          <div>
            <div style="font-weight: bold; text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div style="font-size: 14px; opacity: 0.8;">Cost: ${this.formatNumber(upgrade.cost)} cookies</div>
            <div style="font-size: 12px; opacity: 0.6;">Multiply clicks by ${upgrade.multiplier}x</div>
          </div>
        `;
        
        clickUpgradesList.appendChild(div);
      }
    }
  }

  private buyUpgrade(type: string) {
    const cost = this.getUpgradeCost(type);
    if (this.cookies >= cost) {
      this.cookies -= cost;
      this.upgrades[type as keyof typeof this.upgrades].count++;
      this.calculateCPS();
      this.updateDisplay();
      this.renderShop();
    }
  }

  private buyClickUpgrade(type: string) {
    const upgrade = this.clickUpgrades[type as keyof typeof this.clickUpgrades];
    if (this.cookies >= upgrade.cost && !upgrade.purchased) {
      this.cookies -= upgrade.cost;
      upgrade.purchased = true;
      this.cookiesPerClick *= upgrade.multiplier;
      this.updateDisplay();
      this.renderShop();
    }
  }

  private getUpgradeCost(type: string): number {
    const upgrade = this.upgrades[type as keyof typeof this.upgrades];
    return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count));
  }

  private calculateCPS() {
    this.cookiesPerSecond = 0;
    for (const upgrade of Object.values(this.upgrades)) {
      this.cookiesPerSecond += upgrade.count * upgrade.cps;
    }
  }

  private updateDisplay() {
    document.getElementById('cookie-count')!.textContent = `${this.formatNumber(this.cookies)} cookies`;
    document.getElementById('cps')!.textContent = this.formatNumber(this.cookiesPerSecond);
    document.getElementById('cpc')!.textContent = this.formatNumber(this.cookiesPerClick);
    document.getElementById('total')!.textContent = this.formatNumber(this.totalCookies);
  }

  private formatNumber(num: number): string {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
  }

  private startIntervals() {
    // Cookie generation
    this.updateInterval = window.setInterval(() => {
      this.cookies += this.cookiesPerSecond / 10;
      this.totalCookies += this.cookiesPerSecond / 10;
      this.updateDisplay();
      this.updateParticles();
    }, 100);
    
    // Auto save
    this.saveInterval = window.setInterval(() => {
      this.saveGame();
    }, 10000);
  }

  private saveGame() {
    const save = {
      cookies: this.cookies,
      totalCookies: this.totalCookies,
      cookiesPerClick: this.cookiesPerClick,
      upgrades: this.upgrades,
      clickUpgrades: this.clickUpgrades
    };
    localStorage.setItem('cookie-clicker-save', JSON.stringify(save));
  }

  private loadGame() {
    const saveData = localStorage.getItem('cookie-clicker-save');
    if (saveData) {
      try {
        const save = JSON.parse(saveData);
        this.cookies = save.cookies || 0;
        this.totalCookies = save.totalCookies || 0;
        this.cookiesPerClick = save.cookiesPerClick || 1;
        this.upgrades = save.upgrades || this.upgrades;
        this.clickUpgrades = save.clickUpgrades || this.clickUpgrades;
        this.calculateCPS();
      } catch (e) {
        console.error('Failed to load save:', e);
      }
    }
  }
}