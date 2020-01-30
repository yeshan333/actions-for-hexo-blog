---
title: HTTPie的使用
toc: true
comments: true
popular_posts: true
mathjax: false
top: false
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
password: false
music:
  enable: false
  server: netease
  type: song
  id: 26664345
date: 2019-04-23 23:47:48
tags:
categories:
updated:
excerpt: HTTPie
---

>HTTPie（发音为aitch-tee-tee-pie）是一个命令行HTTP客户端。其目标是使与Web服务的CLI交互尽可能人性化。它提供了一个简单的http命令，允许使用简单自然的语法发送任意HTTP请求，并显示彩色输出。HTTPie可用于测试，调试以及通常与HTTP服务器交互。

# HTTPie官方文档

- [https://httpie.org/doc](https://httpie.org/doc)

windows下安装

    pip install --upgrade httpie

# HTTPie的简单使用

## 一个完整的请求语句的大概样子

    http [选项(flags)] [方法] URL [查询字符串/数据字段/首部字段]

## HTTPie数据语法

|类型|符号|示例|
|:--:|:--:|:--:|
|URL参数|==|param==value|
|首部字段|:|Name:value|
|数据字段|=|field=value|
|原生JSON字段|:=|field:=json|
|表单上传字段|@|field@dir/file|

## 示例

```bash
# 下载文件
$ http --download www.jb51.net/my_file.zip

# 提交表单
$ http -f POST www.jb51.net name='Dan Nanni' comment='Hi there'

# HTTPie的默认数据类型为JSON格式的
$ http PUT example.org name=John email=john@example.org

# 使用代理
$ http --proxy=http:http://10.10.1.10:3128 --proxy=https:https://10.10.1.10:1080 example.org

# 定制请求头
$ http www.test.com User-Agent:Xmodulo/1.0 Referer:http://www.imike.me MyParam:Foo
```

## 放着先。。。。。。。。。占个位