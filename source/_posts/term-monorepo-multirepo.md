---
title: 简单了解波 Mono-repo & Multi-repo（Poly-repo）
toc: true
comments: true
popular_posts: false
mathjax: true
top: false
music:
  enable: true
  server: netease
  type: song
  id: 569213220
cover: https://cdn.jsdelivr.net/gh/ssmath/mypic/824280.png
date: 2021-04-30 23:30:00
tags: [项目管理, Monorepo]
categories: Architecture
references:
  - title: How to end Microservice pain and embrace the Monorepo
    url: https://www.fourtheorem.com/blog/monorepo
  - title: Monorepo-Wikipedia,
    url: https://en.wikipedia.org/wiki/Monorepo
  - title: 11 Great Tools for a Monorepo in 2021
    url: https://blog.bitsrc.io/11-tools-to-build-a-monorepo-in-2021-7ce904821cc2
  - title: Monorepo vs Polyrepo
    url: https://earthly.dev/blog/monorepo-vs-polyrepo/
  - title: Dealing With The Polyrepo Concept
    url: https://isacikgoz.me/2019/01/21/polyrepo/
keywords: "monorepo, polyrepo"
---


Mono-repo 和 Multi-repo 是软件开发中代码管理的两个不同策略。Mono-repo & Multi-repo 孰优孰劣是个老生常谈得话题了，这里就不 [PK](https://hackernoon.com/mono-repo-vs-multi-repo-vs-hybrid-whats-the-right-approach-dv1a3ugn) 了，“略微”看下两者区别。

当我们使用 Git 作为版本控制系统管理项目的代码时，那么 monorepo 与 multirepo 的定义表述如下：

- monorepo，使用一个 Git 仓库管理项目相关的多个 模块/包/功能/应用。
- multirepo（又称为 polyrepo），使用多个 Git 仓库分别管理项目的每一个 模块/包/功能/应用。

<!-- more -->

## Monorepo 的应用实例

GitHub 有很多的使用 Monorepo 风格管理代码的开源项目，比如大名鼎鼎的 Babel，项目结构如下图：

{% gallery %}
![Babel GitHub Repo](https://cdn.jsdelivr.net/gh/ssmath/mypic/20210501015251.png)
{% endgallery %}

packages 目录下存放了很多个 Babel 相关的子项目。

[googles-monorepo-demo](https://github.com/paul-hammant/googles-monorepo-demo)给出了一个基于 Maven 构建工具的 Google 风格的 Monorepo 项目。

还有大佬给出了有 CI/CD pipeline 基于 Java, Maven, GitHub Actions 的 Demo 👉 [monorepo-maven-example](https://github.com/kgunnerud/monorepo-maven-example)。

{% gallery %}
![monorepo-maven-example-with-github-actions](https://cdn.jsdelivr.net/gh/ssmath/mypic/20210501021345.png)
{% endgallery %}

### 使用工具快速搭建 Monorepo 风格的项目

现今，有许多可以创建 Monorepo 风格项目的工具，在前端社区有 Lerna、Nx、Rush Stack、Yarn Workspaces 等，还有许多其它的构建工具可以用于创建 Monorepo 风格的项目，见项目 -> [awesome-monorepo](https://github.com/korfuri/awesome-monorepo#build-systems--dependency-management-tools)。这里让我们看看通过 Nx 创建的 Monorepo 风格的项目是怎么样的：

{% gallery %}
![Nx create project](https://cdn.jsdelivr.net/gh/ssmath/mypic/20210501145451.png)
{% endgallery %}

![project structure](https://cdn.jsdelivr.net/gh/ssmath/mypic/20210501152226.png)

medium 上有篇文章简述了 11 种不同 Monorepo 构建工具的特点：[11 Great Tools for a Monorepo in 2021]()

## 一图看 Monorepo 和 Multirepo 的区别

这里我们用一张图来看下使用 Git 管理多个 package 时，Monorepo 和 Multirepo（Polyrepo） 的区别：

{% gallery %}
![Monorepo & Multirepo(Polyrepo)](https://cdn.jsdelivr.net/gh/ssmath/mypic/20210501151658.png)
{% endgallery %}

Don't say so much. 就这样了🤨🕊️，又水了一篇文章。





