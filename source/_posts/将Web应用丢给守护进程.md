---
title: 将 Web 应用丢给守护进程
toc: true
comments: true
popular_posts: false
mathjax: true
top: false
date: 2020-06-21 14:26:36
tags: 服务器进程管理
categories: Linux
thumbnail: https://tse4-mm.cn.bing.net/th/id/OIP.9uFp2lB4VhDn_e5sY749aQHaE2?pid=Api&rs=1
---

最近老是要把 Web App/Service 部署在个人的服务器上进行测试，发现自己不怎么熟悉「前提：不上 docker ，逃~」，特写此文章来纪念下🤔👀（之前部署的  Web App/Service 都是丢给 [Heroku](https://www.heroku.com/)、[Netlify](https://www.netlify.com/)、GitHub 这样的 PaaS 平台运行，写个配置文件「action、yaml、toml」就完事了。自己整的玩意儿丢在自己服务器上跑的并不算多，今天费点劲，了解点基础设施。根据冰山模型，了解下 FaaS 能更好的了解 [PaaS](https://shansan.top/knowledge-base/#/backend?id=iaas%e3%80%81paas%e3%80%81saas)）。

<!-- more -->

## 冰山的底部-基础

在把 Web 应用丢给守护（daemon）进程前，应该了解部分基础概念。

>守护进程是在后台运行不受终端控制的进程（如输入、输出等）。

插入个场景，我们之前在开发环境下，是如何运行 Web 服务的？对于 Spring Boot，我们可以在终端使用 `mvn spring-boot:run` 在前台跑 Web 服务；对于 React 前端应用，我们可以使用 `npm script` 即 `npm start` 启动前端 HTTP 服务器进行 view 层预览。问题来了，这样操作，服务进程是跑在前台的（所谓的前台任务/进程），当我们退出操作终端或者手动终止时，这些服务也就不能用了，而且前台任务独占了一个终端，使得我们不能再在此终端执行其他命令。在生产环境下，我们要让服务持久运行，这种情况明显不是我们想看到的，那么，如何解决这个问题？

> 所谓的前台任务是我们可以直接看得到的。


![前台进程/任务](https://mypic-1258313760.cos.ap-guangzhou.myqcloud.com/img/20200621153114.gif)


在了解如何解决问题前，我觉得有必要了解下为什么前台任务会随着 session 的退出而退出（收到了 SIGHUP）。Linux 系统对此的设计如下：

```text
1、用户准备退出 session
2、系统向该 session 发出SIGHUP信号
3、session 将SIGHUP信号发给所有子进程
4、子进程收到SIGHUP信号后，自动退出
```

{% folding cyan open, SIGHUP 是什么 %}

SIGHUP（signal hang up） 信号在用户终端连接(正常或非正常)结束时发出, 通常是在终端的控制进程结束时, 通知同一 session 内的各个作业, 这时它们与控制终端不再关联. 系统对 SIGHUP 信号的默认处理是终止收到该信号的进程。

- 查看维基百科：[Unix 信号](https://zh.wikipedia.org/wiki/Unix%E4%BF%A1%E5%8F%B7)

{% endfolding %}

{% folding green, 什么是进程组 %}

进程组是一系列相互关联的进程集合，系统中的每一个进程必须从属于某一个进程组；每个进程组中都会有一个唯一的 ID(process group id)，简称 PGID；PGID 一般等同于进程组的创建进程的 Process ID，而这个进程一般也会被称为进程组先导(process group leader)，同一进程组中除了进程组先导外的其他进程都是其子进程；

进程组的存在，方便了系统对多个相关进程执行某些统一的操作，例如，我们可以一次性发送一个信号量给同一进程组中的所有进程。

{% endfolding %}


{% folding green, 什么是 session %}

会话（session）是一个若干进程组的集合，同样的，系统中每一个进程组也都必须从属于某一个会话；一个会话只拥有最多一个控制终端（也可以没有），该终端为会话中所有进程组中的进程所共用。一个会话中前台进程组只会有一个，只有其中的进程才可以和控制终端进行交互；除了前台进程组外的进程组，都是后台进程组；和进程组先导类似，会话中也有会话先导(session leader)的概念，用来表示建立起到控制终端连接的进程。在拥有控制终端的会话中，session leader 也被称为控制进程(controlling process)，一般来说控制进程也就是登入系统的 shell 进程(login shell)；

{% endfolding %}


OK，回到我们的问题，如何让任务持久运行、不影响其他操作。这时，后台进程就该登场了，将任务丢在后台执行。一个任务要丢给守护进程的第一步就是要将他变为后台进程。变为后台进程后，一个进程是否就成为了守护进程呢？或者说，用户退出 session 以后，后台进程是否还会继续执行？答案是未必。看完后面就明白了。

## 冰山的上层-应用

Linux 提供了很多种方法让我们将前台进程变为后台进程，挑几种介绍下。

### 将前台进程变为后台进程的几种方式

#### 位与运算符-&

通过在命令的尾部加个符号`&`即可将进程启动为后台进程，后台进程的特点如下：

{% folding red open, 后台进程特点 %}

1、继承当前 session （对话）的标准输出（stdout）和标准错误（stderr）。因此，后台任务的所有输出依然会同步地在命令行下显示。

2、不再继承当前 session 的标准输入（stdin）。你无法向这个任务输入指令了。如果它试图读取标准输入，就会暂停执行（halt）。这个特点使得我们可以执行其他命令。

{% endfolding %}

我们可以运行一个 [FastAPI](https://fastapi.tiangolo.com/) 编写的 Web 服务观察下。

```bash
uvicorn main:app --reload &
```

![集成了session的标准输出](https://mypic-1258313760.cos.ap-guangzhou.myqcloud.com/img/20200621161927.gif)

可以很明显的看到，后台进程继承了当前 session （对话）的标准输出（stdout）。我们知道进程收到 SIGHUP 信号会被终止，那么后台进程是否会收到 SIGHUP 信号挂掉？掏出阿里云服务器实验下。

![有IO交互的后台进程](https://mypic-1258313760.cos.ap-guangzhou.myqcloud.com/img/20200621165541.gif)


这。。。后台进程在我们退出 session 后挂掉了！！！，这是为啥？那是因为后台进程与标准 I/O 有交互（这个服务打日志了），后台进程的的标准 I/O 继承自当前 session，就算加个 `&` 符号也没有改变这一特点。我们想要的是服务在后台持久运行，怎么解决？

Linux 提供了一个 `nohup` 命令可以帮我们解决这个问题。

{% folding green, FastAPI Web 服务代码 %}

```Python
# -*- coding: utf-8 -*-

from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()

class People(BaseModel):
    name: str
    age: int
    country: str
    offer_call: bool = None

@app.get('/')
def root():
    return {"status": "hello world"}

@app.get('/person/{your_name}')
def get_people_info(your_name: str, q: int = None):
    return {"your name": your_name, "query": q}

@app.put('/person/{your_name}')
def update_people_info(your_name: str, person: People):
    return {"people name": your_name, "locate": person.age}
```

{% endfolding %}

#### 阻断 SIGHUP 信号的 nohup

![nohup命令的使用](https://mypic-1258313760.cos.ap-guangzhou.myqcloud.com/img/20200621171128.png)

好了，就算结束了 session 此 Web 服务仍在运行。`nohup` 命令实际上将子进程与它所在的 session 分离了。OK，进程由后台进程变为守护进程了（有那味了，还不算真正的守护进程）。

> 守护进程在 session 关闭时不会受影响。守护进程的会话组和当前目录，文件描述符都是独立的。后台运行只是终端进行了一次fork，让程序在后台执行，这些都没改变。

{% folding red open, nohup 做的那些事 %}

- 阻止SIGHUP信号发到这个进程（PID：14229）。
- 关闭标准输入。该进程不再能够接收任何输入，即使运行在前台。
- 重定向标准输出和标准错误到文件nohup.out。

{% endfolding %}

#### 守护进程管理工具-systemd

Systemd（System Daemon） 并不是一个命令，而是一组命令，涉及到系统管理的方方面面。这里不做介绍，直接结合场景来玩耍。教程可看：[Systemd 入门教程：命令篇](http://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-commands.html)。

是时候掏出 [Spring-Boot](https://gitee.com/yeshan333/body) 应用了（mvn clean package 构建好 jar 包）。先为这个应用写个 Systemd 的配置文件`spring-boot-app.service`，如下

```
[Unit]
Description=Spring Boot RESTful APIs Services

[Service]
ExecStart=/usr/local/java/jdk1.8.0_221/bin/java -jar /home/www/body/target/bodymanagement-0.0.1-SNAPSHOT.jar
Restart=always
User=root
Group=root
Environment=PATH=/usr/local/java/jdk1.8.0_221/bin/java
WorkingDirectory=/home/www/body/

[Install]
WantedBy=multi-user.target
```

然后执行如下命令：

```bash
# 将配置文件拷贝到 systemd 中
cp spring-boot-app.service /etc/systemd/system
# 重载配置文件
$ sudo systemctl daemon-reload
# 启动服务
$ sudo systemctl start spring-boot-app.service
```

访问：[http://47.92.4.141:8080/api/user/findLatestInf](http://47.92.4.141:8080/api/user/findLatestInf)，即可看到网页显示`[]`。

```bash
$ systemctl enable spring-boot-app.service  # 设置开机启动
Created symlink from /etc/systemd/system/multi-user.target.wants/spring-boot-app.service to /etc/systemd/system/spring-boot-app.service.
```

使用`systemctl status spring-boot-app.service`可以查看服务状态，使用`journalctl -u spring-boot-app`可以查看服务状态。

![查看服务状态](https://mypic-1258313760.cos.ap-guangzhou.myqcloud.com/img/20200621184905.png)

更多常用命令如下：

```bash
# 查看某个 Unit 的日志
$ sudo journalctl -u nginx.service

# 查看某个 Unit 状态
$ sudo systemctl status mongod

# 让某个 Unit 开机时启动
$ sudo systemctl enable mongod

# 立即启动一个服务
$ sudo systemctl start apache.service

# 立即停止一个服务
$ sudo systemctl stop apache.service

# 重启一个服务
$ sudo systemctl restart apache.service

# 杀死一个服务的所有子进程
$ sudo systemctl kill apache.service

# 重新加载一个服务的配置文件, 一旦配置文件修改就需要使用
$ sudo systemctl reload apache.service

# 查看某个服务的配置文件
$ systemctl cat sshd.service

# 重新加载所有配置文件
$ sudo systemctl daemon-reload
```

## 参考

- [网络编程的三个重要信号（SIGHUP ，SIGPIPE，SIGURG）](https://blog.csdn.net/z_ryan/article/details/80952498)
- [Linux 守护进程的启动方法](http://www.ruanyifeng.com/blog/2016/02/linux-daemon.html)
- [什么是守护进程](https://www.zhihu.com/question/38609004)
- [Node 应用的 Systemd 的启动](http://www.ruanyifeng.com/blog/2016/03/node-systemd-tutorial.html)