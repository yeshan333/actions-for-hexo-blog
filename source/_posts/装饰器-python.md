---
title: 装饰器--python
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2019-01-03 18:39:32
tags: Python
categories: Python
declare:
toc: true
password:
updated:
---

# python装饰器回顾

## 返回函数

![](https://i.imgur.com/3Nea67a.png)


<!-- more -->

## 什么是装饰器

>python装饰器就是用于拓展原来函数功能的一种函数，目的是在不改变原函数定义的情况下，给函数增加新的功能。
>这个函数的特殊之处在于它的返回值也是一个函数，这个函数是内嵌“原”函数的函数

在代码运行期间动态的增加功能
装饰器(decorator)是修改其它函数功能的函数,是返回函数的高阶函数

## demo

```python
# -*- coding: utf-8 -*-

'''
- 这是一个decorator
- 使用一个函数作为参数
- 它返回一个函数
'''
def a_new_decorator(a_func):	
    def wrapTheFunction():
	    print("I am doing some boring work before executing a_func()")
	    a_func()
	    print("I am doing some boring work after executing a_func()")
    return wrapTheFunction


'''
- 使用a_new_decorator装饰a_function_requiring_decoration
- @a_new_decorator 等价于 a_function_requiring_decoration = a_new_decorator(a_function_requiring_decoration)
'''
@a_new_decorator
def a_function_requiring_decoration():
	
	print("I am the function which needs some decoration remove my foul smell")

a_function_requiring_decoration()
```

运行结果
![FIyq7F.png](https://s2.ax1x.com/2019/01/02/FIyq7F.png)

<font color="red">@a_new_decorator 等价于 a_function_requiring_decoration = a_new_decorator(a_function_requiring_decoration)</font>


** 下面这段程序和上面那段等价 **
```python
# -*- coding: utf-8 -*-

def a_new_decorator(a_func):
 
    def wrapTheFunction():
        print("I am doing some boring work before executing a_func()")
 
        a_func()
 
        print("I am doing some boring work after executing a_func()")
 
    return wrapTheFunction
 
def a_function_requiring_decoration():
    print("I am the function which needs some decoration to remove my foul smell")
 
#a_function_requiring_decoration()
#outputs: "I am the function which needs some decoration to remove my foul smell"

a_function_requiring_decoration = a_new_decorator(a_function_requiring_decoration)
#now a_function_requiring_decoration is wrapped by wrapTheFunction()
 
a_function_requiring_decoration()
#outputs:I am doing some boring work before executing a_func()
#        I am the function which needs some decoration to remove my foul smell
#        I am doing some boring work after executing a_func()
```

### 应用：日志打印

![](https://i.imgur.com/rNQ8oB4.png)

在wrap函数内，首先打印日志，再调用原始函数
\*args表示任何多个无名参数，它是一个tuple；**kwargs表示关键字参数，它是一个dict

## PS

对于上面的demo

    >>>print(a_function_requiring_decoration.__name__)
    #输出结果为
    wrapTheFunction

明显不是我们想要的，我们函数的名字和注释文档被重写了
预期应该为
    a_function_requiring_decoration

使用functools.warps可以解决这个问题

上面的demo应该这样写

![](https://i.imgur.com/j1PoOhL.png)

## 参考

- [http://www.runoob.com/w3cnote/python-func-decorators.html](http://www.runoob.com/w3cnote/python-func-decorators.html)

- [https://www.liaoxuefeng.com/wiki/0014316089557264a6b348958f449949df42a6d3a2e542c000/0014318435599930270c0381a3b44db991cd6d858064ac0000](https://www.liaoxuefeng.com/wiki/0014316089557264a6b348958f449949df42a6d3a2e542c000/0014318435599930270c0381a3b44db991cd6d858064ac0000)

- [https://eastlakeside.gitbooks.io/interpy-zh/content/decorators/](https://eastlakeside.gitbooks.io/interpy-zh/content/decorators/)

- [https://www.cnblogs.com/yuzhanhong/p/9180212.html](https://www.cnblogs.com/yuzhanhong/p/9180212.html)

