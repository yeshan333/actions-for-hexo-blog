---
title: 使用 vfox-erlang 安装管理多个 Erlang/OTP 版本
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "Erlang/OTP, erlang, vfox, version fox, vfox-erlang"
cover: https://gallery.shansan.top/file/ac02992ae1fb890558382.png
description: "使用 vfox-erlang 安装管理多个 Erlang/OTP 版本"
date: 2024-04-25 23:15:01
tags: [Erlang/OTP, vfox, vfox-plugin, vfox-erlang]
categories: vfox
---

vfox (version fox) 是一款跨平台、可拓展的通用版本管理器. 支持原生 Windows 以及 Unix-like 系统! 通过它, 可以快速安装和切换开发环境的软件版本. 最近给 vfox 水了几个插件, 其中就有管理多个 Erlang/OTP 版本的, 很喜欢他的插件管理机制. 之前也有使用过类似的工具 [asdf](https://github.com/asdf-vm/asdf), 不过 asdf 之前的使用体验不怎么好 (木有拉踩的意思~, asdf 的生态是非常强大的), vfox 现在支持的插件已经非常之多了, 已经可以管理大多数常见主流语言的版本. 

vfox 的版本管理工作流大体上是和 asdf 类似的, 不过性能要好一点 (5 倍左右), 毕竟 asdf 核心是 shell 写的. 官方文档也给出了一份基准测试, 参见 [《Comparison with asdf-vm》](https://vfox.lhan.me/misc/vs-asdf.html)：

![https://vfox.lhan.me/performence.png](https://vfox.lhan.me/performence.png)

vfox 和 asdf 一样, 可以通过 `.tool-version` 配置文件设置全局和项目级使用到的版本, 这意味着如果你从 asdf 切换到 vfox, 相当的方便.

## vfox-erlang 的使用

本篇文章主要介绍怎么使用 [vfox-erlang](https://github.com/version-fox/vfox-erlang) 插件, 在同一台机器上管理多个 Erlang/OTP 的版本. 一般在开发环境拥有多个版本的 Erlang/OTP 供测试比对也是常见的需求. 

目前插件的实现上实际的安装过程是通过从源码进行编译安装 Erlang/OTP 的, 所以暂时只支持在 Unix-like 系统 (比如 ubuntu、macos darwin 等) 上安装管理 Erlang/OTP 的版本 (官方其实提供了 exe 安装器在 windows, 还没时间去研究加上去 2333~, 不过在 windows 使用 [Erlang](https://www.erlang.org/) 的场景一般也比较少)。

> Erlang 是一种编程语言, 用于构建具有高可用性要求的大规模可扩展软实时系统。它的一些用途是电信、银行、电子商务、计算机电话和即时通讯。Erlang 的运行时系统内置了对并发、分布和容错的支持。
> OTP 是一组 Erlang 库和设计原则, 提供中间件来开发这些系统。它包括自己的分布式数据库、用于连接其他语言的应用程序、调试和发布处理工具。

### 安装 vfox 和 vfox-erlang 插件

在使用 vfox-erlang 管理 Erlang/OTP 版本之前, 请确保你已经在你的机器上安装好了 vfox, 可以参考官方的文档 [Quick Start](https://vfox.lhan.me/guides/quick-start.html#_1-installation), 本文以 Ubuntu 为例.

```shell
# 安装 vfox
echo "deb [trusted=yes] https://apt.fury.io/versionfox/ /" | sudo tee /etc/apt/sources.list.d/versionfox.list
sudo apt-get update -y
sudo apt-get install vfox -y

# 让 vfox hook 你的 shell, 偏于 vfox 识别使用的 Erlang/OTP 版本
echo 'eval "$(vfox activate bash)"' >> ~/.bashrc

# 添加 vfox-erlang 插件
vfox add erlang
```

### 安装使用指定版本 Erlang/OTP

由于是是从源码编译安装的 Erlang/OTP, 所以我们需要有对应的构建工具链和依赖软件, 这里以 Ubuntu 20.04 下安装为例:

```shell
# “无脑”安装依赖的软件
sudo apt-get -y install build-essential autoconf m4 libncurses5-dev libwxgtk3.0-gtk3-dev libwxgtk-webview3.0-gtk3-dev libgl1-mesa-dev libglu1-mesa-dev libpng-dev libssh-dev unixodbc-dev xsltproc fop libxml2-utils libncurses-dev openjdk-11-jdk
```

然后我们即可通过 vfox 管理安装多个 Erlang/OTP 版本了。

```shell
# 可以使用 search 命令查找可供安装的版本
❯ vfox search erlang
Please select a version of erlang [type to search]: 
->  v25.3.2.5
   v24.0-rc3
   v24.3
   v23.3.4.18
   v24.0.6
   v24.3.2
   v25.3
   v24.1.4
   v26.0.2
```

```shell
# 或者直接指定一个版本安装
> vfox install erlang@26.2.2
...
Install erlang@26.2.2 success! 
Please use vfox use erlang@26.2.2 to use it.
```

当你看到类似 Install erlang@xxx success! 的信息, 就意味着安装完成了。接下来可以通过 `vfox use` 命令切换版本, 即可让当前 shell 会话可以使用对应的 Erlang/OTP 版本了.

```shell
vfox use erlang@26.2.2
```

![vfox use demo](https://gallery.shansan.top/file/29090c88952e670c3448d.png)

vfox 提供了三种视角的版本管理方法: shell 会话、项目级、全局, 通过一个 `.tool-versions`, 可以灵活的为不同的项目目录分配使用不同的 Erlang/OTP 版本, 跟多信息可以查看官方文档的介绍: [vfox-Switch runtime](https://vfox.lhan.me/guides/quick-start.html#_5-switch-runtime).

本篇文章的使用示例主要以 Linux 系统为主, 但是 vfox-erlang 的使用文档上也给出了在 MacOS Darwin 系统下的使用指南 [install-in-darwin-macos-13](https://github.com/version-fox/vfox-erlang?tab=readme-ov-file#install-in-darwin-macos-13), 并提供了在 Linux 和 MacOS 下持续集成测试供参考: [vfox-erlang E2E testing](https://github.com/version-fox/vfox-erlang/blob/main/.github/workflows/e2e_test.yaml).

![e2e testing](https://gallery.shansan.top/file/d599dfa1042f22ce7c94f.png)

Happy and funny~