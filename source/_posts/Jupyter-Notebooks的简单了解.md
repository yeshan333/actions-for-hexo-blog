---
title: Jupyter Notebooks的简单了解
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
date: 2019-05-22 22:00:25
tags: Python
categories: Python
updated:
excerpt: 撸一手Jupyter
---

>玩Python这么久了，连Jupyter都不会，有点捞，今天补一补这方面的操作。。。。

# [Jupyter Notebooks](https://jupyter.org/)

&ensp;&ensp;Jupyter Notebooks 是一款开源的网络应用，我们可以将其用于创建和共享代码与文档。其提供了一个环境，你无需离开这个环境，就可以在其中编写你的代码、运行代码、查看输出、可视化数据并查看结果。因此，这是一款可执行端到端的数据科学工作流程的便捷工具，其中包括数据清理、统计建模、构建和训练机器学习模型、可视化数据等等。

## 安装

    pip install ipython jupyter

## 上手上手

在终端输入`jupyter notebook`启动Jupyter notebooks,它会在默认浏览器中打开，地址是http://localhost:8888/tree。

![VCCz7R.md.png](https://s2.ax1x.com/2019/05/22/VCCz7R.md.png)

<!-- more -->

![VCCxB9.md.png](https://s2.ax1x.com/2019/05/22/VCCxB9.md.png)

新建个Python文件试试


![https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/jupyter.gif](https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/jupyter.gif)


# Jupyter常用键盘快捷键

**esc和enter用于切换Jupyter的键盘输入模式，esc切换为命令模式（blue），enter切换为编辑模式（green）**

- 命令模式(常用)
  - 连续按两下D，删除当前活跃单元
  - 按A在活跃单元上插入一个单元，按B在活跃单元下插入一个单元
  - 按Z撤销被删除的单元
  - 按Y将当前单元变为代码单元
  - 按Shift+方向上下键选择多个单元，按Shift+M可以合并选择的单元
  - Ctrl+Shift+F用于打开命令面板
  - 按H查看快捷键完整列表

- 编辑模式（常用）
  - Ctrl+S保存（防死机(๑•̀ㅂ•́)و✧）
  - Ctrl+Home回到单元起始位置
  - Ctrl+Enter运行整个单元块
  - Alt+Enter运行当前活跃单元块，并在当前活跃单元块下方创建新的单元块

![VCPpA1.md.png](https://s2.ax1x.com/2019/05/22/VCPpA1.md.png)


--- 
emmm可以划水了。。。。

了解更多：

[始于Jupyter Notebooks：一份全面的初学者实用指南](https://zhuanlan.zhihu.com/p/37553863)

[jupyter notebook使用技巧](https://zhuanlan.zhihu.com/p/42468945)

[Jupyter介绍和使用 中文版](https://segmentfault.com/a/1190000013014274?tdsourcetag=s_pcqq_aiomsg)
