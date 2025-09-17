---
title: (Amazing!) 通过 vfox 在 Windows 上安装管理多个 Erlang/OTP 和 Elixir 的版本
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "vfox, elixir, erlang, vfox-erlang, vfox-elixir, vfox-plugin"
cover: https://gallery.shansan.top/file/e47d436092cf177a103bc.png
description: "通过 vfox 安装在 Windows 上管理多个 Erlang/OTP 和 Elixir 的版本"
date: 2024-06-18 22:58:39
tags: [Elixir, Erlang, vfox, Windows]
categories: [vfox]
---

大概一个多月前, 我写了篇关于如何使用跨平台版本管理工具 vfox 在 Linux 系统下安装管理多个 Erlang/OTP 版本的文章 -> [通过 vfox 安装管理多版本 Erlang 和 Elixir](https://shan333.cn/2024/04/27/install-erlang-and-elixir-via-vfox/). 文章使用的示范操作系统是 Ubuntu 20.04 Linux 操作系统. 

最近 [vfox-erlang](https://github.com/version-fox/vfox-erlang) 和 [vfox-elixir](https://github.com/version-fox/vfox-elixir) 插件的最新版本已经支持了在 Windows 平台下安装管理多个 Erlang/OTP 和 Elixir 的版本. 且已经通过了 [End to End](https://en.wikipedia.org/wiki/System_testing) 测试 -> [Testing](https://github.com/version-fox/vfox-elixir/actions/runs/9566734284).

![E2E testing](https://gallery.shansan.top/file/bb7f655d91fc39e97c57c.png)

本篇文章将会以 Windows 10 操作系统为例, 教你如何在 Windows 平台安装和管理多个 Erlang/OTP 和 Elixir 版本. 

```powershell
> Get-ComputerInfo
WindowsBuildLabEx                                       : 22621.1.amd64fre.ni_release.220506-1250
WindowsCurrentVersion                                   : 6.3
WindowsInstallationType                                 : Client
WindowsProductName                                      : Windows 10 Pro
......
```

## 1、安装 vfox

[vfox](https://vfox.lhan.me/) (version-fox) 是最近比较热门的一个跨平台通用版本管理工具, 使用 Go 语言进行编写, 插件机制使用了 Lua 去实现扩展性. 目前 vfox 已经支持管理大多数主流编程语言的版本, 生态还算强大. 在这里你可以看到目前 vfox 所支持管理的编程语言版本和工具 -> [vfox-Available Plugins](https://vfox.lhan.me/plugins/available.html). 

请确安装 0.5.3 及以上版本的 vfox, 否则 [vfox-erlang](https://github.com/version-fox/vfox-erlang) 和 [vfox-elixir](https://github.com/version-fox/vfox-elixir) 将无法正常工作. 在这里我们通过 [winget](https://github.com/microsoft/winget-cli) 安装 vfox:

```shell
> winget install vfox
.......

❯ vfox -version
vfox version 0.5.3
```

为了能让 vfox 找到已经安装的 Elixir 和 Erlang 版本, 需要将 vfox 默认挂载到 powershell 中: 

打开 PowerShell 配置文件:

```shell
New-Item -Type File -Path $PROFILE # 无需在意 `文件已存在` 错误

# 如果它提示未能找到路径, 那么你需要强制创建 profile. 添加 "-Force" 选项. 
# New-Item -Type File -Path $PROFILE –Force

Invoke-Item $PROFILE # 打开 profile
```

将下面一行添加到你的 $PROFILE 文件末尾并保存:

```shell
Invoke-Expression "$(vfox activate pwsh)"
```

如果powershell提示: `在此系统上禁止运行脚本`, 那么请你**以管理员身份重新运行powershell**输入如下命令

```shell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned
# 之后输入Y, 按回车
y
```

你也可以参考官方文档安装 vfox -> [https://vfox.lhan.me/guides/quick-start.html](https://vfox.lhan.me/guides/quick-start.html). 安装好 vfox 之后, 我们再安装下版本管理插件: 

```shell
# 添加 vfox-erlang 插件
vfox add erlang
# 添加 vfox-elixir 插件
vfox add elixir
```

安装完成后就可以使用这两个 vfox 插件 [vfox-erlang](https://github.com/version-fox/vfox-erlang) 和 [vfox-elixir](https://github.com/version-fox/vfox-elixir) 在 Windows 平台去安装管理多个 Erlang 和 Elixir 的版本了. 

## 2、通过 vfox-erlang 插件安装 Erlang/OTP

因为 Elixir 依赖于 Erlang/OTP, 所以在安装 Elixir 之前, 我们需要先安装下 Erlang/OTP. 如果你已经通过其他方式安装了 Erlang/OTP, 请确保后续通过 vfox-elixir 安装的 Elixir 版本与它是兼容的, 可以查看 Elixir 官方文档说明去确认这一点 [between-elixir-and-erlang-otp](https://hexdocs.pm/elixir/1.16.2/compatibility-and-deprecations.html#between-elixir-and-erlang-otp). 

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

# 当然你也可以指定安装一个版本, 比如
vfox install erlang@26.2.2
```

理论上, 你可以安装任何一个出现在 [https://github.com/erlang/otp/releases](https://github.com/erlang/otp/releases) 中包含 exe 文件的发行版本. 当你看到如下信息, 就表明安装完成了. 

```shell
compile info.......
...
Install erlang@26.2.2 success! 
Please use vfox use erlang@26.2.2 to use it.
```

我们使用 vfox 切换下到刚才安装好的 Erlang/OTP 版本来验证下安装是否成功:

```shell
❯ vfox use -g erlang@26.2.2
Now using erlang@26.2.2.
❯ erl
Erlang/OTP 26 [erts-14.2.2] [source] [64-bit] [smp:16:16] [ds:16:16:10] [async-threads:1] [jit:ns]

Eshell V14.2.2 (press Ctrl+G to abort, type help(). for help)
1> 
```

如果能正确唤醒 REPL (Read-Eval-Print Loop) 交互式命令行, 那么安装就好啦~. 接下来开始安装 Elixir 吧~

## 3、 通过 vfox-elixir 插件安装 Elixir

在开始安装指定的 Elixir 版本之前, 请确保当前安装的 shell 能找到已经安装好 Erlang/OTP 版本相关工具链

```shell
# 切换 Erlang/OTP 版本
vfox use -g erlang@26.2.2

# 安装一个与 Erlang/OTP 版本兼容的 Elixir 版本
> vfox search elixir
Please select a version of elixir to install [type to search]:
->  v1.16.2-elixir-otp-26
   v1.16.2-elixir-otp-25
   v1.16.2-elixir-otp-24
   v1.16.1-elixir-otp-26
   v1.16.1-elixir-otp-25
   v1.16.1-elixir-otp-24
   v1.16.0-rc.1-elixir-otp-26
   v1.16.0-rc.1-elixir-otp-25
   v1.16.0-rc.1-elixir-otp-24
   v1.16.0-rc.0-elixir-otp-26
   v1.16.0-rc.0-elixir-otp-25
   v1.16.0-rc.0-elixir-otp-24
   v1.16.0-elixir-otp-26
   v1.16.0-elixir-otp-25
   v1.16.0-elixir-otp-24
   v1.15.7-elixir-otp-26
   v1.15.7-elixir-otp-25
   v1.15.7-elixir-otp-24
   v1.15.6-elixir-otp-26
   v1.15.6-elixir-otp-25
Press ↑/↓ to select and press ←/→ to page, and press Enter to confirm

# 比如
vfox install elixir@v1.16.1-elixir-otp-26
.....
.....
Install elixir@1.16.1-elixir-otp-26 success!
Please use vfox use elixir@1.16.1-elixir-otp-26 to use it.
```

当你看到形如 `Install elixir@1.16.1-elixir-otp-26 success! Please use vfox use elixir@1.16.1-elixir-otp-26 to use it.` 相关信息, 就代表安装已经完成了, 接下来验证下可用性: 

```shell
❯ vfox use -g elixir@1.16.1-elixir-otp-26
Now using elixir@1.15.2.
> iex.bat
Erlang/OTP 26 [erts-14.2.5] [source] [64-bit] [smp:16:16] [ds:16:16:10] [async-threads:1] [jit:ns]                                                                                                                                              Interactive Elixir (1.16.1) - press Ctrl+C to exit (type h() ENTER for help)
iex(1)>
```

Elixir 的 REPL (Read-Eval-Print Loop) 交互式命令行能正常打开的话, 那么安装时成功且可用的. 

## 最后

vfox 的两个安装管理 Erlang/OTP 和 Elixir 版本的插件同时也支持在 Uinx-like (Linux & Darwin MacOS) 系统下管理多个版本. 你可以查看这个文档去了解更多信息: [https://github.com/version-fox/vfox-elixir](https://github.com/version-fox/vfox-elixir). 全平台操作系统支持~

Happy & funny!
