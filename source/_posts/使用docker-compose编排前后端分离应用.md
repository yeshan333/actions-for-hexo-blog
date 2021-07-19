---
title: 使用docker-compose编排前后端分离应用
toc: true
comments: true
popular_posts: false
mathjax: true
top: false
date: 2020-06-28 11:39:55
tags: [docker, 服务编排, DevOps]
categories: docker
keywords: "docker, github, flask, DevOps"
---

几个月过去了，是时候把当初的 [🚩](https://github.com/yeshan333/Flask-React-ToDoList#%E6%9B%B4%E6%96%B0%E8%AE%A1%E5%88%92) 干掉了。

顺便提高下 docker 的熟练度，得闲看下原理🚩（假期看过，没总结...）。

重装了波系统（Windows 2004 版本），这个版本下，Docker Desktop 是以 WSL2 为 backend 的，不用 Hyper -V 了，舒服了很多。

细品了下（又摸鱼搞 DevOps），跑这个前后端分离项目需要到的容器还挺多，4 个左右（后端 REST 服务、数据库服务、前端服务），前端服务上了两个容器『貌似没必要』，一个用来过渡，一个跑挂着 SPA 的 Nginx。

这次祭出了 Docker Compose，毕竟容器有点“小多”，单单用命令费劲。

<!-- more -->

## Demo 实战

- Demo 地址：https://github.com/yeshan333/Flask-React-ToDoList

```bash
git clone https://github.com/yeshan333/Flask-React-ToDoList
cd Flask-React-ToDoList
git checkout docker
```

### 1、先给后端服务写个 Dockerfile

这个项目的后端服务是用 Flask 写的，Dockerfile 如下所示：

```dockerfile
FROM python:3.8-alpine

LABEL maintainer = "yeshan <yeshan1329441308@gmail.com>"

EXPOSE 5000

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE 1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED 1

# Install pip requirements
ADD requirements.txt .
RUN python -m pip install -r requirements.txt

WORKDIR /app
ADD . /app

# production web server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
# CMD ["flask", "run", "--host", "0.0.0.0", "--port", "5000"]
```

生产环境下，Flask 自带的服务器不够骚，所以这里上 gunicorn。

### 2、再给前端 React-SPA 写个 Dockerfile

前端使用 React 编写「想起初学那时候抽组件那叫一个痛苦」，Dockerfile 如下

```dockerfile
FROM node:12.18-alpine as frontend-react

LABEL maintainer = "yeshan <yeshan1329441308@gmail.com>"

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install && npm install -g serve

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["serve", "-l", "tcp://0.0.0.0:5000", "-s", "build"]
```

原来想的是直接使用 react-script 自带的 HTTP 服务器的，前端应用也在容器跑，但是这个 HTTP 服务器不够骚，为了生产环境，还是上 Nginx 了。为了调试，使用 serve 套一下构建好的页面。

### 3、编写 docker-compose.yml 对容器进行编排

接下来的编排文件才是大头，调试了半天『🤣连接 MongoDB😂』。这个 URI 连接字符串试了多种操作，比如：`connection = MongoClient("mongodb://mongo:27017/")`、`connection = MongoClient("mongo:27017")`，最后还是看文档解决的，这...，文档还是香的。

原来 compose v2 以上，使用 compose 进行编排时，会默认建立一个网络（bridge 类型），连接各个容器，`主机名和容器名相同`，后面指定了下`container_name: flask_backend`、`container_name: mongo_database`才在 flask_backend 容器 `ping` 通 MongoDB 服务。

文档原文如下：

> By default Compose sets up a single network for your app. Each container for a service joins the default network and is both reachable by other containers on that network, and discoverable by them at a hostname identical to the container name.[🔗](https://docs.docker.com/compose/networking/)

OK，看下这个小 demo 的编排文件：

```yml
version: '3.4'

services:
  backend:
    container_name: flask_backend
    image: backend
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    depends_on:
      - database

  database:
    container_name: mongo_database
    image: mongo
    volumes:
      - data:/data/db

  frontend:
    container_name: frontend-react
    image: frontend
    build:
      context: ./frontend
      dockerfile: Dockerfile
    volumes:
        - static:/usr/src/app/build
    ports:
      - "3000:5000"

  nginx:
    container_name: webserver-nginx
    image: nginx:latest
    ports:
     - "80:80"
    volumes:
     - static:/usr/share/nginx/html
    command: "/bin/bash -c "nginx -g 'daemon off;'"

volumes:
  data:
  static:
```

可以明显的看到，之前为前端 SPA 创建的容器只是为了做下过渡「通过 static volumn 进行过渡」。最终的应用还是挂在 Nginx 上的。通过 volume 做下持久存储。

最后，跑下试试，看看效果如何。

```bash
docker-compose up -d
```

```bash
# 初始化数据库
docker exec -i  flask_backend flask create-database
```

{% gallery %}
![开始编排容器](https://s1.ax1x.com/2020/06/28/NRJe8x.png)

![创建的网络与卷](https://s1.ax1x.com/2020/06/28/NRJxdH.png)

![效果](https://s1.ax1x.com/2020/06/28/NRJaM8.png)
{% endgallery %}

收工，下一步就是做下服务抽离，部署到云原生的操作系统上-Kubernetes！🚩

## 参考

- [Compose file version 3 reference](https://docs.docker.com/compose/compose-file/#compose-documentation)
- [Networking in Compose](https://docs.docker.com/compose/networking/)
- [Python in a container](https://code.visualstudio.com/docs/containers/quickstart-python)
- [docker-practice](https://yeasy.gitbook.io/docker_practice/)
- [npm serve](https://www.npmjs.com/package/serve)
- [使用 Docker 部署 NodeJS + MongoDB 项目](https://zhuanlan.zhihu.com/p/69536325)
- [Docker Nginx 部署 React](https://segmentfault.com/a/1190000010415158)
