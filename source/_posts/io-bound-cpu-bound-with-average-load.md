---
title: 从平均负载开始，这进程是 CPU Bound 还是 IO Bound 的？
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
date: 2021-10-07 16:12:38
tags: [Linux, 压力测试, CPU Bound, IO Bound]
categories:
  - Linux
  - 性能优化
keywords: "Linux 性能问题排查"
---

在排查性能问题的时候，我们经常会使用 top 或者 uptime 两个 Linux 命令，top 命令和 uptime 命令都会给出最近机器 1 min，5 min，15 min 的平均负载情况，一般平均负载值（Average Load）接近甚至超出 CPU cores (现在一般指 processors 的个数, 现在 CPU 的一个 core 一般有两个 processor, 可以处理两个进程) 时，系统会有性能瓶颈.

> 平均负载是指单位时间内，系统处于可运行状态和不可中断状态的平均进程数，也就是平均活跃进程.

造成平均负载升高的原因一般有以下几种：
- 1、有 IO Bound 进程（即存在 IO 密集型任务）
- 2、有 CPU Bound 进程（即存在 CPU 密集型任务）
- 3、处于就绪状态（Ready）的进程多
- .....

本篇文章主要记录下造成平均负载升高的两个场景. IO 密集型场景和 CPU 密集型场景.

这里的实验环境在一个操作系统为 Ubuntu 20.04.3 LTS 的容器内, 通过 stress 进行 IO Bound 与 CPU Bound 场景的模拟, 宿主机有 16 个 processors, 8G 运行内存.


```bash
docker run --rm -it  ubuntu:latest

root@bfdbc798879c:/# cat /etc/os-release
NAME="Ubuntu"
VERSION="20.04.3 LTS (Focal Fossa)"
ID=ubuntu
ID_LIKE=debian
PRETTY_NAME="Ubuntu 20.04.3 LTS"
VERSION_ID="20.04"
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
VERSION_CODENAME=focal
UBUNTU_CODENAME=focal
```

```bash
root@bfdbc798879c:/# top
top - 11:21:53 up  3:10,  0 users,  load average: 0.66, 0.79, 0.46
Tasks:   2 total,   1 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu0  :  1.0 us,  0.6 sy,  0.0 ni, 93.3 id,  0.0 wa,  0.0 hi,  5.1 si,  0.0 st
%Cpu1  : 10.2 us,  0.3 sy,  0.0 ni, 88.1 id,  0.0 wa,  0.0 hi,  1.3 si,  0.0 st
%Cpu2  : 10.4 us,  2.7 sy,  0.0 ni, 87.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu3  :  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu4  : 11.1 us,  0.7 sy,  0.0 ni, 88.3 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu5  :  0.0 us,  0.3 sy,  0.0 ni, 99.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu6  :  0.7 us,  1.3 sy,  0.0 ni, 98.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu7  :  3.0 us,  0.0 sy,  0.0 ni, 97.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu8  :  0.3 us,  1.0 sy,  0.0 ni, 98.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu9  :  0.7 us,  0.0 sy,  0.0 ni, 99.3 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu10 :  0.0 us,  0.0 sy,  0.0 ni, 99.7 id,  0.3 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu11 :  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu12 :  0.3 us,  0.3 sy,  0.0 ni, 99.0 id,  0.3 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu13 :  0.3 us,  0.0 sy,  0.0 ni, 99.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu14 : 10.7 us,  0.7 sy,  0.0 ni, 88.6 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu15 :  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   7829.4 total,   1913.4 free,   1582.2 used,   4333.7 buff/cache
MiB Swap:   2048.0 total,   2047.7 free,      0.3 used.   5582.8 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 root      20   0    4232   3504   2952 S   0.0   0.0   0:00.02 bash
   12 root      20   0    6092   3332   2828 R   0.0   0.0   0:00.08 top

root@bfdbc798879c:/# free -mh
              total        used        free      shared  buff/cache   available
Mem:          7.6Gi       1.6Gi       1.8Gi       410Mi       4.3Gi       5.4Gi
Swap:         2.0Gi       0.0Ki       2.0Gi
```

让我们先安装一下 [stress](https://linux.die.net/man/1/stress) 压力测试工具和系统观测要用到的工具.

```bash
apt-get update
apt-get install -y stress sysstat
```

## CPU Bound 场景

这里我们让三个逻辑 CPU 满载:

```bash
# 持续 10 min, 3 CPU 满载
stress -c 3 -t 600
```

我们用 watch 命令持续观察平均负载情况, 平均负载在逐渐变高，此时我的电脑 CPU 风扇也很响了😂

```bash
watch -d uptime
```

我们在使用 top 命令可以看到有三个 CPU 已经满载了，使用率百分百，还可以看到是哪个 COMMMAND 造成的，

![TOP 命令查看系统情况](https://z3.ax1x.com/2021/10/07/5pfxOK.png)

但是上面不能很清楚的看到 IO 的情况，接下来我们用 [mpstat](https://www.linuxcool.com/mpstat) 每隔 5 秒将所有 CPU 的观测情况打出来：

```bash
mpstat -P ALL 5
```

![所有 CPU 使用情况](https://z3.ax1x.com/2021/10/07/5pfWzq.png)

可以很清楚的看到，的确有三个 CPU 的空闲状态为 0（满载），使用率百分百，且 IO Wait 等待时间是很低的，所以单单 CPU Bound 场景可造成 Average Load 的升高.

不使用 top 命令,使用 pidstat 每隔 5 秒, 三次打印进程的 CPU 情况可定位出是哪个进程造成的平均负载升高.

```bash
root@bfdbc798879c:/# pidstat -u 5 3
Linux 5.4.72-microsoft-standard-WSL2 (bfdbc798879c)     10/07/21        _x86_64_        (16 CPU)

12:01:29      UID       PID    %usr %system  %guest   %wait    %CPU   CPU  Command
12:01:34        0       571  100.00    0.00    0.00    0.00  100.00     9  stress
12:01:34        0       572  100.00    0.00    0.00    0.00  100.00    15  stress
12:01:34        0       573  100.00    0.00    0.00    0.00  100.00    11  stress
```

## IO Bound 场景

stress 压力工具也可以方便的进行 IO Bound 场景的模拟,

开始之前将上面 CPU Bound 场景给终止, 同样地, 我们先开好一个 Terminal 观察平均负载的变化:

```bash
watch -d uptime
```

使用 strees 调起 50 个进程(这里要高于 CPU processors 的数量, 让进程争夺 CPU), 不断打 IO, 持续 10 min:

```bash
root@bfdbc798879c:/# stress -i 50 -t 600
stress: info: [1756] dispatching hogs: 0 cpu, 50 io, 0 vm, 0 hdd
```

可以观察到, 平均负载在不断升高, 再使用 mpstat 可以观测到 IO Wait 很高.

```bash
mpstat -P ALL 5
```

![IO Bound](https://z3.ax1x.com/2021/10/07/5poZCQ.png)

可以 GET 到 IO Bound 任务的确会造成平均负载升高, 结合 iostat, 我们还可以观测磁盘设备的读写性能情况:

```bash
iostat -d -x
```

![iostat](https://z3.ax1x.com/2021/10/07/5powb6.png)






