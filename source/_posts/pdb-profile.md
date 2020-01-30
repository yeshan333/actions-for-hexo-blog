---
title: pdb && cProfile
toc: true
comments: true
popular_posts: true
mathjax: true
top: false
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
password: false
date: 2019-07-28 15:55:48
tags: [debug, Python]
categories: Python
---

# pdb
>[https://docs.python.org/zh-cn/3.7/library/pdb.html#module-pdb](https://docs.python.org/zh-cn/3.7/library/pdb.html#module-pdb)

## 使用方式
- 1、在命令行下直接运行调试

```bash
python -m pdb test.py
```

![](https://img.vim-cn.com/a2/72fea3f756ee8ece77496b3dcec3c7e4d2cd4c.png)

- 2、在需要被调试的代码中添加`import pdb`、`pdb.set_trace()`再运行代码进行调试

<!-- more -->

```python
# test.py
def func():
    print('enter func()')

a = 1
b = 2
import pdb
pdb.set_trace() # 运行到此处启动pdb
func()
c = 3
print(a + b + c)
```
![](https://img.vim-cn.com/a3/4e2ecf7fbd04144c27887217a532fc913ecb3a.png)

![]()

## 常用命令

|简写|说明|
|:--:|:--:|
|p <变量名>|输出变量的值|
|l|列出源码，当前位置前后11行|
|n|执行吓一条语句|
|s|执行下一条语句，如果是函数，则会进入函数内，显示--call--，执行函数内第一条语句，执行完函数内语句后跳出显示--return--|
|b|列出当前所有断点|
|b lineno|在某行添加断点|
|cl|清除断点|
|q|退出调试pdb|
|help|帮助|

![](https://img.vim-cn.com/91/21b5a0146465f972c69a42214d99164b11d3cb.png)

# cProfile-性能分析
>[https://docs.python.org/zh-cn/3.7/library/profile.html](https://docs.python.org/zh-cn/3.7/library/profile.html)

```python
# test.py
def memoize(f):
    memo = {}
    def helper(x):
        if x not in memo:            
            memo[x] = f(x)
        return memo[x]
    return helper

@memoize
def fib(n):
    if n == 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fib(n-1) + fib(n-2)


def fib_seq(n):
    res = []
    if n > 0:
        res.extend(fib_seq(n-1))
    res.append(fib(n))
    return res

fib_seq(30)
```

```bash
python -m cProfile test.py
```

![](https://img.vim-cn.com/ed/1e64c45bda5d78d390323282cd6cd52b9ca7e1.png)

- ncalls：相应代码/函数被调用的次数
- tottime：相应代码/函数执行所需时间（不包括它调用的其他代码/函数的时间）
- tottime percall：tottime/ncalls的结果
- cumtime：对应代码/函数执行所需时间，包含它调用的其他代码/函数的时间
- cumtime percall：cumtime和ncall相除的平均结果

![](https://img.vim-cn.com/80/3c30f54c3a5e9e187e8c550ccbf1bb741ba790.png)

