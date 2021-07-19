---
title: 初探 Git Submodules
toc: true
comments: true
popular_posts: false
mathjax: true
top: false
thumbnail: https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20210310183249.png
date: 2021-03-10 15:51:15
tags: Git
categories: Git
references:
  - title: Git Tools - Submodules
    url: https://git-scm.com/book/en/v2/Git-Tools-Submodules
  - title: Working with submodules
    url: https://github.blog/2016-02-01-working-with-submodules/
  - title: 《Git版本控制管理》- 子模块最佳实践
    url: https://book.douban.com/subject/26341974/
keywords: "git, git submodules, repo"
---

之前一直想将一个 Git 仓库放到另一个 Git 仓库，有 Maven 多模块项目（Maven Multimodule Project）和 Gradle 多项目构建（Gradle Multiproject Build）那味儿。Git 这么骚，肯定也可以。“扫”了多个开源仓库，Get 到了 Git `submodule` 可以做这种操作，水篇文章记录波。

<!-- more -->

## 没有使用 Git Submodules 之前

没有使用 submodule 之前，如果在一个 Git 项目追踪另一个 Git 项目，会报一个 warning「我敲，有暗示用 submodule，之前没注意」，操作如下：

```shell
mkdir git-submodule
cd git-submodule
git init
git clone https://github.com/volantis-x/hexo-theme-volantis --depth 1
```

执行 `git add hexo-theme-volantis`，会出现如下 warning（adding embedded git repository）：

{% gallery %}
![追踪执行结果](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20210310182846.png)
{% endgallery %}

然后使用 `git status` 查看，虽然 `git add` 成功了，但是并没有成功 `add` 到 hexo-theme-volantis 里面的内容。提示也说了（will not contain the contents of the embedded repository），提交到 GitHub 后，显示结果如下， folder 戳也戳不开。

{% gallery %}
![push to GitHub](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20210310182904.png)
{% endgallery %}

可以明显的看到，并不能保证 子目录/文件 的完整性。就我之前如果想在一个 Git 项目保留另一个 Git 项目，那么我只能将一个项目的 Git 版本库去掉，从后续的使用感受来看，此后我追踪另一个项目的更新会有点麻烦。从 yeshan333/actions-for-hexo-blog 项目的对 volantis 项目追踪的历史commit@3ce9316 可以看得出来 ![actions-for-hexo-blog@3ce9316](https://github.com/yeshan333/actions-for-hexo-blog/tree/3ce93169ec7bfd49d91e8dc38415cc08886e052a)

## Git Submodules 的作用

是时候该见识 submodule 的作用了，从官方文档可以看到，它可以解决之前上面提到的一些问题。略微概括下就是：
- Git的 submodule 可以将一个 Git 版本库**作为一个子目录**保存在另一个 Git 版本库中，并可以保留两个版本库之间 commit 的分离，保持父项目和子项目相互独立，实现更为精确的版本控制。

## Git Submodules 的本质

拿 [actions-for-hexo-blog](https://github.com/yeshan333/actions-for-hexo-blog) 项目来实践感受下 submodule。操作如下：

```shell
git clone git@github.com:yeshan333/actions-for-hexo-blog.git && cd actions-for-hexo-blog
git submodule add git@github.com:volantis-x/hexo-theme-volantis.git themes/volantis
```

执行上述命令之后，会看到当前项目下生成了个 `.gitmodules` 文件，内容如下：

```
[submodule "themes/volantis"]
	path = themes/volantis
	url = git@github.com:volantis-x/hexo-theme-volantis.git
```

同时，`.git/config` 文件也会被追加写入如下内容：

```
[submodule "themes/volantis"]
	url = git@github.com:volantis-x/hexo-theme-volantis.git
	active = true
```

再看看 `theme/volantis` 目录，发现该项目的 Git 版本库不见了，之前提到 `git submodule` 可以保留两个版本库之间 commit 的分离，那么项目 volantis 的版本库放哪了？摸索下当前项目的版本库可以看到被放在了 `.git/modules/themes/volantis` 下。尝试提交到 GitHub 看看。

{% gallery %}
![GitHub 提交结果](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20210310183050.png)
{% endgallery %}

emm......，收工，目录名显示多个 commit 引用，可以进行跳转。

## 更多操作

- 与 submodule 类似的 subtree：[Git Submodules vs Git Subtrees](https://martowen.com/2016/05/01/git-submodules-vs-git-subtrees/)
- 子模块更新：`git submodule update`
- [submodule 最佳实践](http://reader.epubee.com/books/mobile/ed/ededfda8184ebf210b5960a5f22be1c7/text00025.html)

```
# 子模块删除
- 删除.gitsubmodule文件中子模块的相关字段；
- 删除.git/config文件中子模块的相关字段；
- 删除模块目录：
- git rm --cached <submodule-path>
```






