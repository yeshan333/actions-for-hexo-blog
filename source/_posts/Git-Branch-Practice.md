---
title: Git Branch Practice
toc: true
comments: true
popular_posts: true
mathjax: false
top: false
music:
  enable: false
  server: netease
  type: song
  id: 26664345
date: 2019-04-08 12:52:55
tags: Git
categories: Git
updated:
excerpt: Git Branch Practice
keywords: "git, workflows"
---

>最近在弄一个东西，基本的功能已经弄好了，现在想再扩展一起其他功能，但这样势必会改动原有代码，我又不想破坏原有的代码逻辑，方便以后查看。记得Git有个分支工作流可以很好的满足我的需求(๑•̀ㅂ•́)و✧。emmm，很久没发文了，record一下吧。(ノへ￣、)

# 使用到的命令

```bash
$ git branch # 显示所有本地分支
$ git branch <new branch> # 创建新分支
$ git checkout <branch> # 切换到指定分支
$ git branch -d <branch> # 删除本地分支
$ git push --set-upstream origin <branch> # 将本地分支与远程分支关联
$ git push origin --delete <branch> # 删除远程分支

$ git tag -n # 列出所有本地标签以及相关信息
$ git tag <tagname> # 基于最新提交创建标签
& git tag <tagname> -m "备注信息" # 基于最新提交创建含备注信息的标签
$ git tag -d <tagname> # 删除标签
$ git push orign <tagname> # 将指定信息推送到远程仓库
$ git push --tags # 推送所有标签到远程仓库
```

# 操作~操作

![https://img.vim-cn.com/00/950a7bad9cc5835194268fce6d40a444b7cfcc.png](https://img.vim-cn.com/00/950a7bad9cc5835194268fce6d40a444b7cfcc.png)

emmm，顺便试试tag

![https://img.vim-cn.com/a4/26dbcd8ed54643c057193aa14d15ade7ef2358.png](https://img.vim-cn.com/a4/26dbcd8ed54643c057193aa14d15ade7ef2358.png)