---
title: Python协程-asyncio、async/await
toc: true
comments: true
popular_posts: true
mathjax: true
top: false
date: 2019-07-19 14:58:48
tags: [Python, 协程]
categories: Python
updated:
keywords: "python, async io"
---

>看到吐血 _(´ཀ`」 ∠)_

- 协程(Coroutine)本质上是一个函数，特点是在代码块中可以将执行权交给其他协程
- 众所周知，子程序（函数）都是层级调用的，如果在A中调用了B，那么B执行完毕返回后A才能执行完毕。**协程与子程序有点类似，但是它在执行过程中可以中断，转而执行其他的协程，在适当的时候再回来继续执行。**
- 协程与多线程相比的最大优势在于：协程是一个线程中执行，没有线程切换的开销；协程由用户决定在哪里交出控制权
- 这里用到的是asyncio库(Python 3.7)，这个库包含了大部分实现协程的魔法工具
  - 使用 async 修饰词声明异步函数
  - 使用 await 语句执行可等待对象（Coroutine、Task、Future）
  - 使用 asyncio.create_task 创建任务，将异步函数（协程）作为参数传入，等待[event loop](https://docs.python.org/3/library/asyncio-eventloop.html)执行
  - 使用 asyncio.run 函数运行协程程序，协程函数作为参数传入

<!-- more -->

# 解析协程运行时

```Python
import asyncio
import time

async def a():
    print("欢迎使用 a ！")
    await asyncio.sleep(1)
    print("欢迎回到 a ！")

async def b():
    print("欢迎来到 b ！")
    await asyncio.sleep(2)
    print("欢迎回到 b ！")

async def main():
    task1 = asyncio.create_task(a())
    task2 = asyncio.create_task(b())
    print("准备开始")
    await task1
    print("task1 结束")
    await task2
    print("task2 结束")

if __name__ == "__main__":
    start = time.perf_counter()

    asyncio.run(main())

    print('花费 {} s'.format(time.perf_counter() - start))
```

![运行结果](https://s1.ax1x.com/2022/11/06/xjumWD.png)

- 解释：
  - 1、asyncio.run(main())，程序进入main()函数，开启事件循环
  - 2、创建任务task1、task2并进入事件循环等待运行
  - 3、输出准备开始
  - 4、执行await task1，用户选择从当前主任务中切出，**事件调度器开始调度 a**
  - 5、a 开始运行，输出欢迎使用a！，**运行到await asyncio.sleep(1)，从当前任务切出，事件调度器开始调度 b**
  - 6、b 开始运行，输出欢迎来到b！，**运行到await asyncio.sleep(2)，从当前任务切出**
  - 7、以上事件运行时间非常短（毫秒），**事件调度器开始暂停调度**
  - 8、**一秒钟后，a的sleep完成，事件调度器将控制权重新交给a**，输出欢迎回到a！，task1完成任务，退出事件循环
  - 9、await task1完成，事件调度器将控制权还给主任务，输出task1结束，然后在await task2处继续等待
  - 10、**两秒钟后，b的sleep完成，事件调度器将控制权重新传给 b**，输出欢迎回到 b！，task2完成任务，从事件循环中退出
  - 11、事件调度器将控制权交还给主任务，主任务输出task2结束，至此协程任务全部结束，事件循环结束。


**上面的代码也可以这样写，将15到21行换成一行`await asyncio.gather(a(), b())`也能实现类似的效果**，await asyncio.gather 会并发运行传入的可等待对象（Coroutine、Task、Future）。

```Python
import asyncio
import time

async def a():
    print("欢迎使用 a ！")
    await asyncio.sleep(1)
    print("欢迎回到 a ！")

async def b():
    print("欢迎来到 b ！")
    await asyncio.sleep(2)
    print("欢迎回到 b ！")

async def main():
    await asyncio.gather(a(), b())

if __name__ == "__main__":
    start = time.perf_counter()

    asyncio.run(main())

    print('花费 {} s'.format(time.perf_counter() - start))
```

# 异步接口同步实现

```Python
"""
- 简单爬虫模拟
- 这里用异步接口写了个同步代码
"""

import asyncio
import time

async def crawl_page(url):
    print('crawling {}'.format(url))
    sleep_time = int(url.split('_')[-1])
    await asyncio.sleep(sleep_time)  # 休眠
    print('OK {}'.format(url))

async def main(urls):
    for url in urls:
        await crawl_page(url)  # await会将程序阻塞在这里，进入被调用的协程函数，执行完毕后再继续


start = time.perf_counter()

# pip install nest-asyncio
asyncio.run(main(['url_1', 'url_2'])) # 协程接口

print("Cost {} s".format(time.perf_counter() - start))
```

![运行结果](https://s1.ax1x.com/2022/11/06/xjuKQH.png)

# 使用 Task 实现异步

```Python
# 异步实现

import asyncio
import time

async def crawl_page(url):
    print('crawling {}'.format(url))
    sleep_time = int(url.split('_')[-1])
    await asyncio.sleep(sleep_time)
    print('OK {}'.format(url))

async def main(urls):
    tasks = [asyncio.create_task(crawl_page(url)) for url in urls]
    for task in tasks:
        await task
    # 14、15行也可以换成这一行await asyncio.gather(*tasks)
    # *tasks 解包列表，将列表变成了函数的参数，与之对应的是，** dict 将字典变成了函数的参数

start = time.perf_counter()

asyncio.run(main(['url_1', 'url_2']))

print("Cost {} s".format(time.perf_counter() - start))
```

![运行结果](https://s1.ax1x.com/2022/11/06/xjuQOA.png)

# 生产者消费者模型的协程版本

[![wiki 百科 介绍](https://s1.ax1x.com/2022/11/06/xju1eI.png)](https://zh.wikipedia.org/wiki/%E7%94%9F%E4%BA%A7%E8%80%85%E6%B6%88%E8%B4%B9%E8%80%85%E9%97%AE%E9%A2%98)

```Python
# 极客时间：Python核心技术与实战

import asyncio
import random
import time

async def consumer(queue, id):
    """消费者"""
    while True:
        val = await queue.get()
        print('{} get a val : {}'.format(id, val))
        await asyncio.sleep(1)


async def producer(queue, id):
    """生产者"""
    for _ in range(5):
        val = random.randint(1, 10)
        await queue.put(val)
        print('{} put a val: {}'.format(id, val))
        await asyncio.sleep(1)

async def main():
    queue = asyncio.Queue()

    consumer_1 = asyncio.create_task(consumer(queue, 'consumer_1'))
    consumer_2 = asyncio.create_task(consumer(queue, 'consumer_2'))

    producer_1 = asyncio.create_task(producer(queue, 'producer_1'))
    producer_2 = asyncio.create_task(producer(queue, 'producer_2'))

    await asyncio.sleep(10)
    # cancel掉执行之间过长的consumer_1、consumer_2,while True
    consumer_1.cancel()
    consumer_2.cancel()

    # return_exceptions 设为True，不让异常throw到执行层，影响后续任务的执行
    await asyncio.gather(consumer_1, consumer_2, producer_1, producer_2, return_exceptions=True)

if __name__ == "__main__":
    start = time.perf_counter()

    asyncio.run(main())

    print("Cost {} s".format(time.perf_counter() - start))
```

![运行结果](https://pic1.imgdb.cn/item/6367a0fc16f2c2beb16e6290.gif)

```
# 输出结果
producer_1 put a val: 7
producer_2 put a val: 4
consumer_1 get a val : 7
consumer_2 get a val : 4
producer_1 put a val: 6
producer_2 put a val: 1
consumer_2 get a val : 6
consumer_1 get a val : 1
producer_1 put a val: 8
producer_2 put a val: 1
consumer_1 get a val : 8
consumer_2 get a val : 1
producer_1 put a val: 6
producer_2 put a val: 4
consumer_2 get a val : 6
consumer_1 get a val : 4
producer_1 put a val: 7
producer_2 put a val: 8
consumer_1 get a val : 7
consumer_2 get a val : 8
Cost 10.0093015 s
```

拓展阅读：[Python的生产者消费者模型，看这篇就够了](https://cloud.tencent.com/developer/article/1153746)

# 参考

- [https://docs.python.org/3/library/asyncio.html#module-asyncio](https://docs.python.org/3/library/asyncio.html#module-asyncio)

- [深入理解asyncio（一）](https://www.dongwm.com/post/142/)

- [揭密Python协程](https://time.geekbang.org/column/article/101855)