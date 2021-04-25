---
title: Windows Insiders WSLg Linux GUI App 支持尝鲜
toc: true
comments: true
popular_posts: false
mathjax: true
top: false
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
music:
  enable: false
  server: netease
  type: song
  id: 26664345
headimg: https://z3.ax1x.com/2021/04/25/cz309s.png
date: 2021-04-25 18:59:48
tags: [Linux, WSL, GUI]
categories: WSL
references:
  - title: The Windows Subsystem for Linux BUILD 2020 Summary
    url: https://devblogs.microsoft.com/commandline/the-windows-subsystem-for-linux-build-2020-summary/#wsl-gui
  - title: The Initial Preview of GUI app support is now available for the Windows Subsystem for Linux
    url: https://devblogs.microsoft.com/commandline/the-initial-preview-of-gui-app-support-is-now-available-for-the-windows-subsystem-for-linux-2/
  - title: WSLg Architecture
    url: https://devblogs.microsoft.com/commandline/wslg-architecture/
  - title: WSLg - GitHub README
    url: https://github.com/microsoft/wslg
---

2021 年 4 月 21 日，微软在 Developer Blogs 发布了 Windows 预览版 WSL（Windows Linux 子系统） 对 Linux GUI App 的支持的[公告🔗](https://devblogs.microsoft.com/commandline/the-initial-preview-of-gui-app-support-is-now-available-for-the-windows-subsystem-for-linux-2)，碰巧😀我最近重装了波电脑，系统换成了 Windows Insiders（Dev），正好可以感受波 Linux GUI App 的支持。btw，预览版的文件管理器支持访问 WSL 的文件了，6~ 的。

{% gallery %}
![Windows new icons](https://z3.ax1x.com/2021/04/25/czJUAO.png)
{% endgallery %}

WSL 现在居然支持跑 Linux 图形应用了，真香（😎，虽然上一年 WSL 的 [Roadmap](https://devblogs.microsoft.com/commandline/the-windows-subsystem-for-linux-build-2020-summary/#wsl-gui) 中有说过要支持，但我没关注，老二手知识党了）。Quickstart ->

<!-- more -->

## WSLg 的架构

[WSLg](https://github.com/microsoft/wslg) 是支持 Windows 运行 Linux 图形应用的核心项目， Windows Subsystem for Linux GUI 的简写，看了眼 Git commit，8 天前开源的，🐂。README 里面有张 WSLg 的架构图，略微操作下帖到这里：

{% gallery %}
![WSLg Architecture](https://z3.ax1x.com/2021/04/25/czneit.png)
{% endgallery %}

扫了眼，只有 RDP 和 X11 有点印象，这个 Wayland 在最近关于 Ubuntu 21.04 的新闻有看到过，具体原理这里就不了解了，骚就完事了，先跑个 Linux GUI App 感受波。

已有微软大佬对 WSLg 的架构做了详细的介绍，参见文章：[WSLg Architecture](https://devblogs.microsoft.com/commandline/wslg-architecture/)

## Windows Insiders Dev 跑下 Linux GUI App

这里又到了经典的环境配置环节（干啥啥不行，老装环境选手了）。不得不说，Windows 系统换成 Insiders 版本真香，WSL 安装一句命令就完事了。虽然又碰到了许久未见到的经典蓝屏问题，但还是阔以接受的，我 giao。

看波 WSLg 的 README，配下环境，操作系统版本要 21362+，还得微微更新波🤨：

{% gallery %}
![Upgrade Windows System](https://z3.ax1x.com/2021/04/25/czKy26.png)
{% endgallery %}

Sometime later...................

{% gallery %}
![Windows insiders version](https://z3.ax1x.com/2021/04/25/czMjOO.png)
{% endgallery %}

OK，可以操作了，之前我已经安装过 WSL，且切换到了 v2 版本，so，按照 README 所说，只需要进行如下操作即可。

以 **Administrator 身份**启动 Powershell 执行以下命令：

```bash
# 1、重启下 WSL
wsl --shutdown
# 2、Update
wsl --update
```

{% gallery %}
![WSL Update](https://z3.ax1x.com/2021/04/25/cz8Rqf.png)
{% endgallery %}

然后随意装个 GUI App 感受下，装个 gedit 吧：

```bash
# Nautilus 文件管理器，可在 Windows 开始菜单启动 Linux GUI App
sudo apt install nautilus -y
sudo apt install gedit -y
```

{% gallery %}
![Windows Desktop Gedit](https://z3.ax1x.com/2021/04/25/cz8LLV.png)
{% endgallery %}

还阔以，虽然我是“命令行仔”了，但时不时用下 GUI App 还是香的。





