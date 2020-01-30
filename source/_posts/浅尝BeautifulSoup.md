---
title: 浅尝BeautifulSoup
date: 2018-10-10 18:03:59
tags: [BeautifulSoup,爬虫]
categories: Python
declare: true
toc: true
updated:
---
```python
import requests
from bs4 import BeautifulSoup #引入BeautifulSoup类

url = "https://python123.io/ws/demo.html"

r = requests.get(url)

print(r.status_code)

print("\n")

#demo = r.text    #html格式信息

#soup = BeautifulSoup(demo,"html.parser")#使用html.parser对demo进行html解析
soup = BeautifulSoup(open(r"C:\Users\Administrator\Desktop\beautifulsoup\demo.html"))
print(soup.prettify())
```
[BeautifulSoup官方文档](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
<!-- more -->

# BeautifulSoup库解析器

|解析器|使用方法|条件|
|:--:|:--:|:--:|
|bs4的HTML解析器|beautiful(mk,"html.parser")|安装bs4库|
|lxml的HTML解析器|BeautifulSoup(mk,"lxml")|安装lxml库|
|lxml的xml解析器|BeautifulSoup(mk,"xml")|安装lxml库|
|html5lib的解析器|BeautifulSoup(mk,"html5lib")|安装html5lib库|

# BeautifulSoup库的基本元素

|基本元素|说明|
|:--:|:--:|
|Tag|标签，最基本的信息组织单元，分别用<></>标明开头和结尾|
|Name|标签的名字，`<p>...</p>`的名字是‘p’,格式:`<tag>.name`|
|Attributes|标签的属性,字典形式组织，格式:`<tag>.attrs`|
|NavigableString|标签内非属性字符串,<>...</>中字符串，格式:`<tag>.string`|
|Comment|标签内字符串的注释部分，一种特殊的Comment类型|
![](https://i.imgur.com/E3iOdKm.png)
![](https://i.imgur.com/IQm7qi8.png)
```python
# Tag的Comment元素

from bs4 import BeautifulSoup

soup = BeautifulSoup("<b><!--This is a comment--></b><p>This is not a comment</p>","html.parser")

print(soup.b.string)
print(type(soup.b.string))

print(soup.p.string)
print(type(soup.p.string))

```
![](https://i.imgur.com/77Ka7Qb.png)

* BeautifulSoup对应一个HTML/XML文档的全部内容
* 任何存在于HTMl语法中的标签都可以用`soup.<tag>`访问获得，当HTML文档中存在多个相同`<tag>`对应内容时，`soup.<tag>`返回第一个
* 每个`<tag>`都有自己的名字，通过`<tag>.name`获取，字符串类型
* 一个`<tag>`可以有0或多个属性，字典类型
* NavigableString可以跨越多个层次

# 基于bs4库的HTML内容遍历方法

![](https://i.imgur.com/9ka0fPA.png)
![](https://i.imgur.com/QqwbSXq.png)

## 标签数的下行遍历
|属性|说明|
|:--:|:--:|
|.contents|子节点的列表，将<tag>所有儿子节点存人列表|
|.children|子节点的迭代类型，于.contents类似，用于循环遍历儿子节点|
|.descendants|子孙节点的迭代类型，包含所有子孙节点，用于循环遍历|
![](https://i.imgur.com/x0ptQee.png)
![](https://i.imgur.com/aoz6x9u.png)
```python
# 标签树的下行遍历

import requests
from bs4 import BeautifulSoup

url = "https://python123.io/ws/demo.html"

r = requests.get(url)

demo = r.text
soup = BeautifulSoup(demo,"html.parser")

'''for child in soup.body.children:  #遍历儿子节点
    print(child)
'''

for child in soup.body.descendants:  #遍历子孙节点
    print(child)

```
## 标签树的上行遍历
|属性|说明|
|:--:|:--:|
|.parent|节点的父亲标签|
|.parents|节点先辈标签的的迭代类型，用于循环遍历先辈节点|
```python
# 标签树的上行遍历

import requests
from bs4 import BeautifulSoup

url = "https://python123.io/ws/demo.html"

r = requests.get(url)

demo = r.text
soup = BeautifulSoup(demo,"html.parser")

for parent in soup.a.parents:  #遍历所有先辈节点，包括soup本身，soup的先辈不存在name信息
    if parent is None:
        print(parent)
    else:
        print(parent.name)

```
![](https://i.imgur.com/WEKGdLU.png)

## 标签树的平行遍历
平行遍历发生在同一个父节点下的各节点之间

|属性|说明|
|:--:|:--:|
|.next_sibling|返回按照HTML文本顺序的下一个平行节点标签|
|.previous_sibling|返回按照HTML文本顺序的上一个平行节点标签|
|.next_siblings|迭代类型，返回按照HTML文本顺序的后续所有平行节点标签|
|.previous_siblings|迭代类型，返回按照HTML文本顺序的前续所有平行节点标签|

![](https://i.imgur.com/TECSzL4.png)
```python
# 标签树的平行遍历

import requests
from bs4 import BeautifulSoup

url = "https://python123.io/ws/demo.html"

r = requests.get(url)

demo = r.text
soup = BeautifulSoup(demo,"html.parser")

for sibling in soup.a.next_sibling:
    print(sibling)                  #遍历后续节点

'''for sibling in soup.a.previous_sibling:
    print(sibling)                  #遍历前续节点
'''
```

# 基于bs4库的HTML格式输出---prettify()方法

* .prettify()为HTML文本`<>`及其内容增加'\n'
* .prettify()可用于标签,方法:`<tag>.perttify()`

![](https://i.imgur.com/4BJpNgt.png)
![](https://i.imgur.com/bHQdzDW.png)

<p align="right"><font color="red" size="3">bs4库将任何HTML输入都变成utf-8编码</font></p>
 
---