---
title: 操作系统笔记-IPC 机制
toc: true
comments: true
popular_posts: false
mathjax: true
top: false
date: 2020-08-02 14:53:41
tags: 进程通信
categories: 操作系统
thumbnail: https://s1.ax1x.com/2020/07/23/UOX79J.png
---

>进程间通信（IPC，Inter-Process Communication），指至少两个进程或线程间传送数据或信号的一些技术或方法。

## 总览

{% gallery %}
![IPC](https://s1.ax1x.com/2020/08/02/atGjjf.png)
{% endgallery %}

<!-- more -->

### 进程间通信的问题

- 竞态条件（race condition）：多个进程对共享数据进行修改，影响程序的正确运行。在计算机内存或者存储里，如果**同时**发出读写大量数据的指令的时候竞态条件可能发生，机器试图覆盖相同的或者旧的数据，而此时旧的数据仍然在被读取。
- 临界区（critical section）：对共享资源进行访问的程序片段。

### 进程的同步与互斥

{% folding open red, 进程的同步与互斥 %}
- 进程的同步（Synchronization）是**解决进程间协作关系(直接制约关系) 的手段**。进程同步指两个以上进程基于某个条件来协调它们的活动。一个进程的执行依赖于另一个协作进程的消息或信号，当一个进程没有得到来自于另一个进程的消息或信号时则需等待，直到消息或信号到达才被唤醒。
- 进程互斥关系是一种特殊的进程同步关系。在系统中多个进程因争用临界资源（Critical Resource）而互斥执行。
{% endfolding %}

#### 互斥设计

{% gallery %}
![互斥设计](https://s1.ax1x.com/2020/08/02/atJSHg.png)
{% endgallery %}

## 参考

- [现代操作系统](https://book.douban.com/subject/27096665/)
- [Inter-process communication](https://en.wikipedia.org/wiki/Inter-process_communication#Approaches)
- [进程间通信](https://mp.weixin.qq.com/s?__biz=MzUxODAzNDg4NQ==&mid=2247485318&idx=1&sn=0da0a684639106f548e9d4454fd49904&chksm=f98e432ccef9ca3ab4e10734fd011c898785f18d842ec3b148c7a8ee500790377858e0dbd8d6&scene=158#rd)

