---
title: (Amazing!) How to manage and install multiple versions of Erlang/OTP and Elixir via vfox in Windows
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "vfox, elixir, erlang, vfox-erlang, vfox-elixir, vfox-plugin"
headimg: https://telegraph.shansan.top/file/e47d436092cf177a103bc.png
description: "通过 vfox 安装在 Windows 上管理多个 Erlang/OTP 和 Elixir 的版本"
date: 2024-06-18 22:58:39
tags: [Elixir, Erlang, vfox, Windows]
categories: [vfox]
---

About a month ago, I wrote an article on how to use the cross-platform version management tool [vfox](https://github.com/version-fox/vfox) to install and manage multiple Erlang/OTP and Elixir version under Linux system -> [Install mutiple Erlang and Elixir with vfox](https://dev.to/yeshan333/install-mutiple-erlang-and-elixir-with-vfox-57ii). the demonstration operation system used in the article is Ubuntu 20.04 Linux operation system.

Recently, the latest version of the [vfox-erlang](https://github.com/version-fox/vfox-erlang) and [vfox-elixir](https://github.com/version-fox/vfox-elixir) plugins has supported the installation and management of multiple version of Erlang/OTP and Elixir under Windows platforms. and has passed the [End to End test](https://en.wikipedia.org/wiki/System_testing) -> [Testing](https://github.com/version-fox/vfox-elixir/actions/runs/9566734284).

![E2E testing](https://telegraph.shansan.top/file/bb7f655d91fc39e97c57c.png)

This article will use the Windows 10 operation system as an example to teach you how to install and manage multiple Erlang/OTP and Elixir version on Windows platforms.

```powershell
> Get-ComputerInfo
WindowsBuildLabEx                                       : 22621.1.amd64fre.ni_release.220506-1250
WindowsCurrentVersion                                   : 6.3
WindowsInstallationType                                 : Client
WindowsProductName                                      : Windows 10 Pro
......
```

## 1、Install vfox

[vfox](https://vfox.lhan.me/) (version-fox) is a popular cross-platform universal version management tool recently. it is written in Go language and the plug-in mechanism uses Lua to realize scalability. currently vfox already supports the management of versions of most mainstream programming languages, and the ecosystem is relatively strong. here you can see the programming language versions and tools currently supported and managed by vfox->  [vfox-Available Plugins](https://vfox.lhan.me/plugins/available.html).

Please be sure to install vfox of version 0.5.3+ and above, otherwise [vfox-erlang](https://github.com/version-fox/vfox-erlang) and [vfox-elixir](https://github.com/version-fox/vfox-elixir) will not work normally. Here we install vfox through winget:

```shell
> winget install vfox
.......

❯ vfox -version
vfox version 0.5.3
```

In order for vfox to find the installed versions of Elixir and Erlang, vfox needs to be mounted to the powershell by default:


```PowerShell
if (-not (Test-Path -Path $PROFILE)) { New-Item -Type File -Path $PROFILE -Force }; Add-Content -Path $PROFILE -Value 'Invoke-Expression "$(vfox activate pwsh)"'
```

If PowerShell prompts: `cannot be loaded because the execution of scripts is disabled on this system`.**Open PowerShell** with **Run as Administrator**.Then, run this command in PowerShell

```shell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned
# After that type Y and press Enter.
y
```

You can also refer to the official document to install vfox -> [https://vfox.lhan.me/guides/quick-start.html](https://vfox.lhan.me/guides/quick-start.html). after installing vfox, we will install the following version management plugins:

```shell
# add vfox-erlang plugin for managine mutiple erlang versions
vfox add erlang
# add vfox-elixir plugin for managine mutiple elixir versions
vfox add elixir
```

After the installation is complete, you can use the two vfox plugins [vfox-erlang](https://github.com/version-fox/vfox-erlang) and [vfox-elixir](https://github.com/version-fox/vfox-elixir) in the Windows platform to install and manage multiple Erlang and Elixir versions.

Let's continue.

## 2、Install Erlang/OTP through vfox-erlang plugin

Since Elixir relies on Erlang/OTP, we need to install Erlang/OTP before installing Elixir. If you have already installed Erlang/OTP through other methods, please ensure that the version of Elixir installed through vfox-elixir is compatible with it. You can check the official documentation of Elixir to confirm this [between-elixir-and-erlang-otp](https://hexdocs.pm/elixir/1.16.2/compatibility-and-deprecations.html#between-elixir-and-erlang-otp).

```shell
# get avaliable version
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

# you can also specify a version to install, such as
vfox install erlang@26.2.2
```

you can install any distribution that appears in the [https://github.com/erlang/otp/releases](https://github.com/erlang/otp/releases) containing the windows executable(exe) file. When you see the following message, the installation is complete.

```shell
compile info.......
...
Install erlang@26.2.2 success! 
Please use vfox use erlang@26.2.2 to use it.
```

We use vfox to switch to the Erlang/OTP version just installed to verify whether the next installation is successful:

```shell
❯ vfox use -g erlang@26.2.2
Now using erlang@26.2.2.
❯ erl
Erlang/OTP 26 [erts-14.2.2] [source] [64-bit] [smp:16:16] [ds:16:16:10] [async-threads:1] [jit:ns]

Eshell V14.2.2 (press Ctrl+G to abort, type help(). for help)
1> 
```

If you can correctly wake up the REPL (Read-Eval-Print Loop) interactive command line, then the installation is fine. Next, start installing Elixir

## 3、Install Elixir via vfox-elixir plugin

Before installing the specified Elixir version, make sure that the currently installed shell can find the toolchain related to the installed Erlang/OTP version.

```shell
# Before the installation starts, switch to the Erlang version that Elixir depends on:
vfox use -g erlang@26.2.2

# Install an Erlang/OTP compatible version of Elixir
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

# such as:
vfox install elixir@v1.16.1-elixir-otp-26
.....
.....
Install elixir@1.16.1-elixir-otp-26 success!
Please use vfox use elixir@1.16.1-elixir-otp-26 to use it.
```

When you see the relevant information such as `Install elixir@1.16.1-elixir-otp-26 success! Please use vfox use elixir@1.16.1-elixir-otp-26 to use it.`, it means that the installation has been completed. Next, verify the availability:

```shell
❯ vfox use -g elixir@1.16.1-elixir-otp-26
Now using elixir@1.15.2.
> iex.bat
Erlang/OTP 26 [erts-14.2.5] [source] [64-bit] [smp:16:16] [ds:16:16:10] [async-threads:1] [jit:ns]                                                                                                                                              Interactive Elixir (1.16.1) - press Ctrl+C to exit (type h() ENTER for help)
iex(1)>
```

If Elixir's REPL (Read-Eval-Print Loop) interactive command line can be opened normally, then the installation is successful and available.

## In the end

vfox's two plug-ins for installing and managing Erlang/OTP and Elixir versions also support managing multiple versions under Uinx-like (Linux & Darwin MacOS) system. You can check this document for more information:[https://github.com/version-fox/vfox-elixir](https://github.com/version-fox/vfox-elixir). Full platform operating system support ~

Happy & funny!
