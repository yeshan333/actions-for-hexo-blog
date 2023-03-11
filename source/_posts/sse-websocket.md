---
title: "(译) Server-Sent Events: the alternative to WebSockets you should be using"
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
headimg: https://s1.ax1x.com/2023/03/11/ppKuToT.jpg
date: 2023-03-11 14:26:29
tags: [Websocket, SSE, Python]
categories: SSE
keywords: "Server-Sent Events"
---

> 原文地址: [https://germano.dev/sse-websockets/](https://germano.dev/sse-websockets/)
> 作者: [Germano Gabbianelli](https://github.com/tyrion)

当开发实时 web 应用时，WebSockets 可能是我们首先想到的。然而，Server Sent Events (SSE) 是通常会是一种更简单的替代方案。

## 1. 序言

最近我对实现实时 Web 应用程序的一些最佳方式很感兴趣。也就是一个应用程序包含一个或多个组件，这些组件会根据某些外部事件自动实时更新。这种应用程序的最常见例子是消息服务，我们希望每条消息都能立即广播到所有已经连接的人，而不需要进行任何的用户交互。

经过一些研究，我偶然发现了 Martin Chaov 的一个[精彩分享](https://www.youtube.com/watch?v=n9mRjkQg3VE)，其比较了 Server Sent Events、WebSockets 和 Long Polling 几个技术的优劣。这个演讲也有篇对应的博客文章来辅助阅读 [Using SSE Instead Of WebSockets For Unidirectional Data Flow Over HTTP/2](https://www.smashingmagazine.com/2018/02/sse-websockets-data-flow-http2/#comments-sse-websockets-data-flow-http2)，内容有趣而且非常有启发性。我真的很推荐大家去看一下。然而，它是 2018 年的内容，一些细节可能已经发生了改变，因此我决定写下这篇文章。

## 2. WebSockets?

[WebSockets](https://tools.ietf.org/html/rfc6455) 可以在浏览器和服务器之间创建 **双向低延迟** 的通信通道。

这使得它在某些场景中非常适用：比如**双向**通信的多人游戏，即浏览器和服务器都会一直在通道上发送消息，需要将这些消息以较**低延迟**进行传递。

在一款第一人称射击游戏中，浏览器可以持续地传输玩家的位置，同时从服务器接收所有其他玩家位置的更新。此外，我们肯定希望这些消息能够以尽可能花费少的开销进行传递，以避免游戏迟缓感，提升用户体验。

这与传统的 [HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) [请求-响应模型](https://en.wikipedia.org/wiki/Request%E2%80%93response)正好相反，其中浏览器始终是发起通信的一方，每个消息都具有显著的开销，因为要建立 [TCP 连接](https://en.wikipedia.org/wiki/Transmission_Control_Protocol)和传输 [HTTP 头部](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)信息。

然而，许多应用程序的实现不需要这么严格的要求。即使在实时应用程序中，**数据流也通常是不对称的**：服务器发送了大部分的消息，而客户端大多只是负责监听，并且只是偶尔发送一些更新。例如，在实时的聊天应用程序中，用户可能会连接到许多聊天房间，每个房间都有几十个或几百个参与者。因此，接收到的消息数量远远超过发送的消息数量。

## 3. WebSockets 的问题在于哪里

双向的通信通道和低延迟是非常好的功能特性。那么，我们为什么还要继续寻找其他解决方案呢？

WebSockets 有一个主要缺点：**它们不完全基于 HTTP 工作**。它们需要自己的 TCP 连接。它们只需要使用 HTTP 建立连接，然后将其升级为一个独立的 TCP 连接，在其上可以使用 WebSocket 协议。

这可能看起来不是很重要，但这意味着 WebSockets 不能从任何已有的 HTTP 特性中受益。即：

- 不支持压缩
- 不支持 HTTP/2 的多路复用
- 可能存在代理问题
- 无跨站点劫持保护

至少，在 WebSocket 协议首次发布时是这种情况。现在，有一些补充标准试图改善这种情况。让我们更详细地了解当前的情况。

注意：如果您不关心细节，请随意跳过本节其余部分，直接转到 Server-Sent Events 或 demo 部分。

### 3.1 压缩 (Compression)

在标准的连接上，每个浏览器都支持 [HTTP 压缩技术](https://en.wikipedia.org/wiki/HTTP_compression)，在服务器端启用也非常容易，只需在所选择的反向代理中开启切换一下开关。但是，对于使用 WebSockets 的情况这更加复杂，因为没有请求和响应，需要压缩各个独立的 WebSocket 帧 (frames)。

[RFC 7692](https://tools.ietf.org/html/rfc7692)，于 2015 年 12 月发布，试图通过定义 “WebSocket 压缩扩展” 来改善这种情况。然而，据我所知，没有任何流行的反向代理服务（如 nginx、caddy）实现了这一功能，因此无法透明地启用压缩。

这意味着，如果要使用压缩，则必须在后端直接实现。幸运的是，我找到了一些支持 RFC 7692 的库。例如，Python 的 [websockets](https://websockets.readthedocs.io/en/stable/extensions.html) 和 [wsproto](https://github.com/python-hyper/wsproto/) 库，以及 nodejs 的 [ws](https://github.com/websockets/ws) 库。

然而，后者并不建议使用该功能：

>该扩展在服务器上默认禁用，在客户端上默认启用。它在性能和内存消耗方面增加了显著的开销，因此我们建议只在确实需要时才启用它。
>
>请注意，Node.js 在高性能压缩方面存在各种问题，尤其是在 Linux 上增加并发性可能会导致灾难性的内存碎片和性能下降。

在浏览器方面，Firefox 从[ 37 版本](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/37#networking)开始支持 WebSocket 的压缩。[Chrome 也支持](https://chromestatus.com/feature/6555138000945152)。然而，显然 Safari 和 Edge 不支持。

我没有验证移动设备上的支持情况如何。

### 3.2 多路复用 (Multiplexing)

[HTTP/2](https://tools.ietf.org/html/rfc7540) 引入了对多路复用的支持，意味着向同一主机发送的多个请求/响应对不再需要单独的 TCP 连接。相反，它们可以共享同一个 TCP 连接，每个请求在其自己独立的 [HTTP/2 流](https://tools.ietf.org/html/rfc7540#section-5)上运行。

这也得到了[每个浏览器的支持](https://caniuse.com/http2)，而且在大多数反向代理上启用它也非常容易。

相比之下，WebSocket 协议默认不支持多路复用。向同一主机发送多个 WebSocket 将各自打开自己的独立的 TCP 连接。如果要使两个独立的 WebSocket 终端共享它们的基础连接，您必须自己在应用程序代码中添加多路复用能力支持。

[RFC 8441](https://tools.ietf.org/html/rfc8441) 于 2018 年 9 月发布，尝试通过添加“使用 HTTP/2 引导 WebSocket”的支持来解决这个问题。它已在 [Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1434137) 和 [Chrome](https://chromestatus.com/feature/6251293127475200) 中实现。然而，据我所知，没有主要的反向代理服务实现了它。不幸的是，我也找不到 Python 或 Javascript 的任何实现。

### 3.3 代理问题 (Issues with proxies)

没有显式支持 WebSockets 的 HTTP 代理可能会阻止未加密的 WebSocket 连接正常工作。这是因为代理无法解析 WebSocket 帧 (frames) 并关闭连接。

但是，通过 HTTPS 发起的 WebSocket 连接应该不受此问题的影响，因为帧将被加密，代理应该只是转发所有内容而不会关闭连接。

要了解更多信息，请参见 Peter Lubbers 的“[HTML5 Web Sockets 如何与代理服务器交互](https://www.infoq.com/articles/Web-Sockets-Proxy-Servers/)”。

### 3.4 跨站 WebSocket 劫持

WebSocket 连接没有受到同源策略的保护，这使它们容易受到跨站 WebSocket 劫持攻击。

因此，**如果 WebSocket 后端没有使用任何客户端缓存的身份验证方式（例如 cookie或 HTTP 身份验证），它们必须检查 Origin 头的正确性**。

我在这里不会详细讨论，但是请考虑这个简短的例子。假设一个比特币交易所使用 WebSockets 提供其交易服务。当您登录时，交易所可能设置一个 cookie 来保持您的会话在一定时间内活动。现在，攻击者要偷取你珍贵的比特币所要做的就是让你访问她控制的站点，然后简单地打开一个 WebSocket 连接到交易所。恶意连接将被自动验证，除非交易所检查 **Origin** 头并阻止来自未授权域的连接。

我建议您阅读 Christian Schneider 关于[跨站 WebSocket 劫持](https://christian-schneider.net/CrossSiteWebSocketHijacking.html#main)的精彩文章以了解更多信息。

## 4. Server-Sent Events

现在我们对 WebSockets 有了更多的了解，包括它们的优点和缺点，让我们学习一下 Server-Sent Events 并了解它们是否是一个有效的替代方案。

[Server-Sent Events](https://html.spec.whatwg.org/#server-sent-events) 使服务器能够随时向客户端发送低延迟的推送事件。它们使用非常简单的协议，并且是 [HTML 标准](https://html.spec.whatwg.org/#server-sent-events)的一部分，受到[每个浏览器的支持](https://html.spec.whatwg.org/#server-sent-events)。

与 WebSockets 不同，**Server-Sent Events 仅支持向客户端单向信息流动**。这使得它们不适合一些需要处理特定场景的应用程序，即那些需要既是双向又是低延迟的通信通道，比如实时游戏。然而，这些权衡取舍也是它们相对于 WebSockets 的主要优势，因为单向流动使得 **Server-Sent Events 可以在 HTTP 之上无缝的工作，而无需自定义协议**。这使它们自动获得了所有 HTTP 的功能，例如压缩或 HTTP/2 多路复用能力，使它们成为大多数实时应用程序的非常方便的选择，其中大部分数据都来自服务器，并且由于 HTTP 头部的一些开销而导致一些请求的开销是可以接受的。

协议非常简单。它使用 `text/event-stream` 作为内容类型 (Content-Type) 和消息的形式如下：

```text
data: First message

event: join
data: Second message. It has two
data: lines, a custom event type and an id.
id: 5

: comment. Can be used as keep-alive

data: Third message. I do not have more data.
data: Please retry later.
retry: 10
```

每个事件由两个换行符（\n）分隔，并由多个可选字段组成。

可重复使用在多处出现的字段 `data` 通常用于表示事件数据的内容。

字段 `event` 允许指定自定义事件类型，如下一节所示，它可以用于在客户端上触发不同的事件处理程序。

另外两个字段 `id` 和 `retry` 用于配置自动重连机制的行为。这是 `Server-Sent Events` 最有趣的特性之一。它确保在连接断开或被服务器关闭时，无需用户干预，客户端将自动尝试重新连接。

`retry` 字段用于指定在尝试重新连接之前等待的最短时间（以秒为单位）。当服务器连接了太多客户端时，它也可以在立即关闭客户端连接之前发送该字段以减轻其负载。

`id` 字段将标识符与当前事件相关联。在重新连接时，客户端将使用 `Last-Event-ID` HTTP 请求头将上次看到的 id 传输给服务器。这使得我们可以从正确的失效点恢复通讯流。

最后，服务器可以通过返回 [HTTP 204 No Content](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204) 响应来完全停止自动重连机制。

## 5. 来点实际代码 Demo

现在，让我们将所学的内容付诸实践。在本节中，我们将使用 Server-Sent Events 和 WebSockets 实现一个简单的服务。这将使我们能够实际比较这两种技术。我们将了解到使用每种技术开始的难易程度，并手动验证前面讨论的功能。

我们将使用 Python 作为后端，Caddy 作为反向代理，当然还需要一些 JavaScript 代码用于前端。

为了让我们的示例尽可能简单，我们的后端将只包含两个端点 (endpoints)，每个端点都会流式传输唯一的随机数字序列。从 /sse1 和 /sse2 进行 Server-Sent Events 访问，从 /ws1 和 /ws2 进行 WebSockets 的访问。我们的前端将仅由一个 index.html 文件组成，其中包含一些 JavaScript 代码，可以让我们启动和停止 WebSockets 和 Server-Sent Events 连接。

[示例代码 - GitHub](https://github.com/tyrion/sse-websockets-demo)

### 5.1 反向代理

使用反向代理，例如 Caddy 或 nginx，对于这种小例子中非常有用。它让我们很容易地开启很多我们所选择的后端可能缺少的功能。

更具体地说，它允许我们轻松地提供静态文件并自动压缩 HTTP 响应；提供 HTTP/2 支持，即使我们的后端仅支持 HTTP/1，也可以让我们受益于多路复用；最后还可以进行负载均衡。

我选择了Caddy，因为它可以自动为我们管理HTTPS证书，让我们跳过一个非常乏味的任务，尤其是对于一个快速实验 Demo。

基本配置位于项目根目录下的 `Caddyfile` 中，大致如下：

```text
localhost

bind 127.0.0.1 ::1

root ./static
file_server browse

encode zstd gzip
```

这指示 Caddy 监听本地接口的 80 和 443 端口，启用 HTTPS 支持并生成自签名证书。它还支持压缩和提供访问 `static` 目录下的静态文件。

最后一步，我们需要让 Caddy 代理到我们的后端服务。Server-Sent Events只是普通的HTTP请求，所以这里没有什么特别的:

```text
reverse_proxy /sse1 127.0.1.1:6001
reverse_proxy /sse2 127.0.1.1:6002
```

要代理 Websocket，需要反向代理显式支持。幸运的是，Caddy 可以毫无障碍地处理这个问题，尽管配置有点冗长:

```text
@websockets {
    header Connection *Upgrade*
    header Upgrade    websocket
}

handle /ws1 {
    reverse_proxy @websockets 127.0.1.1:6001
}

handle /ws2 {
    reverse_proxy @websockets 127.0.1.1:6002
}
```

最后使用如下命令启动 Caddy:

```shell
sudo caddy start
```

### 5.2 前端

让我们从前端开始，比较 WebSockets 和 Server-Sent Events 的 JavaScript API。

WebSocket 的JavaScript API非常易于使用。首先，我们需要创建一个新的 WebSocket 对象，传递服务器的 URL。这里，`wss` 表示连接将在 HTTPS 上进行。如上所述，强烈建议使用 HTTPS 以避免代理问题。

然后，我们应该监听一些可能的事件（即打开 `open`、消息 `message`、关闭 `close`、错误 `error`），通过设置 `on$event` 属性或使用 `addEventListener()`。

```js
const ws = new WebSocket("wss://localhost/ws");

ws.onopen = e => console.log("WebSocket open");

ws.addEventListener(
  "message", e => console.log(e.data));
```

JavaScript 的 Server-Sent Events API 非常类似。它要求我们创建一个新的 EventSource 对象，传递服务器的 URL，然后可以通过相同的方式订阅事件。

主要的区别在于，我们还可以订阅自定义事件。

```js
const es = new EventSource("https://localhost/sse");

es.onopen = e => console.log("EventSource open");

es.addEventListener(
  "message", e => console.log(e.data));

// Event listener for custom event
// 订阅自定义事件
es.addEventListener(
  "join", e => console.log(`${e.data} joined`))
```

我们现在可以使用所有这些关于 JS APIs 的新知识来构建我们实际的前端。

为了让事情尽可能简单，它只包含一个 index.html 文件，里面有一堆用来启动和停止 WebSockets 和 EventSources 的按钮。像这样：

```html
<button onclick="startWS(1)">Start WS1</button>
<button onclick="closeWS(1)">Close WS1</button>
<br>
<button onclick="startWS(2)">Start WS2</button>
<button onclick="closeWS(2)">Close WS2</button>
```

我们需要多个 WebSocket/EventSource，这样我们就可以测试 HTTP/2 多路复用是否有效以及打开了多少连接。

现在让我们实现这些按钮工作所需的两个函数:

```js
const wss = [];

function startWS(i) {
  if (wss[i] !== undefined) return;

  const ws = wss[i] = new WebSocket("wss://localhost/ws"+i);
  ws.onopen = e => console.log("WS open");
  ws.onmessage = e => console.log(e.data);
  ws.onclose = e => closeWS(i);
}

function closeWS(i) {
  if (wss[i] !== undefined) {
    console.log("Closing websocket");
    websockets[i].close();
    delete websockets[i];
  }
}
```

Server-Sent Events 的前端代码几乎相同。唯一的区别是 `onerror` 事件处理程序，它之所以存在，是因为一旦发生错误，浏览器就会记录一条消息，并尝试进行重连。

```js
const ess = [];

function startES(i) {
  if (ess[i] !== undefined) return;

  const es = ess[i] = new EventSource("https://localhost/sse"+i);
  es.onopen = e => console.log("ES open");
  es.onerror = e => console.log("ES error", e);
  es.onmessage = e => console.log(e.data);
}

function closeES(i) {
  if (ess[i] !== undefined) {
    console.log("Closing EventSource");
    ess[i].close()
    delete ess[i]
  }
}
```

### 5.3 后端

现在我们来编写后端代码。我们将使用 Python 的异步 Web 框架 [Starlette](https://www.starlette.io/)，使用 [Uvicorn](https://www.uvicorn.org/) 作为服务器。为了使事情模块化，我们将分离数据生成过程和端点 (endpoints) 的实现。

我们希望两个端点中的每一个都生成一系列唯一的随机数。为了实现这一点，我们将使用流 ID（即1或2）作为[随机种子 (random seed)](https://en.wikipedia.org/wiki/Random_seed)的一部分。

理想情况下，我们也希望我们的流是可恢复的。也就是说，如果连接中断，客户端应该能够从它收到的最后一条消息恢复流，而不是重新读取整个序列。为了实现这一点，我们将为每个消息/事件分配一个 ID，并在生成每个消息之前使用它来初始化随机种子，以及流 ID。在我们的例子中，ID 将只是从 0 开始的计数器 (Counter)。

有了这些，我们就可以编写 get_data 函数来生成我们的随机数：

```python
import random

def get_data(stream_id: int, event_id: int) -> int:
    rnd = random.Random()
    rnd.seed(stream_id * event_id)
    return rnd.randrange(1000)
```

现在我们来写出实际的 endpoints。

Starlette 的入门非常简单。我们只需要初始化一个应用程序 `app`，然后注册一些路由给它:

```python
from starlette.applications import Starlette

app = Starlette()
```

为了编写 WebSocket 服务，我们选择的 web 服务器和框架都必须有明确的支持。幸运的是，Uvicorn 和 Starlette 可以胜任这个任务，编写 WebSocket 端点与编写普通路由一样方便。

这就是我们需要的所有代码:

```python
from websockets.exceptions import WebSocketException

@app.websocket_route("/ws{id:int}")
async def websocket_endpoint(ws):
    id = ws.path_params["id"]
    try:
        await ws.accept()

        for i in itertools.count():
            data = {"id": i, "msg": get_data(id, i)}
            await ws.send_json(data)
            await asyncio.sleep(1)
    except WebSocketException:
        print("client disconnected")
```

上述代码将确保每当浏览器请求以 `/ws` 开头并后跟一个数字的路径时（例如 `/ws1`、`/ws2`），就会调用 websocket_endpoint 函数。

然后，对于每个匹配的请求，它将等待 WebSocket 连接建立，随后开始无限循环每秒发送随机数字，编码为 JSON 有效载荷。

对于 Server-Sent Events，代码非常相似，除了不需要任何特殊的框架支持。在这种情况下，我们注册一个路由，匹配以 /sse 开头并以数字结尾的 URL（例如 `/sse1`、`/sse2`）。但是，这次我们的端点只是设置适当的标头并返回 `StreamingResponse`:

```python
from starlette.responses import StreamingResponse

@app.route("/sse{id:int}")
async def sse_endpoint(req):
    return StreamingResponse(
        sse_generator(req),
        headers={
            "Content-type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
```

`StreamingResponse` 是 `Starlette` 提供的一个实用程序类，它接受一个生成器，并将其输出流式传输到客户端，保持连接处于打开状态。

下面为 `sse_generator` 的实现代码，几乎与 WebSocket 端点相同，只是消息按照 Server-Sent Events 协议进行编码：

```python
async def sse_generator(req):
    id = req.path_params["id"]
    for i in itertools.count():
        data = get_data(id, i)
        data = b"id: %d\ndata: %d\n\n" % (i, data)
        yield data
        await asyncio.sleep(1)
```

我们完成了!

最后，假设我们将所有代码放在名为 `server.py` 的文件中，我们可以使用 Uvicorn 启动我们的后端 endpoints，如下所示:

```shell
$ uvicorn --host 127.0.1.1 --port 6001 server:app &
$ uvicorn --host 127.0.1.1 --port 6002 server:app &
```

## 6. 彩蛋: SSE 很棒的特性

好了，现在让我们来总结一下，实现我们之前吹嘘的那些漂亮的功能是多么容易。

可以通过修改端点中的几行代码来启用压缩:

```python
@@ -32,10 +33,12 @@ async def websocket_endpoint(ws):
 
 async def sse_generator(req):
     id = req.path_params["id"]
+    stream = zlib.compressobj()
     for i in itertools.count():
         data = get_data(id, i)
         data = b"id: %d\ndata: %d\n\n" % (i, data)
-        yield data
+        yield stream.compress(data)
+        yield stream.flush(zlib.Z_SYNC_FLUSH)
         await asyncio.sleep(1)
 
 
@@ -47,5 +50,6 @@ async def sse_endpoint(req):
             "Content-type": "text/event-stream",
             "Cache-Control": "no-cache",
             "Connection": "keep-alive",
+            "Content-Encoding": "deflate",
         },
     )
```

然后，我们可以检查开发者工具 (DevTools) 来验证一切是否按预期工作:

![Compression](https://s1.ax1x.com/2023/03/11/ppK8x3T.png)

因为 Cadd y支持 HTTP/2，所以多路复用是默认启用的。我们可以再次使用开发者工具来确认所有 SSE 请求都使用同一个连接:

![Multiplexing](https://s1.ax1x.com/2023/03/11/ppKGFER.png)

**自动重连**: 在发生意外连接错误时自动重新连接很简单，只需在后端代码中读取 `[Last-Event-ID](https://html.spec.whatwg.org/multipage/server-sent-events.html#last-event-id)` 头信息:

```python
<     for i in itertools.count():
---
>     start = int(req.headers.get("last-event-id", 0))
>     for i in itertools.count(start):
```

前端代码不需要任何改动。

我们可以通过启动到 SSE 端点的连接，然后关闭 uvicorn 来测试它是否正常工作。连接会断开，但浏览器会自动尝试重新连接。因此，如果重新启动服务器，我们会看到流从中断的地方恢复!

请注意流是如何从消息 `243` 恢复的。感觉就像魔法🔥

![Automatic reconnection](https://germano.dev/assets/static/sse-auto-reconnect.7900e78.b190f19887f331ddb680b6ba6bc4921e.gif)

## 7. 总结

WebSockets 是建立在 HTTP 和 TCP 之上的大型机制，提供了一套极其特定的功能，即双向低延迟通信。

为了实现这一点，它们引入了许多复杂性，最终使得客户端和服务器实现比完全基于 HTTP 的解决方案更加复杂。

这些复杂性和限制已经在新的规范（[RFC 7692](https://tools.ietf.org/html/rfc7692)，[RFC 8441](https://tools.ietf.org/html/rfc8441)）中得到了解决，并将逐渐在客户端和服务器库中实现。

然而，即使在没有技术缺陷的情况下，WebSockets 仍然是一项相当复杂的技术，涉及大量额外的客户端和服务器代码。因此，您应仔细考虑是否值得增加复杂性，或者是否可以通过更简单的解决方案（如 Server-Sent Events）去解决问题。

---

就这些内容了，朋友们！希望你们觉得这篇文章有趣，也能从中学到一些新东西。

如果你想尝试一下 Server-Sent Events 和 WebSockets，可以自由地在 GitHub 上查看[演示 Demo 代码](https://github.com/tyrion/sse-websockets-demo)。

我也鼓励你们阅读下 [SSE 的规范](https://html.spec.whatwg.org/#server-sent-events)，因为它解释得非常清晰，包含了很多示例。