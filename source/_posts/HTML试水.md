---
title: HTML试水
date: 2018-10-30 23:39:10
tags: HTML
categories: HTML
declare: true
toc: true
updated:
keywords: "HTML"
---

<h1> 一级标题 </h1>

<h2> 二级标题 </h2>
<!-- more -->
<p>倚天屠龙记</p><p>张无忌</p><p>这是另一段</p>

## 锚点

<a href = "https://shansan.top">这是我的个人博客</a>
<a href = "https://shansan.top" target="_blank">这是我的个人博客，新标签页打开</a>

<!-- more -->
<a href="mailto:1329441308@qq.com" target="_top">邮箱联系我</a>

# 图像

** img是自关标记，不需要结束标记 **
<img src="https://www.baidu.com/img/bd_logo1.png" width="500" height="500">

## 文本
<b>这里是粗体</b>

<i>这里是斜体</i>

<strong>what</strong>

<em>这里还是斜体</em>

<ins>插入字体，下划线</ins>

<del>删除线</del>

~~~ 还是删除线 ~~~

下标&&上标
H<sub>2</sub>O<sub>2</sub>

嗯<sup>我飘了</sup>

<code>#include<stdio.h>
int main()
{
    printf("wocao!");
}</code>


正常字
<small>小号字</small>

<q>短引用，双引号包围</q>

<blockquote>长引用
土地是以它的肥沃和收获而被估价的；才能也是土地，不过它生产的不是粮食，而是真理。
如果只能滋生瞑想和幻想的话，即使再大的才能也只是砂地或盐池，那上面连小草也长不出来的。
 —— 别林斯基
</blockquote>

22222222222
22222222222222
2222

## 表格

    <table>...</table>:定义表格
    <th>...</th>:定义表格的标题栏（文字加粗体）
    <tr>...</tr>:定义表格的行
    <td>...</td>:定义表格的列

<table border="1">
<tr>
<td>row 1, cell 1</td>
<td>row 1, cell 2</td>
</tr>
<tr>
<td>row 2, cell 1</td>
<td>row 2, cell 2</td>
</tr>
</table>

### 跨列表格

<table border="1">
<tr>
  <th>姓名</th>
  <th colspan="2">电话</th>
</tr>
<tr>
  <td>shansan</td>
  <td>1329441308</td>
  <td>164354491</td>
</tr>
<table>

<h3>跨行表格</h3>
<table border="1">
<tr>
  <th>姓名</th>
  <td>shansan</td>
</tr>
<tr>
  <th rowspan="2">电话</th>
  <td>1329441308</td>
</tr>
<tr>
  <td>164354491</td>
</tr>
</table>

## syntax

```html
# HTML试水



<h1> 一级标题 </h1>

<h2> 二级标题 </h2>
<!-- more -->
<p>倚天屠龙记</p><p>张无忌</p><p>这是另一段</p>

## 锚点

<a href = "https://shansan.top">这是我的个人博客</a>
<a href = "https://shansan.top" target="_blank">这是我的个人博客，新标签页打开</a>
<a href="mailto:1329441308@qq.com" target="_top">邮箱联系我</a>

# 图像

** img是自关标记，不需要结束标记 **
<img src="https://www.baidu.com/img/bd_logo1.png" width="500" height="500">

## 文本
<b>这里是粗体</b>

<i>这里是斜体</i>

<strong>what</strong>

<em>这里还是斜体</em>

<ins>插入字体，下划线</ins>

<del>删除线</del>

~~~ 还是删除线 ~~~

下标&&上标
H<sub>2</sub>O<sub>2</sub>

嗯<sup>我飘了</sup>

<code>#include<stdio.h>
int main()
{
    printf("wocao!");
}</code>


正常字
<small>小号字</small>

<q>短引用，双引号包围</q>

<blockquote>长引用
土地是以它的肥沃和收获而被估价的；才能也是土地，不过它生产的不是粮食，而是真理。
如果只能滋生瞑想和幻想的话，即使再大的才能也只是砂地或盐池，那上面连小草也长不出来的。
 —— 别林斯基
</blockquote>

22222222222
22222222222222
2222

## 表格

<table border="1">
<tr>
<td>row 1, cell 1</td>
<td>row 1, cell 2</td>
</tr>
<tr>
<td>row 2, cell 1</td>
<td>row 2, cell 2</td>
</tr>
</table>

### 跨列表格

<table border="1">
<tr>
  <th>姓名</th>
  <th colspan="2">电话</th>
</tr>
<tr>
  <td>shansan</td>
  <td>1329441308</td>
  <td>164354491</td>
</tr>
<table>

<h3>跨行表格</h3>
<table border="1">
<tr>
  <th>姓名</th>
  <td>shansan</td>
</tr>
<tr>
  <th rowspan="2">电话</th>
  <td>1329441308</td>
</tr>
<tr>
  <td>164354491</td>
</tr>
</table>
```
---