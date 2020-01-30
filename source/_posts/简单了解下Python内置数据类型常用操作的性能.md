---
title: 简单感受下Python内置数据类型常用操作的性能
toc: true
comments: true
popular_posts: true
mathjax: true
top: false
music:
  enable: true
  server: tencent
  type: song
  mode: single
  id: 003et2lV2tX3b8
date: 2019-10-02 19:01:46
tags: Python
categories: Python
---

# 生成一个列表的几种方式的性能对比

```Python
# -*- coding: utf-8 -*-

from timeit import Timer
import matplotlib.pyplot as plt

# 列表常用操作性能测试

# 迭代 + '+'
def test1():
    l = []
    for i in range(1000):
        l = l + [i]
    

# 迭代 + append
def test2():
    l = []
    for i in range(1000):
        l.append(i)

# 列表生成式
def test3():
    l = [i for i in range(1000)]

# list构造函数 + range
def test4():
    l = list(range(1000))

t1 = Timer("test1()", "from __main__ import test1")
# print("concat %f seconds" % t1.timeit(number=1000))

t2 = Timer("test2()", "from __main__ import test2")
# print("concat %f seconds" % t2.timeit(number=1000))

t3 = Timer("test3()", "from __main__ import test3")
# print("concat %f seconds" % t3.timeit(number=1000))

t4 = Timer("test4()", "from __main__ import test4")
# print("concat %f seconds" % t4.timeit(number=1000))

result = [t1.timeit(1000), t2.timeit(1000), t3.timeit(1000), t4.timeit(1000)]
method = ["for+ '+'", "for + append", "list comprehension", "list + range"]

plt.bar(method, result, color='rgby')

# plt.legend('concat time')
# print(zip(method, result))

for x,y in zip(method, result):
    plt.text(x, y, "%fs" % y)

plt.show()
```

![Cost time](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20191002194307.png)

<!-- more -->

# list和dict的检索效率对比

```Python
# -*- coding: utf-8 -*-

import random
from timeit import Timer
import matplotlib.pyplot as plt

lst_result = []
d_result = []

for i in range(10000,1000001,20000):
    t = Timer("random.randrange(%d) in x" % i, "from __main__ import random,x")

    x = list(range(i))
    lst_time = t.timeit(number=1000)

    x = {j:None for j in range(i)}
    d_time = t.timeit(number=1000)
    
    lst_result.append(lst_time)
    d_result.append(d_time)
    print("%d,%10.3f,%10.3f" % (i, lst_time, d_time))

test = [i for i in range(10000,1000001,20000)]

plt.plot(test, lst_result, 'ro')
plt.plot(test, d_result, 'bo')

plt.legend(['List','Dictionary'])

plt.show()
```

![result plot](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20191002202553.png)


# del list[index]与del dict[key] 性能对比

>average time complexity：$ O(n)\ \ vs\ \ O(1) $

```Python
# -*- coding: utf-8 -*-

import random
from timeit import Timer
import matplotlib.pyplot as plt


size = 20000


l_result = []
d_result = []

for i in range(size):
    test_list = [i for i in range(size)]
    list_t = Timer("del test_list[%d]" % i,"from __main__ import test_list")
    list_result = list_t.timeit(number=1)
    l_result.append(list_result)

    test_dict = {j:None for j in range(size)}
    dict_t = Timer("del test_dict[%d]" % i,"from __main__ import test_dict")
    dict_result = dict_t.timeit(number=1)
    d_result.append(dict_result)

    # print("%d,%f,%f" % (i, list_result, dict_result))

plt.plot(range(size), l_result)
plt.plot(range(size), d_result)

plt.legend(['del list[index]', 'del dict[key]'])

plt.show()
```

![result](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20191002211901.png)


# 参考

- [matplotlib中文文档](https://www.matplotlib.org.cn/index.html)

- [TimeComplexity<Python Wiki>](https://wiki.python.org/moin/TimeComplexity)

- [北大数据结构与算法公开课](https://www.icourse163.org/course/PKU-1206307812)

- [Python timeit](https://docs.python.org/zh-cn/3/library/timeit.html)
