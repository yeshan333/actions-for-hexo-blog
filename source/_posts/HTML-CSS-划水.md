---
title: HTML&&CSS(划水~~~)
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2019-01-22 17:09:40
tags: [HTML, CSS]
categories: 
  - [HTML]
  - [CSS]

declare:
toc: true
password:
updated:
---

# [HTML](http://www.w3school.com.cn/html/index.asp)(超文本标记语言)

HTML标签不区分大小写。

## HTML属性

- ID属性指定一个标识符，用于唯一标识页面元素，这些标识符主要供Javascript和CSS使用
- class属性是一个全局属性，可用于建立元素编组。可以给多个元素指定相同的class属性，以便在CSS或Javascript中将这些元素作为一个编组来引用它们
- style属性用于定义标签的样式。任何标签中都可以指定属性style。使用style属性可以为标签指定一个或多个样式规则，** 在style定义多条规则的方法是用分号将他们分开 **

<!-- more -->

## HTML的列表

列表标签的特征：

>1. 每个列表都有一个指定列表类型的外部元素。
>2. 每个列表项都有自己的标签。

```html
无序列表：<ul></ul>
有序列表：<ol></ol>
定义列表：<dl></dl>
词汇列表的列表项为<dt><dd>
其他列表的列表项为<li>
```

### 有序列表（ol）

有序列表默认的编号为罗马数字，可以使用属性style指定列表的编号样式，使用CSS属性list-style-type进行修改

```html
eg：
<ol style="list-style-type: upper-roman">
    <li>罗马假日</li>
    <li>平凡的世界</li>
    <li>封神榜</li>
    <li>无间道</li>
</ol>
```

<ol style="list-style-type: upper-roman">
    <li>罗马假日</li>
    <li>平凡的世界</li>
    <li>封神榜</li>
    <li>无间道</li>
</ol>

**<u>有序列表的编号样式</u>**

|CSS属性list-style-type|描述|
|:--|:--|
|decimal(默认)|标准阿拉伯数字|
|lower-alpha|小写字母|
|upper-alpha|大写字母|
|lower-roman|小写罗马数字|
|upper-roman|大写罗马数字|

### 无序列表（ul）

**<u>无序列表编号样式</u>**

|CSS属性list-style-type|描述|
|:--|:--|
|disc|圆盘，默认样式|
|square|实心正方形|
|circle|空心圆|

```html
eg：
<ul style="list-style-type: square">
    <li>正方体</li>
    <li>长方体</li>
    <li>圆柱体</li>
</ul>
```

<ul style="list-style-type: square">
    <li>正方体</li>
    <li>长方体</li>
    <li>圆柱体</li>
</ul>

### 定义列表（dl）

定义列表的每个列表项都包含两部分
- 术语，标签为`<dt>`
- 术语的定义，标签为`<dt>`

```html
eg:
<dl>
    <dt>HTML</dt>
    <dd>超文本标记语言，标准通用标记语言下的一个应用。是 网页制作必备的编程语言。</dd>
    <dt>CSS</dt>
    <dd>层叠样式表(英文全称：Cascading Style Sheets)是一种用来表现HTML（标准通用标记语言的一个应用）或XML（标准通用标记语言的一个子集）等文件样式的计算机语言。</dd>
</dl>
```

<dl>
    <dt>HTML</dt>
    <dd>超文本标记语言，标准通用标记语言下的一个应用。是 网页制作必备的编程语言。</dd>
    <dt>CSS</dt>
    <dd>层叠样式表(英文全称：Cascading Style Sheets)是一种用来表现HTML（标准通用标记语言的一个应用）或XML（标准通用标记语言的一个子集）等文件样式的计算机语言。</dd>
</dl>


## 链接和锚

### 链接到另一个页面的特定位置

** 方法： 使用锚，即在链接的URL中指定要链接到的元素的ID **

```html
eg:

另一个页面2.html：

<h2 id="part4">Part four</h2>

当前页面1.html：

<a href="2.html#part4">go to part four</a>

```

### 链接到当前页面的其他元素

** 方法: 省略页面名就行，使用`#`号和`ID` **

```html
eg:
go to<a href="#section5">the fifth setion</a>
```

## span标签

span标签和style属性结合使用时，可取代很多标签，效果很nice

```html
<p>Here is some<span style="text-decoration: underline"> underline text</span></p>
<p>Here is some<span style="font-style:oblique"> oblique text</span></p>
<p>Here is some<span style="text-decoration:line-through">line-through text</span></p>
<p>Here is some<span style="font-weight:120"> bolder text</span></p>
```

<p>Here is some<span style="text-decoration: underline"> underline text</span></p>
<p>Here is some<span style="font-style:oblique"> oblique text</span></p>
<p>Here is some<span style="text-decoration:line-through">line-through text</span></p>
<p>Here is some<span style="font-weight:120"> bolder text</span></p>

## HTML表格

|标签|用途|
|:--|:--|
|&lt;table&gt;&lt;/table&gt;|定义表格|
|&#60;caption&#62;&#60;/caption&#62;|创建表题(可选)|
|&#60;tr&#62;&#60;/tr&#62;|定义一个表格行，其中可包含表头单元格或数据单元格|
|&#60;th&#62;&#60;/th&#62;|定义一个表头单元格。表头单元格得内容通常显示为粗体，且在水平和竖直方向上都居中|
|&#60;td&#62;&#60;/td&#62;|定义一个数据单元格。数据单元格得内容通常显示为常规字体，在水平方向上左对齐，而且在垂直方向上居中|
|&#60;colgroup&#62;&#60;/colgroup&#62;|将一列或多列编组|
|&#60;col&#62;&#60;/col&#62;|用于定义表格列属性|
|&#60;thead&#62;&#60;/thead&#62;|创建表示表头的行编组。一个表格只能有一个表头|
|&#60;tfoot&#62;&#60;/tfoot&#62;|创建表示表尾的行编组。一个表格只能有一个表尾，它必须在表体前定义|
|&#60;tbody&#62;&#60;/tbody&#62;|定义一个或多个表示表体的行编组。一个表格可包含多个表头部分|

```HTML
<!DOCTYPE html>
<html>
<head>
    <title>Table</title>
</head>
<body>
    <table border="1" style="width: 100%;">
        <caption><b>Science and Mathematic Class Schedules</b></caption>
        <colgroup style="width: 20%; text-align: center; vertical-align: top; background-color: #fcf;">
        <colgroup span="2" style="width: 40%; vertical-align: top; background-color: #ccf;">
        <!-- span属性指定了列编组包含的列数，默认为1 -->
        <thead style="background-color: red;">
            <tr>
                <th>Class</th>
                <th>Room</th>
                <th>Time</th>
            </tr>
        </thead>
        
        <tbody style="background-color: yellow;">
            <tr>
                <td>Biology</td>
                <td>Science Wing, Room 102</td>
                <td>8:00 AM to 9:45 AM</td>
            </tr>
            <tr>
                <td>Science</td>
                <td>Science Wing, Room 110</td>
                <td>9:50 AM to 11:30 AM</td>
            </tr>
            <tr>
                <td>Physics</td>
                <td>Science Wing, Room 107</td>
                <td>1:00 PM to 2:45 PM</td>
            </tr>
        </tbody>
        <tbody style="background-color: gray;">
            <tr>
                <td>Geometry</td>
                <td>Mathematics Wing, Room 236</td>
                <td>8:00 AM to 9:45 Am</td>
            </tr>
            <tr>
                <td>Algebra</td>
                <td>Mathematics Wing, Room 239</td>
                <td>9:50 AM to 11:30 AM</td>
            </tr>
            <tr>
                <td>Trigonometry</td>
                <td>Mathematics Wing, Room 245</td>
                <td>1:00 PM to 2:45 PM</td>
            </tr>
        </tbody>
        
        <!-- tfoot一般放在tbody之前 -->
        <tfoot style="background-color: blue;">
            <tr>
                <th>Class</th>
                <th>Room</th>
                <th>Time</th>
            </tr>
        </tfoot>
    </table>
</body>
</html>
```

![](https://i.imgur.com/PWucSsn.png)

- text-align：指定水平对齐方式，可能取值：left、center、right
- vertical-align：指定垂直对齐方式，可能取值：top、middle、bottom

### 表格属性

|属性|适用元素|用途|
|:--|:--|:--|
|border|table|指定表格是否带边框，默认不带。这个属性指定了表格边框的宽度|
|span|col和colgroup|指定列编组包含多少列，必须是大于0的整数|
|colspan|th或td|指定单元格将向右延伸横跨多少列|
|rowspan|th或td|指定单元格将向下延伸横跨多少行|

```HTML
<!DOCTYPE html>
<html>
<head>
    <title>colspan and rowspan</title>
</head>
<body>
    <table border="10" style="width: 100%">
        <caption><b>跨行跨列表格</b></caption>
        <!-- 跨列 -->
        <tr>
            <th colspan="2">性别</th>
        </tr>
        <tr>
            <td>男</td>
            <td>女</td>
        </tr>
        <!-- 跨行 -->
        <tr>
           <th rowspan="2">辣椒</th>
           <td>牛角椒</td>
        </tr>
        <tr>
            <td>灯笼椒</td>
        </tr>
    </table>
</body>
</html>
```

![](https://i.imgur.com/KsbLpBt.png)

## HTML表单

|标签/属性|用途|
|:--:|:--|
|&#60;form&#62;|创建HTML表单。一个文档可包含多个表单，但是不可嵌套|
|action|标签&#60;form&#62;的一个属性，使用URL路径指定负责处理表单数据的服务器脚本|
|enctype|&#60;form&#62;的一个属性，指定将表单数据发送给服务器前如何对其进行编码|
|method|&#60;form&#62;的一个属性，指定如何将表单数据发送给服务器|
|&#60;input&#62;|一个用于创建表单控件以收集用户输入的信息|
|&#60;button&#62;|创建一个可包含HTML内容的按钮|
|&#60;textarea&#62;|创建多行的文本输入字段|
|&#60;select&#62;|创建一个菜单或可滚动列表，列表项由&#60;option&#62;创建|
|&#60;progress&#62;|显示任务完成进度的进度条|
|&#60;label&#62;|创建与表单控件配套的标签|
|&#60;fieldset&#62;|将表单控件编组|
|type|标签&#60;input的一个属性&#62;，指定了表单控件的类型，可能取值：<br>text：创建一个单行文本输入字段<br>password：&ensp;创建一个可遮挡用户输入的单行文本输入字段<br>hidden：&ensp;创建一个隐藏的表单控件<br>checkbox：&ensp;创建一个复选框<br>search：&ensp;创建一个搜索关键字输入字段<br>file：&ensp;创建一个文件上传控件让用户能够选择要随表单数据一起上传到服务器的文件<br>color、date、datetime、email、url、reset等等|

## 其它

|items|说明|
|:--|:--|
|HTML语义标签|[http://www.w3school.com.cn/html/html5_semantic_elements.asp](http://www.w3school.com.cn/html/html5_semantic_elements.asp)|
|pre标签|[http://www.w3school.com.cn/tags/tag_pre.asp](http://www.w3school.com.cn/tags/tag_pre.asp)|
|HTML字符实体|[http://www.w3school.com.cn/html/html_entities.asp](http://www.w3school.com.cn/html/html_entities.asp)|

<hr/>

# [CSS](http://www.w3school.com.cn/css/css_jianjie.asp)(层叠样式表)

样式表由一系列规则组成，大致结构如下

    selector { property1: value1; property }

- 每条规则都以选择器(selector)打头,后面是一系列有花括号括起来的属性(property)和值(value)。
- 每个选择器可以指定任意数量的属性,但属性之间必须用分号分隔。
- 在最后一个属性/值对后面,可以有分号,也可以没有。

## 选择器(selector)

>任何标签都可以用作CSS选择器，与这种选择器相关联的规则将应用于页面中所有指定的元素

可使用单个选择器将样式应用于多种元素，元素间用逗号间隔，比如：

```CSS
p, ul {
  color: blue
}
```

下面这个规则与上面那个等价
```CSS
p {
  color: blue;
}

ul {
  color: blue;
}
```

### 上下文选择器

&ensp;&ensp;使用上下文选择器可以将样式应用于嵌套在指定元素内的元素

```css
ol em {
  color: red;
}
```
上面那条规则应用于嵌套在有序列表中的em元素


```css
cite { font-style: inherit; font-weight: 200;}
p cite { font-style: italic; font-weight: 500;}
li cite{ font-style: normal; font-weight: bolder;}
```

第一条为应用于所有cite标签的规则
对于嵌套的cite标签，后两条规则说明了他们应该应用的样式

### 类 && ID 选择器

- 将选择器应用于类，使用`.`+`类名`
- 将选择器应用于ID，使用`#`+`ID`，ID是独一无二的
- 给多个元素指定相同的样式可以使用类名，给单个元素指定样式可以使用ID

```html
<!-- 使用类型名 -->

<div class="shan">test</div>

<!-- CSS -->
.shan {
    color: red;
}

<!-- ------------------------------------ -->

<!-- 使用ID -->

<div id="footer">Copyright 2019</div>

<!-- CSS -->
#footer {
    font-size: small;
}
```

### 子选择器

```css
p > span.important { fot-weight: bold; }
```
这个选择器只与p标签，属于important类的span标签匹配,与下面的span标签不匹配

```html
<p>This is a paragraph. <em>This is an <span class="important">important</span> sentence.</em></p>
```
这里的span为p的孙子

### 伪类

[http://www.w3school.com.cn/css/css_pseudo_classes.asp](http://www.w3school.com.cn/css/css_pseudo_classes.asp)

锚伪类

```CSS
a:link {color: #FF0000}		/* 未访问的链接 */
a:visited {color: #00FF00}	/* 已访问的链接 */
a:hover {color: #FF00FF}	/* 鼠标移动到链接上 */
a:active {color: #0000FF}	/* 选定的链接 */
```

### 更多

>[http://www.w3school.com.cn/css/css_selector_descendant.asp](http://www.w3school.com.cn/css/css_selector_descendant.asp)

## CSS度量单位

>[http://www.w3school.com.cn/cssref/css_units.asp](http://www.w3school.com.cn/cssref/css_units.asp)

## CSS颜色

>[http://www.w3school.com.cn/cssref/css_colors.asp](http://www.w3school.com.cn/cssref/css_colors.asp)

## 盒子模型

![kki3LT.gif](https://s2.ax1x.com/2019/01/22/kki3LT.gif)

- element: 元素/内容
- padding: 内边距
- border: 边框
- margin: 外边距

### 边框的属性

|属性|说明|
|:--|:--|
|border-style|指定显示的边框类型。可能取值包括：none、dotted、dashed、solid、double、groove、ridge、inset、outset、inherit。|
|border-width|指定边框的宽度，单位通常为像素(px)。|
|border-color|指定边框颜色。|

同时设置多个边框属性时，形式如下

```css
selector { border: style width color; }
```

eg:
```css
a { border: dashed 3px red; }
```

![](https://i.imgur.com/Bcl26OF.png)

### 内边距和外边距

- 内边距(padding)是边框里面的空白区域
- 外边距(margin)是边框外面的空白区域

```html
<!DOCTYPE html>
<html>
<head>
    <title>test</title>
    <style type="text/css">
        .outer { border: 2px solid black; }
        .inner { 
            border: 2px dotted black;
            padding: 15px;
            margin: 15px;
        }
    </style>
</head>
<body>
    工程狮
    <div class="outer">
        <div class="inner">
            攻城狮（谐音）工程师，来源于腾讯QQ手机管家于2012年3月1日16:53在发布了一条微博：<br/>
            声称腾讯公司一名保安经过一层层技术面试进入了腾讯研究院，成为一名攻城狮（工程师）。<br/>
            这种事儿看起来相信很多人的第一反应都是恶搞，不过不久，腾讯老大马化腾亲自出面，核实了这一事件的真实性，并且称这是个“很励志的故事”。<br/>
        </div>
    </div>  
</body>
</html>
```

![](https://i.imgur.com/w4RwOST.png)

### 内容(element)盒子

- 块式盒子
- 内嵌盒子

块级元素前后都换行，而内嵌元素的尺寸取决于其包含的内容以及外边距、内边距和边框的设置。CSS提供了属性`display`来修改元素的默认行为，属性display的可能取值有三个:block、inline和none。

![](https://i.imgur.com/QAAOmAT.png)


边框显示了在样式表中指定的盒子的尺寸。但文本太多的时候，盒子可能无法容纳，多出来的文本可能会跑到边框的下方。这时，可以通过CSS属性`overflow`告诉浏览器要如何做。overflow的可能取值包括:visible(默认)、hidden、scroll、auto和inherit。

![](https://i.imgur.com/O07gEYV.png)

![](https://i.imgur.com/sqVTUKQ.png)

### 浮动（修改块级元素的排列方式）

- 属性float，指出浮动位置，取值：right、left、none
- 属性clear，消除浮动的影响，取值：none、left、right、both


<p class="codepen" data-height="265" data-theme-id="dark" data-default-tab="html,result" data-user="yeshan333" data-slug-hash="BMaWem" style="height: 265px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid black; margin: 1em 0; padding: 1em;" data-pen-title="1">
  <span>See the Pen <a href="https://codepen.io/yeshan333/pen/BMaWem/">
  1</a> by Mr.Ye (<a href="https://codepen.io/yeshan333">@yeshan333</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

![](https://i.imgur.com/g69xTsU.png)

&ensp;&ensp;浮动的p元素移到了页面右边，而第二个段落出现在它的左边。通过将属于right类的元素p的样式属性float设置为right，指出了页面其他元素应沿元素绕排。我们将第三个段落的clear属性设置为both，消除了前面浮动的影响。

如果想要将第二段浮动到第一段的下方，可设置第二段的属性float为right，属性clear设置为right。仅仅设置float属性时，两个段落会并排。

```CSS
.main {
    border: 3px solid black;
    padding: 10px;
    margin: 10px;
    float: right;
    clear: right;
    width: 33%;
}
```

![](https://i.imgur.com/OjShnIP.png)



