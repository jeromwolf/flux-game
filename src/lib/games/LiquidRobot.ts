export default class LiquidRobot {
  private container: HTMLElement | null = null;
  private THREE: any;
  private scene: any;
  private camera: any;
  private renderer: any;
  private robot: any;
  private robotForm: 'liquid' | 'solid' | 'gas' = 'liquid';
  private animationId: number | null = null;
  private clock: any;
  private audioContext: AudioContext | null = null;
  private keys: { [key: string]: boolean } = {};
  
  // 게임 상태
  private currentLevel: number = 1;
  private isTransforming: boolean = false;
  private gasTimer: number = 0;
  private gasMaxTime: number = 5; // 기체 형태 유지 시간
  private velocity: any;
  private isGrounded: boolean = false;
  private levelCompleted: boolean = false;
  
  // 레벨 요소들
  private obstacles: any[] = [];
  private goal: any = null;
  private collectibles: any[] = [];
  private hazards: any[] = [];
  
  // 로봇 속성
  private readonly MOVE_SPEED = { liquid: 10, solid: 5, gas: 3 };
  private readonly JUMP_FORCE = { liquid: 5, solid: 8, gas: 0 };
  private readonly GRAVITY = { liquid: -15, solid: -20, gas: -2 };

  constructor() {
    // Three.js will be loaded in mount
  }

  mount(container: HTMLElement): void {
    this.container = container;
    
    if (typeof window === 'undefined') {
      console.warn('LiquidRobot can only run in browser');
      return;
    }
    
    // 로딩 메시지
    this.container.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Loading 3D Game...</div>';
    
    // Three.js 동적 로드
    setTimeout(() => {
      import('three').then((module) => {
        console.log('Three.js loaded successfully for LiquidRobot');
        this.THREE = module;
        this.clock = new module.Clock();
        this.velocity = new module.Vector3(0, 0, 0);
        this.initializeGame();
      }).catch((error) => {
        console.error('Failed to load Three.js:', error);
        if (this.container) {
          this.container.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Failed to load 3D engine.</div>';
        }
      });
    }, 100);
  }

  unmount(): void {
    this.cleanup();
  }

  private initializeGame(): void {
    if (!this.container || !this.THREE) return;
    
    // HTML 구조 생성
    this.container.innerHTML = `
      <div style="width: 100%; height: 600px; position: relative; overflow: hidden; background: #111;">
        <!-- 상단 UI -->
        <div style="position: absolute; top: 10px; left: 10px; right: 10px; z-index: 10;">
          <div style="background: rgba(0,0,0,0.8); padding: 15px; border-radius: 10px; border: 2px solid #0ff;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h2 style="color: #0ff; margin: 0 0 5px 0; font-size: 24px;">레벨 ${this.currentLevel}: 실험실</h2>
                <div style="color: #aaa; font-size: 14px;">연구소를 탈출하세요!</div>
              </div>
              <div style="text-align: right;">
                <div style="color: #fff; font-size: 18px; margin-bottom: 5px;">
                  현재 형태: <span id="current-form" style="color: #0ff;">액체</span>
                </div>
                <div id="gas-timer" style="display: none; color: #ff0; font-size: 14px;">
                  기체 유지: <span id="gas-time">5</span>초
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 변신 버튼 (하단) -->
        <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10;">
          <div style="background: rgba(0,0,0,0.8); padding: 10px; border-radius: 10px; border: 2px solid #333;">
            <div style="display: flex; gap: 10px;">
              <button id="form-liquid" style="padding: 15px 25px; font-size: 16px; background: #00cccc; border: none; border-radius: 5px; color: white; cursor: pointer; transition: all 0.3s;">
                💧 액체 [1]
              </button>
              <button id="form-solid" style="padding: 15px 25px; font-size: 16px; background: #666; border: none; border-radius: 5px; color: white; cursor: pointer; transition: all 0.3s;">
                🧊 고체 [2]
              </button>
              <button id="form-gas" style="padding: 15px 25px; font-size: 16px; background: #666; border: none; border-radius: 5px; color: white; cursor: pointer; transition: all 0.3s;">
                💨 기체 [3]
              </button>
            </div>
          </div>
        </div>
        
        <!-- 조작법 (왼쪽 하단) -->
        <div style="position: absolute; bottom: 20px; left: 20px; z-index: 10;">
          <div style="background: rgba(0,0,0,0.6); padding: 10px; border-radius: 5px; font-size: 12px; color: #aaa;">
            <div>방향키: 이동</div>
            <div>스페이스: 점프/부유</div>
            <div>1,2,3: 변신</div>
          </div>
        </div>
        
        <!-- 게임 캔버스 -->
        <div id="game-canvas" style="width: 100%; height: 100%;"></div>
        
        <!-- 레벨 완료 화면 -->
        <div id="level-complete" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none; text-align: center;">
          <div style="background: rgba(0,0,0,0.9); padding: 40px; border-radius: 20px; border: 3px solid #0ff;">
            <h2 style="color: #0ff; font-size: 40px; margin: 0 0 20px 0;">레벨 완료!</h2>
            <div style="color: #fff; font-size: 20px; margin-bottom: 30px;">
              수집품: <span id="collectibles-count">0/3</span><br>
              클리어 시간: <span id="clear-time">00:00</span>
            </div>
            <button id="next-level" style="padding: 15px 40px; font-size: 20px; background: #0ff; border: none; border-radius: 10px; color: #000; font-weight: bold; cursor: pointer;">
              다음 레벨 →
            </button>
          </div>
        </div>
      </div>
    `;
    
    const canvasContainer = this.container.querySelector('#game-canvas') as HTMLElement;
    
    // Three.js 초기화
    this.setupScene();
    this.setupRenderer(canvasContainer);
    this.setupCamera();
    this.setupLights();
    this.createRobot();
    this.createLevel1();
    this.setupControls();
    
    // 게임 시작
    this.startGame();
  }

  private setupScene(): void {
    this.scene = new this.THREE.Scene();
    this.scene.background = new this.THREE.Color(0x222222);
    this.scene.fog = new this.THREE.Fog(0x222222, 10, 50);
  }

  private setupRenderer(container: HTMLElement): void {
    this.renderer = new this.THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    
    window.addEventListener('resize', () => {
      if (!container) return;
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }

  private setupCamera(): void {
    this.camera = new this.THREE.PerspectiveCamera(
      60,
      this.container!.clientWidth / this.container!.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 20);
    this.camera.lookAt(0, 0, 0);
  }

  private setupLights(): void {
    // 앰비언트 라이트
    const ambientLight = new this.THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    // 메인 라이트
    const mainLight = new this.THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -30;
    mainLight.shadow.camera.right = 30;
    mainLight.shadow.camera.top = 30;
    mainLight.shadow.camera.bottom = -30;
    this.scene.add(mainLight);
  }

  private createRobot(): void {
    const geometry = new this.THREE.BoxGeometry(1, 1, 1);
    const material = new this.THREE.MeshPhongMaterial({
      color: 0x00cccc,
      emissive: 0x004444,
      transparent: true,
      opacity: 0.8
    });
    
    this.robot = new this.THREE.Mesh(geometry, material);
    this.robot.position.set(0, 1, 0);
    this.robot.castShadow = true;
    this.robot.receiveShadow = true;
    this.scene.add(this.robot);
  }

  private createLevel1(): void {
    // 바닥
    const floorGeometry = new this.THREE.BoxGeometry(40, 1, 40);
    const floorMaterial = new this.THREE.MeshPhongMaterial({ color: 0x444444 });
    const floor = new this.THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.obstacles.push(floor);
    
    // 벽들
    const wallMaterial = new this.THREE.MeshPhongMaterial({ color: 0x666666 });
    
    // 좁은 통로 (액체 튜토리얼)
    const wall1 = new this.THREE.Mesh(new this.THREE.BoxGeometry(10, 5, 2), wallMaterial);
    wall1.position.set(-10, 2.5, -5);
    wall1.castShadow = true;
    this.scene.add(wall1);
    this.obstacles.push(wall1);
    
    const wall2 = new this.THREE.Mesh(new this.THREE.BoxGeometry(10, 4.5, 2), wallMaterial);
    wall2.position.set(-10, 2.25, -8);
    wall2.castShadow = true;
    this.scene.add(wall2);
    this.obstacles.push(wall2);
    
    // 좁은 틈을 만들기 위한 벽들
    const gap1 = new this.THREE.Mesh(new this.THREE.BoxGeometry(2, 5, 2), wallMaterial);
    gap1.position.set(-5, 2.5, -5);
    gap1.castShadow = true;
    this.scene.add(gap1);
    this.obstacles.push(gap1);
    
    const gap2 = new this.THREE.Mesh(new this.THREE.BoxGeometry(2, 5, 2), wallMaterial);
    gap2.position.set(-5, 2.5, -8);
    gap2.castShadow = true;
    this.scene.add(gap2);
    this.obstacles.push(gap2);
    
    // 높은 플랫폼 (기체 튜토리얼)
    const platform = new this.THREE.Mesh(new this.THREE.BoxGeometry(5, 0.5, 5), wallMaterial);
    platform.position.set(5, 5, -5);
    platform.receiveShadow = true;
    this.scene.add(platform);
    this.obstacles.push(platform);
    
    // 무거운 버튼 (고체 튜토리얼)
    const buttonBase = new this.THREE.Mesh(
      new this.THREE.CylinderGeometry(1.5, 1.5, 0.3, 16),
      new this.THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    buttonBase.position.set(0, 0.15, 5);
    this.scene.add(buttonBase);
    
    // 출구
    const goalGeometry = new this.THREE.BoxGeometry(2, 3, 0.5);
    const goalMaterial = new this.THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5
    });
    this.goal = new this.THREE.Mesh(goalGeometry, goalMaterial);
    this.goal.position.set(15, 1.5, -10);
    this.scene.add(this.goal);
    
    // 출구 빛
    const goalLight = new this.THREE.PointLight(0x00ff00, 2, 10);
    goalLight.position.copy(this.goal.position);
    this.scene.add(goalLight);
    
    // 수집품 3개 배치
    this.createCollectible(-10, 1, -6.5); // 좁은 틈 안
    this.createCollectible(5, 6, -5);     // 높은 플랫폼 위
    this.createCollectible(0, 1, 5);      // 버튼 근처
  }

  private createCollectible(x: number, y: number, z: number): void {
    const geometry = new this.THREE.OctahedronGeometry(0.5);
    const material = new this.THREE.MeshPhongMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.3
    });
    
    const collectible = new this.THREE.Mesh(geometry, material);
    collectible.position.set(x, y, z);
    collectible.userData.collected = false;
    collectible.userData.baseY = y; // 회전 애니메이션용
    this.scene.add(collectible);
    this.collectibles.push(collectible);
  }

  private transformRobot(form: 'liquid' | 'solid' | 'gas'): void {
    if (this.robotForm === form || this.isTransforming) return;
    
    this.isTransforming = true;
    this.robotForm = form;
    
    // UI 업데이트
    const formEl = this.container?.querySelector('#current-form');
    const formNames = { liquid: '액체', solid: '고체', gas: '기체' };
    if (formEl) formEl.textContent = formNames[form];
    
    // 버튼 스타일 업데이트
    ['liquid', 'solid', 'gas'].forEach(f => {
      const btn = this.container?.querySelector(`#form-${f}`) as HTMLElement;
      if (btn) {
        btn.style.background = f === form ? 
          (f === 'liquid' ? '#00cccc' : f === 'solid' ? '#888888' : '#cccccc') : 
          '#666';
      }
    });
    
    // 로봇 외형 변경
    if (this.robot) {
      const material = this.robot.material;
      
      switch (form) {
        case 'liquid':
          this.robot.scale.set(1, 0.7, 1);
          material.color.set(0x00cccc);
          material.opacity = 0.8;
          break;
        case 'solid':
          this.robot.scale.set(1, 1, 1);
          material.color.set(0x888888);
          material.opacity = 1;
          break;
        case 'gas':
          this.robot.scale.set(1.2, 1.2, 1.2);
          material.color.set(0xcccccc);
          material.opacity = 0.5;
          this.gasTimer = this.gasMaxTime;
          break;
      }
    }
    
    // 변신 사운드
    this.playSound('transform');
    
    setTimeout(() => {
      this.isTransforming = false;
    }, 300);
  }

  private setupControls(): void {
    // 키보드 컨트롤
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      
      // 변신
      if (e.key === '1') this.transformRobot('liquid');
      if (e.key === '2') this.transformRobot('solid');
      if (e.key === '3') this.transformRobot('gas');
      
      // 점프
      if (e.key === ' ' && this.isGrounded && this.robotForm !== 'gas') {
        this.velocity.y = this.JUMP_FORCE[this.robotForm];
        this.playSound('jump');
      }
      
      e.preventDefault();
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
    
    // 버튼 클릭
    ['liquid', 'solid', 'gas'].forEach((form, index) => {
      const btn = this.container?.querySelector(`#form-${form}`);
      btn?.addEventListener('click', () => {
        this.transformRobot(form as 'liquid' | 'solid' | 'gas');
      });
    });
    
    // 다음 레벨
    const nextBtn = this.container?.querySelector('#next-level');
    nextBtn?.addEventListener('click', () => {
      this.currentLevel++;
      this.levelCompleted = false;
      
      // UI 숨기기
      const completeEl = this.container?.querySelector('#level-complete') as HTMLElement;
      if (completeEl) completeEl.style.display = 'none';
      
      // 현재는 레벨 1만 있으므로 게임 재시작
      this.resetLevel();
    });
  }

  private updateMovement(deltaTime: number): void {
    if (!this.robot) return;
    
    // 좌우 이동
    const moveSpeed = this.MOVE_SPEED[this.robotForm];
    if (this.keys['arrowleft'] || this.keys['a']) {
      this.robot.position.x -= moveSpeed * deltaTime;
    }
    if (this.keys['arrowright'] || this.keys['d']) {
      this.robot.position.x += moveSpeed * deltaTime;
    }
    
    // 앞뒤 이동
    if (this.keys['arrowup'] || this.keys['w']) {
      this.robot.position.z -= moveSpeed * deltaTime;
    }
    if (this.keys['arrowdown'] || this.keys['s']) {
      this.robot.position.z += moveSpeed * deltaTime;
    }
    
    // 기체 형태 부유
    if (this.robotForm === 'gas' && this.keys[' ']) {
      this.velocity.y = 3;
    }
    
    // 중력
    this.velocity.y += this.GRAVITY[this.robotForm] * deltaTime;
    
    // 속도 적용
    this.robot.position.y += this.velocity.y * deltaTime;
    
    // 충돌 검사
    this.checkCollisions();
    
    // 카메라 추적
    this.camera.position.x = this.robot.position.x;
    this.camera.position.z = this.robot.position.z + 20;
    this.camera.lookAt(this.robot.position);
  }

  private checkCollisions(): void {
    if (!this.robot) return;
    
    this.isGrounded = false;
    
    // 형태별 크기
    const sizes = {
      liquid: { width: 0.7, height: 0.5 },
      solid: { width: 1, height: 1 },
      gas: { width: 1.2, height: 1.2 }
    };
    
    const currentSize = sizes[this.robotForm];
    
    // 바닥 충돌
    if (this.robot.position.y < currentSize.height / 2) {
      this.robot.position.y = currentSize.height / 2;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
    
    // 벽 충돌 (간단한 박스 충돌)
    this.obstacles.forEach(obstacle => {
      if (obstacle === this.obstacles[0]) return; // 바닥은 제외
      
      const dx = Math.abs(this.robot.position.x - obstacle.position.x);
      const dy = Math.abs(this.robot.position.y - obstacle.position.y);
      const dz = Math.abs(this.robot.position.z - obstacle.position.z);
      
      const sumX = currentSize.width / 2 + obstacle.geometry.parameters.width / 2;
      const sumY = currentSize.height / 2 + obstacle.geometry.parameters.height / 2;
      const sumZ = currentSize.width / 2 + obstacle.geometry.parameters.depth / 2;
      
      // 충돌 시 위치 보정 (액체는 좁은 틈 통과 가능)
      if (dx < sumX && dy < sumY && dz < sumZ) {
        if (this.robotForm !== 'liquid' || sumX > 1.5) {
          // 어느 쪽에서 충돌했는지 확인
          if (dx / sumX > dy / sumY && dx / sumX > dz / sumZ) {
            this.robot.position.x = obstacle.position.x + (this.robot.position.x > obstacle.position.x ? sumX : -sumX);
          } else if (dy / sumY > dz / sumZ) {
            this.robot.position.y = obstacle.position.y + (this.robot.position.y > obstacle.position.y ? sumY : -sumY);
            if (this.robot.position.y < obstacle.position.y) {
              this.velocity.y = 0;
              this.isGrounded = true;
            }
          } else {
            this.robot.position.z = obstacle.position.z + (this.robot.position.z > obstacle.position.z ? sumZ : -sumZ);
          }
        }
      }
    });
    
    // 수집품 체크
    this.collectibles.forEach((item, index) => {
      if (item.userData.collected) return;
      
      const distance = this.robot.position.distanceTo(item.position);
      if (distance < 1) {
        item.userData.collected = true;
        this.scene.remove(item);
        this.playSound('collect');
      }
    });
    
    // 목표 도달 체크
    if (this.goal && !this.levelCompleted) {
      const distance = this.robot.position.distanceTo(this.goal.position);
      if (distance < 2) {
        this.completeLevel();
      }
    }
  }

  private updateGasTimer(deltaTime: number): void {
    if (this.robotForm === 'gas') {
      this.gasTimer -= deltaTime;
      
      const timerEl = this.container?.querySelector('#gas-timer') as HTMLElement;
      const timeEl = this.container?.querySelector('#gas-time');
      
      if (timerEl) timerEl.style.display = 'block';
      if (timeEl) timeEl.textContent = Math.ceil(this.gasTimer).toString();
      
      if (this.gasTimer <= 0) {
        this.transformRobot('liquid');
      }
    } else {
      const timerEl = this.container?.querySelector('#gas-timer') as HTMLElement;
      if (timerEl) timerEl.style.display = 'none';
    }
  }

  private completeLevel(): void {
    this.levelCompleted = true;
    
    const completeEl = this.container?.querySelector('#level-complete') as HTMLElement;
    if (completeEl) {
      completeEl.style.display = 'block';
      
      // 수집품 개수
      const collected = this.collectibles.filter(c => c.userData.collected).length;
      const collectiblesEl = this.container?.querySelector('#collectibles-count');
      if (collectiblesEl) collectiblesEl.textContent = `${collected}/3`;
    }
    
    this.playSound('complete');
  }
  
  private resetLevel(): void {
    // 로봇 위치 초기화
    if (this.robot) {
      this.robot.position.set(0, 1, 0);
      this.velocity.set(0, 0, 0);
      this.transformRobot('liquid');
    }
    
    // 수집품 초기화
    this.collectibles.forEach(item => {
      if (item.userData.collected) {
        item.userData.collected = false;
        this.scene.add(item);
      }
    });
    
    // 레벨 UI 업데이트
    const levelEl = this.container?.querySelector('h2');
    if (levelEl) levelEl.innerHTML = `레벨 ${this.currentLevel}: 실험실`;
  }

  private playSound(type: string): void {
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
      case 'transform':
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;
        
      case 'collect':
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.linearRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;
        
      case 'jump':
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.linearRampToValueAtTime(400, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
        
      case 'complete':
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(400 + i * 200, now + i * 0.1);
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.2);
        }
        break;
    }
  }

  private startGame(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      const deltaTime = this.clock.getDelta();
      
      // 업데이트
      this.updateMovement(deltaTime);
      this.updateGasTimer(deltaTime);
      
      // 로봇 회전 애니메이션
      if (this.robot) {
        this.robot.rotation.y += deltaTime * 0.5;
        
        // 수집품 회전
        this.collectibles.forEach(item => {
          if (!item.userData.collected) {
            item.rotation.y += deltaTime * 2;
            item.position.y = item.userData.baseY || item.position.y + Math.sin(Date.now() * 0.002) * 0.1;
          }
        });
      }
      
      // 렌더링
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    
    animate();
  }

  private cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}