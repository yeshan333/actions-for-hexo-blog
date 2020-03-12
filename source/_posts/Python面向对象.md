---
title: Python面向对象
toc: true
comments: true
popular_posts: true
mathjax: false
top: false
music:
  enable: false
  server: netease
  type: song
  id: 26664345
date: 2019-05-24 12:54:40
tags: Python
categories: Python
updated: 2019-05-31 12:54:40
---

- 对象：一个自包含的实体，用一组可识别的特性和行为来标识
- 类：具有相同的属性和功能的对象的抽象的集合
- 实例：一个真实的对象，实例化就是创建对象的过程
- 多态：可对不同类型的对象执行相同的操作，而这些操作就像“被施了魔法”一样能够正常运行
- 封装：对外部隐藏有关对象工作原理的细节
- 继承：可基于通用类创建专用类

# 多态

- 多态可以让我们在不知道变量指向哪种对象时，也能够对其执行操作，且操作的行为将随对象所属的类型（类）而异。每当不知道对象是什么样就能对其执行操作，都是多态在起作用
- 多态以 继承 和 重写 父类方法 为前提
- 多态是调用方法的技巧，不会影响到类的内部设计
- 多态性即向不同的对象发送同一个消息，不同的对象在接收时会产生不同的行为（即方法）
- 听说Python天然就多态

```python
class Person(object):
    def __init__(self,name,sex):
        self.name = name
        self.sex = sex

    def print_title(self):
        if self.sex == "male":
            print("man")
        elif self.sex == "female":
            print("woman")

class Child(Person):                # Child 继承 Person
    def print_title(self):
        if self.sex == "male":
            print("boy")
        elif self.sex == "female":
            print("girl")

May = Child("May","female")
Peter = Person("Peter","male")

print(May.name,May.sex,Peter.name,Peter.sex)
# 同一消息
May.print_title()
Peter.print_title()
```

<!-- more -->

# 封装

- 封装指的是向外部隐藏不必要的细节。与多态有点像，他们都是抽象的原则。**多态让你无需知道对象所属的类（对象的类型）就能调用其方法。封装让你无需知道对象的构造就能够使用它。**

- 实现封装可以对类内的属性和方法的访问加以限制。就像C++类使用private、protected一样对类的成员访问进行限制一样

- 默认情况下，Python中的属性和方法都是公开的，可以在对象外部访问

## 私有变量

- Python并没有真正的私有化支持，但可用下划线得到伪私有。
- 在Python定义私有变量只需在变量名或函数名前加上两个下划线`__`,例如`__name`。那种仅限在一个对象内部访问的“私有”变量在Python中并不存在
- 使用双下划线将方法或属性变为私有时，在内部，Python将以双下划线开头的名字都进行转换，即在开头加上一个下划线和类名。但这样的私有变量或方法还是可以访问的，访问形式如：实例名._类名__变量名、实例名._类名__方法名()
- 以单下划线开头的时保护成员变量，只有本类和子类成员实例能访问这些变量

[![VPgYDA.png](https://s2.ax1x.com/2019/05/23/VPgYDA.png)](https://imgchr.com/i/VPgYDA)

## property装饰器、__slots__魔法

- 我们可以使用property装饰器对属性进行封装、通过getter和setter方法进行属性的访问和修改
- Python是一门动态语言，可以在程序运行时给对象绑定属性和方法，也可以对已经绑定的属性和方法进行解绑定，我们可以使用__slots__魔法限定对象可以绑定的属性

![V1PM1x.png](https://s2.ax1x.com/2019/05/31/V1PM1x.png)

![V1PK91.png](https://s2.ax1x.com/2019/05/31/V1PK91.png)

# 继承&&派生

- 一个新类从已有类那里获得其已有特性，这种现象称为继承。从一个已有类（父类，Python叫超类）产生一个新的子类，称为类的派生。要指顶定超类，可在class语句中的类名后加上超类名，并将其用原括括起来

- 一个类可以继承多个类（多重继承）。但是，如果多个超类以不同的方式实现了同一个方法（即有多个同名的方法），必须在class语句中小心排列这些类，因为位于前面的类的方法将覆盖位于后面的类的方法

- 对子类的实例调用方法（或访问其属性）时，如果找不到该方法或者属性，将在父类中查找

- 在子类中可以重写超类的方法（包括构造函数），重写构造函数时，要确保在子类的构造函数中调用超类的构造函数，否则可能无法正确的初始化对象

- Python中所有的方法实际上是virtual的

```python
class Person:
    def __init__(self,name):
        print("我叫{}".format(name))

class Student(Person):
    def __init__(self,name):
        # 使用super函数调用父类构造函数
        super().__init__(name) # 也可以写成这样：Person.__init__(self,name)
        print("我是一个学生！")
```

![VPB0O0.png](https://s2.ax1x.com/2019/05/23/VPB0O0.png)

# 抽象基类

- 抽象基类是不能（至少是不应该）实例化的类，其职责是定义子类应该实现的一组抽象方法。Python可通过引入ABC模块实现抽象基类，使用`@abstractmethod`装饰器将方法标记为抽象的。例如：


```c++
class Basic{
    public:
        virtual void talk() const = 0;//纯虚函数
};
```

```python
from abc import ABC, abstractmethod

class Basic(ABC):
    @abstractmethod
    def talk(self):
        pass
```

- 抽象类（即包含抽象方法的类）最重要的特征是不能实例化。如果派生出的类没有重写talk方法，那么派生出的类也是抽象的，不能实例化。

# [鸭子类型](https://baike.baidu.com/item/%E9%B8%AD%E5%AD%90%E7%B1%BB%E5%9E%8B/10845665?fr=aladdin)

>“鸭子类型”的语言是这么推断的：一只鸟走起来像鸭子、游起泳来像鸭子、叫起来也像鸭子，那它就可以被当做鸭子。也就是说，它不关注对象的类型，而是关注对象具有的行为(方法)。
>例如，在不使用鸭子类型的语言中，我们可以编写一个函数，它接受一个类型为鸭的对象，并调用它的走和叫方法。在使用鸭子类型的语言中，这样的一个函数可以接受一个任意类型的对象，并调用它的走和叫方法。如果这些需要被调用的方法不存在，那么将引发一个运行时错误。任何拥有这样的正确的走和叫方法的对象都可被函数接受的这种行为引出了以上表述，这种决定类型的方式因此得名

**鸭子类型的关注点在对象的行为，而不在对象的类型**

![VF9D3V.png](https://s2.ax1x.com/2019/05/24/VF9D3V.png)

参考：[https://zhuanlan.zhihu.com/p/59299729](https://zhuanlan.zhihu.com/p/59299729)

# 类方法、静态方法

- 类方法：使用@classmethod装饰器定义。`类方法将类本身作为对象进行操作`,类方法的第一个参数必须是当前类对象（一般命名为`cls`,用于传递类的属性和方法），实例对象和类对象都可以调用类方法。
- 静态方法：使用@staticmethod装饰器定义。没有self和cls参数。在方法中不能使用类或实例任何属性和方法。实例和对象都可以调用静态方法。

![V1PQc6.png](https://s2.ax1x.com/2019/05/31/V1PQc6.png)

![V1PmN9.png](https://s2.ax1x.com/2019/05/31/V1PmN9.png)

参考：

- [https://github.com/jackfrued/Python-100-Days/blob/master/Day01-15/Day09/%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1%E8%BF%9B%E9%98%B6.md](https://github.com/jackfrued/Python-100-Days/blob/master/Day01-15/Day09/%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1%E8%BF%9B%E9%98%B6.md)


