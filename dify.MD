对话型应用 API
对话应用支持会话持久化，可将之前的聊天记录作为上下文进行回答，可适用于聊天/客服 AI 等。

基础 URL
Code
https://api.dify.ai/v1

Copy
Copied!
鉴权
Service API 使用 API-Key 进行鉴权。 强烈建议开发者把 API-Key 放在后端存储，而非分享或者放在客户端存储，以免 API-Key 泄露，导致财产损失。 所有 API 请求都应在 Authorization HTTP Header 中包含您的 API-Key，如下所示：

Code
  Authorization: Bearer {API_KEY}

Copy
Copied!
POST
/chat-messages
发送对话消息
创建会话消息。

Request Body
Name
query
Type
string
Description
用户输入/提问内容。

Name
inputs
Type
object
Description
允许传入 App 定义的各变量值。 inputs 参数包含了多组键值对（Key/Value pairs），每组的键对应一个特定变量，每组的值则是该变量的具体值。 默认 {}

Name
response_mode
Type
string
Description
streaming 流式模式（推荐）。基于 SSE（Server-Sent Events）实现类似打字机输出方式的流式返回。
blocking 阻塞模式，等待执行完毕后返回结果。（请求若流程较长可能会被中断）。 由于 Cloudflare 限制，请求会在 100 秒超时无返回后中断。 注：Agent模式下不允许blocking。
Name
user
Type
string
Description
用户标识，用于定义终端用户的身份，方便检索、统计。 由开发者定义规则，需保证用户标识在应用内唯一。服务 API 不会共享 WebApp 创建的对话。

Name
conversation_id
Type
string
Description
（选填）会话 ID，需要基于之前的聊天记录继续对话，必须传之前消息的 conversation_id。

Name
files
Type
array[object]
Description
上传的文件。

type (string) 支持类型：图片 image（目前仅支持图片格式） 。
transfer_method (string) 传递方式:
remote_url: 图片地址。
local_file: 上传文件。
url 图片地址。（仅当传递方式为 remote_url 时）。
upload_file_id 上传文件 ID。（仅当传递方式为 local_file 时）。
Name
auto_generate_name
Type
bool
Description
（选填）自动生成标题，默认 true。 若设置为 false，则可通过调用会话重命名接口并设置 auto_generate 为 true 实现异步生成标题。

Name
trace_id
Type
string
Description
（选填）链路追踪ID。适用于与业务系统已有的trace组件打通，实现端到端分布式追踪等场景。如果未指定，系统会自动生成trace_id。支持以下三种方式传递，具体优先级依次为：

Header：通过 HTTP Header X-Trace-Id 传递，优先级最高。
Query 参数：通过 URL 查询参数 trace_id 传递。
Request Body：通过请求体字段 trace_id 传递（即本字段）。
Response
当 response_mode 为 blocking 时，返回 ChatCompletionResponse object。 当 response_mode 为 streaming时，返回 ChunkChatCompletionResponse object 流式序列。

ChatCompletionResponse
返回完整的 App 结果，Content-Type 为 application/json。

event (string) 事件类型，固定为 message
task_id (string) 任务 ID，用于请求跟踪和下方的停止响应接口
id (string) 唯一ID
message_id (string) 消息唯一 ID
conversation_id (string) 会话 ID
mode (string) App 模式，固定为 chat
answer (string) 完整回复内容
metadata (object) 元数据
usage (Usage) 模型用量信息
retriever_resources (array[RetrieverResource]) 引用和归属分段列表
created_at (int) 消息创建时间戳，如：1705395332
ChunkChatCompletionResponse
返回 App 输出的流式块，Content-Type 为 text/event-stream。 每个流式块均为 data: 开头，块之间以 \n\n 即两个换行符分隔，如下所示：

data: {"event": "message", "task_id": "900bbd43-dc0b-4383-a372-aa6e6c414227", "id": "663c5084-a254-4040-8ad3-51f2a3c1a77c", "answer": "Hi", "created_at": 1705398420}\n\n

Copy
Copied!
流式块中根据 event 不同，结构也不同：

event: message LLM 返回文本块事件，即：完整的文本以分块的方式输出。
task_id (string) 任务 ID，用于请求跟踪和下方的停止响应接口
message_id (string) 消息唯一 ID
conversation_id (string) 会话 ID
answer (string) LLM 返回文本块内容
created_at (int) 创建时间戳，如：1705395332
event: agent_message Agent模式下返回文本块事件，即：在Agent模式下，文章的文本以分块的方式输出（仅Agent模式下使用）
task_id (string) 任务 ID，用于请求跟踪和下方的停止响应接口
message_id (string) 消息唯一 ID
conversation_id (string) 会话 ID
answer (string) LLM 返回文本块内容
created_at (int) 创建时间戳，如：1705395332
event: agent_thought Agent模式下有关Agent思考步骤的相关内容，涉及到工具调用（仅Agent模式下使用）
id (string) agent_thought ID，每一轮Agent迭代都会有一个唯一的id
task_id (string) 任务ID，用于请求跟踪下方的停止响应接口
message_id (string) 消息唯一ID
position (int) agent_thought在消息中的位置，如第一轮迭代position为1
thought (string) agent的思考内容
observation (string) 工具调用的返回结果
tool (string) 使用的工具列表，以 ; 分割多个工具
tool_input (string) 工具的输入，JSON格式的字符串(object)。如：{"dalle3": {"prompt": "a cute cat"}}
created_at (int) 创建时间戳，如：1705395332
message_files (array[string]) 当前 agent_thought 关联的文件ID
file_id (string) 文件ID
conversation_id (string) 会话ID
event: message_file 文件事件，表示有新文件需要展示
id (string) 文件唯一ID
type (string) 文件类型，目前仅为image
belongs_to (string) 文件归属，user或assistant，该接口返回仅为 assistant
url (string) 文件访问地址
conversation_id (string) 会话ID
event: message_end 消息结束事件，收到此事件则代表流式返回结束。
task_id (string) 任务 ID，用于请求跟踪和下方的停止响应接口
message_id (string) 消息唯一 ID
conversation_id (string) 会话 ID
metadata (object) 元数据
usage (Usage) 模型用量信息
retriever_resources (array[RetrieverResource]) 引用和归属分段列表
event: tts_message TTS 音频流事件，即：语音合成输出。内容是Mp3格式的音频块，使用 base64 编码后的字符串，播放的时候直接解码即可。(开启自动播放才有此消息)
task_id (string) 任务 ID，用于请求跟踪和下方的停止响应接口
message_id (string) 消息唯一 ID
audio (string) 语音合成之后的音频块使用 Base64 编码之后的文本内容，播放的时候直接 base64 解码送入播放器即可
created_at (int) 创建时间戳，如：1705395332
event: tts_message_end TTS 音频流结束事件，收到这个事件表示音频流返回结束。
task_id (string) 任务 ID，用于请求跟踪和下方的停止响应接口
message_id (string) 消息唯一 ID
audio (string) 结束事件是没有音频的，所以这里是空字符串
created_at (int) 创建时间戳，如：1705395332
event: message_replace 消息内容替换事件。 开启内容审查和审查输出内容时，若命中了审查条件，则会通过此事件替换消息内容为预设回复。
task_id (string) 任务 ID，用于请求跟踪和下方的停止响应接口
message_id (string) 消息唯一 ID
conversation_id (string) 会话 ID
answer (string) 替换内容（直接替换 LLM 所有回复文本）
created_at (int) 创建时间戳，如：1705395332
event: error 流式输出过程中出现的异常会以 stream event 形式输出，收到异常事件后即结束。
task_id (string) 任务 ID，用于请求跟踪和下方的停止响应接口
message_id (string) 消息唯一 ID
status (int) HTTP 状态码
code (string) 错误码
message (string) 错误消息
event: ping 每 10s 一次的 ping 事件，保持连接存活。
Errors
404，对话不存在
400，invalid_param，传入参数异常
400，app_unavailable，App 配置不可用
400，provider_not_initialize，无可用模型凭据配置
400，provider_quota_exceeded，模型调用额度不足
400，model_currently_not_support，当前模型不可用
400，completion_request_error，文本生成失败
500，服务内部异常