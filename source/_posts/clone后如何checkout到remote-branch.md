---
title: git clone后如何checkout到remote branch
toc: true
comments: true
popular_posts: true
mathjax: true
top: false
music:
  enable: true
  server: netease
  type: song
  id: 1394743453
date: 2019-10-27 00:36:10
tags: Git
categories: Git
---

## what/why

通常情况使用`git clone github_repository_address`下载下来的仓库使用`git branch`查看当前所有分支时只能看到master分支，但是想要切换到其他分支进行工作怎么办❓

![](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20191027014941.png)

其实使用git clone下载的repository没那么简单😥，clone得到的是仓库所有的数据，不仅仅是复制在Github repository所能看到的master分支下的所有文件，**clone下来的是仓库下的每一个文件和每一个文件的版本（也就是说所有的分支都被搞下来了咯）**，那为啥看不到，其实remote branch被隐藏了，需要使用`git branch -a`才能看到。

![](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20191027015046.png)

## how
emmm...，现在看到了，那么怎么切换到remote branch呢？（我太难了🙃），又到了查文档的时候了，一波操作过后了解到git checkout是有restore working tree files的功能的，可以用来restore remote branch，比如使用以下命令在本地创建个新分支track远程分支：

```bash
$ git checkout -b <branch> --track <remote>/<branch>
```

```bash
# 例子，本地为远程分支CkaiGrac-PYMO创建的新分支名为yeshan，push时需要注意
git checkout -b yeshan --track origin/CkaiGrac-PYMO
```

![](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20191027015123.png)

tips：使用`git checkout -t <remote/branch>`默认会在本地建立一个和远程分支名字一样的分支

![](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20191027015200.png)

## reference
- [git-branch: https://git-scm.com/docs/git-branch](https://git-scm.com/docs/git-branch)
- [git-checkout: https://git-scm.com/docs/git-checkout](https://git-scm.com/docs/git-checkout)
