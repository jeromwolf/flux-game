interface Particle {
  position: any;
  velocity: any;
  mesh: any;
}

export default class LiquidRobot {
  private container: HTMLElement | null = null;
  private THREE: any;
  private scene: any;
  private camera: any;
  private renderer: any;
  private particles: Particle[] = [];
  private obstacles: any[] = [];
  private goal: any;
  private currentLevel: number = 1;
  private isTransforming: boolean = false;
  private robotForm: 'liquid' | 'solid' | 'gas' = 'liquid';
  private animationId: number | null = null;
  private clock: any;
  private audioContext: AudioContext | null = null;
  private keys: { [key: string]: boolean } = {};
  private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private raycaster: any;
  private mouse: any;
  
  // 물리 상수
  private readonly PARTICLE_COUNT = 50; // 성능을 위해 줄임
  private readonly PARTICLE_SIZE = 0.4; // 조금 크게
  private readonly COHESION_FORCE = 0.1; // 더 뭉치도록
  private readonly SEPARATION_FORCE = 0.05;
  private readonly VISCOSITY = 0.95;
  
  constructor() {
    // Three.js will be loaded in mount
  }
  
  mount(container: HTMLElement): void {
    this.container = container;
    
    // Check if we're on client side
    if (typeof window === 'undefined') {
      console.warn('LiquidRobot can only run in browser');
      return;
    }
    
    // Show loading message
    this.container.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Loading 3D Game...</div>';
    
    // Add delay to ensure DOM is ready
    setTimeout(() => {
      // Dynamically import Three.js
      import('three').then((module) => {
        console.log('Three.js loaded successfully for LiquidRobot');
        this.THREE = module;
        this.clock = new module.Clock();
        this.raycaster = new module.Raycaster();
        this.mouse = new module.Vector2();
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
    if (!this.container) return;
    
    // HTML 구조 생성
    this.container.innerHTML = `
      <div style="width: 100%; height: 600px; position: relative; overflow: hidden; background: #000;">
        <div id="game-ui" style="position: absolute; top: 10px; left: 10px; color: white; z-index: 10;">
          <div style="font-size: 20px; margin-bottom: 10px;">레벨: <span id="level">1</span></div>
          <div style="font-size: 16px; margin-bottom: 5px;">형태: <span id="form">액체</span></div>
          <div style="font-size: 14px; color: #aaa;">
            <div>[방향키/WASD] 이동</div>
            <div>[스페이스바] 점프</div>
            <div>[Q] 액체 (좁은 곳 통과) / [R] 고체 (단단함) / [E] 기체 (날기)</div>
            <div style="margin-top: 10px; color: #0ff;">🎯 목표: 초록색 빛나는 곳으로 가세요!</div>
            <div style="color: #ff0;">💡 팁: 벽 사이는 액체로, 높은 곳은 기체로!</div>
          </div>
        </div>
        <div id="game-canvas" style="width: 100%; height: 100%;"></div>
        <div id="level-complete" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none; text-align: center;">
          <h2 style="color: #0ff; font-size: 40px; margin: 0;">레벨 완료!</h2>
          <button id="next-level" style="margin-top: 20px; padding: 10px 30px; font-size: 18px; background: #0ff; border: none; cursor: pointer;">다음 레벨</button>
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
    this.createLevel(this.currentLevel);
    this.setupControls();
    
    // 게임 시작
    this.startGame();
  }
  
  private setupScene(): void {
    this.scene = new this.THREE.Scene();
    this.scene.background = new this.THREE.Color(0x001122);
    this.scene.fog = new this.THREE.Fog(0x001122, 10, 100);
  }
  
  private setupRenderer(container: HTMLElement): void {
    this.renderer = new this.THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    console.log('LiquidRobot renderer created:', this.renderer);
    
    // 리사이즈 핸들러
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
    this.camera.position.set(0, 20, 30);
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
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    this.scene.add(mainLight);
    
    // 포인트 라이트 (액체 효과)
    const liquidLight = new this.THREE.PointLight(0x00ffff, 0.5, 20);
    liquidLight.position.set(0, 5, 0);
    this.scene.add(liquidLight);
  }
  
  private createRobot(): void {
    // 파티클 기반 로봇 생성
    const geometry = new this.THREE.SphereGeometry(this.PARTICLE_SIZE, 8, 8);
    const material = new this.THREE.MeshPhysicalMaterial({
      color: 0x00ffff,
      emissive: 0x004444,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8
    });
    
    // 중심에서 구형으로 파티클 배치
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const particle = new this.THREE.Mesh(geometry, material.clone());
      const angle = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const radius = Math.random() * 2;
      
      particle.position.set(
        Math.sin(angle) * Math.sin(angle2) * radius,
        Math.cos(angle2) * radius + 3,
        Math.cos(angle) * Math.sin(angle2) * radius + 10
      );
      
      particle.castShadow = true;
      particle.receiveShadow = true;
      this.scene.add(particle);
      
      this.particles.push({
        position: particle.position,
        velocity: new this.THREE.Vector3(),
        mesh: particle
      });
    }
  }
  
  private createLevel(level: number): void {
    // 기존 장애물 제거
    this.obstacles.forEach(obstacle => this.scene.remove(obstacle));
    this.obstacles = [];
    
    // 바닥
    const floorGeometry = new this.THREE.BoxGeometry(40, 1, 40);
    const floorMaterial = new this.THREE.MeshPhongMaterial({ color: 0x333333 });
    const floor = new this.THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.obstacles.push(floor);
    
    // 레벨별 장애물 생성
    const obstacleMaterial = new this.THREE.MeshPhongMaterial({ color: 0x666666 });
    
    if (level === 1) {
      // 좁은 통로
      const wall1 = new this.THREE.Mesh(new this.THREE.BoxGeometry(10, 5, 1), obstacleMaterial);
      wall1.position.set(-5, 2.5, 0);
      wall1.castShadow = true;
      this.scene.add(wall1);
      this.obstacles.push(wall1);
      
      const wall2 = new this.THREE.Mesh(new this.THREE.BoxGeometry(10, 5, 1), obstacleMaterial);
      wall2.position.set(5, 2.5, 0);
      wall2.castShadow = true;
      this.scene.add(wall2);
      this.obstacles.push(wall2);
      
      // 좁은 틈
      const gap = new this.THREE.Mesh(new this.THREE.BoxGeometry(1, 2, 1), obstacleMaterial);
      gap.position.set(0, 4, 0);
      gap.castShadow = true;
      this.scene.add(gap);
      this.obstacles.push(gap);
    } else if (level === 2) {
      // 미로
      const wallPositions = [
        { x: -10, y: 2.5, z: 0, w: 2, h: 5, d: 20 },
        { x: 10, y: 2.5, z: 0, w: 2, h: 5, d: 20 },
        { x: 0, y: 2.5, z: -10, w: 20, h: 5, d: 2 },
        { x: 0, y: 2.5, z: 10, w: 20, h: 5, d: 2 },
        { x: 0, y: 2.5, z: 0, w: 10, h: 5, d: 2 }
      ];
      
      wallPositions.forEach(pos => {
        const wall = new this.THREE.Mesh(
          new this.THREE.BoxGeometry(pos.w, pos.h, pos.d),
          obstacleMaterial
        );
        wall.position.set(pos.x, pos.y, pos.z);
        wall.castShadow = true;
        this.scene.add(wall);
        this.obstacles.push(wall);
      });
    } else {
      // 높은 벽과 작은 구멍
      const highWall = new this.THREE.Mesh(new this.THREE.BoxGeometry(20, 10, 2), obstacleMaterial);
      highWall.position.set(0, 5, 5);
      highWall.castShadow = true;
      this.scene.add(highWall);
      this.obstacles.push(highWall);
      
      // 작은 구멍 (기체 형태로만 통과 가능)
      const hole = new this.THREE.Mesh(new this.THREE.BoxGeometry(2, 2, 2), obstacleMaterial);
      hole.position.set(0, 8, 5);
      hole.castShadow = true;
      this.scene.add(hole);
    }
    
    // 목표 지점
    if (this.goal) this.scene.remove(this.goal);
    const goalGeometry = new this.THREE.CylinderGeometry(3, 3, 5, 16);
    const goalMaterial = new this.THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.8
    });
    this.goal = new this.THREE.Mesh(goalGeometry, goalMaterial);
    this.goal.position.set(0, 2.5, level === 1 ? -15 : 15);
    this.scene.add(this.goal);
    
    // 목표 지점 빛 추가
    const goalLight = new this.THREE.PointLight(0x00ff00, 2, 10);
    goalLight.position.copy(this.goal.position);
    goalLight.position.y += 3;
    this.scene.add(goalLight);
  }
  
  private updatePhysics(deltaTime: number): void {
    // 파티클 물리 업데이트
    const center = new this.THREE.Vector3();
    this.particles.forEach(p => center.add(p.position));
    center.divideScalar(this.particles.length);
    
    // 각 파티클 업데이트
    this.particles.forEach((particle, i) => {
      // 형태에 따른 물리 특성 변경
      let cohesion = this.COHESION_FORCE;
      let separation = this.SEPARATION_FORCE;
      let viscosity = this.VISCOSITY;
      
      if (this.robotForm === 'solid') {
        cohesion *= 3;
        separation *= 0.5;
        viscosity = 0.98;
      } else if (this.robotForm === 'gas') {
        cohesion *= 0.1;
        separation *= 2;
        viscosity = 0.9;
      }
      
      // 응집력 (중심으로)
      const toCenter = center.clone().sub(particle.position);
      particle.velocity.add(toCenter.multiplyScalar(cohesion * deltaTime));
      
      // 분리력 (다른 파티클로부터)
      this.particles.forEach((other, j) => {
        if (i !== j) {
          const distance = particle.position.distanceTo(other.position);
          if (distance < this.PARTICLE_SIZE * 2.5) {
            const force = particle.position.clone().sub(other.position);
            force.normalize().multiplyScalar(separation / (distance + 0.1));
            particle.velocity.add(force);
          }
        }
      });
      
      // 중력 (약하게 조정)
      if (this.robotForm !== 'gas') {
        particle.velocity.y -= 2 * deltaTime;
      } else {
        particle.velocity.y += 1 * deltaTime; // 기체는 위로 뜸
      }
      
      // 점성
      particle.velocity.multiplyScalar(viscosity);
      
      // 위치 업데이트
      const newPosition = particle.position.clone().add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );
      
      // 충돌 검사
      let collision = false;
      this.obstacles.forEach(obstacle => {
        const box = new this.THREE.Box3().setFromObject(obstacle);
        const particleSphere = new this.THREE.Sphere(newPosition, this.PARTICLE_SIZE);
        
        if (box.intersectsSphere(particleSphere)) {
          collision = true;
          
          // 충돌 반응
          const closestPoint = new this.THREE.Vector3();
          box.clampPoint(newPosition, closestPoint);
          const normal = newPosition.clone().sub(closestPoint).normalize();
          
          // 반사
          particle.velocity.reflect(normal);
          particle.velocity.multiplyScalar(0.5);
          
          // 위치 보정
          newPosition.copy(closestPoint.add(normal.multiplyScalar(this.PARTICLE_SIZE * 1.1)));
          
          // 바닥에 닿은 경우 Y 속도를 0으로
          if (normal.y > 0.9) {
            particle.velocity.y = Math.max(0, particle.velocity.y);
          }
        }
      });
      
      if (!collision) {
        particle.position.copy(newPosition);
        particle.mesh.position.copy(newPosition);
      }
    });
  }
  
  private checkGoal(): void {
    const center = new this.THREE.Vector3();
    this.particles.forEach(p => center.add(p.position));
    center.divideScalar(this.particles.length);
    
    const distance = center.distanceTo(this.goal.position);
    if (distance < 3) {
      this.levelComplete();
    }
  }
  
  private levelComplete(): void {
    this.playSound('success');
    
    const levelCompleteEl = this.container?.querySelector('#level-complete') as HTMLElement;
    if (levelCompleteEl) levelCompleteEl.style.display = 'block';
  }
  
  private moveRobot(direction: any): void {
    const force = direction.multiplyScalar(this.robotForm === 'gas' ? 30 : 20);
    this.particles.forEach(particle => {
      particle.velocity.add(force.clone().multiplyScalar(0.05));
    });
    
    if (Math.random() > 0.8) {
      this.playSound('move');
    }
  }
  
  private jump(): void {
    // 바닥에 있는 파티클만 점프
    this.particles.forEach(particle => {
      if (particle.position.y < 2) {
        particle.velocity.y = this.robotForm === 'gas' ? 8 : 5;
      }
    });
    this.playSound('move');
  }
  
  private transformRobot(form: 'liquid' | 'solid' | 'gas'): void {
    if (this.robotForm === form || this.isTransforming) return;
    
    this.isTransforming = true;
    this.robotForm = form;
    this.playSound('transform');
    
    // UI 업데이트
    const formEl = this.container?.querySelector('#form');
    if (formEl) {
      formEl.textContent = form === 'liquid' ? '액체' : form === 'solid' ? '고체' : '기체';
    }
    
    // 파티클 외형 변경
    this.particles.forEach(particle => {
      const material = particle.mesh.material as any;
      
      if (form === 'liquid') {
        material.color.set(0x00ffff);
        material.opacity = 0.8;
        material.metalness = 0.8;
        material.roughness = 0.2;
      } else if (form === 'solid') {
        material.color.set(0x0080ff);
        material.opacity = 1;
        material.metalness = 0.3;
        material.roughness = 0.7;
      } else {
        material.color.set(0x80ffff);
        material.opacity = 0.3;
        material.metalness = 0;
        material.roughness = 1;
      }
    });
    
    setTimeout(() => {
      this.isTransforming = false;
    }, 500);
  }
  
  private setupControls(): void {
    // 키보드 컨트롤
    this.keyDownHandler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;
      console.log('Key pressed:', key, 'Current keys:', this.keys);
      
      // 형태 변환
      if (key === 'q') {
        console.log('Transforming to liquid');
        this.transformRobot('liquid');
      } else if (key === 'r') {
        console.log('Transforming to solid');
        this.transformRobot('solid');
      } else if (key === 'e') {
        console.log('Transforming to gas');
        this.transformRobot('gas');
      } else if (key === ' ' || key === 'space') {
        console.log('Jumping!');
        this.jump();
      }
      
      // 방향키와 스페이스바는 기본 동작 방지
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'space'].includes(key)) {
        e.preventDefault();
      }
    };
    
    this.keyUpHandler = (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
    };
    
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    
    // 다음 레벨 버튼
    const nextLevelBtn = this.container?.querySelector('#next-level');
    nextLevelBtn?.addEventListener('click', () => {
      this.currentLevel++;
      const levelCompleteEl = this.container?.querySelector('#level-complete') as HTMLElement;
      if (levelCompleteEl) levelCompleteEl.style.display = 'none';
      
      // 레벨 UI 업데이트
      const levelEl = this.container?.querySelector('#level');
      if (levelEl) levelEl.textContent = this.currentLevel.toString();
      
      // 새 레벨 생성
      this.createLevel(this.currentLevel);
      
      // 로봇 위치 초기화
      this.particles.forEach((particle, i) => {
        const angle = (i / this.particles.length) * Math.PI * 2;
        particle.position.set(
          Math.sin(angle) * 2,
          3,
          Math.cos(angle) * 2 + 10
        );
        particle.velocity.set(0, 0, 0);
        particle.mesh.position.copy(particle.position);
      });
    });
  }
  
  private playSound(type: 'move' | 'transform' | 'success'): void {
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
      case 'move':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
        
      case 'transform':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
        
      case 'success':
        // 성공 멜로디
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.2);
        });
        break;
    }
  }
  
  private startGame(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      const deltaTime = this.clock.getDelta();
      
      // 입력 처리
      const moveDirection = new this.THREE.Vector3();
      let moving = false;
      
      if (this.keys['arrowleft'] || this.keys['a']) {
        moveDirection.x -= 1;
        moving = true;
      }
      if (this.keys['arrowright'] || this.keys['d']) {
        moveDirection.x += 1;
        moving = true;
      }
      if (this.keys['arrowup'] || this.keys['w']) {
        moveDirection.z -= 1;
        moving = true;
      }
      if (this.keys['arrowdown'] || this.keys['s']) {
        moveDirection.z += 1;
        moving = true;
      }
      
      if (moving) {
        console.log('Moving:', moveDirection);
        moveDirection.normalize();
        this.moveRobot(moveDirection);
      }
      
      // 물리 업데이트
      this.updatePhysics(deltaTime);
      
      // 목표 체크
      this.checkGoal();
      
      // 목표 회전 애니메이션
      if (this.goal) {
        this.goal.rotation.y += deltaTime;
      }
      
      // 카메라 추적
      const center = new this.THREE.Vector3();
      this.particles.forEach(p => center.add(p.position));
      center.divideScalar(this.particles.length);
      
      this.camera.position.x += (center.x - this.camera.position.x) * 0.05;
      this.camera.position.z += (center.z + 25 - this.camera.position.z) * 0.05;
      this.camera.lookAt(center);
      
      // 렌더링
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }
  
  private cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Three.js 정리
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // 이벤트 리스너 제거
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
    }
    if (this.keyUpHandler) {
      window.removeEventListener('keyup', this.keyUpHandler);
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}