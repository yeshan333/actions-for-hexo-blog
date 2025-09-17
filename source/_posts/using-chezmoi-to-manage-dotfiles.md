---
title: 使用 chezmoi & vscode, 管理你的 dotfiles
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "using-chezmoi-to-manage-dotfiles"
cover: https://gallery.shansan.top/file/5210f8d9b0331fd1c4f58.png
description: "使用 chezmoi & vscode, 管理你的 dotfiles"
date: 2024-03-23 16:11:23
updated:
tags: [chezmoi, dotfiles]
categories: [dotfiles]
---


## 什么是 dotfiles

> In Unix-like operating systems, any file or folder that starts with a dot character (for example, /home/user/.config), commonly called a dot file or dotfile.
> 任何以 . 开头去命名的文件或者目录都可以称为 dotfile, 在 Unix-like 系统一般用的比较多, 但现在 dotfile 一般用于管理应用/软件的配置, 所以 Windows 平台上也可以看到 dotfile 的身影.

## 什么是 chezmoi

chezmoi 是使用 Go 编写的跨平台 dotfiles 管理工具, 使用同一的 Git 仓库进行配置同步, 可以很方便的帮助我们在多个开发环境共用一套配置, 免去一些同一工具链需要手工重新在多个机器配置的工作量.

开源社区流行的 dotfiles 管理工具很多, 我们可以在这个网站上可以看到: [https://dotfiles.github.io/utilities/](https://dotfiles.github.io/utilities/).

本篇文章主要介绍使用 chezmoi 进行 dotfiles 管理的一些基本流程, 还会介绍如何使用 vscode 配置 chezmoi 让配置管理体验更好的一些小技巧.

### chezmoi 管理 dotfile 工作流

```shell
# 在使用 chezmoi 时, 需要先安装 chezmoi, 可以参考: https://www.chezmoi.io/install
sh -c "$(curl -fsLS get.chezmoi.io)"
# 安装完后初始化 chezmoi 的工作目录
chezmoi init
# 使用 chezmoi cd 可以直接切换到工作目录
chezmoi cd 
# 然后使用 git 将工作目录和代码仓库关联起来即可
git init
git remote add origin <your-git-repo>
```

官方文档也给出了使用 chezmoi 管理 dotfile 的工作流大概是怎么样的, 这里稍作解释:

![chezmoi workflow](https://gallery.shansan.top/file/30d56011e0062dfbbb1ab.png)

我们以 `.bashrc` 文件的管理为例子:

```shell
# Step 1、将 .bashrc 文件纳入 chezmoi 管控范围
# chezmoi 会将该文件拷贝到 chezmoi 工作目录下, 会重命名为 dot_bashrc, 使用 dot 替换 .
chezmoi add .bashrc
# .bashrc 文件纳入管控之后, 就不应该在修改配置的时候编辑 .bashrc 文件了, 而是编辑 chezmoi 工作目录下的 dot_bashrc 文件
# 可以切换去工作目录查看下
chezmoi cd
ls -al
# Step 2、配置的修改我们可以使用如下命令去修改, chezmoi 会使用文本编辑器打开对应的 dot_bashrc 文件
chezmoi edit ~/.bashrc
# Step 3、配置修改后是还没有应用到 .bashrc 文件的, diff 命令可以用来查看修改情况
chezmoi diff ~/.bashrc
# Step 4、想应用修改后的配置可以使用 apply 命令
chezmoi apply ~/.bashrc
# 至此已经基本完成一次 dotfile 的管理, 但为了想要在其他机器也使用这此改动, 是需要使用 git 做一次配置同步的
```

### chezmoi 使用的一些小技巧与配置建议

#### 1、替换 `chezmoi edit` 使用的默认编辑器为 vscode

`chezmoi edit` 默认根据 $VISUAL 或 $EDITOR 环境变量决定使用什么编辑器打开文件, 我们可以修改 chezmoi 的配置文件改变 chezmoi 文件的行为, 配置文件一般在 `~/.config/chezmoi` 目录下, 参考配置如下: 

```shell
# 控制 chezmoi edit 命令使用的编辑器, code --wait 会确保文件关闭再继续
# 配置文件在:  ~/.config/chezmoi/chezmoi.toml
[edit]
    command = "code"
    args = ["--wait"]
```

> tips: chezmoi apply 应用修改后的配置时, 会根据 chezmoi 工作目录的层级去覆盖 HOME 目录对应的文件

#### 2、替换 `chezmoi diff` 使用的 diff 工具为 vscode

万物皆可 vscode, 如果你想使用 vscode 的 dif 能力怎么办, 这里直接给出 chemoi 的参考配置:

```toml
# https://github.com/twpayne/chezmoi/discussions/2424
[diff]
command = "code"
args = ["--wait", "--diff", "{{ .Destination }}", "{{ .Target }}"]

[merge]
command = "bash"
```

#### 3、敏感数据存储

如果你想用 chezmoi 管理你的密钥（例如: id_rsa ssh 密钥），同时又想把你的 dotfiles 配置在 GitHub 共享出来，chezmoi 自带了敏感数据存储的方案，可以使用 GPG、AGE 等对配置文件进行加密, 参考: https://www.chezmoi.io/user-guide/encryption/

