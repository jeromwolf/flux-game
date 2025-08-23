export class GameUI {
  static createStartScreen(
    gameName: string,
    description: string,
    instructions: string[],
    features?: { icon: string; text: string }[],
    onStart?: () => void
  ): HTMLElement {
    const screen = document.createElement('div');
    screen.id = 'start-screen';
    screen.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 500px;
    `;
    
    let featuresHTML = '';
    if (features && features.length > 0) {
      featuresHTML = `
        <div style="text-align: left; margin: 20px 0; background: #f0f0f0; padding: 20px; border-radius: 10px;">
          <h3 style="margin-bottom: 10px; color: #333;">Features:</h3>
          ${features.map(f => `<div style="margin-bottom: 5px;">${f.icon} ${f.text}</div>`).join('')}
        </div>
      `;
    }
    
    screen.innerHTML = `
      <h2 style="font-size: 32px; margin-bottom: 20px; color: #333;">${gameName}</h2>
      <p style="font-size: 18px; color: #666; margin-bottom: 20px;">${description}</p>
      
      <div style="text-align: left; margin-bottom: 20px; background: #f8f8f8; padding: 15px; border-radius: 10px;">
        <h3 style="margin-bottom: 10px; color: #333; font-size: 16px;">How to Play:</h3>
        ${instructions.map(inst => `<div style="margin-bottom: 5px; color: #555;">${inst}</div>`).join('')}
      </div>
      
      ${featuresHTML}
      
      <button id="start-button" style="
        padding: 15px 40px;
        font-size: 20px;
        font-weight: bold;
        color: white;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        Start Game
      </button>
    `;
    
    // Add click handler after element is created
    setTimeout(() => {
      const button = document.getElementById('start-button');
      if (button && onStart) {
        button.onclick = onStart;
      }
    }, 0);
    
    return screen;
  }
  
  static createPauseOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'pause-overlay';
    overlay.style.cssText = `
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 100;
    `;
    
    overlay.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: white;
      ">
        <h2 style="font-size: 48px; margin-bottom: 20px;">PAUSED</h2>
        <p style="font-size: 24px;">Press P to Resume</p>
      </div>
    `;
    
    return overlay;
  }
  
  static createPowerUpDisplay(): HTMLElement {
    const display = document.createElement('div');
    display.id = 'power-up-display';
    display.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 10px;
      flex-direction: column;
    `;
    
    return display;
  }
  
  static updatePowerUpDisplay(activePowerUps: { icon: string; progress: number }[]): void {
    const display = document.getElementById('power-up-display');
    if (!display) return;
    
    display.innerHTML = activePowerUps.map(powerUp => `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid #4ecdc4;
          border-top-color: transparent;
          transform: rotate(${(1 - powerUp.progress) * 360}deg);
          transition: transform 0.1s;
        "></div>
        ${powerUp.icon}
      </div>
    `).join('');
  }
  
  static createScorePopup(text: string, x: number, y: number, color: string = '#FFD700'): void {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      color: ${color};
      font-size: 24px;
      font-weight: bold;
      pointer-events: none;
      z-index: 200;
      animation: scorePopup 1s ease-out forwards;
    `;
    popup.textContent = text;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scorePopup {
        0% {
          transform: translateY(0) scale(0.5);
          opacity: 0;
        }
        50% {
          transform: translateY(-30px) scale(1);
          opacity: 1;
        }
        100% {
          transform: translateY(-60px) scale(0.8);
          opacity: 0;
        }
      }
    `;
    
    if (!document.querySelector('style[data-score-popup]')) {
      style.setAttribute('data-score-popup', 'true');
      document.head.appendChild(style);
    }
    
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  }
  
  static createComboDisplay(combo: number): HTMLElement {
    const display = document.createElement('div');
    display.id = 'combo-display';
    display.style.cssText = `
      position: absolute;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 36px;
      font-weight: bold;
      color: #ff6b6b;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      display: none;
    `;
    
    return display;
  }
  
  static updateCombo(combo: number): void {
    const display = document.getElementById('combo-display');
    if (!display) return;
    
    if (combo > 1) {
      display.style.display = 'block';
      display.textContent = `${combo}x COMBO!`;
      display.style.animation = 'pulse 0.5s ease-out';
    } else {
      display.style.display = 'none';
    }
  }
}