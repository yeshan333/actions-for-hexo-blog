---
title: 在 Visual Studio Code 与微信开发者工具中调试使用 emscripten 基于 C 生成的 WASM 代码
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "vscode, emscripten, emcc, emsdk, wasm, webassembly, DWARF, source map"
cover: https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/emcc_banner.png
description: 在 Visual Studio Code 与微信开发者工具中调试 emscripten 生成的 WASM 代码
date: 2025-01-08 00:30:39
updated:
tags: [WebAssembly, WeChat, emscripten, vscode]
categories: [WebAssembly]
---

最近在尝试将一些 C/C++、Lua 项目挪到 Web 上跑, 接触到了 emscripten. 这里会介绍下在 Visual Studio Code 与微信开发者工具中调试使用 emscripten 基于 C 生成的 WASM 代码 (WebAssembly) 的一些方法.

## Emscripten 与 WebAssebmly

> WebAssembly 是一种新的编码方式, 可以在现代的 Web 浏览器中运行——它是一种低级的类汇编语言, 具有紧凑的二进制格式, 可以接近原生的性能运行, 并为诸如 C/C++、C# 和 Rust 等语言提供编译目标, 以便它们可以在 Web 上运行. 它也被设计为可以与 JavaScript 共存, 允许两者一起工作.  --[来自 MDN](https://developer.mozilla.org/zh-CN/docs/WebAssembly)

[Emscripten](https://emscripten.org/) 基于大名鼎鼎的 [LLVM](https://llvm.org/) 提供了 C/C++ 生态下的编译工具链, 可以很方便的将 C/C++ 项目编译到 WASM, 然后放到 JS 环境 (Web、[微信小程序/游戏](https://developers.weixin.qq.com/minigame/dev/guide/performance/perf-webassembly.html)、nodejs 等) 执行. 
有很多著名的 C/C++ 生态下的工具通过它移植到了现代浏览器 (chrome、firefox 等) 中执行.

Emscripten 官方提供了 [emsdk](https://github.com/emscripten-core/emsdk) 可以很方便的我们管理多个版本的编译工具链.

## vscode 中调试 WebAssembly 的基本方法

现在在 vscode 中调试 WebAssembly 还是很方便的, 巨硬 (Microsoft) 在 2023 年就开发好了一个 vscode 插件去做支持, 见: [WebAssembly DWARF Debugging](https://marketplace.visualstudio.com/items?itemName=ms-vscode.wasm-dwarf-debugging).
请确保你已经安装并启用了该扩展插件. 同时安装好了 Emscripten 相关编译工具链, 这里我们使用的版本如下:

```shell
❯ emcc -v
emcc (Emscripten gcc/clang-like replacement + linker emulating GNU ld) 3.1.74 (1092ec30a3fb1d46b1782ff1b4db5094d3d06ae5)
clang version 20.0.0git (https:/github.com/llvm/llvm-project 322eb1a92e6d4266184060346616fa0dbe39e731)
Target: wasm32-unknown-emscripten
Thread model: posix
InstalledDir: /home/yeshan333/workspace/github/emsdk/upstream/bin
```

这里我们已简单的单个 `fib.c` 文件的调试为例, `fib.c` 的内容如下:

```C
#include <stdio.h>

// 递归方法
int fibonacci_recursive(int n) {
    if (n <= 1)
        return n;
    return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2);
}

// 迭代方法
int fibonacci_iterative(int n) {
    if (n <= 1)
        return n;
    int a = 0, b = 1, c;
    for(int i = 2; i <= n; ++i){
        c = a + b;
        a = b;
        b = c;
    }
    return b;
}

int main() {
    int number = 10;
    printf("Recursive Fibonacci of %d is %d\n", number, fibonacci_recursive(number));
    printf("Iterative Fibonacci of %d is %d\n", number, fibonacci_iterative(number));
    return 0;
}
```

我们先通过 emcc 将 C 代码编译出 WASM, 如下: 

```shell
emcc -v fib.c -o fib.html
```

上述命令执行完成后, 会生成三个文件: `fib.wasm`、`fib.html`、`fib.js`, 如果我们通过浏览器访问 `fib.html`, 可以在浏览器的调试控制台 (F12) 看到对应的斐波那契数的输出.

> `fib.html` 是 emscripten 生成的演示页面, 背后会调用 `fib.js` 胶水层代码, 加载生成的 WEbAssembly 并执行对应 C 代码中的 main 函数. 具体原理可以查看源码并了解相关知识去理解.

![https://d473472.webp.li/fib.png](https://d473472.webp.li/fib.png)

如果本地环境安装有 Node.js. 那么我们也可以通过 node 执行胶水层代码 `fib.js`, 结果如下:

```shell
❯ node fib.js
Recursive Fibonacci of 10 is 55
Iterative Fibonacci of 10 is 55
```

接下来我们将演示通过 vscode 的 debugger 调试器在 C 文件和 JS 文件中打断点调试生成的 WASM & 胶水层 JS 代码, 实现单步调试.

### nodejs 中调试演示

这里我们使用如下 `launch.json` 配置去调试 `fib.js`: 

```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "WASM Debug",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "program": "${workspaceFolder}/fib.js"
        }
    ]
}
```

vscode 下的 C 代码断点调试需要依赖 DWARF 调试信息 (注: 如果没有调试信息, 我们只能调试生成的 js 代码, 而不能直接在 C 中打断点), 我们使用 emcc 的 -g 编译参数, 让生成的 wasm 带上调试信息. 我们先通过如下命令编译 C 文件:

```shell
emcc -g -v fib.c -o fib.html
```

在 `run()` 函数处打一个断点, 然后在 `fib.c` 中 main 函数的两个 printf 中各打一个断点, 使用 F5 启动调试器即可开始调试. 演示 (GIF 加载可能稍久):

[https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_nodejs.gif](https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_nodejs.gif)

![debug_in_nodejs.gif](https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_nodejs.gif)

### 连接到浏览器进行调试

区别于上一小节中提到的 Node.js 环境下的调试方法, vscode 会负责启动 node 执行 `fib.js`. 这里介绍的 vscode 结合浏览器的调试方法, WASM 和 JS 代码将由浏览器负责执行, 我们使用 vscode 的 task 让 vscode 帮我们启动浏览器.

我们使用的 vscode `launch.json` 调试配置如下:

```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch Chrome (fib.html)",
            "type": "chrome",
            "request": "launch",
            "url": "http://127.0.0.1:3000/fib.html",
            "preLaunchTask": "StartHTTPServer",
        },
    ]
}
```

`"preLaunchTask": "StartHTTPServer"` 说明会在调试开始前, 先执行一个名为 `StartHTTPServer` 的 vscode task. task 的配置同样可以放置于 .vscode 目录的 `tasks.json` 中

`tasks.json` 配置如下, 这里会使用到微软提供的插件 [Live Preview](https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server), 它会帮我们起一个 HTTP Server 去托管 HTML 文件 (`fib.html`):

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "StartHTTPServer",
            "type": "process",
            "command": "${input:StartHTTPServer}"
        }
    ],
    "inputs": [
        {
            "id": "StartHTTPServer",
            "type": "command",
            "command": "livePreview.runServerLoggingTask"
        }
    ]
}
```

我们延用之前打断点的位置: 在 `run()` 函数处打一个断点, 然后在 `fib.c` 中 main 函数的两个 printf 中各打一个断点. 启动配置好的调试配置.

> 注: 编译命令仍然是: `emcc -g -v fib.c -o fib.html`

演示 (GIF 加载可能稍久):

[https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_chrome.gif](https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_chrome.gif)

![debug_in_chrome.gif](https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_chrome.gif)

F5 启动调试后, 会有一个 chrome 浏览器调试窗口被拉起, 在 vscode 编译器可以观察到, 断点能正常执行. 于此同时, 我们也可以在浏览器开发者工具的 Debugger 中观察到断点的执行. 

如果你细心观察可以看到, 调试器执行到 C 文件时, 区别于 vscode 编辑器会跳转到对应的 C 代码行, chrome 浏览器开发者工具跳转的却是 wasm 文本格式代码, 这个问题我们可以在编译的时候生成 wasm 文件的 source-map 去解决, 编译命令如下:

```shell
# 确保生成的 source-map 文件 fib.wasm.map 能在 --source-map-base 指定的 HTTP Server 中找到
emcc -g -v fib.c -o fib.html -gsource-map --source-map-base=http://localhost:3000/
```

此后, 重新启动调试器, 我们也可以在浏览器的开发者工具中观察到随着调试的执行, 可以正确跳到被打断点的对应 C 代码行, 而不是对应的 wasm 文本表示格式中的代码行, 浏览器会自动读取 source-map 文件找到对应代码文件的位置.

演示 (GIF 加载可能稍久):

[https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_chrome_with_sourcemap.gif](https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_chrome_with_sourcemap.gif)

![debug_in_chrome_with_sourcemap.gif](https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_chrome_with_sourcemap.gif)

### 微信开发者工具中的调试

现在有很多的基于 C/C++ 写的游戏移植到了微信平台上, 基于上文浏览器的调试方法, 我们可以在微信开发者工具中达到类似的效果, 在 C 中打断点, 进行小程序/小游戏项目的调试. 我创建了一个小型项目, 可以将其导入 [微信的开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 进行尝试. 快速尝试下: 

```shell
git clone https://github.com/yeshan333/emcc_playground.git

cd emcc_playground/debug-blogpost

# 编译出 wasm
emcc -g -v unalign.cc -o unalign.html -gsource-map --source-map-base=http://localhost:3000/ -sSAFE_HEAP=1

# 启动一个 http server 将 debug-blogpost 目录暴露出去, 使用的地址端口需要与 --source-map-base 中指定的一致, 方便微信开发者工具读取
npx serve .
```

微信开发者工具打开 **debug-blogpost** 目录, 打开调试器, 在 Sources -> Page --> localhost:3000 出能看到对应的 C 文件, 并且可以使用 debugger 打断点: 

![debug_scope.png](https://d473472.webp.li/debug_scope.png)

演示（Windows + 微信开发者工具预发布版 RC Build (1.06.2412031) + Wechat Lib:3.7.2, 2024.12.23 10:35:40）: (GIF 加载可能稍久)

[https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_wechatdev.gif](https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_wechatdev.gif)

![debug_in_wechatdev.gif](https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/debug_in_wechatdev.gif)

### 注意

Node.js 环境目前尚未支持读取 WebAssembly 的 source-map, 编译出的 wasm 即便带了 DWARF 调试信息, 堆栈只能看到符号, 看不到 C 符号对应的源文件, 例如有这样
一个 C++ 文件 `unalign.cc`:

```c++
// https://github.com/3dgen/cppwasm-book/blob/master/wasm-in-action-book-examples/ch5/02/unaligned.cc
#ifndef EM_PORT_API
#	if defined(__EMSCRIPTEN__)
#		include <emscripten.h>
#		if defined(__cplusplus)
#			define EM_PORT_API(rettype) extern "C" rettype EMSCRIPTEN_KEEPALIVE
#		else
#			define EM_PORT_API(rettype) rettype EMSCRIPTEN_KEEPALIVE
#		endif
#	else
#		if defined(__cplusplus)
#			define EM_PORT_API(rettype) extern "C" rettype
#		else
#			define EM_PORT_API(rettype) rettype
#		endif
#	endif
#endif

#include <stdio.h>
#include <malloc.h>
#include <memory.h>
#include <stdint.h>

struct ST {
	uint8_t	c[4];
	float	f;
};

void throw_unalign_err() {
	printf("Hello, World!\n");
	char *buf = (char*)malloc(100);
	ST *pst = (ST*)(buf + 2);

	pst->c[0] = pst->c[1] = pst->c[2] = pst->c[3] = 123;
	pst->f = 3.14f;

	printf("c[0]:%d,c[1]:%d,c[2]:%d,c[3]:%d,f:%f\n",
		pst->c[0], pst->c[1], pst->c[2], pst->c[3], pst->f);

	free(buf);
}

int main() {
	throw_unalign_err();
	return 0;
}
```

使用 emcc 编译它, 命令如下: 

```shell
emcc -g -v unalign.cc -o unalign.html -gsource-map --source-map-base=http://localhost:3000/ -sSAFE_HEAP=1
```

然后使用 Node.js 执行编译出来的胶水文件, 会得到类似下面的结果, 有一个内存对齐错误, 堆栈上可以看到问题出现在 `throw_unalign_err`. 但我们看不到符号对应的源文件. 

```shell
❯ node --enable-source-maps unalign.js
Hello, World!
Aborted(alignment fault)
/home/yeshan333/workspace/playground/emcc_playground/debug-blogpost/unalign.js:613
  /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
                                        ^

RuntimeError: Aborted(alignment fault)
    at abort (/home/yeshan333/workspace/playground/emcc_playground/debug-blogpost/unalign.js:613:41)
    at alignfault (/home/yeshan333/workspace/playground/emcc_playground/debug-blogpost/unalign.js:335:3)
    at unalign.wasm (wasm://wasm/unalign.wasm-00091ee6:wasm-function[107]:0x56e4)
    at unalign.wasm.throw_unalign_err() (wasm://wasm/unalign.wasm-00091ee6:wasm-function[6]:0x42f)
    at unalign.wasm.__original_main (wasm://wasm/unalign.wasm-00091ee6:wasm-function[7]:0x4f2)
    at unalign.wasm.main (wasm://wasm/unalign.wasm-00091ee6:wasm-function[8]:0x50f)
    at /home/yeshan333/workspace/playground/emcc_playground/debug-blogpost/unalign.js:682:12
    at callMain (/home/yeshan333/workspace/playground/emcc_playground/debug-blogpost/unalign.js:1383:15)
    at doRun (/home/yeshan333/workspace/playground/emcc_playground/debug-blogpost/unalign.js:1421:23)
    at run (/home/yeshan333/workspace/playground/emcc_playground/debug-blogpost/unalign.js:1431:5)
```

但是如果是在 Web 浏览器环境（chrome）中, 我们能看到符号所在的 C 源文件, 打开 `unalign.html`, 我们能看到如下堆栈: 

![unalign_stacktrace_in_browser](https://d473472.webp.li/unalign_stacktrace_in_browser.png)

## 参考

- https://marketplace.visualstudio.com/items?itemName=ms-vscode.wasm-dwarf-debugging
- [VSCode调试的两种模式: launch 和 attach](https://juejin.cn/post/7388064351504498703)