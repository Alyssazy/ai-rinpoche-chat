class AIRinpocheChat {
    constructor() {
        this.apiKey = 'app-vanuZhHLhFmXqz5kG8guNOb7';
        this.apiBase = 'https://api.dify.ai/v1';
        this.conversationId = null;
        this.isLoading = false;
        this.lastUserMessage = null; // 保存最后一条用户消息，用于重新生成
        
        // 新增：请求控制和优化
        this.currentRequest = null;
        this.requestTimeout = 30000; // 30秒超时
        this.loadingInterval = null;
        this.longWaitTimeout = null;
        
        // 🚀 流式响应支持检测
        this.streamingSupported = null;
        this.fallbackMode = false;

        // 📱 智能设备适配系统
        this.initializeDeviceDetection();
        this.initializeElements();
        this.setupMobileSidebar();
        this.bindEvents();
        this.initializeTheme();
        this.clearInvalidConversation();
        this.initializeMarkdown();
        this.loadConversationHistory();
        this.conversations = this.loadConversations();
        this.updateConversationsList();
    }

    // 📱 智能设备检测和适配系统
    initializeDeviceDetection() {
        const userAgent = navigator.userAgent;
        const body = document.body;
        
        // 详细的设备和系统检测
        const deviceInfo = {
            isIOS: /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream,
            isAndroid: /Android/.test(userAgent),
            isHarmonyOS: /HarmonyOS/.test(userAgent) || /HUAWEI/.test(userAgent),
            isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
            isChrome: /Chrome/.test(userAgent),
            isWebKit: /WebKit/.test(userAgent),
            isMobile: /Mobi|Android/i.test(userAgent)
        };
        
        // 存储设备信息供其他方法使用
        this.deviceInfo = deviceInfo;
        
        // 根据设备类型添加CSS类名，实现差异化渲染
        if (deviceInfo.isIOS) {
            body.classList.add('device-ios', 'render-full');
            console.log('🍎 检测到iOS设备，启用完整UI效果');
        } else if (deviceInfo.isHarmonyOS) {
            body.classList.add('device-harmonyos', 'render-optimized');
            console.log('🔥 检测到鸿蒙系统，启用精细优化模式（保持视觉效果，消除闪屏）');
        } else if (deviceInfo.isAndroid) {
            body.classList.add('device-android', 'render-optimized');
            console.log('🤖 检测到Android系统，启用优化渲染模式');
        } else {
            body.classList.add('device-other', 'render-standard');
            console.log('💻 检测到其他设备，启用标准渲染模式');
        }
        
        // 渲染引擎检测
        if (deviceInfo.isSafari) {
            body.classList.add('engine-safari');
        } else if (deviceInfo.isChrome) {
            body.classList.add('engine-chrome');
        } else {
            body.classList.add('engine-other');
        }
        
        // 移动端检测
        if (deviceInfo.isMobile) {
            body.classList.add('is-mobile');
        }
        
        // 输出设备信息供调试
        console.log('📱 设备检测结果:', deviceInfo);
        
        // 性能监控（鸿蒙系统更敏感的监控）
        this.setupPerformanceMonitoring();
        
        // 🔥 鸿蒙系统专用滚动优化
        if (deviceInfo.isHarmonyOS) {
            this.setupHarmonyScrollOptimization();
            this.setupHarmonyMessageOptimization();
        }
    }
    
    // 性能监控系统
    setupPerformanceMonitoring() {
        // 监控帧率，检测是否出现卡顿
        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 60;
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
                
                // 鸿蒙系统更严格的性能监控
                if (this.deviceInfo.isHarmonyOS && fps < 40) {
                    document.body.classList.add('low-performance');
                    console.warn('🔥 鸿蒙系统检测到轻微卡顿，启用极简模式确保流畅');
                } else if (!this.deviceInfo.isHarmonyOS && fps < 25 && !this.deviceInfo.isIOS) {
                    document.body.classList.add('low-performance');
                    console.warn('⚠️ 检测到性能问题，自动启用低功耗模式');
                } else if (fps >= 50) {
                    document.body.classList.remove('low-performance');
                }
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        // 延迟启动性能监控，避免初始化时的性能波动
        setTimeout(() => {
            requestAnimationFrame(measureFPS);
        }, 2000);
    }
    
    // 🔥 鸿蒙系统专用滚动优化系统
    setupHarmonyScrollOptimization() {
        let scrollTimer = null;
        let isScrolling = false;
        const body = document.body;
        
        console.log('🔥 启用鸿蒙系统滚动优化');
        
        // 滚动开始时暂停动画
        const pauseAnimations = () => {
            if (!isScrolling) {
                isScrolling = true;
                body.classList.add('scrolling-harmony');
                console.log('📜 滚动开始，暂停背景动画');
            }
        };
        
        // 滚动结束后恢复动画
        const resumeAnimations = () => {
            if (isScrolling) {
                isScrolling = false;
                body.classList.remove('scrolling-harmony');
                console.log('📜 滚动结束，恢复背景动画');
            }
        };
        
        // 滚动事件监听（使用passive优化性能）
        const handleScroll = () => {
            pauseAnimations();
            
            // 清除之前的定时器
            if (scrollTimer) {
                clearTimeout(scrollTimer);
            }
            
            // 设置滚动结束检测（100ms后认为滚动结束）
            scrollTimer = setTimeout(resumeAnimations, 100);
        };
        
        // 添加滚动监听，使用passive提升性能
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // 触摸滚动优化（移动端特有）
        let touchStartY = 0;
        let isTouching = false;
        
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            isTouching = true;
        }, { passive: true });
        
        window.addEventListener('touchmove', (e) => {
            if (isTouching) {
                const touchY = e.touches[0].clientY;
                const deltaY = Math.abs(touchY - touchStartY);
                
                // 检测到滚动手势
                if (deltaY > 10) {
                    pauseAnimations();
                }
            }
        }, { passive: true });
        
        window.addEventListener('touchend', () => {
            isTouching = false;
            // 延迟恢复动画，确保滚动完全结束
            if (scrollTimer) {
                clearTimeout(scrollTimer);
            }
            scrollTimer = setTimeout(resumeAnimations, 150);
        }, { passive: true });
        
        // 页面可见性变化时的优化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                body.classList.add('page-hidden');
                console.log('📱 页面隐藏，暂停所有动画');
            } else {
                body.classList.remove('page-hidden');
                console.log('📱 页面显示，恢复动画');
            }
        });
    }
    
    // 🔥 鸿蒙系统消息渲染优化
    setupHarmonyMessageOptimization() {
        console.log('🔥 启用鸿蒙系统消息优化');
        
        // 延迟渲染观察器，减少滚动时的重绘
        const messageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const message = entry.target;
                if (entry.isIntersecting) {
                    // 消息可见时启用完整渲染
                    message.classList.remove('message-hidden');
                } else {
                    // 消息不可见时简化渲染
                    message.classList.add('message-hidden');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px 0px'
        });
        
        // 监听所有消息
        const observeMessages = () => {
            const messages = document.querySelectorAll('.message');
            messages.forEach(message => {
                messageObserver.observe(message);
            });
        };
        
        // 初始化观察
        setTimeout(observeMessages, 1000);
        
        // 监听新消息添加
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            const mutationObserver = new MutationObserver(() => {
                setTimeout(observeMessages, 100);
            });
            
            mutationObserver.observe(chatMessages, {
                childList: true,
                subtree: true
            });
        }
        
        // 预渲染优化：限制同时渲染的消息数量
        this.setupMessageVirtualization();
    }
    
    // 消息虚拟化 - 只渲染可见区域的消息
    setupMessageVirtualization() {
        let renderingMessages = new Set();
        const MAX_RENDERED_MESSAGES = 20; // 最大同时渲染消息数
        
        const optimizeMessageRendering = () => {
            const messages = document.querySelectorAll('.message');
            const visibleMessages = [];
            
            messages.forEach(message => {
                const rect = message.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight + 100 && rect.bottom > -100;
                
                if (isVisible) {
                    visibleMessages.push(message);
                }
            });
            
            // 限制渲染数量
            if (visibleMessages.length > MAX_RENDERED_MESSAGES) {
                visibleMessages.slice(MAX_RENDERED_MESSAGES).forEach(message => {
                    message.style.visibility = 'hidden';
                });
            }
        };
        
        // 滚动时触发优化
        let optimizeTimer;
        window.addEventListener('scroll', () => {
            if (optimizeTimer) clearTimeout(optimizeTimer);
            optimizeTimer = setTimeout(optimizeMessageRendering, 50);
        }, { passive: true });
    }

    initializeElements() {
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.chatLoading = document.getElementById('chatLoading');
        this.themeToggle = document.getElementById('themeToggle');
        this.quickButtons = document.querySelectorAll('.quick-btn');
        
        // 侧边栏元素
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
        this.backupCloseBtn = document.getElementById('backupCloseBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.conversationsList = document.getElementById('conversationsList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    }

    bindEvents() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.chatInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
            this.updateSendButtonState();
        });

        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        this.quickButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 防止在加载时点击
                if (this.isLoading) {
                    return;
                }
                const question = btn.getAttribute('data-question');
                this.chatInput.value = question;
                this.sendMessage();
            });
        });

        // 侧边栏事件绑定
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
        // 🔥 HarmonyOS特殊优化：多种事件绑定确保响应
        if (this.sidebarCloseBtn) {
            this.sidebarCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔥 关闭按钮被点击 - HarmonyOS优化');
                this.closeSidebar();
            });
            
            // 添加触摸事件支持（HarmonyOS优化）
            this.sidebarCloseBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔥 关闭按钮触摸结束 - HarmonyOS优化');
                this.closeSidebar();
            });
        }
        
        // 🔥 备用关闭按钮事件绑定（HarmonyOS优化）
        if (this.backupCloseBtn) {
            this.backupCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔥 备用关闭按钮被点击 - HarmonyOS优化');
                this.closeSidebar();
            });
            
            this.backupCloseBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔥 备用关闭按钮触摸结束 - HarmonyOS优化');
                this.closeSidebar();
            });
        }
        
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.clearHistoryBtn.addEventListener('click', () => this.clearAllHistory());
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }

    clearInvalidConversation() {
        // 🔧 修复：只在明确需要时清理会话ID，保持多轮对话能力
        const shouldClear = sessionStorage.getItem('forceClearConversation');
        
        if (shouldClear) {
            console.log('🧹 检测到强制清理标志，清理会话ID');
            sessionStorage.removeItem('conversationId');
            sessionStorage.removeItem('chatHistory');
            sessionStorage.removeItem('forceClearConversation');
            this.conversationId = null;
        } else {
            // 恢复已保存的会话ID，支持多轮对话
            const savedConversationId = sessionStorage.getItem('conversationId');
            if (savedConversationId) {
                this.conversationId = savedConversationId;
                console.log('✅ 恢复会话ID以支持多轮对话:', savedConversationId);
            }
        }
    }

    initializeMarkdown() {
        if (typeof marked !== 'undefined') {
            // 配置marked选项
            marked.setOptions({
                highlight: function(code, lang) {
                    if (typeof hljs !== 'undefined') {
                        // 如果指定了语言且支持该语言
                        if (lang && hljs.getLanguage(lang)) {
                            try {
                                return hljs.highlight(code, { language: lang }).value;
                            } catch (err) {
                                console.warn('代码高亮失败:', err);
                            }
                        }
                        // 如果没有指定语言，尝试自动检测
                        if (!lang) {
                            try {
                                const result = hljs.highlightAuto(code);
                                return result.value;
                            } catch (err) {
                                console.warn('自动代码高亮失败:', err);
                            }
                        }
                    }
                    return code;
                },
                breaks: true, // 支持GitHub风格的换行
                gfm: true,    // GitHub风格的Markdown
                tables: true  // 启用表格支持
            });
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeIcon = this.themeToggle.querySelector('.theme-icon');
        themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }

    adjustTextareaHeight() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    }

    updateSendButtonState() {
        const hasText = this.chatInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isLoading;
        
        // 更新按钮文字和状态
        if (this.isLoading) {
            this.sendButton.title = '正在处理中，请稍候...';
        } else if (!hasText) {
            this.sendButton.title = '请输入消息';
        } else {
            this.sendButton.title = '发送消息（Enter）';
        }
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isLoading) return;
        
        // 问题长度优化提示
        if (message.length > 1000) {
            const confirmed = confirm('您的问题较长，可能需要更多时间处理。建议简化问题以获得更快响应。\n\n是否继续发送？');
            if (!confirmed) return;
        }

        // 保存用户消息用于重新生成
        this.lastUserMessage = message;
        
        this.showChatInterface();
        this.addMessage('user', message);
        this.chatInput.value = '';
        this.adjustTextareaHeight();
        this.setLoading(true);

        try {
            // 🚀 智能模式选择：优先流式，失败时自动降级
            if (this.fallbackMode) {
                // 已知不支持流式，直接使用传统模式
                console.log('📋 使用传统模式（已知API不支持流式）');
                this.setLoading(true);
                const response = await this.callDifyAPIBlocking(message);
                this.addMessage('ai', response);
            } else {
                // 尝试流式响应
                try {
                    console.log('🚀 尝试流式响应...');
                    await this.callDifyAPIStreaming(message);
                } catch (streamError) {
                    if (streamError.message.includes('streaming') || streamError.message.includes('event-stream')) {
                        // 流式不支持，切换到传统模式
                        console.warn('⚠️ 流式响应不支持，切换到传统模式');
                        this.fallbackMode = true;
                        this.setLoading(true);
                        const response = await this.callDifyAPIBlocking(message);
                        this.addMessage('ai', response);
                    } else {
                        throw streamError; // 其他错误继续抛出
                    }
                }
            }
        } catch (error) {
            console.error('API调用失败:', error);
            let errorMessage = '抱歉，我现在无法回应您的问题。';
            let debugInfo = '';
            
            if (error.message.includes('401')) {
                errorMessage = 'API密钥无效，请检查您的Dify API密钥配置。';
            } else if (error.message.includes('403')) {
                errorMessage = 'API访问被拒绝，请检查您的权限设置。';
            } else if (error.message.includes('429')) {
                errorMessage = 'API调用频率过高，请稍后再试。';
            } else if (error.message.includes('400')) {
                errorMessage = '请求参数错误。可能是会话ID无效，正在重置对话...'; 
                // 🔧 重置无效的conversation_id
                this.conversationId = null;
                sessionStorage.removeItem('conversationId');
                debugInfo = `\n\n🔧 检测到会话ID可能无效，已重置。请重新发送消息开始新对话。`;
            } else if (error.message.includes('404')) {
                // 🔧 404错误表示会话不存在，自动重试新会话
                console.log('🔄 404错误：会话不存在，自动重试新会话');
                this.conversationId = null;
                sessionStorage.removeItem('conversationId');
                
                // 自动重试一次，这次不传conversation_id
                try {
                    // 🔧 修复：默认优先使用流式模式重试
                    if (this.streamingSupported !== false) {
                        console.log('🔄 重试时使用流式模式');
                        await this.callDifyAPIStreaming(message);
                    } else {
                        console.log('🔄 重试时使用阻塞模式');
                        const response = await this.callDifyAPIBlocking(message);
                        this.addMessage('ai', response);
                    }
                    return; // 重试成功，直接返回
                } catch (retryError) {
                    console.error('重试失败:', retryError);
                    errorMessage = '会话已过期，重试新会话也失败了。请稍后再试。';
                }
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = '网络连接失败，请检查网络连接或CORS设置。';
            } else if (error.message.includes('请求超时')) {
                errorMessage = '响应时间过长，请稍后重试或尝试简化问题。提示：过长或复杂的问题可能需要更多时间。';
            } else if (error.message.includes('请求已取消')) {
                errorMessage = '请求已取消，请重新发送消息。';
            } else {
                // 🔧 显示更详细的错误信息用于调试
                debugInfo = `\n\n🐞 调试信息: ${error.message}`;
                if (this.conversationId) {
                    debugInfo += `\n当前会话ID: ${this.conversationId}`;
                }
            }
            
            this.addMessage('ai', errorMessage + debugInfo);
        } finally {
            this.setLoading(false);
        }
    }

    async callDifyAPIStreaming(message) {
        // 创建流式消息容器
        this.createStreamingMessage();
        
        // 取消之前的请求
        if (this.currentRequest) {
            this.currentRequest.abort();
            console.log('取消上一个请求');
        }
        
        this.currentRequest = new AbortController();
        
        const url = `${this.apiBase}/chat-messages`;
        const requestBody = {
            inputs: {},
            query: message,
            response_mode: 'streaming',
            user: 'user-' + Date.now()
        };

        // 🔧 修复：根据Dify文档，conversation_id为选填，有就传，没有就不传
        if (this.conversationId && this.conversationId.trim() !== '') {
            requestBody.conversation_id = this.conversationId;
            console.log('📤 流式模式继续现有会话，ID:', this.conversationId);
        } else {
            console.log('🆕 流式模式开始新会话（不传conversation_id）');
        }

        try {
            // 创建超时Promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('请求超时')), this.requestTimeout);
            });
            
            // 创建请求Promise
            const fetchPromise = fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: this.currentRequest.signal
            });

            // 竞态：哪个先完成用哪个
            const response = await Promise.race([fetchPromise, timeoutPromise]);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API错误详情:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                    conversationId: this.conversationId,
                    requestBody: requestBody
                });
                
                // 🔧 特殊处理400和404错误，通常意味着conversation_id无效或过期
                if ((response.status === 400 || response.status === 404) && this.conversationId) {
                    console.warn(`⚠️ ${response.status}错误可能是由于无效或过期的conversation_id，将在下次请求时重置`);
                }
                
                throw new Error(`API请求失败: ${response.status} - ${response.statusText}`);
            }

            // 直接处理流式响应
            const finalResponse = await this.handleStreamResponse(response);
            
            // 完成流式显示
            if (this.currentStreamingDiv) {
                this.finalizeStreamingMessage(this.currentStreamingDiv, finalResponse);
            }
            
        } catch (error) {
            // 出错时清理流式状态
            if (this.currentStreamingDiv && this.currentStreamingDiv.parentNode) {
                this.currentStreamingDiv.parentNode.removeChild(this.currentStreamingDiv);
            }
            this.currentStreamingDiv = null;
            this.currentStreamingText = null;
            this.currentCopyButton = null;
            
            if (error.name === 'AbortError') {
                throw new Error('请求已取消');
            } else if (error.message === '请求超时') {
                throw new Error('响应时间过长，请重试或简化问题（建议30秒内的问题）');
            }
            throw error;
        } finally {
            this.currentRequest = null;
        }
    }

    // 🔄 保留原有callDifyAPI作为通用接口（用于重新生成等功能）
    async callDifyAPI(message) {
        // 这个方法现在主要用于重新生成功能，使用blocking模式
        return await this.callDifyAPIBlocking(message);
    }

    // 🔄 传统blocking模式API调用（降级方案）
    async callDifyAPIBlocking(message) {
        // 取消之前的请求
        if (this.currentRequest) {
            this.currentRequest.abort();
            console.log('取消上一个请求');
        }
        
        this.currentRequest = new AbortController();
        
        const url = `${this.apiBase}/chat-messages`;
        const requestBody = {
            inputs: {},
            query: message,
            response_mode: 'blocking', // 🔄 传统阻塞模式
            user: 'user-' + Date.now()
        };

        // 🔧 修复：根据Dify文档，conversation_id为选填，有就传，没有就不传
        if (this.conversationId && this.conversationId.trim() !== '') {
            requestBody.conversation_id = this.conversationId;
            console.log('📤 阻塞模式继续现有会话，ID:', this.conversationId);
        } else {
            console.log('🆕 阻塞模式开始新会话（不传conversation_id）');
        }

        try {
            // 创建超时Promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('请求超时')), this.requestTimeout);
            });
            
            // 创建请求Promise
            const fetchPromise = fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: this.currentRequest.signal
            });

            // 竞态：哪个先完成用哪个
            const response = await Promise.race([fetchPromise, timeoutPromise]);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API错误详情:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                    conversationId: this.conversationId,
                    requestBody: requestBody
                });
                
                // 🔧 特殊处理400和404错误，通常意味着conversation_id无效或过期
                if ((response.status === 400 || response.status === 404) && this.conversationId) {
                    console.warn(`⚠️ ${response.status}错误可能是由于无效或过期的conversation_id，将在下次请求时重置`);
                }
                
                throw new Error(`API请求失败: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            // 🔧 修复：正确管理conversation_id，支持多轮对话
            if (data.conversation_id) {
                if (!this.conversationId) {
                    // 第一次对话，保存新的conversation_id
                    this.conversationId = data.conversation_id;
                    this.saveConversationId();
                    console.log('🆕 保存新会话ID:', this.conversationId);
                } else if (this.conversationId !== data.conversation_id) {
                    // conversation_id发生变化，更新
                    console.log('🔄 会话ID更新:', this.conversationId, '->', data.conversation_id);
                    this.conversationId = data.conversation_id;
                    this.saveConversationId();
                }
            }

            return data.answer || '抱歉，我没有收到有效的回复。';
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('请求已取消');
            } else if (error.message === '请求超时') {
                throw new Error('响应时间过长，请稍后重试或尝试简化问题（建议30秒内的问题）');
            }
            console.error('API调用详细错误:', error);
            throw error;
        } finally {
            this.currentRequest = null;
        }
    }

    getDemoResponse(message) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const responses = [
                    '感谢您的提问。这是一个演示模式，请配置您的Dify API密钥以获得真实的AI回复。',
                    '您好！我是AI仁波切的演示版本。要启用完整功能，请在代码中设置您的Dify API密钥。',
                    '这是一个模拟回复。为了获得真正的AI智慧指导，请按照说明配置您的API密钥。',
                    '演示模式下，我只能提供预设回复。配置API密钥后，我将为您提供真正的智慧对话。'
                ];
                
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                resolve(randomResponse);
            }, 1000 + Math.random() * 2000);
        });
    }

    showChatInterface() {
        this.welcomeMessage.style.display = 'none';
        this.chatMessages.classList.add('active');
        this.chatMessages.style.display = 'block';
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🧘';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // 消息头部（包含复制按钮）
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        // AI消息添加操作按钮
        if (type === 'ai') {
            // 重新生成按钮
            const regenerateButton = document.createElement('button');
            regenerateButton.className = 'regenerate-button';
            regenerateButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
                </svg>
                <span class="regenerate-text">重新生成</span>
            `;
            regenerateButton.title = '重新生成回复';
            regenerateButton.addEventListener('click', () => this.regenerateMessage(messageDiv));
            messageHeader.appendChild(regenerateButton);
            
            // 复制按钮
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                </svg>
                <span class="copy-text">复制</span>
            `;
            copyButton.title = '复制消息';
            copyButton.addEventListener('click', () => this.copyMessage(content, copyButton));
            messageHeader.appendChild(copyButton);
        }
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        // AI消息支持Markdown渲染
        if (type === 'ai' && typeof marked !== 'undefined') {
            messageText.innerHTML = marked.parse(content);
            
            // 高亮代码块
            if (typeof hljs !== 'undefined') {
                messageText.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                    this.addCodeCopyButton(block);
                });
            }
            
            // 包装表格
            messageText.querySelectorAll('table').forEach((table) => {
                this.wrapTable(table);
            });
        } else {
            messageText.textContent = content;
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date());
        
        if (messageHeader.children.length > 0) {
            messageContent.appendChild(messageHeader);
        }
        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        
        requestAnimationFrame(() => {
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });

        this.saveMessage(type, content);
        
        // 如果是用户消息，开始新对话或更新当前对话
        if (type === 'user') {
            this.updateCurrentConversation(content);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.chatLoading.style.display = 'flex';
            this.startLoadingAnimation();
            this.chatLoading.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
            this.chatLoading.style.display = 'none';
            this.stopLoadingAnimation();
        }
        
        this.updateSendButtonState();
    }
    
    startLoadingAnimation() {
        const textElement = this.chatLoading.querySelector('.loading-text');
        const messages = [
            'AI仁波切正在深入思考...',
            '正在整理智慧的回答...',
            '请稍候，好内容值得等待...',
            '复杂问题需要更多思考时间...'
        ];
        
        let index = 0;
        textElement.textContent = messages[0];
        
        // 每3秒切换一次提示文字
        this.loadingInterval = setInterval(() => {
            index = (index + 1) % messages.length;
            textElement.textContent = messages[index];
        }, 3000);
        
        // 15秒后提示可能需要更长时间
        this.longWaitTimeout = setTimeout(() => {
            textElement.textContent = '复杂问题需要更多思考时间，感谢您的耐心等待...';
        }, 15000);
        
        // 25秒后提示超时可能
        setTimeout(() => {
            if (this.isLoading) {
                textElement.textContent = '请求即将超时，如果太久请稍后重试...';
            }
        }, 25000);
    }
    
    stopLoadingAnimation() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
        }
        if (this.longWaitTimeout) {
            clearTimeout(this.longWaitTimeout);
            this.longWaitTimeout = null;
        }
        
        // 重置加载文字
        const textElement = this.chatLoading.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = 'AI仁波切正在思考中...';
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    async copyMessage(content, button) {
        try {
            await navigator.clipboard.writeText(content);
            
            // 更新按钮状态显示复制成功
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                </svg>
                <span class="copy-text">已复制</span>
            `;
            button.classList.add('copied');
            
            // 2秒后恢复原状
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 2000);
            
        } catch (err) {
            console.error('复制失败:', err);
            // 显示复制失败状态
            const originalHTML = button.innerHTML;
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
                <span class="copy-text">复制失败</span>
            `;
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 2000);
        }
    }

    async regenerateMessage(messageDiv) {
        if (!this.lastUserMessage || this.isLoading) {
            console.warn('无法重新生成：没有上一条用户消息或正在加载中');
            return;
        }

        // 找到重新生成按钮并更新状态
        const regenerateButton = messageDiv.querySelector('.regenerate-button');
        if (regenerateButton) {
            // 保存原始HTML
            const originalHTML = regenerateButton.innerHTML;
            
            // 显示生成中状态
            regenerateButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6V9L16 5L12 1V4C7.58 4 4 7.58 4 12C4 13.57 4.46 15.03 5.24 16.26L6.7 14.8C6.25 13.97 6 13 6 12C6 8.69 8.69 6 12 6Z" fill="currentColor">
                        <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                    </path>
                </svg>
                <span class="regenerate-text">生成中...</span>
            `;
            regenerateButton.disabled = true;
            regenerateButton.classList.add('regenerating');
        }

        // 找到消息内容区域
        const messageText = messageDiv.querySelector('.message-text');
        const messageTime = messageDiv.querySelector('.message-time');
        
        this.setLoading(true);

        try {
            // 调用API重新生成
            const newResponse = await this.callDifyAPI(this.lastUserMessage);
            
            // 更新消息内容
            if (typeof marked !== 'undefined') {
                messageText.innerHTML = marked.parse(newResponse);
                
                // 重新应用代码高亮
                if (typeof hljs !== 'undefined') {
                    messageText.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                        this.addCodeCopyButton(block);
                    });
                }
                
                // 重新包装表格
                messageText.querySelectorAll('table').forEach((table) => {
                    this.wrapTable(table);
                });
            } else {
                messageText.textContent = newResponse;
            }
            
            // 更新时间戳
            messageTime.textContent = this.formatTime(new Date());
            
            // 更新复制按钮的内容引用
            const copyButton = messageDiv.querySelector('.copy-button');
            if (copyButton) {
                // 移除旧的事件监听器并添加新的
                const newCopyButton = copyButton.cloneNode(true);
                copyButton.parentNode.replaceChild(newCopyButton, copyButton);
                newCopyButton.addEventListener('click', () => this.copyMessage(newResponse, newCopyButton));
            }
            
            // 滚动到消息位置
            requestAnimationFrame(() => {
                messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
            });
            
            // 显示成功状态
            if (regenerateButton) {
                regenerateButton.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                    </svg>
                    <span class="regenerate-text">已重新生成</span>
                `;
                regenerateButton.classList.add('regenerated');
                
                // 2秒后恢复原状
                setTimeout(() => {
                    regenerateButton.innerHTML = originalHTML;
                    regenerateButton.disabled = false;
                    regenerateButton.classList.remove('regenerating', 'regenerated');
                }, 2000);
            }
            
        } catch (error) {
            console.error('重新生成失败:', error);
            
            // 显示错误状态
            if (regenerateButton) {
                regenerateButton.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                    </svg>
                    <span class="regenerate-text">重新生成失败</span>
                `;
                regenerateButton.classList.add('regenerate-error');
                
                setTimeout(() => {
                    regenerateButton.innerHTML = originalHTML;
                    regenerateButton.disabled = false;
                    regenerateButton.classList.remove('regenerating', 'regenerate-error');
                }, 3000);
            }
        } finally {
            this.setLoading(false);
        }
    }

    addCodeCopyButton(codeBlock) {
        const pre = codeBlock.parentElement;
        if (pre.tagName !== 'PRE') return;
        
        // 避免重复添加按钮
        if (pre.querySelector('.code-header')) return;
        
        // 创建代码头部容器
        const codeHeader = document.createElement('div');
        codeHeader.className = 'code-header';
        
        // 检测语言类型
        const langClass = Array.from(codeBlock.classList).find(cls => cls.startsWith('language-'));
        const language = langClass ? langClass.replace('language-', '') : 'text';
        
        // 语言标签
        const langLabel = document.createElement('span');
        langLabel.className = 'code-language';
        langLabel.textContent = this.getLanguageDisplayName(language);
        
        // 复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-button';
        copyButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
            </svg>
            <span>复制</span>
        `;
        copyButton.title = '复制代码';
        
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent);
                copyButton.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                    </svg>
                    <span>已复制</span>
                `;
                copyButton.classList.add('copied');
                
                setTimeout(() => {
                    copyButton.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                        </svg>
                        <span>复制</span>
                    `;
                    copyButton.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('复制代码失败:', err);
                copyButton.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                    </svg>
                    <span>失败</span>
                `;
                setTimeout(() => {
                    copyButton.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                        </svg>
                        <span>复制</span>
                    `;
                }, 2000);
            }
        });
        
        codeHeader.appendChild(langLabel);
        codeHeader.appendChild(copyButton);
        
        pre.style.position = 'relative';
        pre.insertBefore(codeHeader, codeBlock);
    }

    getLanguageDisplayName(lang) {
        const languageNames = {
            'javascript': 'JavaScript',
            'js': 'JavaScript', 
            'python': 'Python',
            'py': 'Python',
            'java': 'Java',
            'cpp': 'C++',
            'c++': 'C++',
            'csharp': 'C#',
            'css': 'CSS',
            'html': 'HTML',
            'xml': 'XML',
            'json': 'JSON',
            'sql': 'SQL',
            'bash': 'Bash',
            'shell': 'Shell',
            'php': 'PHP',
            'ruby': 'Ruby',
            'go': 'Go',
            'rust': 'Rust',
            'typescript': 'TypeScript',
            'ts': 'TypeScript',
            'markdown': 'Markdown',
            'yaml': 'YAML',
            'text': '纯文本'
        };
        return languageNames[lang.toLowerCase()] || lang.toUpperCase();
    }

    wrapTable(table) {
        // 避免重复包装
        if (table.parentElement.classList.contains('table-container')) {
            return;
        }
        
        const container = document.createElement('div');
        container.className = 'table-container';
        
        // 将表格插入容器中
        table.parentNode.insertBefore(container, table);
        container.appendChild(table);
        
        // 添加表格功能增强
        this.enhanceTable(table);
    }

    enhanceTable(table) {
        // 为数字列添加右对齐样式
        const rows = table.querySelectorAll('tr');
        if (rows.length > 1) {
            const headerCells = rows[0].querySelectorAll('th, td');
            
            // 检测每列的内容类型
            headerCells.forEach((cell, colIndex) => {
                let isNumberColumn = true;
                let isCenterColumn = false;
                
                // 检查此列的所有行
                for (let rowIndex = 1; rowIndex < rows.length && rowIndex < 6; rowIndex++) {
                    const cellInRow = rows[rowIndex].cells[colIndex];
                    if (cellInRow) {
                        const text = cellInRow.textContent.trim();
                        
                        // 检查是否为数字
                        if (text && !(/^[\d.,\-+%$€¥£]+$/.test(text))) {
                            isNumberColumn = false;
                        }
                        
                        // 检查是否为居中内容（如✓ ✗ 等符号）
                        if (text && /^[✓✗○●▲▼←→↑↓★☆♦♠♣♥]$/.test(text)) {
                            isCenterColumn = true;
                        }
                    }
                }
                
                // 应用样式
                if (isNumberColumn) {
                    rows.forEach(row => {
                        const cell = row.cells[colIndex];
                        if (cell) cell.classList.add('number');
                    });
                } else if (isCenterColumn) {
                    rows.forEach(row => {
                        const cell = row.cells[colIndex];
                        if (cell) cell.classList.add('center');
                    });
                }
            });
        }
        
        // 添加排序功能（可选）
        this.addTableSorting(table);
    }

    addTableSorting(table) {
        const headers = table.querySelectorAll('thead th, tr:first-child th');
        if (headers.length === 0) return;
        
        headers.forEach((header, index) => {
            if (header.textContent.trim()) {
                header.style.cursor = 'pointer';
                header.style.userSelect = 'none';
                header.title = '点击排序';
                
                header.addEventListener('click', () => {
                    this.sortTable(table, index);
                });
            }
        });
    }

    sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody') || table;
        const rows = Array.from(tbody.querySelectorAll('tr')).slice(1); // 排除表头
        
        if (rows.length === 0) return;
        
        // 检测数据类型
        const isNumeric = rows.every(row => {
            const cell = row.cells[columnIndex];
            if (!cell) return false;
            const text = cell.textContent.trim();
            return !text || !isNaN(parseFloat(text.replace(/[^\d.-]/g, '')));
        });
        
        // 排序
        rows.sort((a, b) => {
            const cellA = a.cells[columnIndex];
            const cellB = b.cells[columnIndex];
            
            if (!cellA || !cellB) return 0;
            
            let valueA = cellA.textContent.trim();
            let valueB = cellB.textContent.trim();
            
            if (isNumeric) {
                valueA = parseFloat(valueA.replace(/[^\d.-]/g, '')) || 0;
                valueB = parseFloat(valueB.replace(/[^\d.-]/g, '')) || 0;
                return valueA - valueB;
            } else {
                return valueA.localeCompare(valueB);
            }
        });
        
        // 重新插入排序后的行
        rows.forEach(row => tbody.appendChild(row));
        
        // 添加排序指示器
        table.querySelectorAll('th').forEach((th, i) => {
            th.classList.remove('sorted-asc', 'sorted-desc');
            th.textContent = th.textContent.replace(' ↑', '').replace(' ↓', '');
        });
        
        const header = table.querySelectorAll('th')[columnIndex];
        if (header) {
            header.classList.add('sorted-asc');
            header.textContent += ' ↑';
        }
    }

    saveConversationId() {
        if (this.conversationId) {
            sessionStorage.setItem('conversationId', this.conversationId);
        }
    }

    loadConversationHistory() {
        const savedConversationId = sessionStorage.getItem('conversationId');
        if (savedConversationId) {
            this.conversationId = savedConversationId;
        }

        const savedMessages = sessionStorage.getItem('chatHistory');
        if (savedMessages) {
            try {
                const messages = JSON.parse(savedMessages);
                if (messages.length > 0) {
                    this.showChatInterface();
                    messages.forEach(msg => {
                        this.addMessageToUI(msg.type, msg.content, msg.time);
                    });
                }
            } catch (error) {
                console.error('加载聊天历史失败:', error);
            }
        }
    }

    saveMessage(type, content) {
        try {
            // 获取当前对话ID
            const currentConversationId = sessionStorage.getItem('currentConversationId');
            
            if (currentConversationId) {
                // 为特定对话保存消息
                const messagesKey = `conversation_messages_${currentConversationId}`;
                const savedMessages = localStorage.getItem(messagesKey);
                const messages = savedMessages ? JSON.parse(savedMessages) : [];
                
                messages.push({
                    type,
                    content,
                    time: new Date().toISOString()
                });

                // 限制每个对话最多保存200条消息
                if (messages.length > 200) {
                    messages.splice(0, messages.length - 200);
                }
                
                localStorage.setItem(messagesKey, JSON.stringify(messages));
                console.log(`💾 消息已保存到对话 ${currentConversationId}`);
            }
            
            // 同时保存到通用历史记录（向后兼容）
            const savedMessages = sessionStorage.getItem('chatHistory');
            const messages = savedMessages ? JSON.parse(savedMessages) : [];
            
            messages.push({
                type,
                content,
                time: new Date().toISOString()
            });

            if (messages.length > 100) {
                messages.splice(0, messages.length - 100);
            }
            
            sessionStorage.setItem('chatHistory', JSON.stringify(messages));
        } catch (error) {
            console.error('保存消息失败:', error);
        }
    }

    addMessageToUI(type, content, timeStr) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🧘';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // 消息头部（包含复制按钮）
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        // AI消息添加操作按钮
        if (type === 'ai') {
            // 重新生成按钮
            const regenerateButton = document.createElement('button');
            regenerateButton.className = 'regenerate-button';
            regenerateButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
                </svg>
                <span class="regenerate-text">重新生成</span>
            `;
            regenerateButton.title = '重新生成回复';
            regenerateButton.addEventListener('click', () => this.regenerateMessage(messageDiv));
            messageHeader.appendChild(regenerateButton);
            
            // 复制按钮
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                </svg>
                <span class="copy-text">复制</span>
            `;
            copyButton.title = '复制消息';
            copyButton.addEventListener('click', () => this.copyMessage(content, copyButton));
            messageHeader.appendChild(copyButton);
        }
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        // AI消息支持Markdown渲染
        if (type === 'ai' && typeof marked !== 'undefined') {
            messageText.innerHTML = marked.parse(content);
            
            // 高亮代码块
            if (typeof hljs !== 'undefined') {
                messageText.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                    this.addCodeCopyButton(block);
                });
            }
            
            // 包装表格
            messageText.querySelectorAll('table').forEach((table) => {
                this.wrapTable(table);
            });
        } else {
            messageText.textContent = content;
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date(timeStr));
        
        if (messageHeader.children.length > 0) {
            messageContent.appendChild(messageHeader);
        }
        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
    }

    clearHistory() {
        sessionStorage.removeItem('chatHistory');
        sessionStorage.removeItem('conversationId');
        this.conversationId = null;
        this.chatMessages.innerHTML = '';
        this.chatMessages.classList.remove('active');
        this.chatMessages.style.display = 'none';
        this.welcomeMessage.style.display = 'flex';
    }

    // 侧边栏功能
    setupMobileSidebar() {
        console.log('🔧 初始化移动端侧边栏系统');
        
        // 创建新的遮罩层
        this.createSidebarOverlay();
        
        // 检测屏幕尺寸变化
        this.checkScreenSize();
        window.addEventListener('resize', () => this.checkScreenSize());
        
        // 侧边栏内点击历史对话时在移动端自动关闭
        this.conversationsList.addEventListener('click', (e) => {
            if (this.isMobile && e.target.closest('.conversation-item')) {
                console.log('📱 移动端点击对话项，延迟关闭侧边栏');
                setTimeout(() => this.closeSidebar(), 300);
            }
        });
        
        console.log('✅ 移动端侧边栏系统初始化完成');
    }

    createSidebarOverlay() {
        // 移除旧的遮罩层
        const existingOverlay = document.querySelector('.sidebar-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
            console.log('🗑️ 移除旧的遮罩层');
        }
        
        // 创建新的遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'sidebar-overlay';
        
        // 强制设置样式
        Object.assign(this.overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: '9998',
            opacity: '0',
            visibility: 'hidden',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            webkitTapHighlightColor: 'transparent'
        });
        
        document.body.appendChild(this.overlay);
        
        // 绑定多种关闭事件
        ['click', 'touchend'].forEach(eventType => {
            this.overlay.addEventListener(eventType, (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log(`🔥 遮罩层${eventType}事件触发 - 关闭侧边栏`);
                this.closeSidebar();
            }, { passive: false });
        });
        
        console.log('✅ 新遮罩层已创建并绑定事件');
    }

    checkScreenSize() {
        this.isMobile = window.innerWidth <= 768;
        
        if (this.isMobile) {
            // 📱 移动端模式：强制重构
            console.log('📱 检测到移动端，启用全新响应式布局');
            
            // 清理旧状态
            this.sidebar.classList.remove('collapsed');
            
            // 添加移动端专用类名
            document.body.classList.add('mobile-mode');
            this.sidebar.classList.add('mobile-hidden');
            
            // 强制隐藏侧边栏
            this.forceMobileHideSidebar();
            
            // 🔥 HarmonyOS特殊处理
            if (this.deviceInfo && this.deviceInfo.isHarmonyOS) {
                console.log('🔥 HarmonyOS系统：启用特殊适配模式');
                document.body.classList.add('harmonyos-mobile');
                this.setupHarmonyOSMobile();
            }
            
        } else {
            // 💻 桌面端模式
            console.log('💻 桌面端模式：侧边栏正常显示');
            this.isMobile = false;
            document.body.classList.remove('mobile-mode', 'harmonyos-mobile');
            this.sidebar.classList.remove('mobile-hidden', 'mobile-open');
            this.sidebar.classList.remove('collapsed');
            
            if (this.overlay) {
                this.overlay.style.opacity = '0';
                this.overlay.style.visibility = 'hidden';
            }
        }
    }
    
    // 🔥 强制隐藏移动端侧边栏
    forceMobileHideSidebar() {
        if (!this.isMobile) return;
        
        console.log('🔒 强制隐藏移动端侧边栏');
        
        // 直接操作样式
        this.sidebar.style.transform = 'translateX(-100%)';
        this.sidebar.style.webkitTransform = 'translateX(-100%)';
        
        // 更新类名
        this.sidebar.classList.remove('mobile-open');
        this.sidebar.classList.add('mobile-hidden');
        
        // 隐藏遮罩层
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            this.overlay.style.visibility = 'hidden';
        }
        
        // 恢复页面滚动
        document.body.style.overflow = '';
        
        console.log('✅ 移动端侧边栏已强制隐藏');
    }
    
    // 🔥 HarmonyOS移动端特殊设置
    setupHarmonyOSMobile() {
        console.log('🔥 设置HarmonyOS移动端特殊优化');
        
        // 全局触摸监听
        document.addEventListener('touchstart', (e) => {
            if (this.isMobile && !this.sidebar.contains(e.target)) {
                // 延迟关闭，避免误触
                setTimeout(() => {
                    if (this.sidebar.classList.contains('mobile-open')) {
                        this.forceMobileHideSidebar();
                    }
                }, 100);
            }
        }, { passive: true });
        
        // HarmonyOS滑动手势
        let startX = 0;
        let startY = 0;
        let isValidSwipe = false;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isValidSwipe = true;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isValidSwipe || !startX) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = Math.abs(startY - currentY);
            
            // 水平滑动距离大于垂直滑动距离
            if (diffX > 50 && diffY < 100) {
                if (this.sidebar.classList.contains('mobile-open')) {
                    console.log('🔥 HarmonyOS向左滑动手势 - 关闭侧边栏');
                    this.forceMobileHideSidebar();
                    isValidSwipe = false;
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            startX = 0;
            startY = 0;
            isValidSwipe = false;
        }, { passive: true });
        
        console.log('✅ HarmonyOS特殊优化设置完成');
    }

    toggleSidebar() {
        console.log('🎯 切换侧边栏状态');
        
        if (this.isMobile) {
            // 移动端特殊处理
            if (this.sidebar.classList.contains('mobile-open')) {
                this.forceMobileHideSidebar();
            } else {
                this.openSidebar();
            }
        } else {
            // 桌面端正常处理
            const isCollapsed = this.sidebar.classList.contains('collapsed');
            if (isCollapsed) {
                this.openSidebar();
            } else {
                this.closeSidebar();
            }
        }
    }

    openSidebar() {
        console.log('📂 打开侧边栏');
        
        if (this.isMobile) {
            // 移动端特殊处理
            this.sidebar.classList.remove('mobile-hidden');
            this.sidebar.classList.add('mobile-open');
            
            // 强制样式更新
            this.sidebar.style.transform = 'translateX(0)';
            this.sidebar.style.webkitTransform = 'translateX(0)';
            
            // 显示遮罩
            if (this.overlay) {
                this.overlay.style.display = 'block';
                this.overlay.style.visibility = 'visible';
                setTimeout(() => {
                    this.overlay.style.opacity = '1';
                }, 10);
            }
            
            // 禁止页面滚动
            document.body.style.overflow = 'hidden';
            
            console.log('📱 移动端侧边栏已打开');
        } else {
            // 桌面端正常处理
            this.sidebar.classList.remove('collapsed');
            
            // 移动端显示遮罩层
            if (window.innerWidth <= 768) {
                this.overlay.style.opacity = '1';
                this.overlay.style.visibility = 'visible';
                document.body.style.overflow = 'hidden'; // 防止背景滚动
            }
        }
    }

    closeSidebar() {
        console.log('📁 关闭侧边栏');
        
        if (this.isMobile) {
            // 移动端使用强制关闭方法
            this.forceMobileHideSidebar();
        } else {
            // 桌面端正常处理
            this.sidebar.classList.add('collapsed');
            
            // 隐藏遮罩层
            this.overlay.style.opacity = '0';
            this.overlay.style.visibility = 'hidden';
            document.body.style.overflow = ''; // 恢复滚动
        }
    }

    startNewChat() {
        this.clearHistory();
        // 🔧 明确重置conversation_id和相关状态
        this.conversationId = null;
        sessionStorage.removeItem('conversationId');
        sessionStorage.setItem('forceClearConversation', 'true'); // 标记下次需要清理
        
        // 移动端自动关闭侧边栏
        if (window.innerWidth <= 768) {
            this.closeSidebar();
        }
        this.lastUserMessage = null;
        sessionStorage.removeItem('currentConversationId');
        
        console.log('🆕 开始新对话，已重置所有状态');
        
        // 更新侧边栏活跃状态
        this.updateConversationsList();
    }

    clearAllHistory() {
        if (confirm('确定要清除所有历史对话吗？')) {
            localStorage.removeItem('conversations');
            this.conversations = [];
            this.updateConversationsList();
            this.startNewChat();
        }
    }

    // 对话管理
    loadConversations() {
        try {
            const saved = localStorage.getItem('conversations');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载对话列表失败:', error);
            return [];
        }
    }

    saveConversations() {
        try {
            localStorage.setItem('conversations', JSON.stringify(this.conversations));
        } catch (error) {
            console.error('保存对话列表失败:', error);
        }
    }

    updateCurrentConversation(userMessage) {
        const currentConversationId = sessionStorage.getItem('currentConversationId');
        
        if (!currentConversationId) {
            // 创建新对话
            const newConversation = {
                id: Date.now().toString(),
                title: this.generateConversationTitle(userMessage),
                lastMessage: userMessage,
                timestamp: new Date().toISOString(),
                messageCount: 1
            };
            
            this.conversations.unshift(newConversation);
            sessionStorage.setItem('currentConversationId', newConversation.id);
            
            // 限制对话数量
            if (this.conversations.length > 50) {
                this.conversations = this.conversations.slice(0, 50);
            }
        } else {
            // 更新现有对话
            const conversation = this.conversations.find(c => c.id === currentConversationId);
            if (conversation) {
                conversation.lastMessage = userMessage;
                conversation.timestamp = new Date().toISOString();
                conversation.messageCount++;
            }
        }
        
        this.saveConversations();
        this.updateConversationsList();
    }

    generateConversationTitle(message) {
        // 生成对话标题，取前20个字符
        const title = message.length > 20 ? message.substring(0, 20) + '...' : message;
        return title.replace(/\n/g, ' ').trim();
    }

    updateConversationsList() {
        const currentConversationId = sessionStorage.getItem('currentConversationId');
        
        this.conversationsList.innerHTML = '';
        
        if (this.conversations.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-conversations';
            emptyDiv.innerHTML = `
                <p style="color: var(--text-muted); text-align: center; padding: 2rem 1rem; font-size: 0.9rem;">
                    暂无历史对话<br>
                    开始新的对话吧！
                </p>
            `;
            this.conversationsList.appendChild(emptyDiv);
            return;
        }
        
        this.conversations.forEach(conversation => {
            const conversationDiv = document.createElement('div');
            conversationDiv.className = 'conversation-item';
            if (conversation.id === currentConversationId) {
                conversationDiv.classList.add('active');
            }
            
            conversationDiv.innerHTML = `
                <div class="conversation-info">
                    <div class="conversation-title">${conversation.title}</div>
                    <div class="conversation-time">${this.formatRelativeTime(new Date(conversation.timestamp))}</div>
                </div>
                <div class="conversation-actions">
                    <button class="conversation-delete" title="删除对话">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // 点击对话项切换对话
            conversationDiv.addEventListener('click', (e) => {
                if (!e.target.closest('.conversation-delete')) {
                    this.switchToConversation(conversation.id);
                }
            });
            
            // 删除对话
            const deleteBtn = conversationDiv.querySelector('.conversation-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteConversation(conversation.id);
            });
            
            this.conversationsList.appendChild(conversationDiv);
        });
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
    }

    switchToConversation(conversationId) {
        console.log('切换到对话:', conversationId);
        
        // 设置当前对话ID
        sessionStorage.setItem('currentConversationId', conversationId);
        
        // 清空当前聊天界面
        this.chatMessages.innerHTML = '';
        
        // 加载该对话的历史消息
        this.loadConversationMessages(conversationId);
        
        // 更新对话列表UI状态
        this.updateConversationsList();
        
        // 确保显示聊天界面
        this.showChatInterface();
        
        // 滚动到底部
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    }

    loadConversationMessages(conversationId) {
        try {
            // 从localStorage加载该对话的消息历史
            const messagesKey = `conversation_messages_${conversationId}`;
            const savedMessages = localStorage.getItem(messagesKey);
            
            if (savedMessages) {
                const messages = JSON.parse(savedMessages);
                console.log(`加载对话 ${conversationId} 的 ${messages.length} 条消息`);
                
                // 重新渲染所有消息
                messages.forEach(msg => {
                    if (msg.type === 'user') {
                        this.addMessage('user', msg.content);
                    } else if (msg.type === 'ai') {
                        this.addMessage('ai', msg.content);
                    }
                });
                
                // 显示消息已加载提示
                if (messages.length > 0) {
                    console.log(`✅ 成功加载 ${messages.length} 条历史消息`);
                } else {
                    console.log('⚠️ 该对话暂无消息历史');
                }
            } else {
                console.log('⚠️ 未找到该对话的消息历史');
            }
        } catch (error) {
            console.error('❌ 加载对话消息失败:', error);
        }
    }

    deleteConversation(conversationId) {
        if (confirm('确定要删除这个对话吗？')) {
            // 删除对话记录
            this.conversations = this.conversations.filter(c => c.id !== conversationId);
            this.saveConversations();
            
            // 删除对话的消息历史
            const messagesKey = `conversation_messages_${conversationId}`;
            localStorage.removeItem(messagesKey);
            console.log(`🗑️ 已删除对话 ${conversationId} 的消息历史`);
            
            // 如果删除的是当前对话，开始新对话
            const currentConversationId = sessionStorage.getItem('currentConversationId');
            if (currentConversationId === conversationId) {
                this.startNewChat();
            } else {
                this.updateConversationsList();
            }
        }
    }

    // 🚀 兼容blocking模式处理（用于重新生成等功能）
    async handleBlockingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // 保留最后一行（可能不完整）
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6).trim();
                            if (jsonStr === '[DONE]') {
                                break;
                            }
                            
                            const data = JSON.parse(jsonStr);
                            
                            // 保存conversation_id
                            if (data.conversation_id && !this.conversationId) {
                                this.conversationId = data.conversation_id;
                                this.saveConversationId();
                            }
                            
                            // 收集所有内容，不实时显示
                            if (data.answer) {
                                fullResponse += data.answer;
                            }
                            
                        } catch (e) {
                            console.warn('解析流式数据失败:', line, e);
                        }
                    }
                }
            }

            return fullResponse || '抱歉，我没有收到有效的回复。';
            
        } catch (error) {
            console.error('流式响应处理失败:', error);
            throw error;
        }
    }

    // 🚀 流式响应核心方法
    async handleStreamResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // 保留最后一行（可能不完整）
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6).trim();
                            if (jsonStr === '[DONE]') {
                                break;
                            }
                            
                            const data = JSON.parse(jsonStr);
                            
                            // 🔧 修复：只在message_end事件时保存conversation_id，确保是最终有效的ID
                            if (data.event === 'message_end' && data.conversation_id) {
                                if (!this.conversationId) {
                                    this.conversationId = data.conversation_id;
                                    this.saveConversationId();
                                    console.log('🆕 消息结束时保存新会话ID:', this.conversationId);
                                } else if (this.conversationId !== data.conversation_id) {
                                    console.log('🔄 消息结束时会话ID更新:', this.conversationId, '->', data.conversation_id);
                                    this.conversationId = data.conversation_id;
                                    this.saveConversationId();
                                }
                            }
                            
                            // 处理流式内容
                            if (data.answer) {
                                fullResponse += data.answer;
                                console.log('📝 收到流式数据:', data.answer.substring(0, 50) + '...');
                                // 🚀 实时更新显示
                                if (this.currentStreamingText) {
                                    this.updateStreamingMessage(fullResponse);
                                    console.log('✅ 已更新显示, 总长度:', fullResponse.length);
                                } else {
                                    console.warn('⚠️ 流式容器不存在，无法实时更新');
                                }
                            }
                            
                        } catch (e) {
                            console.warn('解析流式数据失败:', line, e);
                        }
                    }
                }
            }

            return fullResponse || '抱歉，我没有收到有效的回复。';
            
        } catch (error) {
            console.error('流式响应处理失败:', error);
            throw error;
        }
    }

    // 🚀 创建流式消息容器
    createStreamingMessage() {
        // 立即隐藏加载状态，显示流式内容
        this.setLoading(false);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai streaming';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🧘';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // 消息头部（操作按钮）
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        // 重新生成按钮
        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'regenerate-button';
        regenerateButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
            </svg>
            <span class="regenerate-text">重新生成</span>
        `;
        regenerateButton.title = '重新生成回复';
        regenerateButton.addEventListener('click', () => this.regenerateMessage(messageDiv));
        messageHeader.appendChild(regenerateButton);
        
        // 复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
            </svg>
            <span class="copy-text">复制</span>
        `;
        copyButton.title = '复制消息';
        messageHeader.appendChild(copyButton);
        
        // 消息文本容器
        const messageText = document.createElement('div');
        messageText.className = 'message-text streaming-text';
        messageText.innerHTML = '<span class="streaming-cursor">|</span>'; // 初始显示光标
        
        // 时间戳
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date());
        
        messageContent.appendChild(messageHeader);
        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTime);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        // 添加到聊天容器
        this.chatMessages.appendChild(messageDiv);
        
        // 保存引用以便更新
        this.currentStreamingDiv = messageDiv;
        this.currentStreamingText = messageText;
        this.currentCopyButton = copyButton;
        
        // 滚动到底部
        requestAnimationFrame(() => {
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
        
        return messageDiv;
    }

    // 🚀 实时更新流式消息
    updateStreamingMessage(content) {
        if (!this.currentStreamingText) return;
        
        // 渲染Markdown内容
        if (typeof marked !== 'undefined') {
            this.currentStreamingText.innerHTML = marked.parse(content) + '<span class="streaming-cursor">|</span>';
            
            // 应用代码高亮
            if (typeof hljs !== 'undefined') {
                this.currentStreamingText.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                    this.addCodeCopyButton(block);
                });
            }
            
            // 包装表格
            this.currentStreamingText.querySelectorAll('table').forEach((table) => {
                this.wrapTable(table);
            });
        } else {
            this.currentStreamingText.innerHTML = content + '<span class="streaming-cursor">|</span>';
        }
        
        // 实时滚动
        requestAnimationFrame(() => {
            if (this.currentStreamingDiv) {
                this.currentStreamingDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        });
    }

    // 🚀 完成流式消息
    finalizeStreamingMessage(messageDiv, finalContent) {
        if (!this.currentStreamingText) return;
        
        // 移除光标和流式标记
        this.currentStreamingDiv.classList.remove('streaming');
        
        // 最终内容渲染
        if (typeof marked !== 'undefined') {
            this.currentStreamingText.innerHTML = marked.parse(finalContent);
            
            // 最终代码高亮
            if (typeof hljs !== 'undefined') {
                this.currentStreamingText.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block);
                    this.addCodeCopyButton(block);
                });
            }
            
            // 最终表格处理
            this.currentStreamingText.querySelectorAll('table').forEach((table) => {
                this.wrapTable(table);
            });
        } else {
            this.currentStreamingText.textContent = finalContent;
        }
        
        // 绑定复制功能
        if (this.currentCopyButton) {
            this.currentCopyButton.addEventListener('click', () => this.copyMessage(finalContent, this.currentCopyButton));
        }
        
        // 保存消息到历史
        this.saveMessage('ai', finalContent);
        
        // 清理引用
        this.currentStreamingDiv = null;
        this.currentStreamingText = null;
        this.currentCopyButton = null;
        
        // 最终滚动
        requestAnimationFrame(() => {
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 全局存储实例，方便在页面关闭时访问
    window.aiRinpocheChat = new AIRinpocheChat();
});

window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('lastVisit', new Date().toISOString());
});

// 页面关闭时取消正在进行的请求
window.addEventListener('beforeunload', () => {
    const chatInstance = window.aiRinpocheChat;
    if (chatInstance && chatInstance.currentRequest) {
        chatInstance.currentRequest.abort();
    }
});

// 页面完全加载后再次确保移动端侧边栏正确隐藏
window.addEventListener('load', () => {
    const chatInstance = window.aiRinpocheChat;
    if (chatInstance) {
        // 延迟一点确保所有CSS都已应用
        setTimeout(() => {
            chatInstance.checkScreenSize();
        }, 100);
    }
});