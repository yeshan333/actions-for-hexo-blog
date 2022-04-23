---
title: (译)理解 Prometheus 的范围向量 (Range Vector)
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
date: 2022-04-23 15:38:37
tags: Prometheus
categories: Prometheus
keywords: "Prometheus, Monitor System"
---

Prometheus 中 Range Vector 的概念是有一点不直观的，除非你彻底阅读并理解了官方提供的文档。谁会这样做呢，去读官方文档？大多的人应该会花些错误的时间去做了一些错误的事情，然后随机去寻找一篇像本文一样的文章去理解这个概念，不是吗？

## 什么是 Vector

由于 Prometheus 是一个时序型的数据库，所以所有的数据都在基于时间戳的上下文中被定义。由时间戳到记录数据的映射（map）序列（series）被称之为时间序列（timeseries）。在 Prometheus 的术语中，关于时间序列的集合（即一组时序数据）被称之为 vector。让我们用一个示例去更好的说明这一点。

假设 `http_requests_total` 是一个表示服务受到的 http 请求总量的 vector。Vectors 允许我们更进一步的使用被称为 “labels” 的东西多维度去表示数据。 例:

```text
// the set of timeseries representing the number of requests with a `200` HTTP response code.
// HTTP 状态码为 200 的请求数的一组时间序列
http_requests_total{code="200"}

// the set of timeseries representing the number of requests served by the `/api/v1/query` handler.
// 表示' /api/v1/query '处理程序处理的请求数的一组时间序列
http_requests_total{handler="/api/v1/query"}
```

这样，我们就拥有了所有与所服务的 HTTP 请求数量相关的细粒度的信息，同时还可以在需要时选择聚合这些信息。从语法上讲，`http_requests_total` 指的是命名为它的整个时间序列集。通过添加 `{code="200"}` 或 `{handler="/api/v1/query"}`，我们选择了一个子集。

## Vectors 的类型

Prometheus 进一步定义了两种类型的 vector，取决于时间戳（timestamps）被映射为什么：

- **Instant vector**-一组时间序列，其中每个时间戳都映射到“瞬间（instant）”的单个数据点。在下面的响应中，我们可以看到在时间戳 `1608481001` 处记录的单个值。

```shell
curl 'http://localhost:9090/api/v1/query' \
  --data 'query=http_requests_total{code="200"}' \
  --data time=1608481001

{
  "metric": {"__name__": "http_requests_total", "code": "200"},
  "value": [1608481001, "881"]
}
```

![Instant vector](https://s1.ax1x.com/2022/04/23/LfAKyD.png)

- **Range vector**-一组时间序列，其中每个时间戳映射到一个数据点的“范围（range）”，记录到过去的一段持续时间。如果没有称为 “range” 的指定持续时间，则这些值不能存在，该持续时间用于构建每个时间戳的值列表。 在下面的示例中，请注意带有时间戳的值列表，从 `1608481001` 到过去最多 `30s`。

```shell
curl 'http://localhost:9090/api/v1/query' \
  --data 'query=http_requests_total{code="200"}[30s]' \
  --data time=1608481001

{
  "metric": {"__name__": "http_requests_total", "code": "200"},
  "values": [
    [1608480978, "863"],
    [1608480986, "874"],
    [1608480094, "881"]
  ]
}
```

![Range vector](https://s1.ax1x.com/2022/04/23/LfEf8P.png)

基于此，我们可以建立关于这两个 vector 类型的两个概念（ideas）：

1. Instant vectors 可以用直接被绘制; Range vectors 则不能。这是因为绘制图表需要在 y 轴上为 x 轴上的每个时间戳显示一个数据点。Instant vectors 的每个时间戳只有一个值，而 Range vectors 有很多。为了绘制指标（metric）图表，对于在时间序列中显示单个时间戳的多个数据点是没有被定义的。

2. Instant vectors 可以进行比较和运算; Range vectors 不能。这也是由于比较运算符和算术运算符的定义方式。对于每个时间戳，如果我们有多个值，我们不知道如何添加[1]或将它们与另一个性质类似的时间序列进行比较。

## 为什么我们还需要 Range Vectors

我们现在知道，Range Vectors 不能直接用于图表或聚合。因此，很自然地要问它们为什么会存在? 答案很简单: **counter**。 counter 是监控系统的基本类型之一，除了 gauges 和 timings。我们将继续前面的示例，去试图理解 counters 和 range vectors 是如何相互作用的。

假设我们想知道我们的服务现在正在处理多少请求。我们的度量指标 `http_requests_total{code="200"，handler="/api/v1/query"}` 是一个 instant vector，其值代表一个单调递增的 counter [2]。这个 counter 用于度量我们的服务接收到的请求总数。我们知道 Prometheus 在过去的不同时间里 “爬取（scraped）” 了这个 counter，所以我们可以简单地从请求 counter 的值开始:

```shell
curl 'http://localhost:9090/api/v1/query' \
  --data 'query=http_requests_total{code="200",handler="/api/v1/query"}'

{
  "metric": {"__name__": "http_requests_total", "code": "200", "handler":"/api/v1/query"},
  "value": [1608437313, "881"]
}
```

但从响应中可以看到，这样做会得到我们不感兴趣的请求的总数，我们关注的是它在过去的有限时间内收到的请求的数量（上面表示的是过去所有时间的请求总量），例如，最近十五分钟。当我们只有一个不断增长的 counter 时，我们如何得到这个数字？

更好的方法是用 counter 的当前值减去 15 分钟前看到的 counter 值。这样我们就可以得到实例在这段时间内接收到的确切请求数。为了在 PromQL 中表示这一点，我们给 instant vector 附加持续时间 `[15m]`。这部分叫做 range selector，它把 instant vector 转换成 range vector。然后，我们使用像`increase` 这样的函数，它有效地[3]从 range 开始处的数据点减去 range 结束处的数据点。

```shell
curl 'http://localhost:9090/api/v1/query' \
  --data 'query=increase(http_requests_total{code="200",handler="/api/v1/query"}[15m])'

{
  "metric": {"__name__": "http_requests_total", "code": "200", "handler":"/api/v1/query"},
  "values": [
    [1608437313, "18.4"]
  ]
}
```

上面查询语句的解释：它表示过去 15 分钟内请求总数的增长量。上面的响应包含了我们想要拿到的期望之内的答案。结果以 instant vector 的形式出现，现在可以用于进一步绘制图表或汇总（aggregated）。

## 用于 Range Vector 的函数

类似于 [increase(range-vector)](https://prometheus.io/docs/prometheus/latest/querying/functions/#increase)，下面的 PromQL 函数只可用于 range vectors:

- changes(range-vector)
- absent_over_time(range-vector)
- delta(range-vector)
- deriv(range-vector)
- holt_winters(range-vector, scalar, scalar)
- idelta(range-vector)
- irate(range-vector)
- predict_linear(range-vector, scalar)
- rate(range-vector)
- resets(range-vector)
- avg_over_time(range-vector)
- min_over_time(range-vector)
- max_over_time(range-vector)
- sum_over_time(range-vector)
- count_over_time(range-vector)
- quantile_over_time(scalar, range-vector)
- stddev_over_time(range-vector)
- stdvar_over_time(range-vector)

上述的函数的计算结果返回都为 instant vector。因此，我们可以得出这样的结论： range vector 作为这些以 “range vector” 为输入值的函数是有用的。

除了上面的函数和 curls[^1]，还有更多关于 range vectors 的内容，我们将在[另一篇博文](https://satyanash.net/software/2021/06/09/charting-range-vectors-prometheus.html)中介绍。

## 脚注

[1] 未定义的行为并不意味着不可能定义一种使这些操作可以工作的方式。这意味着实现选择避免支持这一点。这样做可以简化实现，或者因为可能没有一种方法使它在各种情况 （cases）之间一致地工作。

[2] 单调递增 counter 的值永不减少；它要么增加要么保持不变。Prometheus 只允许一种 counter 减少的情况，即在目标重启期间。如果 counter 值低于之前记录的值，则 `rate` 和 `increase` 等 range vector 函数将假定目标重新启动并将整个值添加到它所知道的现有值。这也是为什么我们应该总是先 rate 后 sum，而不是先 sun 后 rate。[Rate then sum, never sum then rate](https://www.robustperception.io/rate-then-sum-never-sum-then-rate)

[3] “有效（effectively）”是这里的关键词。`increase` 实际上也可以进行外推，因为所请求的持续时间可能没有在范围（range）的“开始”和“结束”处精确对齐的数据点。

> 原文：https://satyanash.net/software/2021/01/04/understanding-prometheus-range-vectors.html
> 作者：[Satyajeet Kanetkar](satyanash)
