// rainbow-window.js - 彩虹窗口管理库
class RainbowWindowManager {
    constructor() {
        this.windows = [];
        this.windowTypes = new Map();
        this.zIndex = 10;
    }

    /**
     * 初始化窗口样式（需在使用前调用）
     */
    initStyles() {
        // 检查样式是否已加载
        if (document.getElementById('rainbow-window-styles')) return;

        const style = document.createElement('style');
        style.id = 'rainbow-window-styles';
        style.textContent = `
            .window-container {
                position: absolute;
                border: 1px solid #ccc;
                background-color: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                min-width: 200px;
                min-height: 150px;
                display: flex;
                flex-direction: column;
                z-index: 10;
                overflow: hidden;
                transition: height 0.2s ease;
            }

            .window-container.minimized {
                height: 40px !important;
                min-height: auto;
            }

            .window-titlebar {
                color: white;
                padding: 8px 12px;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
                user-select: none;
                height: 24px;
            }

            .window-title {
                font-size: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .window-buttons {
                display: flex;
                gap: 5px;
            }

            .window-btn {
                width: 24px;
                height: 24px;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
                background: rgba(255,255,255,0.2);
                transition: background 0.2s;
            }

            .window-btn:hover {
                background: rgba(255,255,255,0.3);
            }

            .window-btn.close:hover {
                background: #ff5c5c;
            }

            .window-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: rgba(255,255,255,0.1);
            }

            .window-btn:disabled:hover {
                background: rgba(255,255,255,0.1);
            }

            .window-content {
                flex: 1;
                padding: 15px;
                overflow: auto;
            }

            .window-container.minimized .window-content,
            .window-container.minimized .resize-handle {
                display: none;
            }

            .window-content::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }

            .window-content::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }

            .window-content::-webkit-scrollbar-thumb {
                background: #bbb;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .window-content::-webkit-scrollbar-thumb:hover {
                background: #999;
            }

            .resize-handle {
                position: absolute;
                background: transparent;
            }

            .resize-handle.se {
                right: 0;
                bottom: 0;
                cursor: se-resize;
                width: 15px;
                height: 15px;
                z-index: 1;
            }

            .resize-handle.e {
                right: 0;
                top: 0;
                bottom: 0;
                width: 5px;
                cursor: e-resize;
            }

            .resize-handle.w {
                left: 0;
                top: 0;
                bottom: 0;
                width: 5px;
                cursor: w-resize;
            }

            .resize-handle.s {
                left: 0;
                right: 0;
                bottom: 0;
                height: 5px;
                cursor: s-resize;
            }

            .no-resize .resize-handle {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 注册窗口类型
     * @param {string} title - 窗口标题（唯一标识）
     * @param {Object} options - 窗口配置
     */
    registerWindowType(title, options) {
        if (!title || !options) return;
        
        const defaultOptions = {
            width: 400,
            height: 300,
            content: '',
            x: 100 + (this.windows.length * 30),
            y: 100 + (this.windows.length * 30),
            titleBarColor: '#888',
            resizable: true,
            allowMaximize: true,
            allowMinimize: true
        };

        this.windowTypes.set(title, {
            ...defaultOptions,
            ...options,
            title
        });
    }

    /**
     * 通过注册的类型创建窗口
     * @param {string} title - 已注册的窗口标题
     * @returns {Object|null} 窗口实例或null
     */
    createWindowByType(title) {
        if (!this.windowTypes.has(title)) {
            console.warn(`RainbowWindow: 未注册的窗口类型: ${title}`);
            return null;
        }

        const typeConfig = this.windowTypes.get(title);
        const offset = this.windows.length * 30;
        const newX = Math.min(100 + offset, window.innerWidth - typeConfig.width - 50);
        const newY = Math.min(100 + offset, window.innerHeight - typeConfig.height - 50);

        return this.createWindow({
            ...typeConfig,
            x: newX,
            y: newY
        });
    }

    /**
     * 创建自定义窗口
     * @param {Object} options - 窗口配置
     * @returns {Object} 窗口实例
     */
    createWindow(options) {
        const defaultOptions = {
            title: '新窗口',
            width: 400,
            height: 300,
            x: 100,
            y: 100,
            content: '',
            titleBarColor: '#888',
            resizable: true,
            allowMaximize: true,
            allowMinimize: true
        };

        const config = { ...defaultOptions, ...options };
        const windowId = `rainbow-window-${Date.now()}`;

        const windowElement = document.createElement('div');
        windowElement.id = windowId;
        windowElement.className = `window-container ${!config.resizable ? 'no-resize' : ''}`;
        windowElement.style.width = `${config.width}px`;
        windowElement.style.height = `${config.height}px`;
        windowElement.style.left = `${config.x}px`;
        windowElement.style.top = `${config.y}px`;
        windowElement.style.zIndex = this.zIndex++;

        // 构建窗口按钮
        const buttonsHTML = [];
        if (config.allowMinimize) {
            buttonsHTML.push('<button class="window-btn minimize" title="最小化">-</button>');
        }
        if (config.allowMaximize) {
            buttonsHTML.push('<button class="window-btn maximize" title="最大化">□</button>');
        }
        buttonsHTML.push('<button class="window-btn close" title="关闭">×</button>');

        windowElement.innerHTML = `
            <div class="window-titlebar" style="background-color: ${config.titleBarColor}">
                <div class="window-title">${config.title}</div>
                <div class="window-buttons">
                    ${buttonsHTML.join('')}
                </div>
            </div>
            <div class="window-content">${config.content}</div>
            <div class="resize-handle se"></div>
            <div class="resize-handle e"></div>
            <div class="resize-handle w"></div>
            <div class="resize-handle s"></div>
        `;

        document.body.appendChild(windowElement);

        const windowInstance = {
            id: windowId,
            element: windowElement,
            title: config.title,
            config: { ...config },
            isMaximized: false,
            isMinimized: false,
            originalSize: {
                width: config.width,
                height: config.height,
                x: config.x,
                y: config.y
            }
        };

        this.windows.push(windowInstance);
        this.setupWindowEvents(windowInstance);

        return windowInstance;
    }

    /**
     * 设置窗口属性
     * @param {Object} windowInstance - 窗口实例
     * @param {Object} options - 要更新的属性
     */
    setWindowProperties(windowInstance, options) {
        if (!windowInstance || !options) return;
        
        const { element } = windowInstance;
        
        // 更新配置
        windowInstance.config = { ...windowInstance.config, ...options };
        
        // 更新标题
        if (options.title !== undefined) {
            windowInstance.title = options.title;
            element.querySelector('.window-title').textContent = options.title;
        }
        
        // 更新标题栏颜色
        if (options.titleBarColor !== undefined) {
            element.querySelector('.window-titlebar').style.backgroundColor = options.titleBarColor;
        }
        
        // 更新是否可调整大小
        if (options.resizable !== undefined) {
            if (options.resizable) {
                element.classList.remove('no-resize');
            } else {
                element.classList.add('no-resize');
            }
        }
        
        // 更新按钮状态
        const minimizeBtn = element.querySelector('.window-btn.minimize');
        const maximizeBtn = element.querySelector('.window-btn.maximize');
        
        if (options.allowMinimize !== undefined && minimizeBtn) {
            minimizeBtn.disabled = !options.allowMinimize;
        }
        
        if (options.allowMaximize !== undefined && maximizeBtn) {
            maximizeBtn.disabled = !options.allowMaximize;
        }
    }

    /**
     * 为窗口设置事件监听
     * @param {Object} windowInstance - 窗口实例
     */
    setupWindowEvents(windowInstance) {
        const { element, config } = windowInstance;
        const titlebar = element.querySelector('.window-titlebar');
        const closeBtn = element.querySelector('.window-btn.close');
        const maximizeBtn = element.querySelector('.window-btn.maximize');
        const minimizeBtn = element.querySelector('.window-btn.minimize');
        const seHandle = element.querySelector('.resize-handle.se');
        const eHandle = element.querySelector('.resize-handle.e');
        const wHandle = element.querySelector('.resize-handle.w');
        const sHandle = element.querySelector('.resize-handle.s');

        // 拖动功能
        let isDragging = false;
        let offsetX, offsetY;

        titlebar.addEventListener('mousedown', (e) => {
            this.bringToFront(windowInstance);
            isDragging = true;
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            element.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || windowInstance.isMaximized) return;

            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;
            
            element.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            element.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = '';
                if (!windowInstance.isMaximized) {
                    windowInstance.originalSize.x = parseInt(element.style.left);
                    windowInstance.originalSize.y = parseInt(element.style.top);
                }
            }
        });

        // 关闭窗口
        closeBtn.addEventListener('click', () => {
            element.remove();
            this.windows = this.windows.filter(w => w.id !== windowInstance.id);
        });

        // 最大化/还原窗口
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                if (windowInstance.isMinimized) {
                    this.restoreWindow(windowInstance);
                }

                if (windowInstance.isMaximized) {
                    element.style.width = `${windowInstance.originalSize.width}px`;
                    element.style.height = `${windowInstance.originalSize.height}px`;
                    element.style.left = `${windowInstance.originalSize.x}px`;
                    element.style.top = `${windowInstance.originalSize.y}px`;
                    maximizeBtn.textContent = '□';
                    windowInstance.isMaximized = false;
                } else {
                    windowInstance.originalSize.width = element.offsetWidth;
                    windowInstance.originalSize.height = element.offsetHeight;
                    windowInstance.originalSize.x = parseInt(element.style.left);
                    windowInstance.originalSize.y = parseInt(element.style.top);
                    
                    element.style.width = `${window.innerWidth - 40}px`;
                    element.style.height = `${window.innerHeight - 40}px`;
                    element.style.left = '20px';
                    element.style.top = '20px';
                    maximizeBtn.textContent = '▢';
                    windowInstance.isMaximized = true;
                }
            });
        }

        // 最小化/恢复窗口
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                if (windowInstance.isMinimized) {
                    this.restoreWindow(windowInstance);
                } else {
                    windowInstance.isMinimized = true;
                    windowInstance.originalSize.height = element.offsetHeight;
                    element.classList.add('minimized');
                    minimizeBtn.textContent = '+';
                }
            });
        }

        // 调整大小功能
        let isResizing = false;
        let startPos = null;
        let startSize = null;
        let startLeft = null;

        // 右下角调整
        if (seHandle) {
            seHandle.addEventListener('mousedown', (e) => {
                if (!config.resizable || windowInstance.isMinimized) return;
                
                this.bringToFront(windowInstance);
                isResizing = 'se';
                const rect = element.getBoundingClientRect();
                startPos = { x: e.clientX, y: e.clientY };
                startSize = { width: rect.width, height: rect.height };
                element.style.transition = 'none';
                document.body.style.userSelect = 'none';
                e.preventDefault();
                e.stopPropagation();
            });
        }

        // 右侧调整
        if (eHandle) {
            eHandle.addEventListener('mousedown', (e) => {
                if (!config.resizable || windowInstance.isMinimized) return;
                
                this.bringToFront(windowInstance);
                isResizing = 'e';
                const rect = element.getBoundingClientRect();
                startPos = { x: e.clientX };
                startSize = { width: rect.width };
                element.style.transition = 'none';
                document.body.style.userSelect = 'none';
                e.preventDefault();
                e.stopPropagation();
            });
        }

        // 左侧调整
        if (wHandle) {
            wHandle.addEventListener('mousedown', (e) => {
                if (!config.resizable || windowInstance.isMinimized) return;
                
                this.bringToFront(windowInstance);
                isResizing = 'w';
                const rect = element.getBoundingClientRect();
                startPos = { x: e.clientX };
                startSize = { width: rect.width };
                startLeft = rect.left;
                element.style.transition = 'none';
                document.body.style.userSelect = 'none';
                e.preventDefault();
                e.stopPropagation();
            });
        }

        // 底部调整
        if (sHandle) {
            sHandle.addEventListener('mousedown', (e) => {
                if (!config.resizable || windowInstance.isMinimized) return;
                
                this.bringToFront(windowInstance);
                isResizing = 's';
                const rect = element.getBoundingClientRect();
                startPos = { y: e.clientY };
                startSize = { height: rect.height };
                element.style.transition = 'none';
                document.body.style.userSelect = 'none';
                e.preventDefault();
                e.stopPropagation();
            });
        }

        // 处理调整大小的鼠标移动
        document.addEventListener('mousemove', (e) => {
            if (!isResizing || !config.resizable || windowInstance.isMaximized || windowInstance.isMinimized) return;

            if (isResizing === 'se') {
                const deltaX = e.clientX - startPos.x;
                const deltaY = e.clientY - startPos.y;
                
                let newWidth = startSize.width + deltaX;
                let newHeight = startSize.height + deltaY;
                
                newWidth = Math.max(200, newWidth);
                newHeight = Math.max(150, newHeight);
                
                element.style.width = `${newWidth}px`;
                element.style.height = `${newHeight}px`;
            } 
            else if (isResizing === 'e') {
                const deltaX = e.clientX - startPos.x;
                let newWidth = startSize.width + deltaX;
                newWidth = Math.max(200, newWidth);
                element.style.width = `${newWidth}px`;
            } 
            else if (isResizing === 'w') {
                const deltaX = startPos.x - e.clientX;
                let newWidth = startSize.width + deltaX;
                newWidth = Math.max(200, newWidth);
                
                const newLeft = startLeft - (newWidth - startSize.width);
                
                if (newLeft >= 0) {
                    element.style.width = `${newWidth}px`;
                    element.style.left = `${newLeft}px`;
                }
            }
            else if (isResizing === 's') {
                const deltaY = e.clientY - startPos.y;
                let newHeight = startSize.height + deltaY;
                newHeight = Math.max(150, newHeight);
                element.style.height = `${newHeight}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                startPos = null;
                startSize = null;
                startLeft = null;
                element.style.transition = 'height 0.2s ease';
                document.body.style.userSelect = '';
                
                windowInstance.originalSize.width = element.offsetWidth;
                windowInstance.originalSize.height = element.offsetHeight;
                windowInstance.originalSize.x = parseInt(element.style.left);
            }
        });

        // 点击窗口置顶
        element.addEventListener('mousedown', () => {
            this.bringToFront(windowInstance);
        });
    }

    /**
     * 恢复窗口（从最小化状态）
     * @param {Object} windowInstance - 窗口实例
     */
    restoreWindow(windowInstance) {
        const { element } = windowInstance;
        const minimizeBtn = element.querySelector('.window-btn.minimize');
        
        windowInstance.isMinimized = false;
        element.classList.remove('minimized');
        element.style.height = `${windowInstance.originalSize.height}px`;
        if (minimizeBtn) {
            minimizeBtn.textContent = '-';
        }
    }

    /**
     * 将窗口置于顶层
     * @param {Object} windowInstance - 窗口实例
     */
    bringToFront(windowInstance) {
        this.zIndex++;
        windowInstance.element.style.zIndex = this.zIndex;
    }

    /**
     * 根据标题获取窗口实例
     * @param {string} title - 窗口标题
     * @returns {Object|null} 窗口实例
     */
    getWindowByTitle(title) {
        return this.windows.find(w => w.title === title) || null;
    }
}

// 创建默认实例
const rainbowAPI = new RainbowWindowManager();

// 导出模块（支持模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RainbowWindowManager, rainbowAPI };
}
