---
title: setTimeout 是到了xx ms 就执行吗，了解浏览器的 Event-Loop 机制
toc: true
comments: true
popular_posts: false
mathjax: true
top: false
thumbnail: https://s1.ax1x.com/2020/08/22/ddnTQH.jpg
date: 2020-08-22 13:42:41
tags: [Event-Loop, JavaScript]
categories: JavaScript
---

> 要想 JavaScript 玩得溜，还得了解波 JavaScript 执行机制/(ㄒoㄒ)/~~。

## 前言

最近看了波 JavaScript 相关的文章，不得不说，JavaScript 我还真没玩明白（给我哭~。。。😅）。也挺久没写文了，实习（“摸🐟”）之余小记一波。

> 回顾一句话：JavaScript 是一门单线程、非阻塞、异步、解释性脚本语言。

本文的标题是：setTimeout 是到了xx ms 就执行吗，了解 Event-Loop 机制。先回答波：不是。

来看下网上的一段经典 js 代码在浏览器中「Microsoft Edge 84.0.522.63（64位）」的执行结果。

```js
console.log('script start');
setTimeout(() => {
  console.log('setTimeout');
},0);
Promise.resolve().then(() => {
  console.log('promise1');
}).then(() =>{
  console.log("promise2");
});
console.log('script end');
```

<!-- more -->

![执行结果](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20200822164050.png)

可以明显看到 `setTimeout` 的 callback 并非在 0 ms 后立即执行。那么，这是问什么？要了解原因，需要了解后续介绍的 Event Loop 机制。

## 概念一览

- 浏览器的内核-多线程的渲染进程：**页面的渲染、js 的执行、事件的循环**都在渲染进程中进行。渲染进程主要包含以下几个线程：

{% gallery %}
![JS内核中的线程](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20200822183240.png)
{% endgallery %}

- Task：Task 有 MicroTask 和 MacroTask 之分，MicroTask 在 Promise 出现之后引入。MacroTask 和 MicroTask 分别在以下几种场景形成：
  - MacroTask：主代码块、setTimeout、setInterval、IO 事件等。
  - MicroTask：Promise、process.nextTick 等。

## 浏览器中的Event Loop

有了基础概念，让我们来了解一下文章开头给出的代码是怎么执行的，代码如下：

```js
console.log('script start');
setTimeout(() => {
  console.log('setTimeout');
},0);
Promise.resolve().then(() => {
  console.log('promise1');
}).then(() =>{
  console.log("promise2");
});
console.log('script end');
```

- 1、首先，整个代码块作为第一个 MacroTask 被执行，**同步的代码**直接被压入执行栈被执行「同步任务在JS引擎线程上执行」，script start 和 script end 被打印；
- 2、setTimeout 被作为 MacroTask 处理，加入宏任务队列中；
- 3、Promise 被作为 MicroTask 处理，加入微任务队列中；
- 4、本次 MacroTask 处理完毕，检查微任务队列，发现 promise then 的 callback，promise1，promise2 先后打印；
- 5、接下来执行下一个 MacroTask，即 setTimeout 推送给任务队列的 callback，打印 setTimeout。

so，代码执行结果如下：

```bash
script start
script end
promise1
promise2
setTimeout
```

由此，可大致了解到浏览器下 Event-Loop 执行机制大致如下：

{% folding open red, Event-Loop 执行机制 %}

- 1、一开始，整段脚本被当作 MacroTask 执行
- 2、执行过程中，同步代码进入可执行栈中直接执行，MacroTask 进入宏任务队列，MicroTask 进入微任务队列
- 3、当前 MacroTask 执行完就出队，检查微任务队列，如果不为空，则依次执行微任务队列中的 MicroTask，直到微任务队列为空
- 4、执行浏览器的 UI 线程的渲染工作「两个 MicroTask 执行空隙，有次 render 工作」
- 6、执行队首的 MacroTask，回到 2，依此循环，直至宏任务队列和微任务队列都为空

可通过下图简单理解一波：

![浏览器 Event-Loop 简览](https://cdn.jsdelivr.net/gh/ssmath/picgo-pic/img/20200822201854.png)

{% endfolding %}

由此可知道，setTimeout 中的 callback 不能按时执行是因为 Event-Loop，导致 JS 引擎线程还有其它的 task （promise MicroTask）要处理，主线程还未空闲下来。

## 参考

- [What the heck is the event loop anyway?](https://www.youtube.com/watch?reload=9&v=8aGhZQkoFbQ)「很精彩的演讲🐂」
- [从浏览器多进程到JS单线程，JS运行机制最全面的一次梳理](https://segmentfault.com/a/1190000012925872)
- [精读《Tasks, microtasks, queues and schedules》](https://zhuanlan.zhihu.com/p/187069497)
- [😇原生JS灵魂之问(下)](https://juejin.im/post/6844904004007247880#heading-6)
- [【THE LAST TIME】彻底吃透 JavaScript 执行机制](https://juejin.im/post/6844903955286196237)

