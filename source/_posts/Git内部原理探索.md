---
title: 洞悉技术的本质-Git内部原理探索
toc: true
comments: true
popular_posts: true
mathjax: true
date: 2020-02-03 00:49:18
tags: Git
categories: Git
keywords: "git, git internals"
---

# 前言

洞悉技术的本质，可以让我们在层出不穷的框架面前仍能泰然处之。用了那么久的 Git，不懂点内部原理，那可不行！懂点原理可以让我们遇到问题的时候能够更好更快的理清解决问题的思路。

要真正读懂本文可能需要以下基础：

- 有 Git 使用经验
- 对 Git 的三个分区有所了解
- 熟悉常用的 Linux 命令
- 对经典哈希算法有一定的了解，比如[SHA-1](https://zh.wikipedia.org/zh/SHA-1)、SHA-256、MD5等

在开始之前，让我们先抛出几个问题，然后一一解决、回答它们

- .git版本库里的文件/目录是干什么的?
- Git是如何存储文件信息的？
- 当我们执行git add、git commit时，Git背后做了什么？
- Git分支的本质是什么?

<!-- more -->

# Git分区

在真正开始之前，让我们先回顾下Git的三个分区（Workspace、Index / Stage、git repository）

- 工作区（Workspace）：此处进行代码文件的编辑
- 索引或称暂存区（Index / Stage）：存储文件状态信息，进行commit前会对此时的文件状态作快照（Snapshot）
- Git版本库（git repository）：由Git Object持久记录每一次commit的快照和链式结构的commit变更历史

先看下从《Got Git》和网络上搬来的Git分区工作原理图和待remote的工作流再次感性回顾下之前使用Git自己时怎么操作的

![工作区、版本库、暂存区工作原理图](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20200202210748.png)


![带Remote的工作流](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20200202210624.png)

相信看了这些，会对Git有新的认知，让我们正式开始🎉！

# .git版本库里的文件/目录是干什么的

让我们通过一个从GitHub clone下来的一个实际项目的版本库来看下这些文件/目录，[clone下来的repository](https://github.com/yeshan333/Explore-Git)

```bash
$ git clone https://github.com/yeshan333/Explore-Git

$ ls -F1
config
description
HEAD
hooks/
index
info/
logs/
objects/
packed-refs
refs/
```

**挑几个重要文件/目录的做下解释**

- HEAD文件：用于存放当前所在分支的引用，这个引用是个符号引用（symbolic reference）
- index文件：二进制文件，它就是暂存区（Stage Area）。它是一个目录树，记录了文件的时间戳、文件长度、SHA-1等
- refs目录：基本所有的引用（references）文件都存放在这里，引用文件中的内容为SHA-1值，一般是commit object的SHA-1值
- objects目录：用于存放数据的所有 Git Object均存放在这个目录下，每个 Git Object 对应一个目录，object对应的SHA-1值的前 2 位为目录名，后 38 位为文件名

抱着一些初步的认知，我们继续解决后面几个问题，加深对.git版本库内文件的理解

# Git是如何存储文件信息的

要知道Git如何存储信息，我们需要了解一下常见的Git对象，Git就是通过这些对象存储文件信息的。Git Object是Git存储文件信息的最小单元，如下为几种常见的Git Object以及它们的作用，它们一般是不可变的（immutable），这些对象使用40位的SHA-1值进行标识。

- [blob](https://en.wikipedia.org/wiki/Binary_large_object)：用于存储文件内容，Git保存文件的时候不会保存文件名
- tree object：当前目录结构的一个快照（Snapshot），它存储了一条或多条树记录（tree entries），每条记录含有一个指向数据对象（blob）或子树对象（子树木对象可理解为子目录）的SHA-1指针以及相应的文件模式、类型、文件名，用于表示内容之间的目录层次关系
- commit object：存储**顶层tree object**的SHA-1值、作者/提交者信息+时间戳以及提交注释，如果有父commit object，还会保存有这个commit object对应的SHA-1值。对于merge commit可能会有多个父commit object
- tag object：用于标记commit object。关于[tag object](https://git-scm.com/book/en/v2/Git-Internals-Git-References)

让我们通过一个实际的版本库了解下这些对象，使用[`git log`](https://git-scm.com/docs/git-log#Documentation/git-log.txt---prettyltformatgt)查看这个版本库详尽的历史提交记录

```bash
$ git log --pretty=raw
commit ee8a0dbc0c6fe89e6ff39b16c77543e8e2c6475b
tree fb12b3e52ce18ce281bfc2b11a5e4350c2d10358
parent 7b94dcbe89c9534913854284b4af727a9a5dfc84
author yeshan333 <1329441308@qq.com> 1580629391 +0800
committer yeshan333 <1329441308@qq.com> 1580629391 +0800

    final commit

commit 7b94dcbe89c9534913854284b4af727a9a5dfc84
tree 8feb4afbab18e8d386413224a9e74f871c15a5ca
author yeshan333 <1329441308@qq.com> 1580629170 +0800
committer GitHub <noreply@github.com> 1580629170 +0800

    Initial commit

```

**Git提供了一把非常好用的瑞士军刀🔪给我们剖析这些对象，它是就是`cat-file`，通过`-t`参数可以查看object的类型，通过`-p`参数我们可以查看object存储的具体内容。查看信息时，我们需要使用到object对应的SHA-1值，可不必写完，从头开始的前几位不冲突即可。**[git cat-file](https://git-scm.com/docs/git-cat-file)

让我们通过它查看下SHA-1值`ee8a0dbc0c6fe89e6ff39b16c77543e8e2c6475b`对应的commit object的类型以及存放的内容。

```bash
$ git cat-file -t ee8a
commit

$ git cat-file -p ee8a
tree fb12b3e52ce18ce281bfc2b11a5e4350c2d10358
parent 7b94dcbe89c9534913854284b4af727a9a5dfc84
author yeshan333 <1329441308@qq.com> 1580629391 +0800
committer yeshan333 <1329441308@qq.com> 1580629391 +0800

final commit

```

让我们再查看下这个commit object（ee8a）存储的tree object（fb12）的信息

```bash
$ git cat-file -p fb12
100644 blob 6116a7dd8f752dabff8730a46b46846b2d0a696b    README.md
040000 tree 41ed97c2adb97658107069582b6a27e474b4cc64    test

$ git cat-file -t fb12
tree

```

我们知道tree object存储了一条或多条树记录（tree entries），每条记录含有一个指向数据对象（blob）或子树对象（子树木对象可理解为子目录）的SHA-1指针以及相应的文件模式、类型、文件名。100644即为对应的文件模式，100644表示普通文本文件，040000表示目录文件。[关于文件模式的一点疑问](https://cloud.tencent.com/developer/ask/82974/answers/created)

让我们再看下tree object（fb12）存储的SHA-1指针（6116）对应的blob（6116）存放的内容

```bash
$ git cat-file -p 6116
# Explore-Git
$ git cat-file -t 6116
blob

```

Nice，很好的对应了之前对blob、tree object、commit object的描述。关于文件的大部分信息都存放在这些object中。

# 当我们执行git add、git commit时，Git背后做了什么

解答这个问题，我们需要通过实践去一步步感受Git背后的操作。我们创建一个简单的例子感受下，我们需要时刻关注.git/objects这个目录

```bash
$ mkdir demo
$ cd demo
$ git init # 初始化Git仓库
$ find .git/objects -type f # 没有文件
$ echo "test" > test.txt
$ mkdir hi
$ cd hi
$ echo "Hello" > hello.txt
$ cd ..
$ find .git/objects -type f
$ # 什么都没有
```

这里我们创建先了两个文件，test.txt、hello.txt，其中hello.txt文件放到了hi目录中，然后我们查看了.git/objects目录，没有文件。接下来就是重头戏了，我们要将当前目录的文件/目录（Linux一切皆文件）添加到暂存区（stage/index）。

```bash
$ git add .
$ find .git/objects -type f
.git/objects/9d/aeafb9864cf43055ae93beb0afd6c7d144bfa4
.git/objects/e9/65047ad7c57865823c7d992b1d046ea66edf78
```

我们可以看到，执行了`git add`之后生成了两个文件，让我们通过`git cat-file`看看这两个文件

```bash
$ git cat-file -t 9dae
blob
$ git cat-file -p 9dae
test # test.txt文件中的内容
$ git cat-file -t e965
blob
$ git cat-file -p e965
Hello # hi/hello.txt文件中的内容
```

哦，Git为我们生成了两个object，两个blob，存放的是test.txt、hello.txt的内容，让我们commit一下看看Git又做了什么

```bash
$ find .git/objects -type f
.git/objects/27/1c49aa4a2c8eb1b2ef503c19378aa6810fca1e
.git/objects/2e/8ebea76975c98806e73c0b7aea6c40c58d427c
.git/objects/8c/3c7fbcd903744b20fd7567a1fcefa99133b5bc
.git/objects/9d/aeafb9864cf43055ae93beb0afd6c7d144bfa4
.git/objects/e9/65047ad7c57865823c7d992b1d046ea66edf78
$ git cat-file -t 271c
commit
$ git cat-file -t 2e8e
tree
$ git cat-file -t 8c3c
tree
$
$ git cat-file -p 271c
tree 2e8ebea76975c98806e73c0b7aea6c40c58d427c
author root <root@DESKTOP-CQ9JEC7.localdomain> 1580651827 +0800
committer root <root@DESKTOP-CQ9JEC7.localdomain> 1580651827 +0800

Hello Git
$ git cat-file -p 8c3c
100644 blob e965047ad7c57865823c7d992b1d046ea66edf78    hello.txt
$ git cat-file -p 2e8e
040000 tree 8c3c7fbcd903744b20fd7567a1fcefa99133b5bc    hi
100644 blob 9daeafb9864cf43055ae93beb0afd6c7d144bfa4    test.txt
```

哦，commit后Git为我们新创建了3个object，分别是根树对象tree object（2e8e）、子树对象tree object（8c3c）、commit object（271c）。现在一共有5个Git Object。这些object存放的内容符合我们在解答**Git是如何存储文件信息的**时对它们的表述。Git在add、commit后有条不紊的把它们组织了起来。tql👍

让我们看下此次提交的日志

```bash
$ git log --pretty=raw
commit 271c49aa4a2c8eb1b2ef503c19378aa6810fca1e
tree 2e8ebea76975c98806e73c0b7aea6c40c58d427c
author root <root@DESKTOP-CQ9JEC7.localdomain> 1580651827 +0800
committer root <root@DESKTOP-CQ9JEC7.localdomain> 1580651827 +0800

    Hello Git
```

问题来了，Git是如何组织这些object的❓令人兴奋的是Git在提供给我们这些顶层API去愉快使用的同时还提供了一些较为底层的API让我们能够更深入的了解它。接下来我们将通过部分底层的API来重现本次commit log的创建过程。主要用到的底层API如下：

- [git hash-object](https://git-scm.com/docs/git-hash-object#Documentation/git-hash-object.txt--w)：生成blob
- [git update-index](https://git-scm.com/docs/git-update-index)：对暂存区进行操作
- [git write-tree](https://git-scm.com/docs/git-write-tree)：根据当前暂存区（index）状态创建一个tree object
- [git read-tree](https://git-scm.com/docs/git-read-tree)：将tree object读入暂存区
- [git commit-tree](https://git-scm.com/docs/git-commit-tree#_synopsis)：创建commit object

**重现步骤如下：**

1、先初始化版本库，再为内容分别为`test`的test.txt、`Hello`的hello.txt创建两个blob，blob不存储文件名

```bash
$ mkdir test
$ cd test
git init
$ echo 'test' | git hash-object -w --stdin
9daeafb9864cf43055ae93beb0afd6c7d144bfa4
$ echo 'Hello' | git hash-object -w --stdin
e965047ad7c57865823c7d992b1d046ea66edf78
```

2、使用`git update-index -add`将blob（e965）加入暂存区，使用`--cacheinfo`参数指定文件模式、SHA-1值、文件名（hello.txt）

```bash
$  git update-index --add --cacheinfo 100644 e965047ad7c57865823c7d992b1d046ea66edf78 hello.txt
```

3、使用`git write-tree`将当前暂存区状态写入一个tree object（8c3c）

```bash
$ git write-tree
8c3c7fbcd903744b20fd7567a1fcefa99133b5bc
```

4、将hello.txt移出暂存区，将blob（9dae）加入暂存区（即将test.txt加入暂存区）

```bash
$ git update-index --remove hello.txt
$ git update-index --add --cacheinfo 100644 9daeafb9864cf43055ae93beb0afd6c7d144bfa4 test.txt
```

5、使用`git read-tree`将已有tree object作为**子树对象**加入暂存区，通过`--prefix`设置名称为hi

```bash
$ git read-tree --prefix=hi 8c3c7fbcd903744b20fd7567a1fcefa99133b5bc
```

6、记录下当前暂存区状态到tree object

```bash
$ git write-tree
2e8ebea76975c98806e73c0b7aea6c40c58d427c
```

7、使用`git commit-tree`根据tree object的SHA-1值创建commit object

```bash
$ echo 'Hello Git' | git commit-tree 2e8e
2616a5b40ead79df23736f61b346080423f438fe
```

8、查看commit log，没多大毛病，收工🎉

```bash
$ git log --pretty=raw 2616
commit 2616a5b40ead79df23736f61b346080423f438fe
tree 2e8ebea76975c98806e73c0b7aea6c40c58d427c
author root <root@DESKTOP-CQ9JEC7.localdomain> 1580660050 +0800
committer root <root@DESKTOP-CQ9JEC7.localdomain> 1580660050 +0800

    Hello Git

$ git cat-file -p 2616
tree 2e8ebea76975c98806e73c0b7aea6c40c58d427c
author root <root@DESKTOP-CQ9JEC7.localdomain> 1580660050 +0800
committer root <root@DESKTOP-CQ9JEC7.localdomain> 1580660050 +0800

Hello Git

```

相信到了这里，已经对Git在我们`git add`、`git commit`时做了什么有了一定的了解。如果想了解Git Object对应的SHA-1值如何生成和如何复现并串联多个commit object形成一个提交历史链，可查看《Pro Git》的第十章第二小节或参看后面的参考资料。

# Git分支的本质是什么

**Git分支的本质是指向某一系列提交之首的指针或引用。**Git使用引用的一个好处就是我们不需要花心思去记那些Git Object长长的SHA-1值。引用是存放SHA-1值的文件，它们位于`.git/refs`目录中。Git提供了一个API让我们更新引用-`update-ref`，示例如下

```bash
$ git update-ref refs/heads/master 2616 # 2616为之前浮现commit log创建的commit object的SHA-1值
$ git log
commit 2616a5b40ead79df23736f61b346080423f438fe (HEAD -> master)
Author: root <root@DESKTOP-CQ9JEC7.localdomain>
Date:   Mon Feb 3 00:14:10 2020 +0800

    Hello Git
$ git log master
commit 2616a5b40ead79df23736f61b346080423f438fe (HEAD -> master)
Author: root <root@DESKTOP-CQ9JEC7.localdomain>
Date:   Mon Feb 3 00:14:10 2020 +0800

    Hello Git
$ cat .git/refs/heads/master
2616a5b40ead79df23736f61b346080423f438fe
```

## HEAD引用

在介绍HEAD文件的时候我们说过它存放的是当前所在分支的引用，而且这个引用是个**符号引用**（symbolic reference）。那么什么是符号引用？**它是一个指向其它引用的指针**。我们可以查看之前clone下来的[Explore-Git](https://github.com/yeshan333/Explore-Git)的HEAD文件

```bash
$ cat .git/HEAD
ref: refs/heads/master
```

当我们checkout到某个分支时，HEAD文件内容如下

```bash
$ git branch yeshan
$ git checkout yeshan
Switched to branch 'yeshan'

$ cat .git/HEAD
ref: refs/heads/yeshan
```

至此，抛出的问题已解答完毕。

# 参考

- [Go Git：面向未来的代码平台](https://developer.aliyun.com/article/720615?spm=a2c6h.12873639.0.0.176712eeP7J5d0&tdsourcetag=s_pctim_aiomsg)，了解版本控制系统的发展和Git现存的问题，版本控制系统未来的走向

- [《Git权威指南》](https://github.com/gotgit/gotgit) - [Git对象探秘](http://www.worldhello.net/gotgit/02-git-solo/030-head-master-commit-refs.html)

- [这才是真正的Git——Git内部原理揭秘！](https://mp.weixin.qq.com/s/UQKrAR3zsdTRz8nFiLk2uQ)

- [《Pro Git》- Basic Snapshotting](https://git-scm.com/book/en/v2/Appendix-C%3A-Git-Commands-Basic-Snapshotting)

- [Git对象模型](http://gitbook.liuhui998.com/1_2.html)

- [你知道 Git 是如何做版本控制的吗](https://github.com/tank0317/git-learning/issues/5)

- [图解Git](https://marklodato.github.io/visual-git-guide/index-zh-cn.html#rebase)

- [GitHub Developer REST API Git Blobs](https://developer.github.com/v3/git/blobs/)

- [如何读取git-ls-tree输出的模式字段](https://cloud.tencent.com/developer/ask/82974/answers/created)

- [常用Git命令清单](https://www.ruanyifeng.com/blog/2015/12/git-cheat-sheet.html)

