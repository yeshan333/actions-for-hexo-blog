---
title: 常用的 Linux 网络相关的命令
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
date: 2021-09-25 16:34:52
tags: Linux
categories: Linux
keywords: "Linux, Network"
---

水文警告⚠😂，最近这些玩意用得多，微微记录一下，目前写的比较水，后面应该会补点实践经验🚩。

<!-- more -->
## netstat

netstat 一般用于查看 Socket 的使用情况。这命令在 [Windows](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/netstat) 下也可直接使用（但参数有一定的差异）。如使用 Ubuntu 需要安装 [net-tools](https://helpmanual.io/packages/apt/net-tools/)

```
# ubuntu
$ apt install net-tools
```

常用命令：

```bash
# 1、查看 TCP Socket 情况，TCP 连接的状态
$ netstat -at
Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 172.25.239.216:51430    aerodent.canonical:http TIME_WAIT
# 2、查看 TCP Socket 统计信息
$ netstat -st
Tcp:
    3 active connection openings
    0 passive connection openings
    0 failed connection attempts
    0 connection resets received
    0 connections established
    248 segments received
    195 segments sent out
    5 segments retransmitted
    0 bad segments received
    0 resets sent
```

## ss

ss 的作用跟 netstat 很相似，但当服务器连接数非常多的时候，执行速度比 netstat [快很多](https://stackoverflow.com/a/11778337)，如果 `man netstat` 一下，netstat 的手册中也推荐使用 ss。

```bash
$ man netstat
NOTES
       This program is mostly obsolete.  Replacement for netstat is ss.  Replacement for netstat -r is ip route.  Replacement for netstat -i  is  ip  -s
       link.  Replacement for netstat -g is ip maddr.
```

常用命令：

```bash
# 1、显示 TCP Socket 使用状况
$ ss -t -a
State       Recv-Q Send-Q    Local Address:Port     Peer Address:Port
ESTABLISH   0      0         172.16.0.12:46148      13.229.188.59:https
...

# 2、列出所有打开的端口，配合 grep，可查看指定端口使用情况
$ ss -pl | grep 8080
```

## dig

域名查询工具，一般用于查看主机 DNS 轮询解析状况。一般 Linux 系统都会自带这个命令。

```bash
# 安装
$ apt-get install dnsutils
```

常用：

```bash
# 1、指定 DNS Server 查看域名 DNS 解析情况
$ dig @8.8.8.8 shansan.top

; <<>> DiG 9.16.1-Ubuntu <<>> @8.8.8.8 shansan.top
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 44094
;; flags: qr rd ra; QUERY: 1, ANSWER: 5, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; QUESTION SECTION:
;shansan.top.                   IN      A

;; ANSWER SECTION:
shansan.top.            600     IN      CNAME   yeshan333.github.io.
yeshan333.github.io.    3600    IN      A       185.199.108.153
yeshan333.github.io.    3600    IN      A       185.199.109.153
yeshan333.github.io.    3600    IN      A       185.199.110.153
yeshan333.github.io.    3600    IN      A       185.199.111.153

;; Query time: 160 msec
;; SERVER: 8.8.8.8#53(8.8.8.8)
;; WHEN: Sat Sep 25 21:00:48 CST 2021
;; MSG SIZE  rcvd: 137

# 2、查看指定 DNS 类型记录，如 CNAME
$ dig shansan.top CNAME

# 3、反向解析 IP 地址对应域名
$ dig -x 8.8.8.8 +short
```

## nslookup

nslookup 命令的作用和 dig 命令类似，在 Windows 下的 [PowerShell](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup) & Linux 可以直接使用。

常用：

```bash
# 1、指定 DNS Server 查询域名解析信息
➜ nslookup shan333.cn f1g1ns1.dnspod.net
Server:         f1g1ns1.dnspod.net
Address:        61.151.180.44#53

Name:   shan333.cn
Address: 111.230.58.139
```


