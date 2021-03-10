---
title: 给 GitHub commit 加个小绿标
toc: true
comments: true
popular_posts: false
mathjax: true
date: 2020-06-26 19:11:12
tags: [GPG, 加密, 隐私]
categories: Git
---

最近一波重装系统啥都没了，最常用的 Git 配置肯定得安排回来的。记得之前给 git 的 commit 加了个签名，回想下为什么要给 commit 做下签名？因为它能让 GitHub 的 commit 历史更帅？看下加签名之前是怎么样的：

{% gallery %}

![对commit进行签名前](https://s1.ax1x.com/2020/06/26/NstacQ.png)

{% endgallery %}

<!-- more -->

再看下对 commit 签名后是怎么样的：

{% gallery %}

![对commit进行签名后](https://s1.ax1x.com/2020/06/26/Nstg9U.png)

{% endgallery %}

这么一对比，是更帅了！但我好像不是因为这的才做的。我是为了更好的去混**开源项目**做的，这个绿标能更好的证明我的身份！！！（假装我很专业，2333~）。使用过 Git 的同学应该都晓得，我们的提交作者信息是可以自己设置的（这意味着我们可以使用他人身份信息），如下：

```bash
$ git config user.name "tester"
$ git config user.email "gg@qq.com"
```

{% gallery %}
![冒用作者信息](https://s1.ax1x.com/2020/06/26/NsOPv6.png)
{% endgallery %}

我们可以看到，是可以 push 到 GitHub 的[没有小绿标而已]。这看起来就不太好，得让 GitHub 证明下自己得身份才行，从官方文档可以看到， GitHub 提供了一种使用 GPG 的方式可以让我们的 commit “戴”上小绿标。

忘了当初是怎么操作的了，在 Windows 下操作貌似还挺麻烦的，趁此捋一下过程，趁机水篇文章。

>GNU Privacy Guard（GnuPG或GPG）是一个密码学软件，用于加密、签名通信内容及管理非对称密码学的密钥。

## 生成 GPG 密钥对

第一步肯定就是通过 GPG 生成密钥对了。这时候需要到一个 GnuPG 软件，OK，去下载：[🔐GnuPG](https://www.gnupg.org/index.html)。其实 Git fot windows 自带一个 gpg 命令行程序，但是命令行用多了，还是上 GUI 愉快点吧，我们选择使用带 GUI 的 [Gpg4win🔗](https://gpg4win.org/get-gpg4win.html)。

![Gpg4win下载](https://s1.ax1x.com/2020/06/26/Ns63HU.png)

我们通过全家桶软件之 Kleopatra 新建立一对密钥，名字为 GitHub 用户名，邮箱为 GitHub 的注册邮箱（使用 4096 bits的密钥）：

![Kleopatra新建密钥对](https://s1.ax1x.com/2020/06/26/NscXJH.png)


![4096 bits密钥](https://s1.ax1x.com/2020/06/26/NsgnO0.png)

设置 passphrase （通行口令）来保护我们的密钥对，每次签名都会用它到。（也可以不设置，不用口令验证就可以直接使用密钥）

![设置passphrase](https://s1.ax1x.com/2020/06/26/Ns2R29.png)

好了，密钥对生成完毕。下一步，就是把把公钥放到 GitHub 上，让 GitHub 对我们的提交进行验证，判断是否该给 commit “戴”上小绿标。[获取公钥：鼠标右键->细节->导出]、[GitHub 添加公钥：Settings->SSH and GPG keys]。

![拿到公钥](https://s1.ax1x.com/2020/06/26/NsW1k8.png)

![GitHub上添加公钥](https://s1.ax1x.com/2020/06/26/NsWbjA.png)

下一步就是开启 Git 提交签名。

## 启用 Git 提交签名

首先，我们需要让 Git 知道 gpg 的可执行程序在哪里？gpg 的可执行程序位于[Gpg4win🔗](https://gpg4win.org/get-gpg4win.html)同级目录下的`GnuPG/bin`中（GnuPG 是 Gpg4win 组件之一），我们需要进行如下配置：

```bash
$ git config --global gpg.program <path_to_gpg>
```

我的设置如下：

```bash
$ where gpg
E:\Git\usr\bin\gpg.exe  # 这个是 Git for windows 自带的
E:\GnuPG\bin\gpg.exe    # 这个才是我们要用的
$ git config --global gpg.program "E:\GnuPG\bin\gpg.exe"
```

然后每次`git commit`时，加上`-S`即可启用签名。

![加个-S参数启用签名](https://s1.ax1x.com/2020/06/26/NsbMvT.png)

每次都要多打个参数多麻烦，我们通过如下配置让 Git 默认启用 GPG 签名：

```bash
$ git config --global commit.gpgsign true
```

最后我们`git push`一下看看有没有效果。[https://github.com/yeshan333/anonymous-git-commit/commits/master](https://github.com/yeshan333/anonymous-git-commit/commits/master)

![效果预览](https://s1.ax1x.com/2020/06/26/NsqndH.png)

没问题，收工了。我的 Git 全局配置如下：

```bash
$ cat ~/.gitconfig
[user]
        name = yeshan333
        email = 1329441308@qq.com
[gpg]
        program = E:\\GnuPG\\bin\\gpg.exe
[commit]
        gpgsign = true
```

## 参考

- [GunPG](https://zh.wikipedia.org/wiki/GnuPG)
- [GitHub - Signing commits](https://help.github.com/en/github/authenticating-to-github/signing-commits)
- [给你的 Git commit 加上绿勾 - 一个简单但很多人没注意的细节](https://frostming.com/2019/11-25/git-commit-sign)