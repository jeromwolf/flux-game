export default class CubeCollector3D {
  private container: HTMLElement | null = null;
  private THREE: any;
  private scene: any;
  private camera: any;
  private renderer: any;
  private player: any;
  private items: any[] = [];
  private score: number = 0;
  private lives: number = 3;
  private gameRunning: boolean = false;
  private animationId: number | null = null;
  private clock: any;
  private playerVelocity: any;
  private keys: { [key: string]: boolean } = {};
  private touchStartX: number = 0;
  private audioContext: AudioContext | null = null;
  
  constructor() {
    // Three.js will be loaded in mount
  }
  
  private playSound(type: 'collect' | 'miss' | 'gameOver' | 'move'): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch (type) {
      case 'collect':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now);
        oscillator.frequency.linearRampToValueAtTime(1046.5, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        
        const harmonicOsc = ctx.createOscillator();
        const harmonicGain = ctx.createGain();
        harmonicOsc.connect(harmonicGain);
        harmonicGain.connect(ctx.destination);
        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.setValueAtTime(784.88, now);
        harmonicOsc.frequency.linearRampToValueAtTime(1568, now + 0.1);
        harmonicGain.gain.setValueAtTime(0.15, now);
        harmonicGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        harmonicOsc.start(now);
        harmonicOsc.stop(now + 0.15);
        break;
        
      case 'miss':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
        
      case 'gameOver':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, now);
        gainNode.gain.setValueAtTime(0.3, now);
        
        for (let i = 0; i < 3; i++) {
          oscillator.frequency.setValueAtTime(150 - i * 30, now + i * 0.2);
        }
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        oscillator.start(now);
        oscillator.stop(now + 0.8);
        
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(55, now);
        bassGain.gain.setValueAtTime(0.4, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        bassOsc.start(now);
        bassOsc.stop(now + 1);
        break;
        
      case 'move':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1000, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;
    }
  }
  
  mount(container: HTMLElement): void {
    this.container = container;
    
    // Check if we're on client side
    if (typeof window === 'undefined') {
      console.warn('CubeCollector3D can only run in browser');
      return;
    }
    
    // Show loading message
    this.container.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Loading 3D Game...</div>';
    
    // Add delay to ensure DOM is ready
    setTimeout(() => {
      // Dynamically import Three.js
      import('three').then((module) => {
        console.log('Three.js loaded successfully');
        this.THREE = module;
        this.clock = new module.Clock();
        this.playerVelocity = new module.Vector3();
        this.initializeGame();
      }).catch((error) => {
        console.error('Failed to load Three.js:', error);
        if (this.container) {
          this.container.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Failed to load 3D engine. Please refresh the page.</div>';
        }
      });
    }, 100);
  }
  
  unmount(): void {
    this.cleanup();
  }
  
  private initializeGame(): void {
    if (!this.container || !this.THREE) return;
    
    const THREE = this.THREE;
    
    this.container.innerHTML = `
      <div style="width: 100%; height: 600px; position: relative; overflow: hidden; background: #000;">
        <div id="game-info" style="position: absolute; top: 10px; left: 10px; color: white; font-size: 20px; z-index: 10;">
          <div>Score: <span id="score">0</span></div>
          <div>Lives: <span id="lives">3</span></div>
        </div>
        <div id="game-canvas" style="width: 100%; height: 100%;"></div>
        <div id="game-over" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none; text-align: center; color: white; background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px;">
          <h2 style="margin: 0 0 10px 0;">Game Over!</h2>
          <p style="margin: 10px 0;">Final Score: <span id="final-score">0</span></p>
          <button id="restart-btn" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Play Again</button>
        </div>
      </div>
    `;
    
    const canvasContainer = this.container.querySelector('#game-canvas') as HTMLElement;
    if (!canvasContainer) return;
    
    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);
    this.scene.background = new THREE.Color(0x001122);
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasContainer.appendChild(this.renderer.domElement);
    console.log('Renderer created and added to DOM:', this.renderer);
    
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvasContainer.clientWidth / canvasContainer.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);
    
    // Setup lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x00ffff, 0.5, 30);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
    
    // Create player
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x00ff00,
      emissive: 0x002200,
      shininess: 100
    });
    this.player = new THREE.Mesh(geometry, material);
    this.player.position.y = 1;
    this.player.castShadow = true;
    this.player.receiveShadow = true;
    this.scene.add(this.player);
    
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x333333,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Add grid
    const gridHelper = new THREE.GridHelper(40, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);
    
    // Setup controls
    this.setupControls();
    
    // Handle resize
    const handleResize = () => {
      if (!canvasContainer || !this.camera || !this.renderer) return;
      const width = canvasContainer.clientWidth;
      const height = canvasContainer.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    
    // Start game
    this.startGame();
  }
  
  private setupControls(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    if (this.container) {
      this.container.addEventListener('touchstart', (e) => {
        this.touchStartX = e.touches[0].clientX;
      });
      
      this.container.addEventListener('touchmove', (e) => {
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - this.touchStartX;
        if (this.player) {
          this.player.position.x += deltaX * 0.01;
          this.player.position.x = Math.max(-18, Math.min(18, this.player.position.x));
        }
        this.touchStartX = touchX;
      });
    }
    
    const restartBtn = this.container?.querySelector('#restart-btn');
    restartBtn?.addEventListener('click', () => {
      this.resetGame();
    });
  }
  
  private createItem(): void {
    if (!this.THREE) return;
    
    const THREE = this.THREE;
    const geometryTypes = [
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.OctahedronGeometry(0.7),
      new THREE.TetrahedronGeometry(0.8)
    ];
    
    const colors = [0xff0000, 0xffff00, 0x00ffff, 0xff00ff, 0x00ff00];
    
    const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
    const material = new THREE.MeshPhongMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      emissive: colors[Math.floor(Math.random() * colors.length)],
      emissiveIntensity: 0.3,
      shininess: 100
    });
    
    const item = new THREE.Mesh(geometry, material);
    item.position.x = (Math.random() - 0.5) * 30;
    item.position.y = 1;
    item.position.z = -30;
    item.castShadow = true;
    item.receiveShadow = true;
    
    this.scene.add(item);
    this.items.push(item);
  }
  
  private updateGame(): void {
    if (!this.gameRunning || !this.player) return;
    
    const delta = this.clock.getDelta();
    
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.player.position.x -= 20 * delta;
      this.playSound('move');
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      this.player.position.x += 20 * delta;
      this.playSound('move');
    }
    
    this.player.position.x = Math.max(-18, Math.min(18, this.player.position.x));
    
    this.player.rotation.y += 0.01;
    this.player.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.position.z += 10 * delta;
      item.rotation.x += 0.02;
      item.rotation.y += 0.03;
      
      const distance = this.player.position.distanceTo(item.position);
      if (distance < 2) {
        this.scene.remove(item);
        this.items.splice(i, 1);
        this.score += 10;
        this.updateUI();
        this.playSound('collect');
        this.createCollectEffect(item.position);
      } else if (item.position.z > 20) {
        this.scene.remove(item);
        this.items.splice(i, 1);
        this.lives--;
        this.updateUI();
        this.playSound('miss');
        
        if (this.lives <= 0) {
          this.gameOver();
        }
      }
    }
    
    if (Math.random() < 0.02) {
      this.createItem();
    }
  }
  
  private createCollectEffect(position: any): void {
    if (!this.THREE) return;
    
    const THREE = this.THREE;
    const particleCount = 20;
    const particles: any[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      
      particles.push({ mesh: particle, velocity: velocity, life: 1.0 });
      this.scene.add(particle);
    }
    
    const animateParticles = () => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.add(p.velocity);
        p.velocity.y -= 0.01;
        p.life -= 0.02;
        p.mesh.scale.setScalar(p.life);
        
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }
      
      if (particles.length > 0) {
        requestAnimationFrame(animateParticles);
      }
    };
    
    animateParticles();
  }
  
  private animate = (): void => {
    if (!this.gameRunning) return;
    
    this.animationId = requestAnimationFrame(this.animate);
    
    this.updateGame();
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };
  
  private updateUI(): void {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    
    if (scoreEl) scoreEl.textContent = this.score.toString();
    if (livesEl) livesEl.textContent = this.lives.toString();
  }
  
  private startGame(): void {
    this.gameRunning = true;
    this.score = 0;
    this.lives = 3;
    this.updateUI();
    this.animate();
  }
  
  private gameOver(): void {
    this.gameRunning = false;
    this.playSound('gameOver');
    
    const gameOverEl = document.getElementById('game-over');
    const finalScoreEl = document.getElementById('final-score');
    
    if (gameOverEl && finalScoreEl) {
      finalScoreEl.textContent = this.score.toString();
      gameOverEl.style.display = 'block';
    }
  }
  
  private resetGame(): void {
    for (const item of this.items) {
      this.scene.remove(item);
    }
    this.items = [];
    
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) {
      gameOverEl.style.display = 'none';
    }
    
    this.startGame();
  }
  
  private cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.gameRunning = false;
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}