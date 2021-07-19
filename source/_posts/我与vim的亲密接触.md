---
title: 我与vim的亲密接触(ˉ▽￣～)
toc: true
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2019-03-20 23:51:17
tags: Linux
categories: Linux
declare:
password:
updated:
keywords: "linux, vim, editor"
---

>emmm，闲来无事，打算了解下神奇vim（用来zhuangbi）。在终端操作很帅(ˉ▽￣～)~~！
>什么是vim？？Vim是从 vi 发展出来的一个文本编辑器。代码补完、编译及错误跳转等方便编程的功能特别丰富，在程序员中被广泛使用。

# vi/vim的使用

vi/vim有三种模式：
- **命令模式**：控制光标移动，可对文本进行复制、粘贴、删除和查找等工作。刚启动时就是这个模式。
- **输入模式**：正常的文本录入。
- **末行模式**：保存或退出文档，以及设置编辑环境。又可成为底线命令模式。

<!-- more -->

![vim-vi-workmodel.png](https://img.shan333.cn/images/2019/03/20/vim-vi-workmodel.png)

## 常用命令

命令模式常用命令：

|命令|作用|
|:--:|:--:|
|dd|删除（剪切）光标所在整行|
|5dd|删除（剪切）从光标处开始的5行|
|yy|复制光标所在的整行|
|5yy|复制从光标处开始的5行|
|n|显示搜索命令定位到的下一个字符串|
|N|显示搜索命令定位到的上一个字符串|
|u|撤销上一步的操作|
|p|将之前删除（dd）或复制（yy）过的数据粘贴到光标后面|

末行模式可用命令：

|命令|作用|
|:--:|:--:|
|:w|保存|
|:q|退出|
|:q!|强制退出（放弃对文档内容的修改）|
|:wq!|强制保存退出|
|:set nu|显示行号|
|:set nonu|不显示行号|
|:命令|执行该命令|
|:整数|跳转到该行|
|:s/one/two|将当前光标所在行的第一个one替换成two|
|:s/one/two/p|将当前光标所在行的所有one替换成two|
|:%s/one/two/g|将全文中的所有one替换成two|
|?字符串|在文本中从下到上搜索该字符串|
|/字符串|在文本中从上到下搜索该字符串|

# 我与它的亲密接触。。。。。

![_2019_03_21_00_34_28_680.gif](https://img.shan333.cn/images/2019/03/20/_2019_03_21_00_34_28_680.gif)

# 相关

- vim官网：[https://www.vim.org/](https://www.vim.org/)
- vim快捷键键位图：[https://www.jianshu.com/p/8b986f572a61](https://www.jianshu.com/p/8b986f572a61)

![1294928-20171207102042159-1872416815.jpg](https://img.shan333.cn/images/2019/03/20/1294928-20171207102042159-1872416815.jpg)



