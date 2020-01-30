---
title: map-filter-reduce
toc: true
comments: true
popular_posts: true
mathjax: true
top: false
date: 2019-11-14 21:49:41
tags: [Python,函数式编程]
categories: 函数式编程 
---

>听说函数式编程很⑥，咱也不知道，咱也不晓得，还没实际用过。emmm。。。。，先mark下Python中和函数式编程有关的部分功能先，又开始水了，立个flag🚩：慢慢完善

## map

先看下Python官方文档的说法
>map(function, iterable, ...)，返回一个将 function 应用于 iterable 中每一项并输出其结果的迭代器。 如果传入了额外的 iterable 参数，function 必须接受相同个数的实参并被应用于从所有可迭代对象中并行获取的项。

见识一下

```Python
>>> def cook(something):
...     if something == "cow":
...         return "hamburger"
...     elif something == "tomato":
...         return "chips"
...     elif something == "chicken":
...         return "ddrumstick"
...     elif something == "corn":
...         return "popcorn"
...
>>> list(map(cook, ["cow", "tomato", "chicken", "corn"]))
['hamburger', 'chips', 'ddrumstick', 'popcorn']
```

<!-- more -->

## filter

也看下官方文档的说法
>filter(function, iterable),用 iterable 中函数 function 返回真的那些元素，构建一个新的迭代器。iterable 可以是一个序列，一个支持迭代的容器，或一个迭代器。如果 function 是 None ，则会假设它是一个身份函数，即 iterable 中所有返回假的元素会被移除。

也见识下

```Python
>>> def isVegetarian(food):
...     check = ['chips', 'popcorn']
...     if food in check:
...         return True
...     else:
...         return False
...
>>> list(filter(isVegetarian, ['hamburger', 'chips', 'ddrumstick', 'popcorn']))
['chips', 'popcorn']
```

## reduce

再看下官方文档

>Apply function of two arguments cumulatively to the items of iterable, from left to right, so as to >**reduce the iterable to a single value**.

见识下

```Python
>>> from functools import reduce
>>> reduce(lambda x, y: x+y, [1, 2, 3, 4, 5])
15
```

## 一图胜千言

>曾看到过一张把filter、map、reduce描述得很透彻得图，真滴六🐂

![](https://cdn.jsdelivr.net/gh/ssmath/mypic/img/20191114233050.png)

## references

- [Demonstrating map, filter, and reduce in Swift using food emoji](http://www.globalnerdy.com/2016/06/26/demonstrating-map-filter-and-reduce-in-swift-using-food-emoji/?tdsourcetag=s_pctim_aiomsg)
- [函数式编程指引](https://docs.python.org/zh-cn/3.7/howto/functional.html)
- [functools.reduce](https://docs.python.org/zh-cn/3/library/functools.html?highlight=reduce#functools.reduce)
- [map](https://docs.python.org/zh-cn/3/library/functions.html#map)




