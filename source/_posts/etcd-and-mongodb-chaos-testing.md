---
title: etcd 和 MongoDB 的混沌（故障）测试方法
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "chaos testing, failpoint, etcd, mongodb"
music:
  enable: false
  server: netease
  type: song
  id: 26664345
headimg: https://telegraph.shansan.top/file/bb4710073af02d3a1beca.png
description: "etcd 和 MongoDB 的混沌（故障）测试方法"
date: 2024-05-18 15:02:09
tags: ["Chaos Testing", "etcd", "MongoDB"]
categories: ["Chaos"]
---

最近在对一些自建的数据库 driver/client 基础库的健壮性做混沌（故障）测试, 去验证了解业务的故障处理机制和恢复时长. 主要涉及到了 MongoDB 和 etcd 这两个基础组件. 本文会介绍下相关的测试方法. 

## MongoDB 中的故障测试

> MongoDB 是比较世界上热门的文档型数据库, 支持 ACID 事务、分布式等特性. 

社区上大部分对 MongoDB 进行混沌（故障）测试的文章大多都是外围通过对 monogd 或 mongos 进行做处理进行模拟的. 比如如果想要让 MongoDB 自己触发副本集切换, 可以通过一下这样一段 shell 脚本: 

```shell
# 将副本集主节点进程挂死
kill -s STOP <mongodb-primary-pid>

# 挂死之后, 业务受损, MongoDB 在几秒到十几秒应该会进程主备切换
# 切换完成后, 业务能自动将连接切换到新的工作正常的主节点, 无需人工干预, 业务恢复正常
# 这里一般验证的是 Mongo Client Driver 的可靠性
```

上面提到的手段一般是系统层级的, 如果我们只是想要模拟某个 MongoDB command 命令遇到网络问题了, 怎么做？进一步想要进行更细粒度的测试. 其实 MongoDB 在 4.x 以上版本内部已经实现了一套可控的故障点模拟机制 -> [failCommand](https://github.com/mongodb/mongo/wiki/The-failCommand-fail-point). 

在测试环境部署 MongoDB 副本集的时候, 一般可以通过以下方式启动这个特性: 

```shell
mongod --setParameter enableTestCommands=1
```

然后我们可以通过 mongo shell 针对特定的 command 开启故障点, 例如针对一次 `find` 操作让其返回错误码 2: 

```shell
db.adminCommand({
    configureFailPoint: "failCommand",
    mode: {
      "times": 1,
    },
    data: {errorCode: 2, failCommands: ["find"]}
});
```

这些故障点模拟是可控的, 成本相对于必直接在机器上搞破坏比较低, 也很适合融入持续集成自动化流程. MongoDB 内置的故障点机制还支持了很多的特性, 比如让某个故障概率发生、返回任意 MongoDB 支持的错误码类型等等, 通过该机制, 我们可以很方便的在单元测试和集成测试中验证我们自己实现的 MongoDB Client Driver 的可靠性. 

如果想具体知道 MongoDB 支持哪些故障点, 可以详细查看 MongoDB 提供的 [specification](https://github.com/mongodb/specifications), 里面有提到针对 MongoDB 每一个特性, driver 可以使用哪些故障点进行测试. 

MongoDB 官方提供的 go 实现的 dirver 代码仓库中也有不少的例子可以参考 [https://github.com/mongodb/mongo-go-driver/blob/345ea9574e28732ca4f9d7d3bb9c103c897a65b8/mongo/with_transactions_test.go#L122](https://github.com/mongodb/mongo-go-driver/blob/345ea9574e28732ca4f9d7d3bb9c103c897a65b8/mongo/with_transactions_test.go#L122). 

## etcd 中的故障测试

> etcd 是一个开源的、高可用的分布式键值存储系统, 它主要用于共享配置和服务发现. 

之前我们提到了 MongoDB 内置了可控的故障点注入机制方便我们做故障点测试, 那么 etcd 是否也提供了呢？

没错, etcd 官方也提供了内置的可控故障注入手段方便我们围绕 etcd 做故障模拟测试, 不过官方提供的可供部署的二进制分发默认是没有使用故障注入特性的, 区别于 MongoDB 提供了开关, etcd 需要我们手动从源码编译出包含故障注入特性的二进制出来去部署. 

etcd 官方实现了一个 Go 包 [gofail](https://github.com/etcd-io/gofail) 去做 "可控" 的故障点测试, 可以控制特定故障发生的概率和次数. gofail 可以用于任意 Go 实现的程序中. 

原理上通过注释在源代码中通过注释 (`// gofail:`) 去对可能发生问题的地方埋藏一些故障注入点, 偏于进行测试验证, 例如:

```go
	if t.backend.hooks != nil {
		// gofail: var commitBeforePreCommitHook struct{}
		t.backend.hooks.OnPreCommitUnsafe(t)
		// gofail: var commitAfterPreCommitHook struct{}
	}
```

在使用 `go build` 构建出二进制之前, 使用 gofail 提供的命令行工具 `gofail enable` 可以取消这些故障注入相关代码的注释, 并生成故障点相关的代码，这样编译出的二进制可以用于故障场景的细粒度测试. 使用 `gofail disable` 去注释去除掉生成的故障点相关代码, 再使用 `go build` 编译出的二进制就可以在生产环境使用.

在执行二进制的时候, 可以通过环境变量 `GOFAIL_FAILPOINTS` 去唤醒故障点, 如果你的二进制程序是个永不停机的服务, 那么可以通过 GOFAIL_HTTP 环境变量在程序启动的同时, 启动一个 HTTP endpoint 去给外部测试工具唤醒埋藏的故障点. 

具体的原理实现可以查看下 gofail 的设计文档 -> [design](https://github.com/etcd-io/gofail/blob/master/doc/design.md). 

> 值的一提的是 pingcap 重新基于 gofail 重新造了个轮子, 做了不少优化:
> failpoint 相关代码不应该有任何额外开销；
> 不能影响正常功能逻辑，不能对功能代码有任何侵入；
> failpoint 代码必须是易读、易写并且能引入编译器检测；
> 最终生成的代码必须具有可读性；
> 生成代码中，功能逻辑代码的行号不能发生变化（便于调试）；
> 如果想要了解它的实现原理, 可以查看这篇官方文章: [Golang Failpoint 的设计与实现](https://cn.pingcap.com/blog/golang-failpoint/?spm=ata.21736010.0.0.2d507a54sxGHvz)
> 这篇深度剖析的博客也值得一读: [在 Go 中使用 Failpoint 注入故障](https://www.luozhiyun.com/archives/595)

接下来我们看看如何在 etcd 中启用这些故障埋点。

### 编译出可供进行故障测试的 etcd

etcd 官方仓库的 Makefile 已经内置了对应的指令帮我们快速编译出包含故障点二进制 etcd server. 编译步骤大致如下: 

```shell
git clone git@github.com:etcd-io/etcd.git
cd etcd

# 激活故障点注释
make gofail-enable
make build
# 还原代码
make gofail-disable
```

经过如上步骤之后, 编译好的二进制文件直接可以在 `bin` 目录下可以看到, 让我们启动 etcd 看一下:

```shell
# 开启通过 HTTP 激活故障点的方式
GOFAIL_HTTP="127.0.0.1:22381" ./bin/etcd
```

使用 curl 看下有哪些故障点可以使用: 

```shell
curl http://127.0.0.1:22381

afterCommit=
afterStartDBTxn=
afterWritebackBuf=
applyBeforeOpenSnapshot=
beforeApplyOneConfChange=
beforeApplyOneEntryNormal=
beforeCommit=
beforeLookupWhenForwardLeaseTimeToLive=
beforeLookupWhenLeaseTimeToLive=
beforeSendWatchResponse=
beforeStartDBTxn=
beforeWritebackBuf=
commitAfterPreCommitHook=
commitBeforePreCommitHook=
compactAfterCommitBatch=
compactAfterCommitScheduledCompact=
compactAfterSetFinishedCompact=
compactBeforeCommitBatch=
compactBeforeCommitScheduledCompact=
compactBeforeSetFinishedCompact=
defragBeforeCopy=
defragBeforeRename=
raftAfterApplySnap=
raftAfterSave=
raftAfterSaveSnap=
raftAfterWALRelease=
raftBeforeAdvance=
raftBeforeApplySnap=
raftBeforeFollowerSend=
raftBeforeLeaderSend=
raftBeforeSave=
raftBeforeSaveSnap=
walAfterSync=
walBeforeSync=
```

知道了故障点, 就可以针对指定故障设置故障类型, 如下: 

```shell
# beforeLookupWhenForwardLeaseTimeToLive 处 sleep 1 秒
curl http://127.0.0.1:22381/beforeLookupWhenForwardLeaseTimeToLive -XPUT -d'sleep(10000)'
# 查看故障点状态
curl http://127.0.0.1:22381/beforeLookupWhenForwardLeaseTimeToLive
sleep(1000)
```

> 故障点的描述语法见: [https://github.com/etcd-io/gofail/blob/master/doc/design.md#syntax](https://github.com/etcd-io/gofail/blob/master/doc/design.md#syntax)

至此, 已经可以利用 etcd 内置的故障点做一些故障模拟测试了, 具体怎么使用这些故障点可以参考下 etcd 官方的集成测试实现 -> [etcd Robustness Testing](https://github.com/etcd-io/etcd/tree/main/tests/robustness). 通过故障点名称搜索相关代码即可. 

除了上述这些 etcd 内置的故障点, etcd 的官方仓库也提供了一份系统级的集成测试例子 -> [etcd local-tester](https://github.com/etcd-io/etcd/tree/main/tools/local-tester), 它模拟了 etcd 集群模式下的节点宕机测试. 

好了, 本文的分享, 到此暂时结束啦 ღ( ´･ᴗ･` )~

小广告插播: 最近维护了可以维护多个 etcd server、etcdctl、etcductl 版本的工具 [vfox-etcd](https://github.com/version-fox/vfox-etcd), 你也可以用它来在机器上安装多个包含 failpoint 的 etcd 版本进行混沌 (故障模拟) 测试哦~
