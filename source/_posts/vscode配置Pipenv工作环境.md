---
title: vscode配置Pipenv工作环境
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2019-03-03 23:25:30
tags: Python
categories: Python
declare:
toc:
password:
updated:
---

# 让vscode使用Pipenv工作环境

## 1、查看Pipenv的位置

```
# 先激活Pipenv环境
pipenv shell
# 获取当前虚拟环境的位置
pipenv --venv
```

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/0078bOVFgy1g0pe3ndazpj30ft01l746.jpg)

## 2、打开setting.json配置文件

- Ctrl+Shift+P，输入settings，选择Open Settings(JSon)
- 将之前得到的Pipenv环境路径添加进去

    "python.venvPath": "C:\\Users\\Algorithm\\.virtualenvs"

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/0078bOVFgy1g0pdwtnoqtj30gu08rq3k.jpg)

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/0078bOVFgy1g0pdyyyuvqj30m405pjrh.jpg)

<!-- more -->

## 3、重启vscode

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/0078bOVFgy1g0pe1hhuo1j30sg0lc770.jpg)

## 参考

[https://segmentfault.com/a/1190000017558652](https://segmentfault.com/a/1190000017558652)

[https://blog.csdn.net/weixin_34294649/article/details/87518937](https://blog.csdn.net/weixin_34294649/article/details/87518937)