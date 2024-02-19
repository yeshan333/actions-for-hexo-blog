---
title: 使用 GitHub Codespaces 加速 Elixir 开发环境工作速度
date: 2024-02-19 16:29:08
updated: 2024-02-19 19:29:08
tags: Elixir, Github Codespaces
categories: Github Codespaces
toc: true            # 目录
comments: true       # 评论功能
popular_posts: false # 显示推荐文章
mathjax: true        # 公式渲染
pin: false           # 文章置顶
keywords:            'Github Codespaces, Elixir'
headimg: https://telegraph.shansan.top/file/bb853b1aec1b7cc6fb298.png
description:         "create elixir dev env with github codespaces"
---

## 前言

使用 [Elixir](https://www.erlang-solutions.com/capabilities/elixir/?utm_source=Google&utm_medium=cpc&utm_campaign=Elixir_USCART&utm_content=&gad_source=1&gclid=CjwKCAiAlcyuBhBnEiwAOGZ2SzBl8ExJxYuUq6FdtHQt5bSzORVL8RekWUtih8Ht6dzkIqlnaON6rhoCbv0QAvD_BwE) 开发点小玩意的时候，面对经常需要走外网下载依赖 (Elixir 的镜像站 [UPYUN](https://hex.pm/docs/mirrors) 使用有时候也经常抽风) 的时候，为了避免需要不断的进行网络代理配置，有想到之前经常使用 [GitHub Codespaces](https://github.com/features/codespaces) 来在浏览器里面通过云环境来写博客文章，也可以做点开发：  

![GitHub Codespaces](https://telegraph.shansan.top/file/62f2956f4dc3e543f75ca.png)

> 第一次连接一般会看到:
> 👋 Welcome to Codespaces! You are on our default image. 
>   - It includes runtimes and tools for Python, Node.js, Docker, and more. See the full list here: https://aka.ms/ghcs-default-image
>   - Want to use a custom image instead? Learn more here: https://aka.ms/configure-codespace

> 🔍 To explore VS Code to its fullest, search using the Command Palette (Cmd/Ctrl + Shift + P or F1).

> 📝 Edit away, run your app as usual, and we'll automatically make it available for you to access.


使用 GitHub Codespaces 甚至也能直接提交代码到 GitHub 仓库之中。通过 vscode 插件 [GitHub Codespaces](https://code.visualstudio.com/docs/remote/codespaces)，能通过本地 IDE 连接云端的环境进行开发。GitHub 提供了免费使用的额度，足够白嫖了🐏。如果有将 vscode 的配置同步到 GitHub，也可以在一定程度复用本地 IDE 的配置。

通过 [https://github.com/codespaces/new](https://github.com/codespaces/new) 我们能配置 GitHub 使用的环境规格和部署地区:

![select machine & zone](https://telegraph.shansan.top/file/9be59c0db63ef57e9e9b4.png)

## 加速 Elixir 开发环境

Elixir 应用构建拉依赖经常需要走外网，但 GitHub 默认创建的 Codespaces 环境默认一般都是 js 的开发环境 [Dockerfile](https://github.com/devcontainers/images/blob/main/src/universal/.devcontainer/Dockerfile)，并没有 Elixir 环境，需要我们自己单独配置一手，好在提供了 [devcontainer](https://containers.dev/) 的形式供我们自定义自己的基础开发环境，我们只需要提供配置文件就好， 我们需要做的如下:

- 1、GitHub 仓库创建 `.devcontainer` 目录;
- 2、`.devcontainer` 下的 `devcontainer.json` 文件声明开发环境配置;

示范仓库如: [https://github.com/yeshan333/erlang_elixir_asdf_ubuntu_container/tree/main/.devcontainer](https://github.com/yeshan333/erlang_elixir_asdf_ubuntu_container/tree/main/.devcontainer)

```json
{
  "image": "ghcr.io/yeshan333/erlang_elixir_asdf_ubuntu_container:latest",
  "customizations": {
    "vscode": {
      "extensions": ["jakebecker.elixir-ls"]
    }
  },
  "postCreateCommand": "git config --global core.fileMode false"
}
```

通过 image 字段，我们直接声明了 GitHub Codespaces 使用的 Docker 镜像，extensions 指定了要启用哪些 vscode 插件，postCreateCommand 制定了环境起来之后要跑的 shell 命令。甚至于也可以指定我们自己写的 Dockerfile 来启动 GitHub Codespaces 环境，可参考：[https://github.com/devcontainers/images/blob/main/src/go/.devcontainer/devcontainer.json](https://github.com/devcontainers/images/blob/main/src/go/.devcontainer/devcontainer.json)。

基于以上，我们可以通过 https://github.com/codespaces/new 指定海外节点进行 GitHub Codespaces 创建即刻.

## 参考

- [create-dev-container](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
- [GitHub Codespaces](https://github.com/features/codespaces)