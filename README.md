# AI仁波切 - 智慧对话助手

一个优雅的对话界面，集成了您的Dify机器人"ai仁波切"，提供深度思考与智慧指导。

## 功能特性

- 🎨 **现代化界面设计** - 深色主题，支持明暗模式切换
- 💬 **流畅对话体验** - 实时消息，加载状态指示
- 📱 **响应式设计** - 完美适配移动端和桌面端
- 💾 **会话持久化** - 自动保存对话历史
- 🚀 **快速提问** - 预设常见问题按钮
- 🔗 **Dify集成** - 无缝对接您的ai仁波切机器人

## 技术栈

- **前端**: 纯HTML5 + CSS3 + JavaScript ES6+
- **字体**: Noto Sans SC + Noto Serif SC
- **API**: Dify Chat API
- **存储**: SessionStorage

## 快速开始

1. 直接在浏览器中打开 `index.html`
2. 开始与AI仁波切对话

## 文件结构

```
ai 仁波切/
├── index.html      # 主页面
├── styles.css      # 样式文件
├── script.js       # 交互逻辑
└── README.md       # 说明文档
```

## 配置说明

机器人配置在 `script.js` 中：

```javascript
this.botId = 'vdD2AUJy94VGO5ZF';  // 您的Dify机器人ID
this.apiBase = 'https://udify.app/api';  // API端点
```

## 浏览器兼容性

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 特色功能

### 主题切换
支持深色和浅色主题，自动保存用户偏好。

### 智能输入
- Enter键发送消息
- Shift+Enter换行
- 自动调整输入框高度

### 对话管理
- 自动保存最近100条消息
- 会话ID持久化
- 优雅的加载状态

### 响应式设计
完美适配各种屏幕尺寸，提供一致的用户体验。

## 开发说明

如需修改样式或功能，请编辑对应文件：
- 界面布局：`index.html`
- 视觉样式：`styles.css`
- 交互逻辑：`script.js`

## 许可证

此项目仅供个人学习和使用。