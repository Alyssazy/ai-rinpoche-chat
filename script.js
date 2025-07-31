class AIRinpocheChat {
    constructor() {
        this.apiKey = 'app-vanuZhHLhFmXqz5kG8guNOb7';
        this.apiBase = 'https://api.dify.ai';
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
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.clearHistoryBtn.addEventListener('click', () => this.clearAllHistory());
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }

    clearInvalidConversation() {
        // 清理可能存在的无效会话ID
        const savedConversationId = sessionStorage.getItem('conversationId');
        if (savedConversationId) {
            console.log('发现已保存的会话ID，正在清理以开始新对话:', savedConversationId);
            sessionStorage.removeItem('conversationId');
            sessionStorage.removeItem('chatHistory');
            this.conversationId = null;
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
            
            if (error.message.includes('401')) {
                errorMessage = 'API密钥无效，请检查您的Dify API密钥配置。';
            } else if (error.message.includes('403')) {
                errorMessage = 'API访问被拒绝，请检查您的权限设置。';
            } else if (error.message.includes('429')) {
                errorMessage = 'API调用频率过高，请稍后再试。';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = '网络连接失败，请检查网络连接或CORS设置。';
            } else if (error.message.includes('请求超时')) {
                errorMessage = '响应时间过长，请稍后重试或尝试简化问题。提示：过长或复杂的问题可能需要更多时间。';
            } else if (error.message.includes('请求已取消')) {
                errorMessage = '请求已取消，请重新发送消息。';
            }
            
            this.addMessage('ai', errorMessage);
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
        
        const url = `${this.apiBase}/v1/chat-messages`;
        const requestBody = {
            inputs: {},
            query: message,
            response_mode: 'streaming',
            user: 'user-' + Date.now()
        };

        if (this.conversationId && this.conversationId.trim() !== '') {
            requestBody.conversation_id = this.conversationId;
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
                    body: errorText
                });
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
        
        const url = `${this.apiBase}/v1/chat-messages`;
        const requestBody = {
            inputs: {},
            query: message,
            response_mode: 'blocking', // 🔄 传统阻塞模式
            user: 'user-' + Date.now()
        };

        if (this.conversationId && this.conversationId.trim() !== '') {
            requestBody.conversation_id = this.conversationId;
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
                    body: errorText
                });
                throw new Error(`API请求失败: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.conversation_id && !this.conversationId) {
                this.conversationId = data.conversation_id;
                this.saveConversationId();
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
        // 创建遮罩层
        this.createSidebarOverlay();
        
        // 检测屏幕尺寸变化
        this.checkScreenSize();
        window.addEventListener('resize', () => this.checkScreenSize());
        
        // 点击遮罩层关闭侧边栏
        this.overlay.addEventListener('click', () => this.closeSidebar());
        
        // 侧边栏内点击历史对话时在移动端自动关闭
        this.conversationsList.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && e.target.closest('.conversation-item')) {
                setTimeout(() => this.closeSidebar(), 300); // 延迟关闭让用户看到切换效果
            }
        });
    }

    createSidebarOverlay() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'sidebar-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(this.overlay);
    }

    checkScreenSize() {
        if (window.innerWidth <= 768) {
            // 移动端：默认收起侧边栏
            this.sidebar.classList.add('collapsed');
            console.log('📱 移动端模式：侧边栏已收起');
        } else {
            // 桌面端：默认展开侧边栏
            this.sidebar.classList.remove('collapsed');
            if (this.overlay) {
                this.overlay.style.opacity = '0';
                this.overlay.style.visibility = 'hidden';
            }
            console.log('💻 桌面端模式：侧边栏已展开');
        }
    }

    toggleSidebar() {
        const isCollapsed = this.sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
            this.openSidebar();
        } else {
            this.closeSidebar();
        }
    }

    openSidebar() {
        this.sidebar.classList.remove('collapsed');
        
        // 移动端显示遮罩层
        if (window.innerWidth <= 768) {
            this.overlay.style.opacity = '1';
            this.overlay.style.visibility = 'visible';
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        }
    }

    closeSidebar() {
        this.sidebar.classList.add('collapsed');
        
        // 隐藏遮罩层
        this.overlay.style.opacity = '0';
        this.overlay.style.visibility = 'hidden';
        document.body.style.overflow = ''; // 恢复滚动
    }

    startNewChat() {
        this.clearHistory();
        this.conversationId = null;
        
        // 移动端自动关闭侧边栏
        if (window.innerWidth <= 768) {
            this.closeSidebar();
        }
        this.lastUserMessage = null;
        sessionStorage.removeItem('currentConversationId');
        
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
                            
                            // 保存conversation_id
                            if (data.conversation_id && !this.conversationId) {
                                this.conversationId = data.conversation_id;
                                this.saveConversationId();
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