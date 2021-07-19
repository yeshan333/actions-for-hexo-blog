---
title: Flask的请求钩子与上下文简记
toc: true
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2019-03-16 22:32:05
tags: Flask
categories: Flask
popular_posts: true
declare:
password:
updated:
keywords: "python, flask, hooks"
---

# 请求钩子(Hook)

>在客户端和服务器交互的过程中，有些准备工作或扫尾工作需要处理，比如：在请求开始时，建立数据库连接；在请求结束时，指定数据的交互格式。为了让>每个视图函数避免编写重复功能的代码，Flask提供了通用设施的功能，即请求钩子。通过请求钩子，我们可以对请求进行预处理(preprocessing)和后处理>(postprocessing)。

Flask的请求钩子通过装饰器实现，每个钩子可以注册任意多个处理函数，默认的五种请求钩子如下:

|钩子|说明|
|:--:|:--|
|before_first_request|注册一个函数，在处理请求前运行|
|before_request|注册一个函数，在处理每个请求前运行|
|after_request|注册一个函数，如果有未处理的一场抛出。会在每个请求结束后运行|
|teardown_request|注册一个函数，即使有未处理的异常抛出，会在每个请求介绍后执行。如果发生异常，会传入异常对象作为参数注册到函数中|
|after_this_request|在视图函数内注册一个函数，在这个请求结束后运行|

<!-- more -->

假如我们创建了三个视图函数A、B、C，其中视图C使用了after_this_request钩子，那么当请求A进入后，整个请求处理周期的请求处理函数调用流程如图:

![AEdgN4.png](https://s2.ax1x.com/2019/03/15/AEdgN4.png)

# 上下文

>什么是上下文？上下文相当于一个容器，它保存了程序运行过程中的一些信息，它是当前环境的一个快照(snapshot)。
>Flask中有两种上下文，程序上下文(application context)和请求上下文(request context)。
>程序上下文中包含了程序运行所必须的信息；请求上下文里包含了请求的各种信息，比如请求的URL、HTTP方法等

## 上下文全局变量

我们知道，Flask将请求报文封装在request对象中。按照一般的思路，如果我们要在视图函数中使用它，就得把它作为参数传入视图函数，就像我们接收URL变量一样。但这样就会导致大量的重复，而且增加了的程序的负担。
不一般的是，我们可以从Flask导入一个全局的request变量，在视图函数中直接调用request的属性获取数据。这是为什么？因为Flask会在每个请求产生后后自动激活当前请求的上下文，激活请求上下文后，request被临时设置为全局可访问。在每个请求结束后，Flask就会销毁对应的请求上下文。

Flask提供的四个上下文全局变量如下：

|变量名|上下文类别|说明|
|:--:|:--:|:--|
|current_app|程序上下文|指向处理请求的当前程序实例|
|g|程序上下文|替代Python的全局变量用法，确保仅在当前请求可用，用于存储全局数据，每次请求都会重设|
|request|请求上下文|封装客户端发出的请求报文数据|
|session|请求上下文|用于记住请求之间的数据，通过签名的Cookie实现|

- 不同的视图函数中，request对象都表示和视图函数对应的请求，也就是当前请求
- 程序存在多个程序实例的情况，使用current_app可获取对应的实例

## 上下文的激活

**请求进入时，Flask会自动激活请求上下文，此时程序上下文也被自动激活。请求处理完毕后，请求上下文和程序上下文也会自动销毁。两者具有相同的生命周期。**

- Flask自动激活上下文的情况：
  - 使用`flask run`命令启动程序时
  - 使用旧的`app.run()`方法启动程序时
  - 执行使用`@app.cli.command()`装饰器注册的flask命令时
  - 使用`flask shell`命令启动Python Shell时


- 手动激活的方法:
  - 使用with语句，程序上下文对象可通过app.app_context()获取
  - 使用push（）方法激活程序上下文
  - 请求上下文可以通过test_request_context()方法临时创建

```shell
>>> from app import app
>>> from flask import current_app
>>> with app.app_context():
    ... current_app.name
'app'
```

```shell
>>> from app import app
>>> from flask import current_app
>>> app_ctx = app.app_context()
>>> app_ctx.push()
>>> current_app.name
'app'
>>> app_ctx.pop()
```

```shell
>>> from app import app
>>> from flask import request
>>> with app.test_request_context('/hello'):
...     request.method
'GET'
```


参考：[https://book.douban.com/subject/30310340/](https://book.douban.com/subject/30310340/)