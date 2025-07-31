# AI仁波切 API配置说明

## 问题原因分析

您的网站显示"无法回应您的问题"主要有以下原因：

1. **API端点错误** - 之前使用了错误的API地址
2. **认证方式错误** - 需要真正的API密钥而不是机器人ID
3. **安全限制** - 浏览器CORS策略阻止直接调用第三方API

## 当前状态

现在网站已经修复，目前运行在**演示模式**下，会提供模拟回复。要获得真正的AI仁波切回复，需要配置您的Dify API密钥。

## 配置步骤

### 1. 获取Dify API密钥

1. 访问您的Dify控制台：https://cloud.dify.ai/
2. 找到您的"ai仁波切"应用
3. 进入应用设置 → API访问
4. 复制API密钥（以 `app-` 开头的字符串）

### 2. 配置API密钥

打开 `script.js` 文件，找到第6行：

```javascript
this.apiKey = 'YOUR_DIFY_API_KEY_HERE';
```

将 `YOUR_DIFY_API_KEY_HERE` 替换为您的真实API密钥：

```javascript
this.apiKey = 'app-xxxxxxxxxxxxxxxxx';  // 您的真实API密钥
```

### 3. 安全警告

⚠️ **重要提醒**：直接在前端代码中放置API密钥是不安全的！任何访问您网站的人都能看到这个密钥。

推荐的安全做法：
1. **本地使用**：仅在本地测试使用
2. **创建后端API**：建立一个简单的后端服务代理API调用
3. **使用环境变量**：在生产环境中使用环境变量管理密钥

## 解决CORS问题（可选）

如果配置API密钥后仍然有网络错误，可能是CORS问题。解决方案：

1. **使用本地服务器**：
   ```bash
   # 安装简单HTTP服务器
   npm install -g http-server
   
   # 在项目目录运行
   http-server -p 8080 --cors
   
   # 然后访问 http://localhost:8080
   ```

2. **使用Chrome无安全模式**（仅限开发）：
   ```bash
   chrome.exe --user-data-dir="C:\temp" --disable-web-security --disable-features=VizDisplayCompositor
   ```

## 测试网站

1. 刷新网页
2. 在演示模式下测试基本功能
3. 配置API密钥后测试真实对话
4. 检查浏览器控制台查看详细错误信息

## 故障排除

如果仍然有问题，请：

1. 按F12打开开发者工具
2. 查看Console标签页的错误信息
3. 查看Network标签页的网络请求状态
4. 确认API密钥格式正确（以`app-`开头）
5. 确认网络连接正常

## 联系支持

如需进一步帮助，请提供：
- 浏览器控制台的错误信息
- 使用的浏览器和版本
- API密钥是否配置正确（不要分享实际密钥）