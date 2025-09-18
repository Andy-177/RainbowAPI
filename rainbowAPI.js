// 支持窗口大小管理、单个窗口专属主题和独立标题颜色控制的窗口系统API
(function(window, document) {
    if (window.rainbowAPI) {
        console.warn('rainbowAPI 已加载');
        return;
    }

    // 解析尺寸字符串 "aaa*bbb" 为 {width, height} 对象
    function parseSize(sizeStr) {
        if (!sizeStr || typeof sizeStr !== 'string') return null;
        const parts = sizeStr.split('*');
        if (parts.length !== 2) return null;
        
        const width = parseInt(parts[0], 10);
        const height = parseInt(parts[1], 10);
        
        return (isNaN(width) || isNaN(height)) ? null : { width, height };
    }

    // 颜色处理工具：生成基于主色的衍生色
    const ColorUtils = {
        // 解析颜色为RGB数组
        parseColor: function(color) {
            if (!color || typeof color !== 'string') return [156, 39, 176]; // 默认紫色
            
            // 处理十六进制颜色
            if (color.startsWith('#')) {
                const hex = color.slice(1);
                const bigint = parseInt(hex, 16);
                return [
                    (bigint >> 16) & 255,
                    (bigint >> 8) & 255,
                    bigint & 255
                ];
            }
            
            // 简单处理rgb颜色
            if (color.startsWith('rgb')) {
                const rgb = color.match(/\d+/g);
                return rgb ? rgb.map(Number) : [156, 39, 176];
            }
            
            return [156, 39, 176]; // 默认紫色
        },
        
        // 调整颜色亮度
        adjustLightness: function(rgb, percent) {
            return rgb.map(component => {
                let adjusted = component + (255 * percent);
                return Math.max(0, Math.min(255, adjusted));
            });
        },
        
        // RGB数组转十六进制
        rgbToHex: function(rgb) {
            return '#' + rgb.map(component => {
                const hex = component.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        },
        
        // 基于主色生成完整主题 - 标题默认白色
        generateThemeFromColor: function(baseColor) {
            const rgb = this.parseColor(baseColor);
            
            // 生成不同亮度的衍生色
            const darker = this.adjustLightness(rgb, -0.2); // 暗20%
            const darkest = this.adjustLightness(rgb, -0.35); // 暗35%
            const lighter = this.adjustLightness(rgb, 0.3); // 亮30%
            const border = this.adjustLightness(rgb, 0.6); // 亮60%
            
            return {
                borderColor: this.rgbToHex(border),
                headerBg: this.rgbToHex(rgb),
                headerText: 'white', // 固定标题为白色
                buttonBg: this.rgbToHex(darker),
                buttonHover: this.rgbToHex(darkest),
                contentBg: '#ffffff', // 固定内容区域为白色
                contentText: '#333333', // 固定内容文字为深灰色
                resizerColor: this.rgbToHex(rgb)
            };
        }
    };

    // 注入基础样式
    function injectBaseStyles() {
        const style = document.createElement('style');
        style.id = 'rainbow-api-base-styles';
        style.textContent = `
            .winbox {
                position: absolute;
                width: 500px;
                height: 400px;
                overflow: hidden;
                z-index: 1000;
                display: none;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border: 1px solid #e0e0e0;
            }
            .winbox-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                cursor: move;
                user-select: none;
                background-color: #9c27b0;
            }
            .winbox-header .title {
                font-weight: bold;
                color: white; /* 默认标题颜色为白色 */
            }
            .winbox-header .controls {
                display: flex;
            }
            .winbox-header .controls button {
                border: none;
                font-size: 14px;
                cursor: pointer;
                width: 24px;
                height: 24px;
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
                background: #7b1fa2;
                color: white;
            }
            .winbox-header .controls button:hover {
                background: #6a1b88;
            }
            .winbox-content {
                padding: 15px;
                box-sizing: border-box;
                overflow: auto;
                height: calc(100% - 40px);
                background-color: white;
                color: #333;
            }
            .resizer {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 10px;
                height: 10px;
                cursor: se-resize;
                background-color: #9c27b0;
            }
            .resizer.disabled {
                cursor: default;
                background-color: #ccc;
            }
        `;
        document.head.appendChild(style);
    }

    // 窗口系统核心类
    class RainbowAPI {
        constructor() {
            this.winboxes = [];
            this.winboxCounter = 0;
            this.windowThemes = {}; // 存储全局注册的主题
            this.windowSettings = {}; // 存储每个窗口的设置
            this.initialize();
        }

        initialize() {
            injectBaseStyles();
        }

        // 为特定窗口类型注册全局主题 - 标题默认白色
        registerWindowTheme(themeId, theme) {
            this.windowThemes[themeId] = {
                borderColor: theme.borderColor || '#e0e0e0',
                headerBg: theme.headerBg || '#9c27b0',
                headerText: theme.headerText || 'white', // 默认标题白色
                buttonBg: theme.buttonBg || '#7b1fa2',
                buttonHover: theme.buttonHover || '#6a1b88',
                contentBg: '#ffffff', // 强制内容区域为白色
                contentText: '#333333', // 强制内容文字为深灰色
                resizerColor: theme.resizerColor || '#9c27b0'
            };
        }

        // 获取已注册的主题
        getRegisteredTheme(themeId) {
            return this.windowThemes[themeId] ? {...this.windowThemes[themeId]} : null;
        }

        // 创建窗口 - 支持大小设置、主题和直接标题颜色定义
        createWindow(windowName, x, y, options = {}) {
            // 处理参数兼容
            let themeConfig = {};
            let sizeOptions = {};
            let baseColor = null;
            let headerColor = null; // 标题颜色
            
            if (typeof options === 'string' || (options && !options.theme && !options.initialSize && !options.baseColor)) {
                // 兼容旧版：第四个参数是主题ID或主题对象
                themeConfig = options;
            } else {
                // 新版：使用options对象
                themeConfig = options.theme || {};
                sizeOptions = {
                    initialSize: options.initialSize || '500*400',
                    minSize: options.minSize || '200*100',
                    maxSize: options.maxSize || null,
                    resizable: options.resizable !== undefined ? options.resizable : true
                };
                baseColor = options.baseColor || null;
                headerColor = options.headerColor || null; // 直接设置标题颜色
            }

            // 处理主题配置
            let theme;
            if (baseColor) {
                // 根据基础色生成完整主题 - 标题默认白色
                theme = ColorUtils.generateThemeFromColor(baseColor);
            } else if (typeof themeConfig === 'string') {
                // 使用全局注册的主题
                theme = this.getRegisteredTheme(themeConfig) || {};
            } else {
                // 使用直接提供的主题对象 - 强制标题默认白色
                theme = {
                    ...themeConfig,
                    headerText: themeConfig.headerText || 'white', // 确保标题默认白色
                    contentBg: '#ffffff',
                    contentText: '#333333'
                };
            }

            // 解析尺寸设置
            const initialSize = parseSize(sizeOptions.initialSize) || { width: 500, height: 400 };
            const minSize = parseSize(sizeOptions.minSize) || { width: 200, height: 100 };
            const maxSize = parseSize(sizeOptions.maxSize);

            const winboxId = `winbox-${this.winboxCounter++}`;
            const winbox = document.createElement('div');
            winbox.id = winboxId;
            winbox.className = `winbox winbox-${winboxId}`;
            winbox.style.display = 'none';
            // 设置初始大小
            winbox.style.width = `${initialSize.width}px`;
            winbox.style.height = `${initialSize.height}px`;

            // 存储窗口设置
            this.windowSettings[winboxId] = {
                minSize,
                maxSize,
                resizable: sizeOptions.resizable,
                baseColor: baseColor,
                headerColor: headerColor // 保存标题颜色设置
            };

            // 应用窗口主题，传入标题颜色
            this.applyWindowTheme(winboxId, theme, headerColor);

            winbox.innerHTML = `
                <div class="winbox-header">
                    <div class="title">${windowName}</div>
                    <div class="controls">
                        <button onclick="rainbowAPI.closeWindow('${winboxId}')">×</button>
                    </div>
                </div>
                <div class="winbox-content">
                    <div class="output" id="${winboxId}-output"></div>
                </div>
                <div class="resizer ${!sizeOptions.resizable ? 'disabled' : ''}"></div>
            `;

            document.body.appendChild(winbox);
            this.winboxes.push(winbox);

            const outputDiv = document.getElementById(`${winboxId}-output`);
            this.makeDraggable(winbox);
            this.makeResizable(winbox);
            this.toggleWindow(winboxId, x, y);

            const winboxObj = {
                id: winboxId,
                element: winbox,
                content: outputDiv,
                setContent: (content) => { outputDiv.innerHTML = content; },
                appendContent: (content) => { outputDiv.innerHTML += content; },
                setStyle: (styles) => {
                    Object.keys(styles).forEach(key => {
                        winbox.style[key] = styles[key];
                    });
                },
                // 应用已注册的全局主题
                applyRegisteredTheme: (themeId) => {
                    const theme = this.getRegisteredTheme(themeId);
                    if (theme) {
                        // 应用主题时保持当前标题颜色设置
                        const currentHeaderColor = this.windowSettings[winboxId].headerColor;
                        this.applyWindowTheme(winboxId, theme, currentHeaderColor);
                        // 清除基础色设置
                        this.windowSettings[winboxId].baseColor = null;
                    }
                },
                // 更新主题
                updateTheme: (newTheme) => {
                    // 强制标题默认白色
                    const themeWithWhiteHeader = {
                        ...newTheme,
                        headerText: newTheme.headerText || 'white',
                        contentBg: '#ffffff',
                        contentText: '#333333'
                    };
                    
                    const currentHeaderColor = this.windowSettings[winboxId].headerColor;
                    this.applyWindowTheme(winboxId, themeWithWhiteHeader, currentHeaderColor);
                    // 清除基础色设置
                    this.windowSettings[winboxId].baseColor = null;
                },
                // 设置窗口专属基础色（会自动生成完整主题）
                setBaseColor: (color) => {
                    const theme = ColorUtils.generateThemeFromColor(color);
                    const currentHeaderColor = this.windowSettings[winboxId].headerColor;
                    this.applyWindowTheme(winboxId, theme, currentHeaderColor);
                    this.windowSettings[winboxId].baseColor = color;
                },
                // 直接设置标题颜色
                setHeaderColor: (color) => {
                    // 直接更新标题元素的样式，不影响其他主题设置
                    const headerTitle = winbox.querySelector('.winbox-header .title');
                    if (headerTitle) {
                        headerTitle.style.color = color;
                        // 更新存储的标题颜色设置
                        this.windowSettings[winboxId].headerColor = color;
                    }
                },
                // 设置窗口大小
                setSize: (size) => {
                    let sizeObj = size;
                    if (typeof size === 'string') {
                        sizeObj = parseSize(size);
                    }
                    if (sizeObj && sizeObj.width && sizeObj.height) {
                        const settings = this.windowSettings[winboxId];
                        let newWidth = sizeObj.width;
                        let newHeight = sizeObj.height;

                        // 应用大小限制
                        if (settings.minSize) {
                            newWidth = Math.max(newWidth, settings.minSize.width);
                            newHeight = Math.max(newHeight, settings.minSize.height);
                        }
                        if (settings.maxSize) {
                            newWidth = Math.min(newWidth, settings.maxSize.width);
                            newHeight = Math.min(newHeight, settings.maxSize.height);
                        }

                        winbox.style.width = `${newWidth}px`;
                        winbox.style.height = `${newHeight}px`;
                    }
                },
                // 更新大小限制
                updateSizeConstraints: (constraints) => {
                    if (!constraints) return;
                    
                    const settings = this.windowSettings[winboxId];
                    if (constraints.minSize) {
                        const min = parseSize(constraints.minSize);
                        if (min) settings.minSize = min;
                    }
                    if (constraints.maxSize) {
                        const max = parseSize(constraints.maxSize);
                        if (max) settings.maxSize = max;
                    }
                    if (constraints.resizable !== undefined) {
                        settings.resizable = constraints.resizable;
                        const resizer = winbox.querySelector('.resizer');
                        if (resizer) {
                            if (constraints.resizable) {
                                resizer.classList.remove('disabled');
                            } else {
                                resizer.classList.add('disabled');
                            }
                        }
                    }
                    
                    // 确保当前大小符合新限制
                    this.enforceSizeConstraints(winboxId);
                }
            };

            return winboxObj;
        }

        // 获取窗口当前主题
        getWindowTheme(winboxId) {
            const themeStyle = document.getElementById(`winbox-${winboxId}-theme`);
            if (!themeStyle) return {};
            
            // 从样式中提取当前主题信息
            const styleText = themeStyle.textContent;
            const theme = {};
            
            const headerBgMatch = styleText.match(/headerBg:\s*([^;]+)/);
            if (headerBgMatch) theme.headerBg = headerBgMatch[1];
            
            const headerTextMatch = styleText.match(/headerText:\s*([^;]+)/);
            if (headerTextMatch) theme.headerText = headerTextMatch[1];
            
            return theme;
        }

        // 确保窗口大小符合限制
        enforceSizeConstraints(winboxId) {
            const winbox = document.getElementById(winboxId);
            if (!winbox) return;
            
            const settings = this.windowSettings[winboxId];
            let width = winbox.offsetWidth;
            let height = winbox.offsetHeight;

            // 应用最小限制
            if (settings.minSize) {
                width = Math.max(width, settings.minSize.width);
                height = Math.max(height, settings.minSize.height);
            }

            // 应用最大限制
            if (settings.maxSize) {
                width = Math.min(width, settings.maxSize.width);
                height = Math.min(height, settings.maxSize.height);
            }

            // 应用调整后的大小
            if (width !== winbox.offsetWidth || height !== winbox.offsetHeight) {
                winbox.style.width = `${width}px`;
                winbox.style.height = `${height}px`;
            }
        }

        // 应用窗口主题 - 支持自定义标题颜色
        applyWindowTheme(winboxId, theme, customHeaderColor) {
            const finalTheme = {
                borderColor: theme.borderColor || '#e0e0e0',
                headerBg: theme.headerBg || '#9c27b0',
                headerText: theme.headerText || 'white', // 确保标题默认白色
                buttonBg: theme.buttonBg || '#7b1fa2',
                buttonHover: theme.buttonHover || '#6a1b88',
                contentBg: '#ffffff',
                contentText: '#333333',
                resizerColor: theme.resizerColor || '#9c27b0'
            };

            // 处理基础主题样式
            let themeStyle = document.getElementById(`winbox-${winboxId}-theme`);
            if (!themeStyle) {
                themeStyle = document.createElement('style');
                themeStyle.id = `winbox-${winboxId}-theme`;
                document.head.appendChild(themeStyle);
            }
            
            // 基础主题样式（不含标题颜色）
            themeStyle.textContent = `
                .winbox-${winboxId} {
                    border: 1px solid ${finalTheme.borderColor};
                }
                .winbox-${winboxId} .winbox-header {
                    background-color: ${finalTheme.headerBg};
                }
                .winbox-${winboxId} .winbox-header .controls button {
                    background: ${finalTheme.buttonBg};
                    color: ${finalTheme.headerText};
                }
                .winbox-${winboxId} .winbox-header .controls button:hover {
                    background: ${finalTheme.buttonHover};
                }
                .winbox-${winboxId} .winbox-content {
                    color: ${finalTheme.contentText};
                    background-color: ${finalTheme.contentBg};
                }
                .winbox-${winboxId} .resizer:not(.disabled) {
                    background-color: ${finalTheme.resizerColor};
                }
            `;
            
            // 单独处理标题颜色样式（使用ID选择器提高优先级）
            const titleStyleId = `winbox-${winboxId}-title-style`;
            let titleStyle = document.getElementById(titleStyleId);
            if (!titleStyle) {
                titleStyle = document.createElement('style');
                titleStyle.id = titleStyleId;
                document.head.appendChild(titleStyle);
            }
            
            // 应用标题颜色 - 自定义颜色优先
            titleStyle.textContent = `
                #${winboxId} .winbox-header .title {
                    color: ${customHeaderColor || finalTheme.headerText};
                    font-weight: bold;
                }
            `;
        }

        // 无边界限制的拖动实现
        makeDraggable(element) {
            let isDragging = false;
            let offsetX, offsetY;

            const header = element.querySelector('.winbox-header');
            header.addEventListener('mousedown', (event) => {
                isDragging = true;
                offsetX = event.clientX - element.getBoundingClientRect().left;
                offsetY = event.clientY - element.getBoundingClientRect().top;
                element.style.zIndex = "1001";
            });

            document.addEventListener('mousemove', (event) => {
                if (isDragging) {
                    const newX = event.clientX - offsetX;
                    const newY = event.clientY - offsetY;
                    element.style.left = `${newX}px`;
                    element.style.top = `${newY}px`;
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
                element.style.zIndex = "1000";
            });
        }

        // 支持大小限制的调整功能
        makeResizable(element) {
            const resizer = element.querySelector('.resizer');
            const winboxId = element.id;
            let isResizing = false;
            let startX, startY, startWidth, startHeight;

            // 如果不可拉伸，直接返回
            const settings = this.windowSettings[winboxId];
            if (!settings || !settings.resizable) return;

            resizer.addEventListener('mousedown', (event) => {
                // 检查是否可拉伸
                if (!settings.resizable || resizer.classList.contains('disabled')) return;
                
                isResizing = true;
                startX = event.clientX;
                startY = event.clientY;
                startWidth = element.offsetWidth;
                startHeight = element.offsetHeight;
                element.style.zIndex = "1001";
                event.preventDefault();
            });

            document.addEventListener('mousemove', (event) => {
                if (isResizing && settings.resizable && !resizer.classList.contains('disabled')) {
                    let newWidth = startWidth + (event.clientX - startX);
                    let newHeight = startHeight + (event.clientY - startY);

                    // 应用最小限制
                    if (settings.minSize) {
                        newWidth = Math.max(newWidth, settings.minSize.width);
                        newHeight = Math.max(newHeight, settings.minSize.height);
                    }

                    // 应用最大限制
                    if (settings.maxSize) {
                        newWidth = Math.min(newWidth, settings.maxSize.width);
                        newHeight = Math.min(newHeight, settings.maxSize.height);
                    }

                    element.style.width = `${newWidth}px`;
                    element.style.height = `${newHeight}px`;
                }
            });

            document.addEventListener('mouseup', () => {
                isResizing = false;
                element.style.zIndex = "1000";
            });
        }

        // 窗口显示/隐藏切换
        toggleWindow(winboxId, x, y) {
            const winbox = document.getElementById(winboxId);
            if (winbox.style.display === 'none' || winbox.style.display === '') {
                winbox.style.display = 'block';
                if (x !== undefined && y !== undefined) {
                    winbox.style.left = `${x}px`;
                    winbox.style.top = `${y}px`;
                } else {
                    // 默认居中显示
                    winbox.style.left = `${(window.innerWidth - winbox.offsetWidth) / 2}px`;
                    winbox.style.top = `${(window.innerHeight - winbox.offsetHeight) / 2}px`;
                }
            } else {
                winbox.style.display = 'none';
            }
        }

        // 关闭窗口
        closeWindow(winboxId) {
            const winbox = document.getElementById(winboxId);
            if (winbox) {
                // 移除窗口专属样式
                const themeStyle = document.getElementById(`winbox-${winboxId}-theme`);
                if (themeStyle) themeStyle.remove();
                
                const titleStyle = document.getElementById(`winbox-${winboxId}-title-style`);
                if (titleStyle) titleStyle.remove();
                
                winbox.remove();
                const index = this.winboxes.indexOf(winbox);
                if (index !== -1) this.winboxes.splice(index, 1);
                
                // 清理设置
                delete this.windowSettings[winboxId];
            }
        }
    }

    // 初始化并暴露API
    window.rainbowAPI = {
        instance: null,
        init: () => {
            if (!window.rainbowAPI.instance) {
                window.rainbowAPI.instance = new RainbowAPI();
            }
            return window.rainbowAPI.instance;
        },
        registerWindowTheme: (themeId, theme) => {
            if (window.rainbowAPI.instance) {
                window.rainbowAPI.instance.registerWindowTheme(themeId, theme);
            }
        },
        getRegisteredTheme: (themeId) => {
            if (window.rainbowAPI.instance) {
                return window.rainbowAPI.instance.getRegisteredTheme(themeId);
            }
            return null;
        },
        createWindow: (windowName, x, y, options) => {
            if (window.rainbowAPI.instance) {
                return window.rainbowAPI.instance.createWindow(windowName, x, y, options);
            }
            return null;
        },
        toggleWindow: (winboxId, x, y) => {
            if (window.rainbowAPI.instance) {
                window.rainbowAPI.instance.toggleWindow(winboxId, x, y);
            }
        },
        closeWindow: (winboxId) => {
            if (window.rainbowAPI.instance) {
                window.rainbowAPI.instance.closeWindow(winboxId);
            }
        }
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.rainbowAPI.init());
    } else {
        window.rainbowAPI.init();
    }
})(window, document)
    