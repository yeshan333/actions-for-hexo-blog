---
title: 使用 go-ycsb 对 etcd 进行基准 (benchmark) 性能测试
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: SEO 关键词
music:
  enable: false
  server: netease
  type: song
  id: 26664345
headimg: 文章头图 url 824x280
thumbnail: 标题右边缩略图 url
description: RSS 描述
abstract: Welcome to my blog, enter password to read.
message: Welcome to my blog, enter password to read.
date: 2024-02-28 14:16:51
updated:
tags:
categories:
password:
---

最近在对一些存储组件做性能测试，主要使用到了 YCSB，💧篇文章记录下。

## 什么是 YCSB

[YCSB](https://github.com/brianfrankcooper/YCSB/wiki#yahoo-cloud-serving-benchmark-ycsb)，全称为“Yahoo！Cloud Serving Benchmark”，是雅虎开发的用来对云服务进行基准 (benchmark) 性能测试的工具。可以用来对多种 NoSQL 数据库，如 MongoDB、Redis 等进行性能测试。官方内置了丰富的性能测试场景 (称之为: [workload](https://github.com/brianfrankcooper/YCSB/wiki/Running-a-Workload))，压测场景可以通过文件进行配置，便于压测场景的复现重用。

## go-ycsb

雅虎的 YCSB 是 Java 语言实现的，且没有对 etcd 内置的支持，pingcap 使用 Go 仿照 Java 版本的 YCSB 实现了 [go-ycsb](https://github.com/pingcap/go-ycsb)，工作机制大体类似. 且支持的数据库类型更加丰富，其中就有 [etcd](https://etcd.io/). 本文主要介绍使用 go-ycsb 基于 etcd 官方提供的性能场景场景 -> [Benchmarking etcd v3](https://etcd.io/docs/v3.5/benchmarks/etcd-3-demo-benchmarks/)，做一下基准性能测试。

性能测试一般有三个主要阶段:

```shell
数据准备(load phase) -> 压测执行(load run phase) -> 结果分析(load analysis phase)
```

go-ycsb 使用上可覆盖前两个阶段，对应如下:

1、数据准备(load phase): `./bin/go-ycsb load etcd -P workloads/workloada`

2、压测执行(load run phase): `./bin/go-ycsb run etcd -P workloads/workloada`

> 这里针对 etcd 进行数据准备和压测执行.

两个阶段都依赖到了一个负载控制的配置文件 `workloada`, 接下来让我们看看它.

## workload 负载配置介绍

在开始进行性能测试之前，我们对 go-ycsb 的 workload 负载配置简单介绍一下，以 go-ycsb 代码仓库提供的 [workloads/workload_template](https://github.com/pingcap/go-ycsb/blob/master/workloads/workload_template) 文件为例子:

```ini
# 主要支持的配置项见: https://github.com/pingcap/go-ycsb/blob/master/pkg/prop/prop.go

# 负责控制性能测试压力的核心实现
# 这里可以指定为我们自己实现的压力控制器, 不过 ycsb 内置的 core 一般情况下够用了
# 见：https://github.com/pingcap/go-ycsb/blob/f9c3dce045990bc03dac5092be2b00bef386b7c6/cmd/go-ycsb/main.go#L129
workload=core

# 指定了数据库中存在的数据条目数量
# 在数据准备阶段 (load phase) 会据此创建指定条目的数据
# 压测执行时 (load run phase) 可操作的数据条目总数
recordcount=1000000

# 压测执行阶段 (load run phase) 执行的数据库操作总数, 到达这个数量后一般压测即会停止执行
operationcount=3000000

# 执行数据库操作使用的线程数量
threadcount=500

# 控制目标吞吐量 OPS
target=1000

# 插入操作总数, 如果与 recordcount 不一致, 会根据 insertstart 指定的位置开始插入数据
#insertcount=

# 第一次插入操作的位置偏移量
insertstart=0

# 一条数据库记录存在的字段数量
# 在数据准备阶段 (load phase) 会据此创建每一条数据库数据
fieldcount=10

# 控制每个字段的大小 (单位: Byte 字节)
fieldlength=100

# 用于控制压测执行时, 读取操作是否会读取所有字段
readallfields=true

# 压测执行时, 控制数据库更新操作更新数据库记录时是否会更新所有字段
writeallfields=false

# The distribution used to choose the length of a field
fieldlengthdistribution=constant
#fieldlengthdistribution=uniform
#fieldlengthdistribution=zipfian

# 压测执行时, 读操作占总操作数 (operationcount) 的比例
readproportion=0.95

# 压测执行时, 写更新操作占总操作数 (operationcount) 的比例
updateproportion=0.05

# 压测执行时, 插入新数据操作占总操作数 (operationcount) 的比例
insertproportion=0

# 压测执行时, 先读取再写入操作占总操作数 (operationcount) 的比例
readmodifywriteproportion=0

# 扫描操作占总操作数 (operationcount) 的比例
scanproportion=0

# 每一次扫描操作, 扫描的记录总数
maxscanlength=1000

# 控制扫描操作的策略, 即每一次扫描操作的记录数策略
# uniform：表示每次扫描的记录数是随机的
# zipfian：根据 Zipfian 分布来选择记录数. 互联网常说的 80/20 原则, 也就是 20% 的 key, 会占有 80% 的访问量;
scanlengthdistribution=uniform
#scanlengthdistribution=zipfian

# 控制数据是否是顺序插入的
insertorder=hashed
#insertorder=ordered

# 数据库操作的策略
# uniform：随机选择一个记录进行操作；
# sequential：按顺序选择记录操作；
# zipfian：二八原则；
# latest：和 Zipfian 类似，但是倾向于访问新数据明显多于老数据；
# hotspot：热点分布访问；
# exponential：指数分布访问；
requestdistribution=zipfian

# 数据准备阶段，hotspot 热点分布策略下数据的占比
hotspotdatafraction=0.2

# 访问热点数据的数据库操作百分比
hotspotopnfraction=0.8

# 最大的执行时间 (单位为秒). 当操作数达到规定值或者执行时间达到规定最大值时基准测试会停止
#maxexecutiontime=

# 数据准备和压测执行阶段被操作的数据库表名称
table=usertable

# 控制压测结果的展现形式, 见: https://github.com/pingcap/go-ycsb/blob/fe11c4783b57703465ec7d36fcc4268979001d1a/pkg/measurement/measurement.go#L84
measurementtype=histogram
#measurementtype=csv
#measurementtype=raw
```

workload 负载文件支持的配置项以为 [pkg/prop/prop.go](https://github.com/pingcap/go-ycsb/blob/master/pkg/prop/prop.go) 声明的为准。

## 环境准备

## 性能测试

##


查看 workload 配置文件可用配置字段

## 参考

- [探究Go-YCSB做数据库基准测试](https://www.luozhiyun.com/archives/634)
- [YCSB wiki - Running a Workload](https://github.com/brianfrankcooper/YCSB/wiki/Running-a-Workload) [中译版](https://lsr1991.github.io/2015/04/25/ycsb-document-translation-running-a-workload/)
