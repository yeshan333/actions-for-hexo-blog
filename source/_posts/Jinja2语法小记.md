---
title: Jinja2语法小记
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2019-01-09 23:26:59
tags: Flask
categories: Flask
declare:
toc:
password:
updated:
---

# jinja2模板语法小记

>[Jinja2模板中文文档](http://docs.jinkan.org/docs/jinja2/templates.html)


## 三种常见界定符

1. 表达式<br>
{% raw %}{{ ... }}{% endraw %}

用于装载字符串、变量、函数调用等

2. 语句<br>
{% raw %}{% ... %}{% endraw %}

用于装载控制语句，比如if判断、for循环等

3. 注释<br>
{% raw %}{# ... #}{% endraw %}

用于装载一个注释，模板渲染的时候会被忽略掉

<!-- more -->

## 变量

1. 在模板中，我们可以使用“**.**”获取变量的属性

```python
user = {
	'username' : 'shansan',
	'bio': '我佛了',
}
```
如果user为传入模板中的字典变量，则我们可通过"**.**"获取它的键值。
eg：***user.username***
user.username等价于user['username']

2. 我们可以用**set**标签在模板中定义变量

```Jinja2
{% set navigation = [('/','Home'),('/about','关于我')] %}
```

使用**endset**声明结束


# 过滤器(filter)

>过滤器(filter)是一些可以用来修改和过滤特殊变量值的函数。
>过滤器和变量用一个竖线“**|**”（管道符号）隔开，需要参数的过滤器可以像函数一样使用括号传递

eg: 对一个movies列表使用length过滤器获取其长度

```Jinja2
movies|length
```

>下面是Jinja2常用的内置过滤器

|过滤器|说明|
|:--:|:--:|
|default(value,default_value,boolean=False)|设置默认值，默认值作为参数传入，别名为d|
|escap(s)|转义HTML文本，别名为e|
|first(seq)|返回序列的第一个元素|
|last(seq)|返回列表的最后一个元素|
|length(object)|返回变量的长度|
|safe(value)|将变量标记为安全，避免转义|
|wordcount(s)|计算单词数量|

过滤器函数的第一个参数表示被过滤的变量值(value)或字符串(s)，**即竖线符号左侧的值**其他参数可以使用括号传入

# 测试器(Test)

>测试器主要用来判断一个值是否满足某种变量类型,返回布尔值（True or False）的特殊函数
>语法为：**if...is...**

- is的左侧是测试器函数的第一个参数(value)
- 其他参数可以通过添加括号传入，也可以在右侧使用空格连接

>Jinja2常用内置测试器

|测试器|说明|
|:--:|:--:|
|callable(object)|判断对象是否可调用|
|defined(value)|判断变量是否已定义|
|none(value)|判断变量是否为None|
|number(value)|判断变量是否为数字|
|string(value)|判断变量是否为字符串|
|sequence(value)|判断变量是否为序列，比如字符串、列表、元组|
|iterable(value)|判断变量是否可迭代|
|mapping(value)|判断变量是否是匹配对象，比如字典|
|smeas(value,other)|判断变量与other是否指向相同的内存地址|

```Jinja2
{% if foo is smeas(bar) %}
{# 等价于 #}
{% if foo is smeas bar %}
```
判断foo和bar所以指向的内存地址是否相同

# 语句

>在Jinja2中，语句使用**{% raw %}{% ... %}{% endraw %}**标识
>在语句结束的地方，必须添加结束标签

- if语句使用endif
- for语句使用endfor

```Jinja2
{% if user.name == 'shansan' %}
    <h1>you are right!</h1>
{% else %}
    <h1>you are wrong!</h1>
{% endif %}
```

```Jinja2
{% for g in ga %}
    <li>{{ g.name }} - {{ g.year }}</li>
{% endfor %}
```

***不可使用break和continue控制循环的执行***

# 模板

## 局部模板

- 当多个独立模板中使用到同一块HTML代码时，可以把这部分代码抽离出来，放到局部模板中
- 局部模板的命名一般以一个下划线开始
- 使用**include**标签插入一个局部模板

```Jinja2
{% include '_banner.html' %}
```

## 宏

- 宏，类似于Python中的函数。使用宏可以封装一部分模板代码
- 一般把宏寄存在即存在名为macros.html或_macros.html文件中
- 使用macro和endmacro标签声明宏的开始和结束
- 在开始标签中定义宏的名称和接收的参数

```Jinja2
{% macro qux(amount=1) %}
    {% if amount==1 %}
        I am qux.
    {% elif amount>1 %}
        We are qux.
    {% endif %}
{% endmacro %} 
```

就像从Python模块中导入函数一样，我们可以使用import导入宏

```Jinja2
{% from 'macros.html' import qux %}
```

PS:<font color="red">默认情况下，使用include导入一个局部模板会传递上下文到局部模板中，但使用import却不会</font>

## 模板继承

>模板继承允许我们构建一个包含站点共同元素的基本模板"骨架"，并定义子模版可以覆盖的块


1. 基模板 base.html

** 在基模板中定义的块（block），可以让子模版通过定义同名的块来执行继承操作 **

<u>块的开始和结束分别使用block和endblock标签,不同的块允许嵌套</u>
<u>以下示例代码中使用head、title、styles、content、footer和scripts划分了不同的标签块</u>

```html
<!DOCTYPE html>
<html>
<head>
	{% block head %}
        <meta charset="utf-8">
	    <title>{% block title %}Template - HelloFlask{% endblock %}</title>
	    {% block styles %}{% endblock styles %}
	{% endblock head %}
</head>
<body>
    <ul><li><a href="{{ url_for('index') }}">Home</a></li></ul>
    <main>
    	{% block content %}{% endblock content %}
    </main>
    <footer>
    	{% block footer %}
        {% endblock footer %}
    </footer>
    {% block scripts %}{% endblock scripts %}
</body>
</html>
```

2. 子模版 index.html

- 当在子模版创建同名的块时，会使用字块的内容覆盖父块的内容
- 这里子模版的content块的内容覆盖了基模板content块的内容
- <font color=red>extends 标签必须是模板中的第一个 标签</font>

```html
{% extends 'base.html' %}
{% from 'macros.html' import qux %}

{% block content %}
{% set name='baz' %}
<h1>Template</h1>
<ul>
	<li><a href="{{ url_for('watchlist') }}">Watchlist</a></li>
	<li>Filter: {{ foo|musical }}</li>
	<li>Global: {{ bar() }}</li>
	<li>Test: {% if name == 'baz' %}I am baz.{% endif %}</li>
	<li>Macro: {{ qux(amount=5) }}</li>
</ul>
{% endblock content %}
```

*** 如需要向基模板中追加内容，可以使用Jinja2的super()函数 ***

如向基模板的styles块追加一行样式

```Jinja2
{% block styles %}
{{ super() }}
<style>
    html{
        color: red;
    }
</style>
{% endblock %}
```

-----
参考：
- [https://book.douban.com/subject/30310340/](https://book.douban.com/subject/30310340/)

- [https://www.cnblogs.com/yanzi-meng/p/8342798.html](https://www.cnblogs.com/yanzi-meng/p/8342798.html)

- [http://docs.jinkan.org/docs/jinja2/templates.html#id21](http://docs.jinkan.org/docs/jinja2/templates.html#id21)