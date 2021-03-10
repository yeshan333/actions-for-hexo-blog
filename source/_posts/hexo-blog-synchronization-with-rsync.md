---
title: 使用 rsync-deploy-action 同步 Hexo 博客到个人服务器
toc: true
comments: true
popular_posts: false
mathjax: true
headimg: https://s3.ax1x.com/2021/01/20/sfyNy4.png
date: 2021-01-19 20:02:51
tags: [Github Actions, DevOps, Nginx]
categories: DevOps
---

前几天写了个基于 rsync 进行文件同步的 Action -> [rsync-deploy-action](https://github.com/yeshan333/rsync-deploy-action)。目的有三个：

- 1、深入了解波 [GitHub Actions](https://docs.github.com/en/actions/creating-actions)，感受下 GitHub 的文档；
- 2、个人博客在我的腾讯云 CVM 服务器上是部署有一份的「域名：[shan333.cn](https://shan333.cn)」，之前的博客同步方式是通过 Linux 的定时任务，觉得不太行，当前博客的更新并没有那么频繁，没必要每隔几个小时就 `git pull` 一下，且服务器还挂着其他东西，性能还是有点损耗的，换成通过 rsync 进行主动推送的方式好点；
- 3、熟悉波 SSH 协议和 rsync 协议。

今天撸一篇文章简单记录下这次折腾。

<!-- more -->

## rsync-deploy-action 的创建

挑 rsync 协议，不挑 FTP 或 scp 的新建 GitHub Actions 的部分原因是 rsync 可以做增量备份。GitHub Action 有三种类别，即 Docker container、JavaScript 和 Composite run steps。这次手撸的 Action 归属于 GitHub 官方文档介绍的 [Docker container action](https://docs.github.com/en/actions/creating-actions/creating-a-docker-container-action)。rsync-deploy-action 已经发布到 GitHub 的 Marketplace。源仓库地址：[https://github.com/yeshan333/rsync-deploy-action](https://github.com/yeshan333/rsync-deploy-action)。

> rsync 与其他文件传输工具（如 FTP 或 scp）不同，rsync 的最大特点是会检查发送方和接收方已有的文件，仅传输有变动的部分（默认规则是文件大小或修改时间有变动）。

rsync-deploy-action 基于 SSH 协议进行文件的远程同步，从元数据文件 action.yml 可以看到，Action 支持 8 个参数「6个必选，2个可选」。

```yml
name: 'rsync-deploy-action'
description: 'Synchronize files to the remote server using the SSH private key'
inputs:
  ssh_login_username:
    description: 'SSH login username'
    required: true
  remote_server_ip:
    description: 'remote server ip'
    required: true
  ssh_port:
    description: 'remote server SSH port'
    required: true
    default: "22"
  ssh_private_key:
    description: 'login user SSH private key'
    required: true
  source_path:
    description: 'The source storage path of the synchronous files'
    required: true
  destination_path:
    description: 'The destination storage path of the synchronous files'
    required: true
  ssh_args:
    description: 'SSH args'
    required: false
  rsync_args:
    description: 'rsync args'
    required: false

outputs:
  start_time:
    description: 'Start time of synchronization'
  end_time: # id of output
    description: 'End time of synchronization'
runs:
  using: 'docker'
  image: 'Dockerfile'
  args:
    - ${{ inputs.ssh_login_username }}
    - ${{ inputs.remote_server_ip }}
    - ${{ inputs.ssh_port }}
    - ${{ inputs.ssh_private_key }}
    - ${{ inputs.source_path }}
    - ${{ inputs.destination_path }}
    - ${{ inputs.ssh_args }}
    - ${{ inputs.rsync_args }}

branding:
  icon: 'file'
  color: 'green'
```

利用 rsync-deploy-action 的 Dockerfile 文件配合 [Action 执行日志](https://github.com/yeshan333/github-actions-test-repo/runs/1709315134?check_suite_focus=true)可以一窥 GitHub Actions 背后是如何执行的。 Action 的 [with](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstepswith) 参数的传递在一定程度上利用了 Dockerfile 的 ENTRYPOINT。

```dockerfile
# Container image that runs your code
FROM alpine:latest

RUN apk update \
 && apk upgrade \
 && apk add --no-cache \
            rsync \
            openssh-client

# Copies your code file from your action repository to the filesystem path `/` of the container
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Code file to execute when the docker container starts up (`entrypoint.sh`)
ENTRYPOINT ["/entrypoint.sh"]
```

接下来介绍下利用 rsync-deploy-action 进行 Hexo 博客同步到个人腾讯云 CVM 服务器的过程。

## Hexo 博客同步到云服务器

由于 rsync 是基于 SSH 协议的，rsync-deploy-action 需要使用到 SSH 私钥，所以需要先创建一个可以进行 SSH 远程登录的用户，不建议直接使用 root 用户。

### SSH 密钥登录

1、先配置好远程腾讯云 CVM 服务器 SSH 允许密钥登录。编辑 SSH 配置文件 /etc/ssh/sshd_config。

```shell
vim /etc/ssh/sshd_config
```

- StrictModes yes 改成 StrictModes no （去掉注释后改成 no）
- 找到 #PubkeyAuthentication yes 改成 PubkeyAuthentication yes （去掉注释）
- 找到 #AuthorizedKeysFile .ssh/authorized_keys 改成 AuthorizedKeysFile .ssh/authorized_keys （去掉注释）

保存后，重启 sshd。

```shell
systemctl restart sshd
```

2、新建用户 github，用于远程 SSH 免密登录。

在远程服务器执行如下命令：

```shell
# root 用户下创建用户 github 并且指定 HOME 目录
useradd -d /home/github github
# 也可以使用 adduser github，adduser会自动创建 HOME 目录等
# 设置 github 用户密码，用于后续 SSH 登录公钥的上传
passwd github
```

3、在本地 PC 执行如下命令，创建用于登录的密钥对。

```shell
# 生成密钥对
ssh-keygen -t rsa -b 4096 -C "1329441308@qq.com"
# 将生成的公钥上传到云服务器，server_ip 为服务器 IP 地址，ssh_port 为 SSH 端口号
cat ~/.ssh/id_rsa.pub | ssh github@server_ip -p ssh_port "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
# ssh 密钥登录测试，server_ip 为服务器 IP 地址，ssh_port 为 SSH 端口号
ssh -p ssh_port -i ~/.ssh/id_rsa github@server_ip
```

以上操作完成没问题之后，即可使用 [rsync-deploy-action](https://github.com/yeshan333/rsync-deploy-action) 了，后面以个人 Hexo 博客的同步为例子，简单看下如何使用此 Action。

### Hexo 博客同步

个人 Hexo 博客之前已经配置过 GitHub Action 的 workflows 进行博客的自动部署「博客源仓库：[yeshan333/actions-for-hexo-blog](https://github.com/yeshan333/actions-for-hexo-blog/blob/master/.github/workflows/hexo-ci.yaml#L54)」，所以再添加个 step 给  rsync-deploy-action 即可启用博客同步。step 声明如下：

```yml
name: Site CI

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      ......
      - name: Release to GitHub Pages
        run: |
          git config --global user.email "1329441308@qq.com"
          git config --global user.name "yeshan333"
          git clone git@github.com:yeshan333/yeshan333.github.io.git .deploy_git
          chmod 755 -R .deploy_git
          hexo clean
          hexo generate
          hexo deploy
      - name: Push to tencentyun CVM
        uses: yeshan333/rsync-deploy-action@v1.0.0
        with:
          ssh_login_username: ${{ secrets.SSH_LOGIN_USERNAME }}
          remote_server_ip: ${{ secrets.REMOTE_SERVER_IP }}
          ssh_port: ${{ secrets.SSH_PORT }}
          ssh_private_key: ${{ secrets.SSH_PRIVATE_KEY }}
          source_path: ./.deploy_git/*
          destination_path: ~/shan333.cn
          rsync_args: --exclude="./.deploy_git/.git/*"
```

workflow 中名为 Push to tencentyun CVM 的 [step](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstepswith) 会将 .deploy_git 下的所有文件上传到云服务器「存放到 ~/shan333.cn 目录下」，熟悉 Hexo 的朋友应该知道 `hexo deploy` 生成的文件会放在 `.deploy_git` 目录下，这里用到了 Hexo 的一个 Plugin -> [hexo-deployer-git](https://www.npmjs.com/package/hexo-deployer-git)。其实也可以将 `hexo generate` 生成的 [public](https://hexo.io/docs/generating.html) 目录下的所有文件同步到云服务器。

[rsync-deploy-action](https://github.com/yeshan333/rsync-deploy-action) 使用到的参数解释「有部分数据也算是隐私数据，这里意思下用了 GitHub 的 [repository secrets](https://docs.github.com/en/actions/reference/encrypted-secrets)」：

- ssh_login_username：可以进行 SSH 密钥登录的用户名，即之前配置好的 **github** 用户。
- remote_server_ip：云服务器 IP
- ssh_private_key：SSH 登录用户的私钥，即之前的 ~/.ssh/id_rsa 文件的内容
- source_path：博客相关所有文件路径
- destination_path：同步到云服务器的目标路径`~/shan333.cn`，即`/home/github/shan333.cn`
- rsync_args：action 的可选参数，.git 目录是没必要同步上传的，排除掉

“大功告成”。rsync 协议的更多介绍可参考：[WangDoc.com rsync](https://wangdoc.com/ssh/rsync.html)。

### More

个人的腾讯云 CVM 服务器之前为了方便维护安装了个运维面板[BT.CN](https://www.bt.cn/bbs/thread-19376-1-1.html)，Hexo 博客是用过 Nginx Serving 的，但 Nginx 是通过运维面板安装的，默认的 user 为 www「宝塔对 Nginx 的配置文件进行了拆分」，但同步后的博客是放在 github 用户的 HOME 目录下的 shan333.cn 目录中的，www 无权限执行博客的相关文件（403 Forbidden），所以需要操作波给 www 用户可执行权限，让 Nginx Worker 可以 serving 博客：

```shell
# root 用户下执行，github 目录下的所有文件 755 权限
chmod -R 755 /home/github
# 将 www 用户添加到 github user group
usermod www -G -a www
```

## 参考

- [GitHub Actions-Creating actions](https://github.com/features/actions)
- [GitHub Actions-Workflow syntax](https://docs.github.com/en/actions/reference#workflow-syntax)
- [SSH 密钥登录-网道文档](https://wangdoc.com/ssh/key.html)
- [nginx-split-large-configuration-file](https://serverfault.com/questions/707955/nginx-split-large-configuration-file)
- [Dockerfile ENTRYPOINT](https://docs.docker.com/engine/reference/builder/#entrypoint)






