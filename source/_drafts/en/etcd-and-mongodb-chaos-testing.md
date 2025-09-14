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
headimg: https://blog-cloudflare-imgbed.pages.dev/file/bb4710073af02d3a1beca.png
description: "etcd 和 MongoDB 的混沌（故障）测试方法"
date: 2024-05-18 15:02:09
tags: ["Chaos Testing", "etcd", "MongoDB"]
categories: ["Chaos"]
---

Recently, I have been doing chaos (fault) tests on the robustness of some self-built database driver/client base libraries to verify and understand the fault handling mechanism and recovery time of the business.  It mainly involves the two basic components MongoDB and etcd.  This article will introduce the relevant test methods.

## Fault test in MongoDB

> MongoDB is a popular document database in the world, supporting ACID transactions, distributed and other features.

Most of the articles on chaos (fault) testing of MongoDB in the community are simulated by processing monogd or mongos. For example, if you want MongoDB to trigger copy set switching, you can use a shell script like this:

```shell
# suspended the primary node
kill -s STOP <mongodb-primary-pid>

# After the service is damaged, MongoDB should stepDown ReplicaSet in a few seconds to ten seconds.
# After the stepDown is complete, the service can automatically switch the connection to the new working primary node, without manual intervention, the service will return to normal.
# The reliability of the Mongo Client Driver is generally verified here.
```

The above-mentioned means are generally system-level, if we just want to simulate a MongoDB command command encountered network problems, how to do further want to conduct more fine-grained testing. In fact, MongoDB in 4.x version above has implemented a set of controllable fault point simulation mechanism -> [failCommand](https://github.com/mongodb/mongo/wiki/The-failCommand-fail-point). 

When deploying a MongoDB replica set in a test environment, you can generally enable this feature in the following ways: 

```shell
mongod --setParameter enableTestCommands=1
```

Then we can open the fault point for a specific command through the mongo shell, for example, for a `find` operation to make it return error code 2:

```shell
db.adminCommand({
    configureFailPoint: "failCommand",
    mode: {
      "times": 1,
    },
    data: {errorCode: 2, failCommands: ["find"]}
});
```

These fault point simulations are controllable, and the cost is relatively low compared to the direct destruction on the machine, and it is also suitable for integrating into continuous integration automation processes. The MongoDB built-in fault point mechanism also supports many features, such as allowing a certain fault probability to occur, returning any MongoDB supported error code type, etc. Through this mechanism, we can easily verify the reliability of our own implementation of the MongoDB Client Driver in unit tests and integration tests.

If you want to know which fault points the MongoDB supports, you can check the [specification](https://github.com/mongodb/specifications) provided by the MongoDB in detail, which mentions which fault points the driver can use for testing for each feature of the MongoDB.

MongoDB, there are many examples in the dirver code repository of the official go implementation that can be: [https://github.com/mongodb/mongo-go-driver/blob/345ea9574e28732ca4f9d7d3bb9c103c897a65b8/mongo/with_transactions_test.go#L122](https://github.com/mongodb/mongo-go-driver/blob/345ea9574e28732ca4f9d7d3bb9c103c897a65b8/mongo/with_transactions_test.go#L122). 

## Fault test in etcd

> etcd is an open source and highly available distributed key-value storage system, which is mainly used for shared configuration and service discovery.

We mentioned earlier that MongoDB has a built-in controllable fault point injection mechanism to facilitate us to do fault point testing, so does etcd also provide it?

Yes, etcd officials also provide a built-in controllable fault injection method to facilitate us to do fault simulation tests around etcd. However, the official binary distribution available for deployment does not use the fault injection feature by default, which is different from the switch provided by MongoDB. etcd requires us to manually compile the binary containing the fault injection feature from the source code for deployment.

etcd has officially implemented a Go package [gofail](https://github.com/etcd-io/gofail) to do "controllable" fault point testing, which can control the probability and number of specific faults. gofail can be used in any Go implementation program.

In principle, comments are used in the source code to bury some fault injection points in places where problems may occur through comments (`// gofail:`), which is biased towards testing and verification, for example:

```go
	if t.backend.hooks != nil {
		// gofail: var commitBeforePreCommitHook struct{}
		t.backend.hooks.OnPreCommitUnsafe(t)
		// gofail: var commitAfterPreCommitHook struct{}
	}
```

Before using `go build` to build the binary, use the command line tool `gofail enable` provided by gofail to cancel the comments of these fault injection related codes and generate the code related to the fault point, so that the compiled binary can be used for fine-grained testing of fault scenarios. Use `gofail disable` to remove the generated fault point related codes, the binary compiled with `go build` can be used in the production environment.

When executing final binary, you can wake up the fault point through the environment variable `GOFAIL_FAILPOINTS`. if your binary program is a service that never stops, you can start an HTTP endpoint to wake up the buried fault point to the external test tool by `GOFAIL_HTTP` the environment variable at the same time as the program starts.

The specific principle implementation can be seen in the design document of gofail-> [design](https://github.com/etcd-io/gofail/blob/master/doc/design.md).

> It is worth mentioning that pingcap have rebuilt a wheel based on gofail and made many optimizations:
> failpoint related code should not have any additional overhead;
> Can not affect the normal function logic, can not have any intrusion on the function code;
> failpoint code must be easy to read, easy to write and can introduce compiler detection;
> In the generated code, the line number of the functional logic code cannot be changed (easy to debug);
> 
> If you want to understand how it is implemented, you can check out this official article: [Design and Implementation of Golang Failpoints](https://www.pingcap.com/blog/design-and-implementation-of-golang-failpoints/)

Next, let's look at how to enable these fault burial points in etcd.

### Compile etcd for fault testing

corresponding commands have been built into the Makefile of the official etcd github repository to help us quickly compile the binary etcd server containing fault points. the compilation steps are roughly as follows:

```shell
git clone git@github.com:etcd-io/etcd.git
cd etcd

# generate failpoint relative code
make gofail-enable
# compile etcd bin file
make build
# Restore code
make gofail-disable
```

After the above steps, the compiled binary files can be directly seen in the `bin` directory. Let's start etcd to have a look:

```shell
# enable http endpoint to control the failpoint
GOFAIL_HTTP="127.0.0.1:22381" ./bin/etcd
```

Use curl to see which failure points can be used:

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

Knowing these fault points, you can set the fault type for the specified fault, as follows:

```shell
# In beforeLookupWhenForwardLeaseTimeToLive failoint sleep 10 seconds
curl http://127.0.0.1:22381/beforeLookupWhenForwardLeaseTimeToLive -XPUT -d'sleep(10000)'
# peek failpoint status
curl http://127.0.0.1:22381/beforeLookupWhenForwardLeaseTimeToLive
sleep(1000)
```

> For the description syntax of the failure point, see: [https://github.com/etcd-io/gofail/blob/master/doc/design.md#syntax](https://github.com/etcd-io/gofail/blob/master/doc/design.md#syntax)

so far, we have been able to do some fault simulation tests by using the fault points built in etcd. how to use these fault points can refer to the official integration test implementation of etcd-> [etcd Robustness Testing](https://github.com/etcd-io/etcd/tree/main/tests/robustness). you can search for relevant codes by the name of the fault point.

In addition to the above-mentioned built-in failure points of etcd, the official warehouse of etcd also provides a system-level integration test example-> [etcd local-tester](https://github.com/etcd-io/etcd/tree/main/tools/local-tester), which simulates the node downtime test in etcd cluster mode.

Well, the sharing of this article is over for the time being ღ( ´･ᴗ･` )~

Commercial break: I recently maintenance can maintain multiple etcd server, etcdctl etcductl version of the tools [vfox-etcd](https://github.com/version-fox/vfox-etcd)), You can also use it to install multiple versions of etcd containing failpoint on the machine for chaos (failure simulation) tests!
