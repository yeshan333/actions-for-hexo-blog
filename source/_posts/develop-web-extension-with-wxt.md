---
title: 使用 WXT 开发浏览器插件（上手使用篇）
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "WXT, WSL2, browser plugin"
cover: https://telegraph.shansan.top/file/298031f2826e13ca14330.png
description: "WXT 开发浏览器插件"
date: 2024-03-15 07:47:53
tags: ["extension", "WXT"]
categories: 浏览器插件开发
---

WXT ([https://wxt.dev/](https://wxt.dev/)), Next-gen Web Extension Framework. 号称下一代浏览器开发框架. 可一套代码 (code base) 开发支持多个浏览器的插件.

## 上路~

WXT 提供了脚手架可以方便我们快速进行开发，但是我们得先安装好环境依赖，这里我们使用 npm, 所以需要安装下 node，可以参考 [https://nodejs.org/en](https://nodejs.org/en).

```shell
# 直接基于脚手架创建项目
npx wxt@latest init yeshan-bowser-extensoin

cd yeshan-bowser-extensoin
# 安装依赖
npm install --registry=https://registry.npmmirror.com

# 开始调试插件
npm run dev
```

![https://telegraph.shansan.top/file/a989ed6d1aee8952789c0.png](https://telegraph.shansan.top/file/a989ed6d1aee8952789c0.png)

## QAQ - WSL2 下开发遇到的问题

使用 WSL2 进行开发的时候，`npm run dev` 在 wsl 是没办法自动打开浏览器的，会吐出如下问题：

```shell
WARN  Cannot open browser when using WSL. Load ".output/chrome-mv3" as an unpacked extension manually
```

大概看了下 wxt 的实现，它是通过 [web-ext](https://github.com/mozilla/web-ext) 跟进指定的浏览器的 bin 文件（默认为 chromium）启动浏览器装载开发好的插件. 曾经通过文章 [chromium-in-wsl2](https://saisuman.org/blog/chromium-in-wsl2) 提到的办法直接在 wsl2 安装了 chromium，还是没能解决此问题😂😣. 翻了下官方仓库的 issue，有关联问题 [https://github.com/wxt-dev/wxt/issues/55](https://github.com/wxt-dev/wxt/issues/55), 本质上是 web-ext 的 BUG [issuecomment-1837565780](https://github.com/mozilla/web-ext/issues/2108#issuecomment-1837565780)，截至 2024/3/15 还未修复.

### 解决方法

没办法了，如果还想继续用 wsl 做开发，只能手动加载插件了，在 windows 上打开 chrome 后，地址栏输入 `chrome://extensions/` 转到插件管理页 (记得开启开发者模式) -> 加载已解压的扩展程序:

![https://telegraph.shansan.top/file/6b2718aa149d6feabb5e5.png](https://telegraph.shansan.top/file/6b2718aa149d6feabb5e5.png)

我们要加载的插件目录是在 wsl 中的（即: `.output/chrome-mv3/`），好在 Window 和 wsl2 的文件文件系统是打通的，可以相互访问，我们可以使用 [wslutils](https://github.com/wslutilities/wslu) 提供的工具获取在 Windows 下可以访问的路径

![https://telegraph.shansan.top/file/b5543ca9568f1fae401b3.png](https://telegraph.shansan.top/file/b5543ca9568f1fae401b3.png)

```shell
# 获取 windows 文件管理器可以访问的地址
❯ wslpath -w .output/chrome-mv3/
\\wsl.localhost\Ubuntu-20.04\home\yeshan333\workspace\github\yeshan-bowser-extensoin\.output\chrome-mv3
```

![https://telegraph.shansan.top/file/67564121734cef6527d83.png](https://telegraph.shansan.top/file/67564121734cef6527d83.png)

Done ~, 搞定咯，可以愉快码代码了~