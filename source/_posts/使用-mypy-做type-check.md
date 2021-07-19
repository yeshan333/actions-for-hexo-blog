---
title: 使用 mypy 做 type check
toc: true
comments: true
popular_posts: true
mathjax: true
music:
  enable: false
  server: netease
  type: song
  id: 26664345
date: 2020-03-06 11:29:17
tags: [Python, 静态类型检查]
categories: Python
keywords: "mypy, type_check"
---

## 前言

完残！😂，最近看之前写的 Python 代码老得琢磨这比变量的类型是啥（~~Python 无类型系统xxx~~），不愧是我写的！

看段之前写的实现迭代器模式的代码：

<!-- more -->

```python
# 抽象迭代器类
class Iterator(object):
    def hasNext():
        pass

    def next():
        pass

# 抽象聚集类
class Aggregate(object):
    def iterator():
        pass

class BookShelf(Aggregate):
    def __init__(self):
        self._books = []
        self._last = 0

    def getBookAt(self, index):
        return self._books[index]

    def appendBook(self, book):
        self._books.append(book)
        self._last = self._last + 1

    def getLength(self):
        return self._last

    def iterator(self):
        return BookShelfIterator(self)

class BookShelfIterator(Iterator):
    def __init__(self, bookShelf):
        self._bookShelf = bookShelf
        self._index = 0

    def hasNext(self):
        if self._index < self._bookShelf.getLength():
            return True
        else:
            return False

    def next(self):
        book = self._bookShelf.getBookAt(self._index)
        self._index = self._index + 1
        return book

class Book():
    def __init__(self, name):
        self._name = name

    def getName(self):
        return self._name

if __name__ == "__main__":
    bookShelf = BookShelf()
    bookShelf.appendBook(Book("A"))
    bookShelf.appendBook(Book("B"))
    bookShelf.appendBook(Book("C"))
    bookShelf.appendBook(Book("D"))

    it = bookShelf.iterator()
    while it.hasNext():
        book = it.next()
        print(book.getName())
```

有一丢丢难读（不通读的话，会乱猜某变量类型），回想之前在 PyCon China 2019 的大会资聊曾看到过类型检查相关的演讲主题，回顾下演讲视频。水一波，写篇文章了解下 Python 标准([PEP 3107](https://www.python.org/dev/peps/pep-3107/) & [PEP 484](https://www.python.org/dev/peps/pep-0484/) )支持的 mypy。

> 类型系统：编译期的类型推导检查规则，类型系统属于一种轻量级的形式化方法（一种数学方法）

## 使用-mypy

```shell
# 安装 mypy
pip install mypy
# 使用 mypy 做类型检查
mypy module_name.py
```

以下使用方式适用于 Python 3.6 及以上的版本。**值得注意**：mypy 默认的推导类型不可为 None

### 变量的类型注释

```python
integer: int = 1
string: str = "ShanSan"
err_str: str = 1  # error: Incompatible types in assignment
child: bool = True
# mypy 默认的推导类型不可为 None
none: int - None  # error: Invalid type comment or annotation

print(integer, string)
```

### 内建类型

关于更多 mypy 的类型系统内建的类型可参考：https://mypy.readthedocs.io/en/stable/builtin_types.html

```python
from typing import Dict, Tuple, Optional, Iterable, Union
# 对于映射(Map)数据结构，需要指定 key 和 value 的类型
x: Dict[str, float] = {'field': 2.0}

# Tuple 需要指定所有元素的类型
x: Tuple[int, str, float] = (3, "yes", 7.5)

# error: Incompatible types in assignment (expression has type "Tuple[int, str, float, int]", variable has type "Tuple[int, str, float]")
y: Tuple[int, str, float] = (3, "yes", 7.5, 11)

op: Optional[str] = None  # 可为 str 或 None

# 泛用可迭代对象
l: Iterable = [1]
t: Iterable = (1, 2)
d: Iterable = {1: 1}

# 可为 str 或 int
str_int1: Union[str, int] = 1
str_int2: Union[str, int] = "ss"
str_int3: Union[str, int] = None  # error
```

### 函数注解

```python
from typing import NoReturn

def f1() -> None:
    pass

def f2() -> NoReturn:  # 无返回值
    pass

def plus(num1: int, num2: int) -> int:
    return num1 + num2

# 带默认值
def plus_default(num1: int, num2: int = 3) -> int:
    return num1 + num2

# 容器的参数类型
def container_param(names: List[str]) -> None:
    for name in names:
        print(name)
```

### 类成员注解

```python
class MyClass:
    attr: int
    # 带默认值的实例变量
    charge_percent: int = 100

    # 没有任何返回值应该注解为 None
    def __init__(self) -> None:
        pass

    # 忽略对 self 类型的注解
    def my_method(self, num: int, str1: str) -> str:
        return num * str1

# 支持自定义类型的注解
x: MyClass = MyClass()
```

## 结尾

OK， 差不多了，对之前的迭代器模式的代码改造一波

```python
from typing import List, Iterable

# 抽象迭代器类
class Iterator(object):
    def hasNext(self):
        pass

    def next(self):
        pass

# 抽象聚集类
class Aggregate(object):
    def iterator(self):
        pass

class BookShelf(Aggregate):
    def __init__(self) -> None:
        self._books: List[Book] = []
        self._last: int = 0

    def getBookAt(self, index: int) -> Book:
        return self._books[index]

    def appendBook(self, book: Book) -> None:
        self._books.append(book)
        self._last = self._last + 1

    def getLength(self) -> int:
        return self._last

    def iterator(self) -> BookShelfIterator:
        return BookShelfIterator(self)

class BookShelfIterator(Iterator):
    def __init__(self, bookShelf) -> None:
        self._bookShelf: BookShelf = bookShelf
        self._index: int = 0

    def hasNext(self) -> bool:
        if self._index < self._bookShelf.getLength():
            return True
        else:
            return False

    def next(self) -> Book:
        book: Book = self._bookShelf.getBookAt(self._index)
        self._index = self._index + 1
        return book

class Book():
    def __init__(self, name) -> None:
        self._name: str = name

    def getName(self) -> str:
        return self._name

if __name__ == "__main__":
    bookShelf: BookShelf = BookShelf()
    bookShelf.appendBook(Book("A"))
    bookShelf.appendBook(Book("B"))
    bookShelf.appendBook(Book("C"))
    bookShelf.appendBook(Book("D"))

    it: Iterator = bookShelf.iterator()
    while it.hasNext():
        book: Book = it.next()
        print(book.getName())
```

emmm, 舒服了一丢丢/(ㄒoㄒ)/~~

## 参考

- [https://github.com/python/mypy](https://github.com/python/mypy)
- [PyCon China 2019 成都分会场-刘知杭-静态类型的 Python](https://shimo.im/docs/dpq9q6hJttwVcqHy/read), [video🔗](https://www.bilibili.com/video/av75148536?p=5)
- [PyCon China 2019 北京分会场-依云-类型检查拯救粗心开发者](https://shimo.im/docs/HRdRxCDXtKy9TPVh/read), [video🔗](https://www.bilibili.com/video/av75279850?p=9)
- [Type hints cheat sheet (Python 3)](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html)
