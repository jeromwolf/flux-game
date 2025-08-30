// ShareSystem.ts - 게임 공유 시스템

export interface ShareData {
  gameId: string;
  gameName: string;
  score?: number;
  level?: number;
  achievement?: string;
  customMessage?: string;
}

export interface ShareConfig {
  platforms: ('twitter' | 'facebook' | 'kakao' | 'clipboard' | 'native')[];
  language: 'ko' | 'en';
}

export class ShareSystem {
  private static instance: ShareSystem;
  private readonly BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://flux-game.com';
  
  private readonly messages = {
    ko: {
      defaultMessage: '나는 {game}에서 {score}점을 획득했어요!',
      achievementMessage: '나는 {game}에서 "{achievement}" 업적을 달성했어요!',
      levelMessage: '나는 {game}에서 레벨 {level}에 도달했어요!',
      playNow: '지금 플레이하기',
      shareSuccess: '공유되었습니다!',
      copySuccess: '링크가 복사되었습니다!',
      shareError: '공유에 실패했습니다.',
      fluxGames: '플럭스 게임즈'
    },
    en: {
      defaultMessage: 'I scored {score} points in {game}!',
      achievementMessage: 'I unlocked "{achievement}" in {game}!',
      levelMessage: 'I reached level {level} in {game}!',
      playNow: 'Play Now',
      shareSuccess: 'Shared successfully!',
      copySuccess: 'Link copied!',
      shareError: 'Failed to share.',
      fluxGames: 'Flux Games'
    }
  };

  private constructor() {}

  static getInstance(): ShareSystem {
    if (!ShareSystem.instance) {
      ShareSystem.instance = new ShareSystem();
    }
    return ShareSystem.instance;
  }

  // 게임 공유
  async shareGame(data: ShareData, config: ShareConfig): Promise<void> {
    const shareUrl = this.generateShareUrl(data);
    const shareText = this.generateShareText(data, config.language);
    
    // 네이티브 공유 API 우선 시도
    if (config.platforms.includes('native') && navigator.share) {
      try {
        await navigator.share({
          title: `${data.gameName} - ${this.messages[config.language].fluxGames}`,
          text: shareText,
          url: shareUrl
        });
        this.showNotification(this.messages[config.language].shareSuccess, 'success');
        return;
      } catch (err) {
        // 사용자가 취소한 경우 에러를 무시
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }
    
    // 플랫폼별 공유 모달 표시
    this.showShareModal(data, config, shareUrl, shareText);
  }

  // 공유 URL 생성
  private generateShareUrl(data: ShareData): string {
    const params = new URLSearchParams({
      game: data.gameId,
      ...(data.score && { score: data.score.toString() }),
      ...(data.level && { level: data.level.toString() }),
      ref: 'share'
    });
    
    return `${this.BASE_URL}/games/${data.gameId}?${params.toString()}`;
  }

  // 공유 텍스트 생성
  private generateShareText(data: ShareData, language: 'ko' | 'en'): string {
    const messages = this.messages[language];
    
    if (data.customMessage) {
      return data.customMessage;
    }
    
    let template = messages.defaultMessage;
    
    if (data.achievement) {
      template = messages.achievementMessage;
    } else if (data.level && !data.score) {
      template = messages.levelMessage;
    }
    
    return template
      .replace('{game}', data.gameName)
      .replace('{score}', data.score?.toLocaleString() || '0')
      .replace('{level}', data.level?.toString() || '1')
      .replace('{achievement}', data.achievement || '');
  }

  // 공유 모달 표시
  private showShareModal(data: ShareData, config: ShareConfig, shareUrl: string, shareText: string): void {
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 30px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    `;

    const title = document.createElement('h2');
    title.style.cssText = `
      margin: 0 0 20px 0;
      color: #333;
      font-size: 24px;
      text-align: center;
    `;
    title.textContent = config.language === 'ko' ? '공유하기' : 'Share';

    const platforms = document.createElement('div');
    platforms.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
      margin-bottom: 20px;
    `;

    // 플랫폼 버튼들
    if (config.platforms.includes('twitter')) {
      platforms.appendChild(this.createShareButton('Twitter', '#1DA1F2', () => {
        this.shareToTwitter(shareText, shareUrl);
        modal.remove();
      }));
    }

    if (config.platforms.includes('facebook')) {
      platforms.appendChild(this.createShareButton('Facebook', '#1877F2', () => {
        this.shareToFacebook(shareUrl);
        modal.remove();
      }));
    }

    if (config.platforms.includes('kakao')) {
      platforms.appendChild(this.createShareButton('KakaoTalk', '#FEE500', () => {
        this.shareToKakao(data, config.language);
        modal.remove();
      }, '#000'));
    }

    if (config.platforms.includes('clipboard')) {
      platforms.appendChild(this.createShareButton(
        config.language === 'ko' ? '링크 복사' : 'Copy Link', 
        '#666', 
        () => {
          this.copyToClipboard(shareUrl);
          modal.remove();
        }
      ));
    }

    // 닫기 버튼
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      background: #eee;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      color: #666;
    `;
    closeBtn.textContent = config.language === 'ko' ? '닫기' : 'Close';
    closeBtn.onclick = () => modal.remove();

    content.appendChild(title);
    content.appendChild(platforms);
    content.appendChild(closeBtn);
    modal.appendChild(content);

    // 애니메이션 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        style.remove();
      }
    });
  }

  // 공유 버튼 생성
  private createShareButton(text: string, bgColor: string, onClick: () => void, textColor: string = '#fff'): HTMLButtonElement {
    const button = document.createElement('button');
    button.style.cssText = `
      padding: 12px 24px;
      background: ${bgColor};
      color: ${textColor};
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
    `;
    button.textContent = text;
    button.onclick = onClick;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
    
    return button;
  }

  // 트위터 공유
  private shareToTwitter(text: string, url: string): void {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  // 페이스북 공유
  private shareToFacebook(url: string): void {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  // 카카오톡 공유
  private shareToKakao(data: ShareData, language: 'ko' | 'en'): void {
    // Kakao SDK가 로드되어 있는지 확인
    if (typeof window.Kakao === 'undefined') {
      console.error('Kakao SDK not loaded');
      this.showNotification(this.messages[language].shareError, 'error');
      return;
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: data.gameName,
          description: this.generateShareText(data, language),
          imageUrl: `${this.BASE_URL}/images/games/${data.gameId}.png`,
          link: {
            mobileWebUrl: this.generateShareUrl(data),
            webUrl: this.generateShareUrl(data),
          },
        },
        buttons: [
          {
            title: this.messages[language].playNow,
            link: {
              mobileWebUrl: this.generateShareUrl(data),
              webUrl: this.generateShareUrl(data),
            },
          },
        ],
      });
    } catch (error) {
      console.error('Kakao share error:', error);
      this.showNotification(this.messages[language].shareError, 'error');
    }
  }

  // 클립보드 복사
  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification(this.messages.ko.copySuccess, 'success');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showNotification(this.messages.ko.copySuccess, 'success');
    }
  }

  // 알림 표시
  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 15px 30px;
      background: ${type === 'success' ? '#4ecdc4' : '#ff6b6b'};
      color: white;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      animation: slideInUp 0.3s ease-out;
      z-index: 10001;
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from { transform: translate(-50%, 100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      @keyframes slideOutDown {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, 100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutDown 0.3s ease-in';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);
  }
}

// Window 타입 확장 (Kakao SDK용)
declare global {
  interface Window {
    Kakao: any;
  }
}

// 싱글톤 인스턴스 export
export const shareSystem = ShareSystem.getInstance();