---
title: 使用tcpdump和Wireshark看下TCP握手
toc: true
comments: true
popular_posts: false
mathjax: true
top: false
music:
  enable: false
  server: netease
  type: song
  id: 26664345
headimg: https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20201115174718.png
date: 2020-11-15 15:52:13
tags: [计算机网路, TCP, tcpdump, Wireshark]
categories: 计算机网络
keywords: "tcpdump, wireshark"
---

tcpdump 和 Wireshark 是最常用的网络抓包和分析工具，作为经常和网络打交道的划水选手，怎么能不了解下呢？补篇博文回顾下相关操作。这里以 example.com 的一次 GET 请求为例，先使用 tcpdump 抓个包，再使用 Wireshark 看下 TCP 的握手。

> 操作环境：WSL2(Ubuntu 20.04 LTS) + Windows 10

<!-- more -->

## 用 tcpdump 抓个包

先在 WSL2 Ubuntu 安装下 tcpdump。

```shell
# 启动 wsl
wsl
# 安装 tcpdump
apt-get install tcpdump
```

抓包需要使用两个终端，一个终端使用 curl 向 example.com 发送请求，一个用于 packets 的抓取。OK，抓包开始：


1、一个终端使用 tcpdump 监听 example.com。

```shell
# terminal 1，监听 example.com 的网络包
tcpdump -nn host example.com -w web.pcap
```

2、另一个终端使用 curl 发送网络请求。

```shell
# terminal 2，发送网络请求
curl example.com
```

请求发送完毕后，`Ctrl + C` 终止终端 1 的监听，将抓取结果 `wep.pcap` 拷贝到 Windows 10 桌面。

```shell
mv web.pcap /mnt/c/Users/yeshan/Desktop/web.pcap
```

![操作](https://s3.ax1x.com/2020/11/15/DFPm6O.gif)

## 拿 Wireshark 看下包

由于 tcpdump 的输出格式并不直观，所以之前将抓取结果写入到 web.pcap。然后这里使用有图形化界面的 Wireshark 去看下刚刚抓下来的网络包 web.pcap。

- 下载安装 Wireshark：[https://www.wireshark.org/download.html](https://www.wireshark.org/download.html)

1、使用 Wireshark 打开 web.pcap。

![wireshark 看包](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20201115173534.png)

2、使用 Wireshark 的统计工具可以看到 TCP 握手的流程。`分析->流量图`

```shell
# 确定 example.com ip
$ dig +short example.com
93.184.216.34
```

![流量图](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20201115174333.png)

![TCP 流](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20201115174144.png)

完美，可以看到经典的 TCP 握手过程。「TCP三次握手，四次挥手：」

![TCP三次握手，四次挥手](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20201115174718.png)

很香的是 Wireshark 提供了许多示例网络包『[SampleCaptures
](https://gitlab.com/wireshark/wireshark/-/wikis/SampleCaptures#grpc)』，计网学习新世界？




