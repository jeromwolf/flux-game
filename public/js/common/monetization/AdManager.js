/**
 * 광고 관리자 - 게임 내 광고를 관리하는 싱글톤 클래스
 */
export class AdManager {
    constructor() {
        if (AdManager.instance) {
            return AdManager.instance;
        }
        
        this.adContainer = null;
        this.isTestMode = true; // 개발 중에는 테스트 모드
        this.adQueue = [];
        this.isShowingAd = false;
        this.callbacks = {};
        
        AdManager.instance = this;
    }
    
    init() {
        this.createAdContainer();
        this.loadAdSDK();
        console.log('AdManager initialized in', this.isTestMode ? 'TEST' : 'PRODUCTION', 'mode');
    }
    
    createAdContainer() {
        // 광고 컨테이너 생성
        this.adContainer = document.createElement('div');
        this.adContainer.id = 'ad-container';
        this.adContainer.className = 'ad-container hidden';
        this.adContainer.innerHTML = `
            <div class="ad-overlay"></div>
            <div class="ad-content">
                <div class="ad-header">
                    <span class="ad-label">광고</span>
                    <button class="ad-close-btn" id="ad-close-btn">✕</button>
                </div>
                <div class="ad-body" id="ad-body"></div>
            </div>
        `;
        document.body.appendChild(this.adContainer);
        
        // 닫기 버튼 이벤트
        document.getElementById('ad-close-btn').addEventListener('click', () => {
            this.close();
        });
    }
    
    loadAdSDK() {
        if (!this.isTestMode) {
            // 실제 광고 SDK 로드 (Google AdSense, AdMob 등)
            // const script = document.createElement('script');
            // script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
            // script.async = true;
            // document.head.appendChild(script);
        }
    }
    
    /**
     * 광고 표시
     * @param {string} placement - 광고 위치 (start, gameover, reward, banner)
     * @param {Object} options - 광고 옵션
     */
    show(placement, options = {}) {
        if (this.isShowingAd) {
            this.adQueue.push({ placement, options });
            return Promise.reject('Ad already showing');
        }
        
        this.isShowingAd = true;
        
        return new Promise((resolve, reject) => {
            this.callbacks = { resolve, reject };
            
            if (this.isTestMode) {
                this.showTestAd(placement, options);
            } else {
                this.showRealAd(placement, options);
            }
        });
    }
    
    showTestAd(placement, options) {
        const adBody = document.getElementById('ad-body');
        const closeBtn = document.getElementById('ad-close-btn');
        
        // 광고 타입별 표시
        switch (placement) {
            case 'banner':
                adBody.innerHTML = `
                    <div class="test-ad banner-ad">
                        <h4>배너 광고 (320x50)</h4>
                        <p>게임 하단에 표시되는 광고입니다</p>
                    </div>
                `;
                closeBtn.style.display = 'block';
                break;
                
            case 'interstitial':
            case 'gameover':
                let countdown = 5;
                closeBtn.style.display = 'none';
                
                adBody.innerHTML = `
                    <div class="test-ad interstitial-ad">
                        <h3>전면 광고</h3>
                        <div class="ad-image-placeholder">
                            <span>광고 이미지 영역</span>
                        </div>
                        <p class="ad-countdown">${countdown}초 후 닫기 가능</p>
                    </div>
                `;
                
                const countdownInterval = setInterval(() => {
                    countdown--;
                    const countdownEl = adBody.querySelector('.ad-countdown');
                    if (countdown > 0) {
                        countdownEl.textContent = `${countdown}초 후 닫기 가능`;
                    } else {
                        countdownEl.textContent = '광고를 닫을 수 있습니다';
                        closeBtn.style.display = 'block';
                        clearInterval(countdownInterval);
                    }
                }, 1000);
                break;
                
            case 'reward':
                closeBtn.style.display = 'none';
                
                adBody.innerHTML = `
                    <div class="test-ad reward-ad">
                        <h3>보상형 광고</h3>
                        <div class="ad-video-placeholder">
                            <span>동영상 광고 (30초)</span>
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                        </div>
                        <p>광고를 끝까지 시청하면 보상을 받습니다!</p>
                        <p class="reward-info">보상: ${options.reward || '코인 100개'}</p>
                    </div>
                `;
                
                // 프로그레스 바 애니메이션
                setTimeout(() => {
                    const progressFill = adBody.querySelector('.progress-fill');
                    progressFill.style.width = '100%';
                }, 100);
                
                // 30초 후 보상 지급
                setTimeout(() => {
                    closeBtn.style.display = 'block';
                    adBody.querySelector('.reward-info').innerHTML = '✓ 보상이 지급되었습니다!';
                    this.callbacks.resolve({ watched: true, reward: options.reward });
                }, 5000); // 테스트를 위해 5초로 단축
                break;
        }
        
        this.adContainer.classList.remove('hidden');
    }
    
    showRealAd(placement, options) {
        // 실제 광고 SDK 호출
        // 예: AdMob, Unity Ads, IronSource 등
        console.log('Showing real ad:', placement, options);
        
        // 실제 구현 시 광고 SDK의 콜백을 처리
        // adSDK.show(placement, {
        //     onClose: () => this.callbacks.resolve(),
        //     onError: (err) => this.callbacks.reject(err),
        //     onReward: (reward) => this.callbacks.resolve({ reward })
        // });
    }
    
    close() {
        this.adContainer.classList.add('hidden');
        this.isShowingAd = false;
        
        if (this.callbacks.resolve) {
            this.callbacks.resolve({ closed: true });
        }
        
        // 대기 중인 광고가 있으면 표시
        if (this.adQueue.length > 0) {
            const next = this.adQueue.shift();
            setTimeout(() => {
                this.show(next.placement, next.options);
            }, 500);
        }
    }
    
    /**
     * 배너 광고 표시/숨기기
     */
    showBanner() {
        const banner = document.createElement('div');
        banner.id = 'bottom-banner-ad';
        banner.className = 'bottom-banner-ad';
        banner.innerHTML = `
            <div class="banner-content">
                <span>배너 광고 영역 (320x50)</span>
            </div>
        `;
        document.body.appendChild(banner);
    }
    
    hideBanner() {
        const banner = document.getElementById('bottom-banner-ad');
        if (banner) {
            banner.remove();
        }
    }
    
    /**
     * 광고 제거 구매 확인
     */
    isAdFree() {
        return localStorage.getItem('adFree') === 'true';
    }
    
    setAdFree(value) {
        localStorage.setItem('adFree', value ? 'true' : 'false');
    }
}

// 싱글톤 인스턴스
export default new AdManager();