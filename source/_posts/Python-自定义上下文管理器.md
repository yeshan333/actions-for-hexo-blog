---
title: Python-自定义上下文管理器
toc: true
comments: true
popular_posts: true
mathjax: false
top: false
date: 2019-07-26 16:30:46
tags: [Python, 上下文]
categories: Python
keywords: "python, context"
---

# 上下文管理器

- 上下文管理器可以帮助我们自动分配和释放资源
- 上下文管理器需要配合**with语句**使用

比如进行文件操作的时候我们可能会忘记操作后关闭文件（file close），使用`with open(filename, mode) as f`不需要我们手动关闭文件，不管处理文件中是否有异常出现，都能保证with语句执行完毕后关闭文件，有效防止资源泄露，安全多了。

```python
# with 语句的一般格式
with context_expression [as target(s)]:
    with-body
```
**在执行with-body会调用上下文管理器的__enter__方法，执行完with-body之后再调用上下文管理器的__exit__方法**

<!-- more -->

# 基与类的上下文管理器

- 基与类的上下文管理器需要我们实现对象的`__enter()__`和`__exit()__`方法
- 我们需要在`__enter()__`中管理资源对象，在`__exit__()`中释放资源
- __enter__ 方法在 with 语句体执行前调用，with 语句将该方法的返回值赋给 as 字句中的变量，如果有 as 字句的话

```python
# 模拟 Python 的打开文件、关闭文件操作
class Filemanager:
    def __init__(self, name, mode):
        print('calling __init__ method')
        self.name = name
        self.mode = mode
        self.file = None

    def __enter__(self):
        print('caling __enter__ method')
        self.file = open(self.name, self.mode)
        return self.file

    def __exit__(self, exc_type, exc_val, exc_tb):
        print('caling __exit__ method')
        if self.file:
            self.file.close


# Filemanager为上下文管理器
# with Filemanager('test.txt', 'w') as f 是上下文表达式，f为资源对象
with Filemanager('test.txt', 'w') as f:
    print('ready to write to file')
    f.write('Hello World')
```

![运行结果](https://pic1.imgdb.cn/item/6367a21716f2c2beb17018d0.png)

- 运行结果解析：
  - 1、with 语句调用__init__方法，初始化对象
  - 2、with 语句先暂存了Filemanager的__exit__方法
  - 3、然后调用__enter__方法，输出caling __enter__ method，返回资源对象（这里是文件句柄）给f
  - 4、输出ready to write to file，将Hello World写入文件
  - 5、最后调用__exit__方法，输出caling __exit__ method，关闭之前打开的文件流

**注意**：__exit__方法中的参数exc_type、exc_val、exc_tb分别表示exception type、exception value、traceback。进行资源回收时如果有异常抛出，那么异常的信息就会包含再这三个变量中，让我们可以再__exit__中处理这些异常。例如：

```python
class Foo:
    def __init__(self):
        print('__init__ called')

    def __enter__(self):
        print('__enter__ called')
        return self

    def __exit__(self, exc_type, exc_value, exc_tb):
        print('__exit__ called')
        if exc_type:
            print(f'exc_type: {exc_type}')
            print(f'exc_value: {exc_value}')
            print(f'exc_traceback: {exc_tb}')
            print('exception handled')
        return True

with Foo() as obj:
    raise Exception('exception raised').with_traceback(None)
```

```
输出结果：
---------------------------------------
1、__exit__返回 True
__init__ called
__enter__ called
__exit__ called
exc_type: <class 'Exception'>
exc_value: exception raised
exc_traceback: <traceback object at 0x00000234AA532F08>
exception handled
---------------------------------------
2、__exit__返回 False
__init__ called
__enter__ called
__exit__ called
exc_type: <class 'Exception'>
exc_value: exception raised
exc_traceback: <traceback object at 0x00000120D0324F88>
exception handled
Traceback (most recent call last):
  File "e:\Blog\shansan\source\_posts\context.py", line 19, in <module>
    raise Exception('exception raised').with_traceback(None)
Exception: exception raised
---------------------------------------
```

**发生异常时，__exit__方法返回 True 表示不处理异常，否则会在退出该方法后重新抛出异常以由 with 语句之外的代码逻辑进行处理。**

# 基与生成器的上下文管理器

- 基于生成器的上下文管理器的实现需要使用`@contextmanage`装饰器
- 我们需要在finally block 中释放资源

```python
from contextlib import contextmanager

@contextmanager
def file_manager(name, mode):
    try:
        f = open(name, mode)
        yield f
    finally:
        f.close()

with file_manager('test.txt', 'w') as f:
    f.write('hello world')

```

# 参考

- [浅谈Python的with语句](https://www.ibm.com/developerworks/cn/opensource/os-cn-pythonwith/)
- [上下文管理器-极客学院](http://wiki.jikexueyuan.com/project/explore-python/Advanced-Features/context.html)
- [http://wiki.jikexueyuan.com/project/interpy-zh/context_managers/README.html](http://wiki.jikexueyuan.com/project/interpy-zh/context_managers/README.html)
- [深入理解 Python 中的上下文管理器](https://juejin.im/post/5c87b165f265da2dac4589cc)
- [Python核心技术与实战-极客时间](https://time.geekbang.org/column/article/106821)
