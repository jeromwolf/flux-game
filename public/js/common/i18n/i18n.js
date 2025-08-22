/**
 * Internationalization (i18n) Manager
 * Handles language detection, switching, and translation loading
 */
export class I18nManager {
    constructor() {
        this.translations = {};
        this.fallbackLang = 'en';
        this.supportedLanguages = ['ko', 'en', 'ja'];
        this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        this.isInitialized = false;
        this.loadingPromise = null;
        this.currentLang = this.detectLanguage();
    }

    /**
     * Initialize the i18n system
     */
    async init() {
        if (this.isInitialized) return;
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = this.loadTranslations(this.currentLang);
        await this.loadingPromise;
        
        this.applyLanguageDirection();
        this.isInitialized = true;
        this.loadingPromise = null;
    }

    /**
     * Detect user's preferred language
     */
    detectLanguage() {
        // Check localStorage first
        const savedLang = localStorage.getItem('flux-game-language');
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            return savedLang;
        }

        // Check browser language
        const browserLang = navigator.language || navigator.userLanguage || 'en';
        const langCode = browserLang.split('-')[0].toLowerCase();

        if (this.supportedLanguages.includes(langCode)) {
            return langCode;
        }

        // Default to English
        return 'en';
    }

    /**
     * Load translations for a specific language
     */
    async loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang} translations`);
            }
            
            this.translations[lang] = await response.json();
            
            // Load fallback language if different
            if (lang !== this.fallbackLang && !this.translations[this.fallbackLang]) {
                const fallbackResponse = await fetch(`/locales/${this.fallbackLang}.json`);
                if (fallbackResponse.ok) {
                    this.translations[this.fallbackLang] = await fallbackResponse.json();
                }
            }
        } catch (error) {
            console.error(`Error loading translations for ${lang}:`, error);
            
            // Try to load fallback language
            if (lang !== this.fallbackLang) {
                this.currentLang = this.fallbackLang;
                await this.loadTranslations(this.fallbackLang);
            }
        }
    }

    /**
     * Get translated text
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        // Navigate through nested keys
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                // Try fallback language
                value = this.translations[this.fallbackLang];
                for (const fk of keys) {
                    if (value && value[fk]) {
                        value = value[fk];
                    } else {
                        // Return key if translation not found
                        return key;
                    }
                }
                break;
            }
        }

        // Replace parameters
        if (typeof value === 'string') {
            return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param] !== undefined ? params[param] : match;
            });
        }

        return value;
    }

    /**
     * Change language
     */
    async changeLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.error(`Language ${lang} is not supported`);
            return;
        }

        this.currentLang = lang;
        localStorage.setItem('flux-game-language', lang);

        if (!this.translations[lang]) {
            await this.loadTranslations(lang);
        }

        this.applyLanguageDirection();
        this.updatePageTranslations();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    /**
     * Apply RTL/LTR direction based on language
     */
    applyLanguageDirection() {
        const isRTL = this.rtlLanguages.includes(this.currentLang);
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLang;
        
        // Add/remove RTL class for additional styling
        if (isRTL) {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    }

    /**
     * Update all translations on the current page
     */
    updatePageTranslations() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Handle placeholders
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // Update elements with data-i18n-title attribute (for tooltips)
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Update elements with data-i18n-alt attribute (for images)
        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const key = element.getAttribute('data-i18n-alt');
            element.alt = this.t(key);
        });

        // Update document title if it has data attribute
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Check if language is RTL
     */
    isRTL() {
        return this.rtlLanguages.includes(this.currentLang);
    }

    /**
     * Format number based on locale
     */
    formatNumber(number, options = {}) {
        return new Intl.NumberFormat(this.currentLang, options).format(number);
    }

    /**
     * Format date based on locale
     */
    formatDate(date, options = {}) {
        return new Intl.DateTimeFormat(this.currentLang, options).format(date);
    }

    /**
     * Format currency based on locale
     */
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat(this.currentLang, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
}

// Create singleton instance
const i18n = new I18nManager();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}

export default i18n;