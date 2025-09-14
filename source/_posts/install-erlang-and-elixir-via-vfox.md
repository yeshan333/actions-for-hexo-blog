---
title: 通过 vfox 安装管理多版本 Erlang 和 Elixir
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "vfox, elixir, erlang, vfox-erlang, vfox-elixir, vfox-plugin"
music:
  enable: false
  server: netease
  type: song
  id: 26664345
cover: https://blog-cloudflare-imgbed.pages.dev/file/82ff2d010a3c8d2fb3973.png
description: "通过 vfox 安装管理多版本 Erlang 和 Elixir"
date: 2024-04-27 15:36:31
tags: [Elixir, Erlang, vfox]
categories: [vfox]
---

[vfox](https://vfox.lhan.me/) (version-fox) 是最近比较热门的一个通用版本管理工具，使用 Go 语言进行编写，插件机制使用了 Lua 去实现扩展性. 目前 vfox 已经支持管理大多数主流编程语言的版本，生态还算强大。在这里你可以看到目前 vfox 所支持管理的编程语言版本和工具 -> [vfox-Available Plugins](https://vfox.lhan.me/plugins/available.html)

Elixir 和 Erlang 社区一直以来都比较流行通过 [asdf](https://asdf-vm.com/) 去安装和管理多版本环境。asdf 也是一个通用的版本管理工具，生态非常的丰富。

vfox 的版本管理上和 asdf 很像，均通过 `.tool-versions` 文件去管理项目级和全局的版本信息。这意味着如果你之前使用了 asdf，那么切换到 vfox，不会很困难。因为 vfox 和 asdf 的核心实现有有点不一样，vfox 的执行速度比 asdf 快了将近 5 倍~，官方文档也给出了基准测试结果：[version-fox Comparison with asdf-vm](https://vfox.lhan.me/misc/vs-asdf.html)

![https://vfox.lhan.me/performence.png](https://vfox.lhan.me/performence.png)

如果你之前使用 asdf 去管理维护多个 [Erlang](https://www.erlang.org/) 和 [Elixir](https://elixir-lang.org/) 的版本，那么 vfox 也是一个不错的选择，值的一试。

本篇文章将会介绍如果通过 vfox 去安装和管理多个 Erlang 和 Elixir 的版本。

## 安装 vfox

[vfox](https://vfox.lhan.me/) (version-fox) 的跨操作系统支持上很友好，这意味可以 Windows 和 Unix-like 系统上使用它。本篇文章的核心是通过 vfox 去安装和管理多个 Erlang 和 Elixir 语言的版本。因为目前 vfox 的两个管理 Erlang 和 Elixir 版本的插件实现上还没有去支持在 Windows 操作系统下的管理，所以本篇文章的示例环境主要是 Ubuntu 20.04 Linux 环境。让我们开始吧~

先安装下 vfox (version fox):

```shell
echo "deb [trusted=yes] https://apt.fury.io/versionfox/ /" | sudo tee /etc/apt/sources.list.d/versionfox.list
sudo apt-get update
sudo apt-get install vfox
```

为了能让 vfox 找到已经安装的 Elixir 和 Erlang 版本，需要将 vfox 默认挂载到 shell 中。接下来修改下 shell 的配置 (以 Bash 为例)：

```shell
echo 'eval "$(vfox activate bash)"' >> ~/.bashrc
```

你也可以参考这个官方文档安装 vfox -> [https://vfox.lhan.me/guides/quick-start.html](https://vfox.lhan.me/guides/quick-start.html)。安装好 vfox 之后，我们再安装下插件：

```shell
# 添加 vfox-erlang 插件
vfox add erlang
# 添加 vfox-elixir 插件
vfox add elixir
```

接下来我们就可以通过上面安装好的两个 vfox 插件 [vfox-erlang](https://github.com/version-fox/vfox-erlang) 和 [vfox-elixir](https://github.com/version-fox/vfox-elixir) 去安装管理多个 Erlang 和 Elixir 的版本了。

### 通过 vfox-erlang 插件安装 Erlang/OTP

因为 Elixir 依赖于 Erlang，所以在安装 Elixir 之前，我们需要先安装下 Erlang。Erlang 的安装是通过对应版本的源码进行安装的，所以我们需要有对应的编译工具链，这里以 Ubuntu 20.04 为例：

```shell
sudo apt-get -y install build-essential autoconf m4 libncurses5-dev libwxgtk3.0-gtk3-dev libwxgtk-webview3.0-gtk3-dev libgl1-mesa-dev libglu1-mesa-dev libpng-dev libssh-dev unixodbc-dev xsltproc fop libxml2-utils libncurses-dev openjdk-11-jdk
```

接下来可以安装 Erlang 了。

```shell
# 通过 vfox search 找到你想要安装的版本
❯ vfox search erlang
Please select a version of erlang [type to search]: 
->  v25.0.4
   v24.3.4.16
   v24.1.3
   v24.0
   v24.3
   v24.3.2
   v25.2
   v27.0-rc2
   v24.3.4.1
Press ↑/↓ to select and press ←/→ to page, and press Enter to confirm

# 当然你也可以指定安装一个版本，比如
vfox install erlang@26.2.2
```

理论上，你可以安装任何一个出现在 [https://github.com/erlang/otp/releases](https://github.com/erlang/otp/releases) 的版本。因为是从源码编译安装的, 所以安装过程会花费点时间。当你看到如下信息，就表明安装完成了。

```shell
compile info.......
...
Install erlang@26.2.2 success! 
Please use vfox use erlang@26.2.2 to use it.
```

我们使用 vfox 切换下到刚才安装好的 Erlang/OTP 版本来验证下安装是否成功:

```shell
❯ vfox use erlang@26.2.2
Now using erlang@26.2.2.
❯ erl
Erlang/OTP 26 [erts-14.2.2] [source] [64-bit] [smp:16:16] [ds:16:16:10] [async-threads:1] [jit:ns]

Eshell V14.2.2 (press Ctrl+G to abort, type help(). for help)
1> 
```

如果能正确唤醒 REPL，那么安装就好啦~。接下来开始安装 Elixir 吧~

### 安装 Elixir

因为安装 Elixir 也是从对应版本的源码进行编译安装的，Elixir 的编译需要依赖到 Erlang，我们先让当前使用的 shell 能找到刚才安装好的 Erlang。

```shell
# 切换 Erlang 版本
❯ vfox use erlang@26.2.2
Now using erlang@26.2.2.
# 安装 Elixir，将会使用对应的 erlc 编译器
> vfox install elixir@1.15.2
.........
.........
Generated ex_unit app
==> logger (compile)
Generated logger app
Generated eex app
==> iex (compile)
Generated iex app
Install elixir@1.15.2 success! 
Please use vfox use elixir@1.15.2 to use it.
```

当你看到 Install elixir@1.15.2 success!，也就意味着安装成功了。可以通过 iex 确认下安装彻底成功:

```shell
❯ vfox use elixir@1.15.2
Now using elixir@1.15.2.
❯ iex
Erlang/OTP 26 [erts-14.2.2] [source] [64-bit] [smp:16:16] [ds:16:16:10] [async-threads:1] [jit:ns]

Interactive Elixir (1.15.2) - press Ctrl+C to exit (type h() ENTER for help)
iex(1)> 
```


如果你想要安装其他版本的 Elixir，请确保当前使用的 Erlang/OTP 版本和 Elixir 版本是兼容的，可以查看这个文档去确认兼容性: [《compatibility-and-deprecations.html#between-elixir-and-erlang-otp》](https://hexdocs.pm/elixir/1.16.2/compatibility-and-deprecations.html#between-elixir-and-erlang-otp)。

### 设置全局使用版本

我们可以使用 `vfox use -g xxx` 设置默认使用的 Erlang 和 Elixir 版本。

```shell
> vfox use -g erlang@26.2.2
> vfox use -g elixir@1.15.2

# 可以查看 .tool-versions 确认设置是否完成
> cat ~/.version-fox/.tool-versions 
erlang 26.2.2
elixir 1.15.2
```

## 最后

vfox 的两个安装管理 Erlang/OTP 和 Elixir 版本的插件同时也支持在 MacOS Darwin 下管理多个版本。你可以查看这个文档去了解更多信息: [https://github.com/version-fox/vfox-elixir?tab=readme-ov-file#install-in-darwin-macos-13](https://github.com/version-fox/vfox-elixir?tab=readme-ov-file#install-in-darwin-macos-13).

Happy & funny!