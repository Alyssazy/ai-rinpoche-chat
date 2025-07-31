#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的代理服务器，解决CORS问题
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import urllib.request
import urllib.parse
from urllib.error import HTTPError

class CORSHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/chat':
            try:
                # 读取请求数据
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                # 提取API密钥和消息
                api_key = request_data.get('api_key')
                message = request_data.get('message')
                conversation_id = request_data.get('conversation_id', '')
                
                # 构建发送给Dify的请求
                dify_data = {
                    "inputs": {},
                    "query": message,
                    "response_mode": "blocking",
                    "conversation_id": conversation_id,
                    "user": "user-" + str(hash(message))
                }
                
                # 调用Dify API
                req = urllib.request.Request(
                    'https://api.dify.ai/v1/chat-messages',
                    data=json.dumps(dify_data).encode('utf-8'),
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {api_key}'
                    }
                )
                
                with urllib.request.urlopen(req) as response:
                    result = json.loads(response.read().decode('utf-8'))
                
                # 返回结果
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
                
            except HTTPError as e:
                error_response = {
                    'error': f'API调用失败: {e.code}',
                    'message': '请检查API密钥是否正确'
                }
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
                
            except Exception as e:
                error_response = {
                    'error': str(e),
                    'message': '服务器内部错误'
                }
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
        else:
            super().do_POST()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8000), CORSHTTPRequestHandler)
    print("服务器启动在: http://localhost:8000")
    print("代理API端点: http://localhost:8000/api/chat")
    print("按 Ctrl+C 停止服务器")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        server.shutdown()