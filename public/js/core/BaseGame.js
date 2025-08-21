export class BaseGame {
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.container = null;
        this.isRunning = false;
        this.isActive = false;
    }

    mount(container) {
        this.container = container;
        this.isActive = true;
        this.init();
        this.render();
    }

    unmount() {
        this.isActive = false;
        this.cleanup();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    init() {
        throw new Error('init() method must be implemented');
    }

    render() {
        throw new Error('render() method must be implemented');
    }

    cleanup() {
        // Override if needed
    }

    start() {
        this.isRunning = true;
    }

    stop() {
        this.isRunning = false;
    }

    createElement(tag, className, innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    createButton(text, className, onClick) {
        const button = this.createElement('button', className, text);
        button.addEventListener('click', onClick);
        return button;
    }
}