#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最简单的HTTP服务器，解决CORS问题
"""

import http.server
import socketserver
import os
import sys

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def start_server():
    PORT = 8000
    
    # 切换到脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print(f"正在启动服务器...")
    print(f"服务器目录: {script_dir}")
    print(f"端口: {PORT}")
    print(f"请在浏览器中访问: http://localhost:{PORT}")
    print("按 Ctrl+C 停止服务器")
    print("-" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except OSError as e:
        if e.errno == 10048:  # Windows端口被占用
            print(f"\n错误: 端口 {PORT} 被占用")
            print("请尝试以下方案:")
            print("1. 关闭占用端口的程序")
            print("2. 等待几分钟后重试")
            print("3. 重启电脑")
        else:
            print(f"\n服务器启动失败: {e}")
        input("按回车键退出...")
    except Exception as e:
        print(f"\n服务器出现错误: {e}")
        input("按回车键退出...")

if __name__ == "__main__":
    start_server()