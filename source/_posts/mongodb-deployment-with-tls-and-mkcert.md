---
title: 使用 mkcert 本地部署启动了 TLS/SSL 加密通讯的 MongoDB 副本集和分片集群
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "MongoDB-ReplicaSet, MongoDB-Sharding-Cluster, TLS/SSL"
music:
  enable: false
  server: netease
  type: song
  id: 26664345
headimg: https://pub-a8b9801c20ad491b964fc0e49c81cdb7.r2.dev/mongodb-tls.png
description: "使用 mkcert 本地部署启动了 TLS/SSL 加密通讯的 MongoDB 副本集和分片集群"
date: 2025-02-06 15:40:38
updated:
tags: ["MongoDB-ReplicaSet", "MongoDB-Sharding-Cluster", "TLS/SSL"]
categories: 
  - [MongoDB]
  - [TLS/SSL]
---

MongoDB 是支持客户端与 MongoDB 服务器之间启用 TLS/SSL 进行加密通讯的, 对于 MongoDB 副本集和分片集群内部的通讯, 也可以开启 TLS/SSL 认证. 本文会使用 [mkcert](https://github.com/FiloSottile/mkcert) 创建 TLS/SSL 证书, 基于创建的证书, 介绍 MongoDB 副本集、分片集群中启动 TLS/SSL 通讯的方法. 

我们将会在本地部署启用了 SSL/TLS 通讯的副本集、分片集群. 

## 安装 mkcert 和 MongoDB

在介绍 MongoDB 副本集和 MongoDB 分片集群中启用 SSL/TLS 通讯前, 我们先在本地安装好 MongoDB 和 mkcert.

[mkcert](https://github.com/FiloSottile/mkcert) 是一个 Go 实现的命令行工具, 方便我们使用一行命令就创建好 TLS/SSL 证书. 这里我们以 Ubuntu Linux 为例子:

```shell
# 需要安装有 Go
go install filippo.io/mkcert@latest

```

你也可以参考 mkcert 文章中描述的安装方法进行安装: [mkcert installation](https://github.com/FiloSottile/mkcert#installation).

接下来我们安装 MongoDB Server 和 MongoDB Shell 命令行工具. 你可以在 [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) 下载到对应的二进制 (mongod、mongos) 文件压缩包. 后续我们将会以 MongoDB@2.0.26 版本为例:

```shell
❯ mongod --version
db version v5.0.26
Build Info: {
    "version": "5.0.26",
    "gitVersion": "0b4f1ea980b5380a66425a90b414106a191365f4",
    "openSSLVersion": "OpenSSL 1.1.1f  31 Mar 2020",
    "modules": [],
    "allocator": "tcmalloc",
    "environment": {
        "distmod": "ubuntu2004",
        "distarch": "x86_64",
        "target_arch": "x86_64"
    }
}
```

> 注意, 如果你使用了高本版的 MongoDB, 需要单独下载 MongoDB Shell 命令行客户端工具. 可以在这里下载 [https://www.mongodb.com/try/download/shell](https://www.mongodb.com/try/download/shell).

接下来让我们看看如何在 MongoDB 中启用 TLS/SSL 通讯.

## MongoDB 副本集中启用 TLS/SSL

让我们先看看怎么在副本集中启用 SSL/TLS.

1. 第一步, 我们先使用 mkcert 生成待会 MongoDB 服务器 `mongod` 使用的证书

```shell
# 将 CA 证书存放在 mkcert 目录下
export CAROOT=$(pwd)/mkcert
# 安装 CA
mkcert -install
# 将证书和密钥合并, 后续 mongod 会使用到, 一般用来校验客户端使用的证书
cat mkcert/rootCA.pem mkcert/rootCA-key.pem > mkcert/CA.pem

# 生成 mongod 使用的服务器证书, 这个证书在通信的时候会传递给客户端校验合法性
mkcert -cert-file mongo-tls.crt -key-file mongo-tls.key localhost 127.0.0.1 ::1
# 同样, 合并证书和密钥
cat mongo-tls.crt mongo-tls.key > mongo-tls.pem

# 生成 mongo 客户端使用的证书, 这个证书后续不只用于客户端于服务器的通讯, 也用于副本集成员内部认证时使用
mkcert -client -cert-file mongo-tls-client.crt -key-file mongo-tls-client.key localhost 127.0.0.1 ::1
cat mongo-tls-client.crt mongo-tls-client.key > mongo-tls-client.pem
```

2. 第二步, 我们使用上述生成的证书 pem 文件来启动副本集, 副本集各成员使用的配置文件如下:

```yaml
❯ cat etc/primary.conf.yaml
replication:
  replSetName: mongo_replica_set

storage:
  dbPath: build/mongo_replica_set/mongodata_primary

# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: logs/mongo_replica_set_mongod_primary.log
  verbosity: 0

# network interfaces
net:
  tls:
    mode: requireTLS
    CAFile: mkcert/CA.pem
    certificateKeyFile: mongo-tls.pem
    clusterFile: mongo-tls-client.pem # https://www.mongodb.com/docs/manual/tutorial/configure-ssl/#member-certificate-requirements
    allowConnectionsWithoutCertificates: true
  port: 47017
  bindIp: 127.0.0.1,localhost
  compression:
    compressors: zlib

# how the process runs
processManagement:
  fork: true
  timeZoneInfo: /usr/share/zoneinfo

# Member x.509 Certificate
# https://www.mongodb.com/docs/manual/tutorial/configure-x509-member-authentication/
security:
  clusterAuthMode: x509
```

```yaml
❯ cat etc/secondary_a.conf.yaml 
replication:
  replSetName: mongo_replica_set

storage:
  dbPath: build/mongo_replica_set/mongodata_secondary_a

# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: logs/mongo_replica_set_mongod_secondary_a.log
  verbosity: 0

# network interfaces
net:
  tls:
    mode: requireTLS
    CAFile: mkcert/CA.pem
    certificateKeyFile: mongo-tls.pem
    clusterFile: mongo-tls-client.pem # https://www.mongodb.com/docs/manual/tutorial/configure-ssl/#member-certificate-requirements
    allowConnectionsWithoutCertificates: true
  port: 47018
  bindIp: 127.0.0.1,localhost
  compression:
    compressors: zlib

# how the process runs
processManagement:
  fork: true
  timeZoneInfo: /usr/share/zoneinfo

# Member x.509 Certificate
# https://www.mongodb.com/docs/manual/tutorial/configure-x509-member-authentication/
security:
  clusterAuthMode: x509
```

```yaml
❯ cat etc/secondary_b.conf.yaml
replication:
  replSetName: mongo_replica_set

storage:
  dbPath: build/mongo_replica_set/mongodata_secondary_b

# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: logs/mongo_replica_set_mongod_secondary_b.log
  verbosity: 0

# network interfaces
net:
  tls:
    mode: requireTLS
    CAFile: mkcert/CA.pem
    certificateKeyFile: mongo-tls.pem
    clusterFile: mongo-tls-client.pem # https://www.mongodb.com/docs/manual/tutorial/configure-ssl/#member-certificate-requirements
    allowConnectionsWithoutCertificates: true
  port: 47019
  bindIp: 127.0.0.1,localhost
  compression:
    compressors: zlib

# how the process runs
processManagement:
  fork: true
  timeZoneInfo: /usr/share/zoneinfo

# Member x.509 Certificate
# https://www.mongodb.com/docs/manual/tutorial/configure-x509-member-authentication/
security:
  clusterAuthMode: x509
```

其中主节点（primary）监听的地址为 `127.0.0.1:47017`, 从节点监听的地址为 `127.0.0.1:47018`、`127.0.0.1:47019`. 这是典型的 PSS 架构部署的 MongoDB 副本集, 网络拓扑如下:

![PSS MongDB ReplicaSet](https://www.mongodb.com/docs/manual/images/replica-set-read-write-operations-primary.bakedsvg.svg)

我们使用 `mongod` 启用上述配置文件, 注意配置文件中 certificate 相关字段引用到的 mkcert 生成的配置文件, `mongod` 启用命令如下:

```shell
mkdir logs
mkdir build

mongod --config "etc/primary.conf.yaml"
mongod --config "etc/secondary_a.conf.yaml"
mongod --config "etc/secondary_b.conf.yaml"

# 初始化副本集
mongo --port 47017 --tls <<EOF
db.adminCommand({replSetInitiate: { 
  _id: "mongo_replica_set", 
  members: [
    { _id: 0, host: "127.0.0.1:47017", priority: 2}, 
    { _id: 1, host: "127.0.0.1:47018", priority: 1}, 
    { _id: 2, host: "127.0.0.1:47019", priority: 1} ],
  settings: {
    electionTimeoutMillis: 3000
  }
}})
EOF
```

启动完成后, 我们使用 MongoDB Shell 命令客户端尝试连接主 (primary) 节点 `127.0.0.1:47017`, 命令如下:

```shell
❯ mongo --port 47017
MongoDB shell version v5.0.26
connecting to: mongodb://127.0.0.1:47017/?compressors=disabled&gssapiServiceName=mongodb
Error: network error while attempting to run command 'isMaster' on host '127.0.0.1:47017'  :
connect@src/mongo/shell/mongo.js:372:17
@(connect):2:6
exception: connect failed
exiting with code 1
```

会看到连接会失败, 这是因为 MongoDB 服务器强制开启了 TLS/SSL 通讯, 配置文件中相关字段如下:

```yaml
net:
  tls:
    mode: requireTLS
```

这时候 mongo 客户端连接的使用需要走 TLS/SSL, 命令如下:

```shell
❯ mongo --port 47017 --tls
MongoDB shell version v5.0.26
connecting to: mongodb://127.0.0.1:47017/?compressors=disabled&gssapiServiceName=mongodb
{"t":{"$date":"2025-02-06T14:22:24.093Z"},"s":"I",  "c":"NETWORK",  "id":5490002, "ctx":"thread4","msg":"Started a new thread for the timer service"}
Implicit session: session { "id" : UUID("0a5698d1-81b5-4aee-800b-809da69baf58") }
MongoDB server version: 5.0.26
================
Warning: the "mongo" shell has been superseded by "mongosh",
which delivers improved usability and compatibility.The "mongo" shell has been deprecated and will be removed in
an upcoming release.
For installation instructions, see
https://docs.mongodb.com/mongodb-shell/install/
================
mongo_replica_set:PRIMARY>
```

可以看到我们能正常连接到副本集. 通过 tcpdump 能网络抓包工具, 我们可以看到通信流量是被加密过的. 接下来我们看看如何在 MongoDB 分片集群 (Sharding Cluster) 中启用 TLS/SSL.

## MongoDB 分片集群中启用 TLS/SSL

接下来我们将本地部署的 MongoDB 分片集群拓扑大致如下, 其中两个 mongos、一个 config shard、一个数据分片 mongo shard a:

![[https://www.mongodb.com/docs/manual/static/1112d075b61fb59a49076c865c6e8f60/bde8a/sharded-cluster-production-architecture.webp](https://www.mongodb.com/docs/manual/static/1112d075b61fb59a49076c865c6e8f60/bde8a/sharded-cluster-production-architecture.webp)](https://www.mongodb.com/docs/manual/static/1112d075b61fb59a49076c865c6e8f60/bde8a/sharded-cluster-production-architecture.webp)

1. 同样, 我们也需要生成 mongod、mongos、mongo 客户端使用的证书:

```shell
# 将 CA 证书存放在 mkcert 目录下
export CAROOT=$(pwd)/mkcert
# 安装 CA
mkcert -install
# 将证书和密钥合并, 后续 mongod 会使用到, 一般用来校验客户端使用的证书
cat mkcert/rootCA.pem mkcert/rootCA-key.pem > mkcert/CA.pem

# 生成 mongod 使用的服务器证书, 这个证书在通信的时候会传递给客户端校验合法性
mkcert -cert-file mongo-tls.crt -key-file mongo-tls.key localhost 127.0.0.1 ::1
# 同样, 合并证书和密钥
cat mongo-tls.crt mongo-tls.key > mongo-tls.pem

# 生成 mongo 客户端使用的证书, 这个证书后续不只用于客户端于服务器的通讯, 也用于副本集成员内部认证时使用
mkcert -client -cert-file mongo-tls-client.crt -key-file mongo-tls-client.key localhost 127.0.0.1 ::1
cat mongo-tls-client.crt mongo-tls-client.key > mongo-tls-client.pem
```

2. 我们先启用 mongo config shard 集群配置分片, 一般用于存储集群的路由信息等数据, 主节点启动配置如下, `clusterFile` 字段指定了集群成员间内部认证使用的证书:

```yaml
> cat etc/mongo_config_shard/mongo_cfg_primary.yaml
sharding:
  clusterRole: configsvr

replication:
  replSetName: config_shard_repl

storage:
  dbPath: build/config_shard_repl/mongodata_primary

# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: logs/config_shard_repl_mongod_primary.log
  verbosity: 0

# network interfaces
net:
  tls:
    mode: requireTLS
    CAFile: mkcert/CA.pem
    certificateKeyFile: mongo-tls.pem
    clusterFile: mongo-tls-client.pem # https://www.mongodb.com/docs/manual/tutorial/configure-ssl/#member-certificate-requirements
    allowConnectionsWithoutCertificates: true
  port: 27017
  bindIp: localhost,127.0.0.1
  compression:
    compressors: zlib

# how the process runs
processManagement:
  fork: true
  timeZoneInfo: /usr/share/zoneinfo

# https://www.mongodb.com/docs/manual/tutorial/configure-x509-member-authentication/
security:
  clusterAuthMode: x509
```

从节点使用的配置可以在这里看到: [ShardingCluster/etc/mongo_config_shard](https://github.com/yeshan333/mongo-deployment-with-tls/tree/main/deployments/ShardingCluster/etc/mongo_config_shard), 启动命令如下:

```shell
mongod --config "etc/mongo_config_shard/mongo_cfg_primary.yaml"
mongod --config "etc/mongo_config_shard/mongo_cfg_secondary_a.yaml"
mongod --config "etc/mongo_config_shard/mongo_cfg_secondary_b.yaml"

# 初始化副本集
mongo --port 27017 --tls <<EOF
db.adminCommand({replSetInitiate: { 
  _id: "config_shard_repl", 
  members: [
    { _id: 0, host: "127.0.0.1:27017", priority: 2}, 
    { _id: 1, host: "127.0.0.1:27018", priority: 1}, 
    { _id: 2, host: "127.0.0.1:27019", priority: 1} ],
  settings: {
    electionTimeoutMillis: 3000
  }
}})
EOF
```

3. 启动数据分片 (mongo shard a), 这个分片一般用于存储业务数据, 实际的生产使用会有多个, 主从节点配置文件可以在 [ShardingCluster/etc/mongo_shard_a](https://github.com/yeshan333/mongo-deployment-with-tls/tree/main/deployments/ShardingCluster/etc/mongo_shard_a) 中找到, 与配置分片的各节点配置除访问地址外大致相同, 各节点启用命令如下:

```shell
mongod --config "etc/mongo_shard_a/mongo_cfg_primary.yaml"
mongod --config "etc/mongo_shard_a/mongo_cfg_secondary_a.yaml"
mongod --config "etc/mongo_shard_a/mongo_cfg_secondary_b.yaml"

# 初始化副本集
mongo --port 37017 --tls <<EOF
db.adminCommand({replSetInitiate: { 
  _id: "shard_a_repl", 
  members: [
    { _id: 0, host: "127.0.0.1:37017", priority: 2}, 
    { _id: 1, host: "127.0.0.1:37018", priority: 1}, 
    { _id: 2, host: "127.0.0.1:37019", priority: 1} ],
  settings: {
    electionTimeoutMillis: 3000
  }
}})
EOF
```

4. 接下来我们通过如下配置启动 mongos 路由器, mongo 客户端一般通过 mongos 访问业务数据, mongos 的启用配置如下:

```yaml
❯ cat etc/mongos/mongos_a_cfg.yaml 
# network interfaces
net:
  tls:
    mode: requireTLS
    CAFile: mkcert/CA.pem
    certificateKeyFile: mongo-tls.pem
    clusterFile: mongo-tls-client.pem # https://www.mongodb.com/docs/manual/tutorial/configure-ssl/#member-certificate-requirements
    allowConnectionsWithoutCertificates: true
  port: 27011
  bindIp: localhost,127.0.0.1
sharding:
  configDB: config_shard_repl/127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019
systemLog:
  destination: file
  logAppend: true
  path: logs/mongos_a.log
  verbosity: 0

# https://www.mongodb.com/docs/manual/tutorial/configure-x509-member-authentication/
security:
  clusterAuthMode: x509
```

```yaml
❯ cat etc/mongos/mongos_b_cfg.yaml
# network interfaces
net:
  tls:
    mode: requireTLS
    CAFile: mkcert/CA.pem
    certificateKeyFile: mongo-tls.pem
    clusterFile: mongo-tls-client.pem # https://www.mongodb.com/docs/manual/tutorial/configure-ssl/#member-certificate-requirements
    allowConnectionsWithoutCertificates: true
  port: 27012
  bindIp: localhost,127.0.0.1
sharding:
  configDB: config_shard_repl/127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019
systemLog:
  destination: file
  logAppend: true
  path: logs/mongos_b.log
  verbosity: 0

# https://www.mongodb.com/docs/manual/tutorial/configure-x509-member-authentication/
security:
  clusterAuthMode: x509
```

mongos 启动命令如下:

```shell
mongos --config "etc/mongos/mongos_a_cfg.yaml"
mongos --config "etc/mongos/mongos_b_cfg.yaml"

# Cluster Member enable X503 authenticate, need auth access for db
mongo --port 27011 --tls <<EOF
use admin
db.createUser(
  {
    user: "mongo_super_user",
    pwd: "mongo_super_user_pwd",
    roles: [
      { role: "userAdminAnyDatabase", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" },
      { role: "clusterAdmin", "db" : "admin" }
    ]
  }
)
EOF

# mongos 添加分片
mongo --port 27011 --tls --username mongo_super_user --password mongo_super_user_pwd <<EOF
sh.addShard( "shard_a_repl/127.0.0.1:37017,127.0.0.1:37018,127.0.0.1:37019")
EOF
mongo --port 27012 --tls --username mongo_super_user --password mongo_super_user_pwd <<EOF
sh.addShard( "shard_a_repl/127.0.0.1:37017,127.0.0.1:37018,127.0.0.1:37019")
EOF
```

4. 待分片集群初始化完成后, 我们即可通过如下命令走 TLS/SSL 加密通讯访问分片集群数据:

```shell
mongo --port 27011 --tls --username mongo_super_user --password mongo_super_user_pwd <<EOF
show dbs;

quit();
EOF
```

Good~

## 结语

好了, 相信你跟着本篇文章成功在本地环境部署了开启 TLS/SSL 加密通讯的副本集或者 MongoDB 分片集群, 我已经将相关配置文件整理到了 GitHub 仓库中方便你后续快速参考使用, 访问地址为: [https://github.com/yeshan333/mongo-deployment-with-tls](https://github.com/yeshan333/mongo-deployment-with-tls).

```shell
git clone git@github.com:yeshan333/mongo-deployment-with-tls.git
cd /mongo-deployment-with-tls

bash run.sh ReplicaSet
```

## 参考

- [MongoDB configure-ssl](https://www.mongodb.com/docs/manual/tutorial/configure-ssl/)