---
title: python生成器回顾
date: 2018-11-02 23:25:44
tags: Python
categories: Python
declare: true
toc: true
updated:
keywords: "python, python generator"
---
# python生成器（generator）

- 生成器是一种使用普通函数语法定义的迭代器
- 包含yield语句的函数都是生成器，它是一个不断产生值的函数
- 生成器每次使用yield产生一个值后，函数都将冻结，即在此处停止执行，等待重新被唤醒。被唤醒后从停止的地方开始继续执行

## 生成器推导（生成器表达式）

*** 使用圆括号`()`创建一个生成器推导 ***,它创建了一个可迭代的对象
使用next()函数可以获得生成器推导的下一个返回值

	g = (i**2 for i in range(10))

<!-- more -->

![](https://i.imgur.com/wmTo1u5.png)

## simple generator

** demo_1 **

>斐波拉契数列（Fibonacci），除第一个和第二个数外，任意一个数都可由前两个数相加得到

![](https://i.imgur.com/NgdbD2D.png)

** demo_2_generator **

![](https://i.imgur.com/hEt9tRq.png)

## recursive generator

处理多层嵌套列表

```python
def flagtten(nested):
    try:
        for sublist in nested:
            for element in flagtten(sublist):
                yield element
    except TypeError:#处理迭代单个对象引起的typeerror异常
        yield nested

def main():
    s = list(flagtten([1,[2,3]]))
    print(s)


main()

```

```python
def flagtten(nested):
    try:
        #不迭代类似于字符串的对象
        try:
            nested + ''
        except TypeError:
            pass
        else:
            raise TypeError
        for sublist in nested:
            for temp in flagtten(sublist):
                yield temp
    except TypeError:
        yield nested

def main():
    s = list(flagtten(["haha",["shan","san"]]))
    print(s)


main()

```

![](https://i.imgur.com/8YyFVoE.gif)


---