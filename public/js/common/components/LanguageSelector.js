/**
 * Language Selector Component
 * Provides UI for language selection
 */
import i18n from '../i18n/i18n.js';

export class LanguageSelector {
    constructor(container) {
        this.container = container;
        this.isOpen = false;
        this.languages = [
            { code: 'ko', name: '한국어', flag: '🇰🇷' },
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' }
        ];
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        
        // Listen for language changes
        this.languageChangeHandler = (e) => {
            this.updateSelectedLanguage(e.detail.lang);
        };
        window.addEventListener('languageChanged', this.languageChangeHandler);
    }

    render() {
        const currentLang = i18n.getCurrentLanguage();
        const currentLangData = this.languages.find(lang => lang.code === currentLang);

        this.container.innerHTML = `
            <div class="language-selector">
                <button class="language-selector__toggle" aria-label="Select language">
                    <span class="language-selector__flag">${currentLangData.flag}</span>
                    <span class="language-selector__name">${currentLangData.code.toUpperCase()}</span>
                    <svg class="language-selector__arrow" width="12" height="8" viewBox="0 0 12 8">
                        <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                </button>
                <div class="language-selector__dropdown" aria-hidden="true">
                    <ul class="language-selector__list">
                        ${this.languages.map(lang => `
                            <li class="language-selector__item ${lang.code === currentLang ? 'language-selector__item--active' : ''}">
                                <button class="language-selector__option" data-lang="${lang.code}">
                                    <span class="language-selector__flag">${lang.flag}</span>
                                    <span class="language-selector__name">${lang.name}</span>
                                    ${lang.code === currentLang ? '<svg class="language-selector__check" width="16" height="16" viewBox="0 0 16 16"><path d="M13.5 3.5L6 11L2.5 7.5" stroke="currentColor" stroke-width="2" fill="none"/></svg>' : ''}
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;

        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('language-selector-styles')) return;

        const style = document.createElement('style');
        style.id = 'language-selector-styles';
        style.textContent = `
            .language-selector {
                position: relative;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .language-selector__toggle {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .language-selector__toggle:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
            }

            .language-selector__flag {
                font-size: 20px;
                line-height: 1;
            }

            .language-selector__arrow {
                transition: transform 0.3s ease;
            }

            .language-selector--open .language-selector__arrow {
                transform: rotate(180deg);
            }

            .language-selector__dropdown {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                min-width: 200px;
                background: rgba(30, 30, 30, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 8px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                z-index: 1000;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }

            .language-selector--open .language-selector__dropdown {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .language-selector__list {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .language-selector__item {
                margin: 2px 0;
            }

            .language-selector__option {
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: none;
                border-radius: 8px;
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .language-selector__option:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .language-selector__item--active .language-selector__option {
                background: rgba(255, 255, 255, 0.15);
                color: white;
            }

            .language-selector__check {
                margin-left: auto;
                color: #4CAF50;
            }

            /* RTL Support */
            .rtl .language-selector__dropdown {
                right: auto;
                left: 0;
            }

            .rtl .language-selector__option {
                text-align: right;
            }

            .rtl .language-selector__check {
                margin-left: 0;
                margin-right: auto;
            }

            /* Mobile styles */
            @media (max-width: 768px) {
                .language-selector__toggle {
                    padding: 6px 12px;
                    font-size: 12px;
                }

                .language-selector__flag {
                    font-size: 16px;
                }

                .language-selector__dropdown {
                    min-width: 180px;
                }

                .language-selector__option {
                    padding: 8px 10px;
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    attachEventListeners() {
        const toggle = this.container.querySelector('.language-selector__toggle');
        const selector = this.container.querySelector('.language-selector');

        // Remove existing listeners
        if (this.toggleHandler) {
            toggle.removeEventListener('click', this.toggleHandler);
        }
        if (this.containerClickHandler) {
            this.container.removeEventListener('click', this.containerClickHandler);
        }
        if (this.documentClickHandler) {
            document.removeEventListener('click', this.documentClickHandler);
        }
        if (this.keydownHandler) {
            toggle.removeEventListener('keydown', this.keydownHandler);
        }

        // Toggle dropdown
        this.toggleHandler = (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        };
        toggle.addEventListener('click', this.toggleHandler);

        // Language selection
        this.containerClickHandler = async (e) => {
            const option = e.target.closest('.language-selector__option');
            if (option) {
                e.stopPropagation();
                const lang = option.dataset.lang;
                await this.selectLanguage(lang);
            }
        };
        this.container.addEventListener('click', this.containerClickHandler);

        // Close dropdown when clicking outside
        this.documentClickHandler = (e) => {
            if (!this.container.contains(e.target) && this.isOpen) {
                this.closeDropdown();
            }
        };
        document.addEventListener('click', this.documentClickHandler);

        // Keyboard navigation
        this.keydownHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleDropdown();
            } else if (e.key === 'Escape' && this.isOpen) {
                this.closeDropdown();
            }
        };
        toggle.addEventListener('keydown', this.keydownHandler);
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
        const selector = this.container.querySelector('.language-selector');
        const dropdown = this.container.querySelector('.language-selector__dropdown');
        
        if (this.isOpen) {
            selector.classList.add('language-selector--open');
            dropdown.setAttribute('aria-hidden', 'false');
        } else {
            selector.classList.remove('language-selector--open');
            dropdown.setAttribute('aria-hidden', 'true');
        }
    }

    closeDropdown() {
        this.isOpen = false;
        const selector = this.container.querySelector('.language-selector');
        const dropdown = this.container.querySelector('.language-selector__dropdown');
        selector.classList.remove('language-selector--open');
        dropdown.setAttribute('aria-hidden', 'true');
    }

    async selectLanguage(lang) {
        if (lang === i18n.getCurrentLanguage()) {
            this.closeDropdown();
            return;
        }

        // Show loading state
        const toggle = this.container.querySelector('.language-selector__toggle');
        toggle.disabled = true;
        toggle.style.opacity = '0.5';

        try {
            await i18n.changeLanguage(lang);
            this.closeDropdown();
            this.render();
        } catch (error) {
            console.error('Failed to change language:', error);
            toggle.disabled = false;
            toggle.style.opacity = '1';
        }
    }

    updateSelectedLanguage(lang) {
        const currentLangData = this.languages.find(l => l.code === lang);
        if (currentLangData) {
            // Re-render instead of updating individual elements
            this.render();
            this.attachEventListeners();
        }
    }
}