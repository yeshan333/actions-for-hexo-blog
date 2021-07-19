---
title: docker学习笔记
toc: true
comments: true
popular_posts: true
mathjax: true
top: false
date: 2019-08-08 17:29:19
tags: docker
categories: docker
keywords: "docker, note, dockerhub, docker image"
---

>[Play With Docker一个免费使用的基于web界面的Docker环境](https://labs.play-with-docker.com/)

# 常用docker命令

**可使用`docker COMMAND --help`查看命令的用法**

## Docker镜像相关

- 1、`docker image pull`：用于下载镜像，镜像从远程镜像仓库服务的仓库中下载，默认从Docker Hub的仓库中拉取

```bash
# 格式：docker pull [OPTIONS] NAME[:TAG|@DIGEST]
# 说明：如果给出tag，一般拉取latest，name一般为username/repository,digest为镜像摘要可不给出
docker image pull ubuntu:latest
# 这个拉取标签为latest的ubuntu官方镜像，latest: Pulling from library/ubuntu，latest不一定是最新镜像
```
<!-- more -->

- 2、`docker image ls`：列出本地Docker主机上存储的镜像

- 3、`docker image inspect`：查看镜像的细节，包括镜像层数据和元数据

```bash
# docker image inspect [OPTIONS] IMAGE [IMAGE...]
# inspect后一般跟repository name或image id
```

- 4、`docker image rm`：用于删除镜像。如果镜像存在关联的容器，并且容器处于运行(Up)或停止(Exit)状态时，不允许删除该镜像。rm后可跟repository或image id

- 5、`dicker image search`：从Docker Hub查找镜像

- 6、`docker image build`：根据Dockerfile构建镜像

```bash
# 例如：使用当前目录的 Dockerfile 创建镜像，标签为 runoob/ubuntu:v1。
docker build -t yeshan333/ubuntu:latest .
```

- 7、`docker image history`：用于查看镜像构建的相关信息

## Docker容器相关

- 1、`docker container run`：用于启动新容器

```bash
# 格式：docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
# 常用options：
# -d: 后台运行容器，并返回容器ID；
# -i: 以交互模式运行容器，通常与 -t 同时使用；
# -t: 为容器重新分配一个伪输入终端，通常与 -i 同时使用；
# -P: 随机端口映射，容器内部端口随机映射到主机的高端口
# -p: 指定端口映射，格式为：主机(宿主)端口:容器端口
# --name="container-name": 为容器指定一个名称；

# 示例
docker container run -it ubuntu:latest /bin/bash
# 说明：-it使容器具备交互性并与终端连接，命令最后表明运行容器中的Bash Shell程序
```

- 2、`docker container ls`：列出所有运行状态的容器可用`docker p`s代替，如果加个**-a*附加参数，会列出所有容器（包括处于停止状态的容器）

- 3、`docker container stop`：停止运行中的容器，并将其状态设置为Exited(0)，stop后跟container name或container id

- 4、`docker container rm`：用于删除停止运行的容器，rm后跟container name或container id，使用-f参数可强制删除运行中的容器

- 5、`docker container exec`：用于连接一个处于运行状态的容器

```bash
# 例如：
docker container exec -t <container-name or container-id> bash
# 该命令会将docker主机中的shell连接到一个运行中的容器，在容器内部启动一个新的bash shell进程
```
- 6、`docker container start`：用于重启处于停止(Exited)状态的容器，start后跟container name或container id

- 7、`docker container inspect`：查看容器的配置信息和运行时信息，inspect后跟container name或container id

- 8、快捷键`Ctrl+PQ`用于断开docker主机的shell终端与容器终端的连接，并在退出后保证容器在后台运行

# 应用容器化
>(Containerizing|Dockerizing)即将应用整合到容器中并且运行的过程

## 应用容器化的一般步骤

- 1、编写应用代码
- 2、创建Dockerfile，其中包括当前应用的描述、依赖以及如何运行这个应用
- 3、对Dockerfile执行docker image build命令
- 4、等待Docker将应用程序构建到Docker镜像中

>Once your app is containerized (made into a Docker image), you’re ready to ship it and run it as a container.《Docker Deep Dive》

![docker deep dive](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20190808213453.png)

## 使用Dockerfile定制镜像

- [Dockerfile最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [使用Dockerfile定制镜像](https://docker_practice.gitee.io/image/build.html)

>Dockerfile中以#开头的都是注释行，除注释之外，每一行都是一条指令
>指令的的一般格式：INSTRUCTION argument，INSTRUCTION一般都为大写

示例Dockerfile：https://github.com/yeshan333/psweb
```
FROM alpine

LABEL maintainer="nigelpoulton@hotmail.com"

# Install Node and NPM
RUN apk add --update nodejs nodejs-npm

# Copy app to /src
COPY . /src

WORKDIR /src

# Install dependencies
RUN  npm install

EXPOSE 8080

ENTRYPOINT ["node", "./app.js"]
```
- 说明：
  - 每个Dockerfile文件文件的第一行一般都是`FROM`指令。**FROM指定的镜像会作为当前镜像的一个基础镜像层，当前应用的剩余内容会作为新的镜像层添加到基础镜像层之上。**，FROM建议引用官方镜像
  - LABEL指定当前镜像维护者，给镜像使用者一个沟通渠道
  - `RUN apk add --update nodejs nodejs-npm`将当前应用的依赖安装到镜像中，RUN指令会新建一个镜像层存储这些内容
  - `COPY . /src`会将应用相关文件从构建上下文复制到当前镜像中，这会新建一个镜像层
  - `WORKDIR /src`会为Dockerfile中未执行的指令设置工作目录
  - `RUN  npm install`在当前工作目录中为应用安装依赖，这会新建一个镜像层
  - `EXPOSE 8080`对外提供一个web服务端口
  - `ENTRYPOINT ["node", "./app.js"]`指定了当前镜像的入口程序，container运行时就会运行

### 构建镜像
使用docker image build根据Dockerfile制作镜像，示例：
```
# -t用于指定制作好的镜像的名字及标签，通常 name:tag 或者 name
# 最后的 . 表示使用当前目录作为构建上下文
docker image build -t web:latest .
```

**使用`docker image history web:latest`可以查看构建镜像过程中执行了哪些指令**

### 推送镜像到Docker Hub

- 推送镜像前建议使用以下命令给镜像打新标签
```
# new-tag建议以自己的 DockerHub ID/new-tag 的格式命名，方便推送到自己的repo
docker image tag <current-tag> <new-tag>
```
- 使用`docker image push <tag-name>`推送镜像，推送前需要`docker login`,**记得测试打包好的应用再推送！！！**

### Dockerfile常用指令

|指令|说明|
|:--:|:--:|
|FROM|指定要构建的镜像的基础镜像，一般为Dockerfile文件第一行|
|RUN|用于在镜像中执行命令，会新建一个镜像层|
|COPY|一般用于将应用代码copy到镜像中，这会新建一个镜像层|
|WORKDIR|用于设置Dockerfile中未执行的指令的工作目录|
|ENTRYPOINT|指定镜像以容器方式启动后默认运行的程序， ENTRYPOINT 的命令不会被docker run指定要执行的命令覆盖|
|CMD|指定容器启动时执行的命令，一个 Dockerfile 中只能有一个 CMD 指令，如果写了多个，那么只有最后一个会执行。CMD 和 ENTRYPOINT 同时存在时，CMD 中的内容会变成 ENTRYPOINT 中指令命令的默认参数，该参数可以被 docker run 时设置的命令覆盖|
|ENV|设置镜像中的环境变量|
|EXPOSE|记录应用所使用的网络端口|

更多：
- [Dockerfile指令详解](https://docker_practice.gitee.io/image/dockerfile/)
- [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)


<p align="middle">
<a src="https://labs.play-with-docker.com/">
<img src="https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20190808232118.png"></a>
</p>