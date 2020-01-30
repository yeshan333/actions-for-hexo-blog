---
title: Python多进程&&多线程（初步）
toc: true
comments: true
popular_posts: true
mathjax: false
top: false
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
password: false
music:
  enable: false
  server: netease
  type: song
  id: 26664345
date: 2019-05-11 21:40:32
tags: Python
categories: Python
---

# 进程 && 线程

>进程：进程是操作系统中执行的一个程序，操作系统以进程为单位分配存储空间，每个进程都有自己的地址空间、数据栈以及其他用于跟踪进程执行的辅助数据，操作系统管理所有进程的执行，为它们合理的分配资源。进程可以通过fork或者wpawn的方式来创建新的进程执行其他任务，不过新的进程有自己独立的内存空间和数据栈，所以必须通过进程间的通信机制（IPC，Inter Process Communication）来实现数据共享，具体的方式包括管道、信号、套接字、共享内存等。


>线程：进程的一个执行单元。线程在同一个进程中执行，共享程序的上下文。一个进程中的各个线程与主线程共享同一片数据空间，因而相比与独立的进程，线程间的信息共享和通信更为容易。线程一般是以并发的方式执行的。注意在单核CPU系统中，真正的并发是不可能的，所以新城的执行实际上是这样规划的：每个线程执行一小会，然后让步给其他线程的任务（再次排队等候更多的CPU执行时间）。在整个线程的执行过程中，每个线程执行它自己的特定的任务，在必要时和其他进程进行结果通信。

# Python多进程（使用multiprocessing）

```python
from time import time, sleep
from random import randint
from multiprocessing import Process

def my_task(name):
    sleep_time = randint(1,10)
    sleep(sleep_time)
    print("你叫了一声%s，它鸟你用了%d秒" % (name, sleep_time))


def main():
    start = time()
    process_1 = Process(target=my_task, args=["yeshan", ])
    process_2 = Process(target=my_task, args=["foel", ])
    # 启动进程
    process_1.start()
    process_2.start()
    # 等待进程执行结束
    process_1.join()
    process_2.join()
    end = time()
    print("一共花费了%f秒" % (end-start))


if __name__ == '__main__':
    main()
```

<!-- more -->

![EIcIMt.png](https://s2.ax1x.com/2019/05/14/EIcIMt.png)

我们通过Process类创建了进程对象，通过`target`参数我们传入一个函数来表示进程启动后要执行的代码，后面的`args`是一个元组，它代表了传递给函数的参数。
Process对象的start方法用来启动进程，join方法表示等待进程执行结束。

# Python多线程（使用threading）

```Python
#!/usr/bin/env python
#-*- coding:utf-8 -*-

from time import time, sleep
from random import randint
from threading import Thread


def download(filename):
    print("开始下载 %s ..." % filename)
    download_time = randint(1,10)
    sleep(download_time)
    print("下载完成！耗时 %d 秒" % download_time)


def main():
    start = time()

    t1 = Thread(target=download, args=('黑暗地宫',))
    t1.start()

    t2 = Thread(target=download, args=('通天',))
    t2.start()

    t1.join()
    t2.join()
    
    end = time()

    print("下载总共耗时 %.3f 秒" % (end-start))

if __name__ == '__main__':
    main()
```

![VSTFr4.png](https://s2.ax1x.com/2019/05/21/VSTFr4.png)


** 继承Thread类，实现自定义线程类 **

```Python
#-*- coding:utf-8 -*-

from time import time, sleep
from random import randint
from threading import Thread


class DownLoadTask(Thread):

    def __init__(self, filename):
        super().__init__() #初始化父类的构造函数
        self._filename = filename # 私有的
    
    def run(self):
        print("开始下载 %s ..." % self._filename)
        download_time = randint(1,10)
        sleep(download_time)
        print("%s下载完成！耗时 %d 秒" % (self._filename, download_time))


def main():
    strat = time()

    t1 = DownLoadTask("从菜鸟到菜鸡")
    t1.start()

    t2 = DownLoadTask("去哪里啊弟弟")
    t2.start()

    t1.join()
    t2.join()

    end = time()

    print("下载完成，总共耗费 %.3f 秒" % (end-strat))


if __name__ == '__main__':
    main()
```

![VSTiMF.png](https://s2.ax1x.com/2019/05/21/VSTiMF.png)


## 线程间的通信

>因为多个线程可以共享进程的内存空间，因此要实现多个线程间的通信相对简单，大家能想到的最直接的办法就是设置一个全局变量，多个线程共享这个全局变量即可。但是当多个线程共享同一个变量（我们通常称之为“资源”）的时候，很有可能产生不可控的结果从而导致程序失效甚至崩溃。如果一个资源被多个线程竞争使用，那么我们通常称之为“临界资源”，对“临界资源”的访问需要加上保护，否则资源会处于“混乱”的状态。在这种情况下，“锁”就可以派上用场了。我们可以通过“锁”来保护“临界资源”，只有获得“锁”的线程才能访问“临界资源”，而其他没有得到“锁”的线程只能被阻塞起来，直到获得“锁”的线程释放了“锁”，其他线程才有机会获得“锁”，进而访问被保护的“临界资源”。

```Python
from time import sleep
from threading import Thread, Lock


class Account(object):

    def __init__(self):
        self._balance = 0
        self._lock = Lock()

    def deposit(self, money):
        # 先获取锁才能获取后面的代码
        self._lock.acquire()
        try:
            # 计算存款后的余额
            new_balance = self._balance + money
            # 模拟受理存款业务需要0.01秒的时间
            sleep(0.01)
            # 修改账户余额
            self._balance = new_balance
        finally:
            self._lock.release()

    @property
    def balance(self):
        return self._balance


class AddMoneyThread(Thread):

    def __init__(self, account, money):
        super().__init__()
        self._account = account
        self._money = money

    def run(self):
        self._account.deposit(self._money)


def main():
    account = Account()
    threads = []
    # 创建100个存款的线程向同一个账户中存钱
    for _ in range(100):
        t = AddMoneyThread(account, 1)
        threads.append(t)
        t.start()
    # 等所有存款的线程都执行完毕
    for t in threads:
        t.join()
    print('账户余额为: ￥%d元' % account.balance)


if __name__ == '__main__':
    main()
```

输出结果为100块，不用锁为2块

** Python内置装饰器 property **

*** property装饰器一般存在于类中，可以将一个函数定义成一个属性，属性的值就是该函数return的内容 ***

```python
class Student(object):
    # 把一个方法变成属性
    @property
    def score(self):
        return self._score
    
    # setter把一个方法变成一个可控属性用于赋值
    @score.setter
    def score(self, value):
        if not isinstance(value, int):
            raise ValueError('score must be an integer!')
        if value < 0 or value > 100:
            raise ValueError('score must between 0 ~ 100!')
        self._score = value
```

![https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/21.png](https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/21.png)

![https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/22.png](https://raw.githubusercontent.com/yeshan333/blog_images/master/posts/22.png)


---

参考：

[一篇文章搞懂装饰器的用法](https://zhuanlan.zhihu.com/p/65968462?utm_source=qq&utm_medium=social&utm_oi=908413169096077312)

[https://github.com/jackfrued/Python-100-Days/blob/master/Day01-15/Day13/%E8%BF%9B%E7%A8%8B%E5%92%8C%E7%BA%BF%E7%A8%8B.md](https://github.com/jackfrued/Python-100-Days/blob/master/Day01-15/Day13/%E8%BF%9B%E7%A8%8B%E5%92%8C%E7%BA%BF%E7%A8%8B.md)