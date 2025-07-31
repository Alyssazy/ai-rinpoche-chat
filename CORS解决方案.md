# CORS问题简单解决方案

您的网站现在已经恢复到直接调用Dify API的版本。由于浏览器的CORS安全策略，直接打开HTML文件会遇到跨域问题。

## 🚀 推荐解决方案

### 方案1: Chrome无安全模式（最简单）

1. **关闭所有Chrome浏览器窗口**
2. **按 Win + R，输入以下命令：**
   ```
   chrome --user-data-dir="C:\temp" --disable-web-security --disable-features=VizDisplayCompositor
   ```
3. **在新打开的Chrome窗口中打开您的 `index.html` 文件**
4. **开始与AI仁波切对话**

### 方案2: 使用Firefox

Firefox对CORS的限制相对宽松：
1. 打开Firefox浏览器
2. 直接拖拽 `index.html` 到浏览器中
3. 尝试发送消息

### 方案3: 安装CORS浏览器扩展

在Chrome或Edge中安装CORS扩展：
- CORS Unblock
- CORS Everywhere
- Disable CORS

## ⚠️ 重要提醒

- **仅用于测试**：这些方案仅适用于本地开发测试
- **安全风险**：禁用安全功能后请勿访问其他网站
- **临时使用**：测试完成后请关闭特殊模式的浏览器

## 📱 测试步骤

1. 使用上述任一方案打开网页
2. 发送消息："你好，AI仁波切"
3. 查看是否收到来自真实API的回复
4. 如果仍有错误，按F12查看控制台错误信息

## 🔍 验证是否成功

- **成功**：收到有意义的AI回复，不是错误信息
- **失败**：显示"网络连接失败"或CORS错误

这样您就可以直接使用API版本，无需复杂的服务器配置！