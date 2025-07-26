---
title: 回环地址的一点儿破事
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
music:
  enable: false
  server: netease
  type: song
  id: 26664345
cover: https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/loopback_banner.png
date: 2021-11-27 11:41:50
tags: [Wireshark]
categories: 计算机网络
keywords: "loopback address, IPv4"
---

心血来潮，小水一篇！

## 回环地址（loopback address）

> [loopback](https://en.wikipedia.org/wiki/Loopback) 在维基百科上有一段这样的解释：Loopback (also written loop-back) is the routing of electronic signals or digital data streams back to their source without intentional processing or modification. It is primarily a means of testing the communications infrastructure.
> 通熟的说就是将由“源”发送出去的数据路由回“源”。

<!-- more -->

作为划水选手，我们肯定会接触过这样一个东西 -> Virtual loopback interface。当我们写的应用/服务想在同一台机器上进行通信的时候，基本都会使用到它。



在类 Unix 系统中，虚拟回环接口（Virtual loopback interface）通常被命名为 **lo** 或者 **lo0**。我们可以使用 `ipconfig` 看一下：

![ipconfig loopback address](https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/blogloopback.png)

emmm，127.0.0.1，好家伙，没错，127.0.0.1 就是一个 IPv4 的回环地址。IETF 标准中（[RFC1122](https://www.rfcreader.com/#rfc1122_line1324)、[RFC5735](https://www.rfcreader.com/#rfc5735_line97)）将 IPv4 [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing#CIDR_notation) 地址块 127.0.0.0/8 划为回环地址（即 127.0.0.0 ~ 127.255.255.255）。IPv6 下回环地址为 `::1/128`。

![CIDR 表示](https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/cidr.png)

> IPv6 下 127.0.0.1 表示为 ::1

## 几个常见的小家伙

OK, 回环地址简介完了，接下来让我们看下以下几个常用的“小家伙”：

- localhost
- 0.0.0.0
- 127.0.0.1

在这里，抛出几个问题？再自问自答！😎
- 这三个家伙有什么区别？

显而易见，0.0.0.0 和 127.0.0.1 是 IP 地址嘛，localhost 是 hostname。至于再具体点的东西，可以看下后面两个问题。

- 为什么断网后，我们还能 ping 通这三个东西？

断网的情况下，我们使用 ping 命令，ping 一下公网的 IP 地址，一般是不通的。但是 `ping 127.0.0.1` 却可以。因为 127.0.0.1 是一个回环地址（Loopback Address），操作系统对于走真实网卡的公网 IP 数据包的处理和走虚拟网卡的本机回环地址（之前介绍的 lo 和 lo0，Virtual loopback interface）的处理是不一样的。相对于目标是公网 IP 的数据包走的 ring buffer，回环地址的数据包走了一个数据结构 input_pkt_queue 触发软中断 ksoftirqd 处理，这篇文章有较为深入的介绍 👉[🔗](https://zhuanlan.zhihu.com/p/381408859)🐂。

至于 `ping localhost` 也是通的是因为 localhost DNS 解析到了回环地址 127.0.0.1，可以使用 `cat /etc/hosts` 查看 Linux hosts 文件。IETF 标准 [RFC6761](https://www.rfcreader.com/#rfc6761_line336) 将域名 localhost 默认保留给了回环地址 127.0.0.1。

```bash
➜ cat /etc/hosts
127.0.0.1       localhost
::1     ip6-localhost ip6-loopback
```

至于为什么断网能 ping 通 0.0.0.0，可以结合下一个问题思考一下。

- 开发完后的 Web Service，我们一般会 listen 0.0.0.0，这有什么用？

`listen 0.0.0.0` 会监听本机上的所有IPV4地址。让服务访问方就可以通过本机的多个 IP 地址（包括回环地址，只要服务访问方与本机处于同一个网络下）访问本机的 Web 服务。[RFC 5735](https://datatracker.ietf.org/doc/html/rfc5735#section-3) 对特殊的 0.0.0.0 地址做了介绍。

![ping 0.0.0.0](https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/ping0000.png)

## Wireshark 回环地址抓包

在这里介绍下使用 [Wireshark](https://www.wireshark.org/#download) 抓取回环地址的数据包，

> Wireshark 如果想要抓取回环地址的包（(loopback packets)），需要安装 [Npcap](https://nmap.org/npcap/)。

1、我们本地使用 Go 的 Gin 起个粗糙版 Web 服务：

```go
package main

import "github.com/gin-gonic/gin"

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
```

![Go-Gin](https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/gogin.png)

2、打开 Wireshark，capture 回环地址的虚拟网卡：

![Wireshark capture loopback](https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/wireshark_loopback.png)

3、过滤一下 TCP 端口，curl 一下 localhost:8080/ping：

```bash
curl --location --request GET 'localhost:8080/ping'
```

![Wireshark TCP port filter](https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/wireshark_port_filter.png)

水完，收工！😊

## 参考

- [LoopBack (Virtual loopback interface) - wikipedia](https://en.wikipedia.org/wiki/Loopback)
- [Localhost - wikipedia](https://en.wikipedia.org/wiki/Localhost)
- [断网了，还能ping通 127.0.0.1 吗？为什么？](https://zhuanlan.zhihu.com/p/381408859)