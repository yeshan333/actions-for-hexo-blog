---
title: 浅解shallow copy、deep copy
toc: true
comments: true
popular_posts: false
mathjax: true
music:
  enable: false
  server: netease
  type: song
  id: 26664345
thumbnail: https://tse1-mm.cn.bing.net/th/id/OIP.eYc28rU_Y07pW5BEyPq4igAAAA?pid=Api&rs=1
date: 2020-10-09 23:04:04
tags: [深拷贝与浅拷贝]
categories:
  - [Python]
  - [JavaScript]
keywords: "shallow copy, deep copy, python, javascript"
---

“回👋掏”。最近做东西，有点儿玩不转复杂数据类型，写篇博文再回顾下深、浅拷贝相关知识。深、浅的区分主要在对复杂数据类型进行操作的时候。

> By the way：时间过得很快，十月了，之前定了个小目标：`一个月至少一篇文章产出`。2020年的 $ \frac{5}{6} $ 已经过去。很庆幸自己坚持了下来，学到了不少东西。实习期间其实有不少的文章主题的想法，但真正想动手写篇博文的时候，发现事情并没有想想中的那么简单，一个主题涉及到的知识点还是蛮多的，再加上实践经验的不足，有些东西很难写道点上，copy & paste 总是不太好的『努力提高文章质量，hhh~』。希望自己后续继续加油。
>![一些想法](https://s1.ax1x.com/2020/10/11/0cgxOg.png)

<!-- more -->

## 浅拷贝（shallow copy）

> - 浅拷贝总结：新对象内容为**原对象内第一层对象的引用**。

### Python 中的浅拷贝

关键点就在于这第一层对象。让我们先看看 Python 中的浅拷贝。

先看看不含嵌套元素的情形：

```python
l1 = [1, 2, 3]

# 直接赋值，使用 is 比较地址
l2 = l1
print(l1 is l2)  # True

# 使用构造器
l3 = list(l1)
print(l1 is l3)  # False

# 切片
l4 = l1[:]
print(l1 is l4)  # False

print(id(l1), id(l2), id(l3), id(l4))  # 查看内存地址
# 2124445454144 2124445454144 2124445477568 2124445029248
```

含嵌套元素的情形：

```python
l1 = [1, [2,3], 4]

# 直接赋值
l2 = l1

# 构造器
l3 = list(l1)

# 切片
l4 = l1[:]

for first, second, third, fourth in zip(l1, l2, l3, l4):
    # 查看每层对象的地址
    print("value", first, "address:", id(first), id(second), id(third), id(fourth))
# value 1 address: 140729744430752 140729744430752 140729744430752 140729744430752
# value [2, 3] address: 1924217248768 1924217248768 1924217248768 1924217248768
# value 4 address: 140729744430848 140729744430848 140729744430848 140729744430848

l4[1].append("new")

print(l1)  # [1, [2, 3, 'new'], 4]
print(l2)  # [1, [2, 3, 'new'], 4]
print(l3)  # [1, [2, 3, 'new'], 4]
print(l4)  # [1, [2, 3, 'new'], 4]

for first, second, third, fourth in zip(l1, l2, l3, l4):
    # 查看每层对象的地址
    print("value", first, "address:", id(first), id(second), id(third), id(fourth))
# value 1 address: 140729744430752 140729744430752 140729744430752 140729744430752
# value [2, 3, 'new'] address: 1639298767872 1639298767872 1639298767872 1639298767872
# value 4 address: 140729744430848 140729744430848 140729744430848 140729744430848
```

从上面的示例可以看到，Python中切片操作、工厂函数和`=`操作均是浅拷贝，只拷贝了原对象的第一层对象的引用，对第一层对象的操作会影响到其它对元对象进行浅拷贝的对象。但`=`操作和切片、构造器（工厂函数）不同的是，`=`操作不会创建新的对象。

值得注意的是，Python 中 tuple 的 tuple() 和切片操作和`=`进行的拷贝一样，不会创建新的对象。字典的浅拷贝可以使用 dict.copy()。

### JS 中的浅拷贝

让我们再来看看 JS 中的浅拷贝操作。

老规矩，先看看简单对象：

```js
let obj1 = {
  a: 1,
  b: 2
};

// 赋值
let obj2 = obj1;  // { a: 1, b: 2 }


// Object.assign
let obj3 = Object.assign({}, obj1);  // { a: 1, b: 2 }
console.log(obj3)

// spread
let obj4 = {...obj1};  // // { a: 1, b: 2 }


obj2.a = "new";

// { a: 'new', b: 2 } { a: 'new', b: 2 } { a: 1, b: 2 } { a: 1, b: 2 }
console.log(obj1, obj2, obj3, obj4)
```

再看下复杂对象：

```js
let obj1 = {
  a: {
    b: 1,
    c: 2
  },
  d: 3
};

// 直接赋值
let obj2 = obj1;  // { a: { b: 1, c: 2 }, d: 3 }

// Object.assign
let obj3 = Object.assign({}, obj1);  // { a: { b: 1, c: 2 }, d: 3 }

// Object Spread
let obj4 = {...obj1};  // { a: { b: 1, c: 2 }, d: 3 }

obj2.a.b = "new";

console.log(obj1);  // { a: { b: 'new', c: 2 }, d: 3 }
console.log(obj2);  // { a: { b: 'new', c: 2 }, d: 3 }
console.log(obj3);  // { a: { b: 'new', c: 2 }, d: 3 }
console.log(obj4);  // { a: { b: 'new', c: 2 }, d: 3 }
```

可以看到，JS 对象的`=`操作、Object.assign({}, originObject) 和对象扩展运算均是浅拷贝。但是 Object.assign和对象的扩展运算对只有一层的对象进行的是深拷贝。此外 JS 数组「array 也是 object」的 map、reduce、filter、slice 等方法对嵌套数组进行的也是浅拷贝操作。

**可以明显的看到，JS 和 Python 中的浅拷贝拷贝的均是第一层对象的引用。**

## 深拷贝（deep copy）

> - 深拷贝总结：创建一个新的对象，并且将原对象中的元素，以递归的方式，通过创建新的子对象拷贝到新对象中。深拷贝拷贝了对象的所有元素，包括多层嵌套的元素。

### Python 中的深拷贝

在 Python 中实现复杂对象的拷贝可以通过标准库[copy](https://docs.python.org/zh-cn/3/library/copy.html) 提供的 copy.deepcopy 实现，此外 copy 模块还提供了 copy.copy 进行对象的浅拷贝。

看下深拷贝的情况：

```python
import copy
l1 = [1, [2, 3], 4]
l2 = copy.deepcopy(l1)

l2[1].append("new")

print(l1)  # [1, [2, 3], 4]
print(l2)  # [1, [2, 3, 'new'], 4]
```

可以看到，有别于浅拷贝，对深拷贝 l1 的新对象 l2 的子元素增加新元素，并不会影响到 l1。

### JS 中的深拷贝

在 JS 中进行复杂对象的深拷贝，可以使用 JSON.stringify 先将 JS 对象转成 JSON 再转 JS 对象，如下：

```js
let obj1 = {
  a: {
    b: 1,
    c: 2
  },
  d: 3
};

let obj2 = JSON.parse(JSON.stringify(obj1));

obj2.a.b = "new";

console.log(obj1);  // { a: { b: 1, c: 2 }, d: 3 }

console.log(obj2); // { a: { b: 'new', c: 2 }, d: 3 }
```

可以看到，深拷贝后对新对象深层次对象的更改不会使原对象发生变更。

## 手动实现深拷贝操作

在某些情况下需要我们实现深拷贝操作，比如对自定义数据类型进行深拷贝。前面 JS 所述使用 JSON 进行的深拷贝方法仍有缺陷，比如：会忽略 undefined、会忽略 symbol、不能序列化函数、不能解决循环引用的对象。这时候就需要了解波深拷贝的实现了。

从前面所述可知，深拷贝与浅拷贝的区别主要在于 copy 的层次，浅拷贝 copy 的是第一层对象的引用，深拷贝需要 copy 深层次对象。So，以 deepcopy 层次 Object 为例子，要实现真正的深拷贝操作则需要通过遍历键来赋值对应的值，这个过程中如果遇到 Object 类型还需要再次进行遍历「同样的方法」。递归无疑了。来看波实现：

```js
function deepclone(obj) {
  let map = new WeakMap(); // 解决循环引用
  function deep(data) {
    let result = {};
    // 支持 Symbol 类型的属性
    const keys = [...Object.getOwnPropertyNames(data), ...Object.getOwnPropertySymbols(data)]

    if (!keys.length) return data;

    const exist = map.get(data);
    if (exist) return exist;

    map.set(data, result);

    keys.forEach(key => {
      let item = data[key];
      if (typeof item === 'object' && item) {
        result[key] = deep(item);
      } else {
        result[key] = item;
      }
    })
    return result;
  }
  return deep(obj);
}
```

OK，再看些 Python 的 copy.deepcopy 的实现：

```python

def deepcopy(x, memo=None, _nil=[]):
    """Deep copy operation on arbitrary Python objects.

  See the module's __doc__ string for more info.
  """

    if memo is None:
        memo = {}
    d = id(x) # 查询被拷贝对象x的id
  y = memo.get(d, _nil) # 查询字典里是否已经存储了该对象
  if y is not _nil:
      return y # 如果字典里已经存储了将要拷贝的对象，则直接返回
        ...
```

emm...，实现思想也是使用递归，同时借助了 memo （备忘录）解决对象的循环引用问题，避免 StackOverflow。

## 参考

- [Object Spread Initializer](https://github.com/tc39/proposal-object-rest-spread/blob/master/Spread.md)
- [Python copy.deepcopy](https://github.com/python/cpython/blob/20bdeedfb4ebd250dad9834c96cb858d83c896cb/Lib/copy.py#L128)
- [JS Symbol](https://developer.mozilla.org/zh-CN/docs/Glossary/Symbol)
- [关于 JavaScript 的数据类型，你知多少？](https://kaiwu.lagou.com/course/courseInfo.htm?courseId=180#/detail/pc?id=3178)
- [Python对象的比较、拷贝](https://time.geekbang.org/column/article/100105)


