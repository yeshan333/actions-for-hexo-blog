---
title: 定向爬虫-中国大学MOOC-python网络爬虫实例
date: 2018-10-15 23:48:56
tags: [爬虫,Python]
categories: Python
declare: true
toc: true
updated:
keywords: "spider, python, mooc"
---

定向爬虫:仅对输入URL进行爬取，不扩展爬取
[中国大学排名2018](http://www.zuihaodaxue.cn/zuihaodaxuepaiming2018.html)

![](https://i.imgur.com/5sll5d0.png)

<!-- more -->
# format格式化输出

![](https://i.imgur.com/06d74Hk.png)

看下所需信息位置
![](https://i.imgur.com/J15TrKJ.png)
# 程序大体框架

```python
import requests
from bs4 import BeautifulSoup

def getHTMLText(url):
	return ""


def fillUnivList(ulist,html):
	pass


def printUnivList(ulist,num):
	print("Suc"+str(num))

def main():
	uinfo = []
	url = ""
	html = getHTMLText(url)
	fillUnivList(uinfo,html)
	printUnivList(uinfo,10)

main()
```
## getHTMLText()
```python
def GetHTMLText(url):       #获取网页内容
	try:
		r = requests.get(url)
		r.raise_for_status()   #用于捕获异常
		r.encoding = r.apparent_encoding
		return r.text
	except:
	    return ""
```
## fillUnivList()
```python
def fillUnivList(ulist, html):         # 把网页内容放到数据结构中
    soup = BeautifulSoup(html,"html.parser")
    '''一个tr标签存放一所大学的信息'''
    for tr in soup.find("tbody").children:
        if isinstance(tr,bs4.element.Tag):  #仅仅遍历标签,过滤掉非标签类型的其它信息
            tds = tr('td')  #将所有的td标签存放到列表tds中，等价于tr.find_all('td')返回一个列表类型
            '''由于进行了遍历，使用print打印tds会得到多个列表'''
            ulist.append([tds[0].string, tds[1].string, tds[3].string])#向ulist中增加所需要的信息
```

## printUnivList()
```python
def printUnivlist(ulist, num):
    print("{:^10}\t{:^6}\t{:^10}".format("排名","学校","总分"))
    for i in range(num):
        u = ulist[i]
        print("{:^10}\t{:^6}\t{:^10}".format(u[0],u[1],u[2]))
```
## main
```python
import requests
import bs4   # 用到instance
from bs4 import BeautifulSoup

def GetHTMLText(url):       #获取网页内容
	try:
		r = requests.get(url)
		r.raise_for_status()   #用于捕获异常
		r.encoding = r.apparent_encoding
		return r.text
	except:
	    return ""


def fillUnivList(ulist, html):         # 把网页内容放到数据结构中
    soup = BeautifulSoup(html,"html.parser")
    '''一个tr标签存放一所大学的信息'''
    for tr in soup.find("tbody").children:
        if isinstance(tr,bs4.element.Tag):  #仅仅遍历标签,过滤掉非标签类型的其它信息
            tds = tr('td')  #将所有的td标签存放到列表tds中，等价于tr.find_all('td')返回一个列表类型
            '''由于进行了遍历，使用print打印tds会得到多个列表'''
            ulist.append([tds[0].string, tds[1].string, tds[3].string])#向ulist中增加所需要的信息

def printUnivlist(ulist, num):
    print("{:^10}\t{:^6}\t{:^10}".format("排名","学校","总分"))
    for i in range(num):
        u = ulist[i]
        print("{:^10}\t{:^6}\t{:^10}".format(u[0],u[1],u[2]))

def main():
    uinfo = []
    url = "http://www.zuihaodaxue.cn/zuihaodaxuepaiming2018.html"
    html = GetHTMLText(url)
    fillUnivList(uinfo,html)
    printUnivlist(uinfo,10)

main()

```
![](https://i.imgur.com/SJSG4OB.png)

## 代码优化，使用chr(12288)解决中文对齐问题
```python
import requests
import bs4   # 用到instance
from bs4 import BeautifulSoup

def GetHTMLText(url):       #获取网页内容
	try:
		r = requests.get(url)
		r.raise_for_status()   #用于捕获异常
		r.encoding = r.apparent_encoding
		return r.text
	except:
	    return ""


def fillUnivList(ulist, html):         # 把网页内容放到数据结构中
    soup = BeautifulSoup(html,"html.parser")
    '''一个tr标签存放一所大学的信息'''
    for tr in soup.find("tbody").children:
        if isinstance(tr,bs4.element.Tag):  #仅仅遍历标签,过滤掉非标签类型的其它信息
            tds = tr('td')  #将所有的td标签存放到列表tds中，等价于tr.find_all('td')返回一个列表类型
            '''由于进行了遍历，使用print打印tds会得到多个列表'''
            ulist.append([tds[0].string, tds[1].string, tds[3].string])#向ulist中增加所需要的信息


'''def printUnivlist(ulist, num):
    print("{:^10}\t{:^6}\t{:^10}".format("排名","学校","总分"))
    for i in range(num):
        u = ulist[i]
        print("{:^10}\t{:^6}\t{:^10}".format(u[0],u[1],u[2]))
'''
'''优化输出格式，中文对齐问题,使用chr(12288)表示一个中文空格，utf-8编码'''
def printUnivlist(ulist, num):
    tplt = "{0:^10}\t{1:{3}^10}\t{2:^10}"   #输出模板，{3}使用format函数第三个变量进行填充，即使用中文空格进行填充
    print(tplt.format("排名","学校","总分",chr(12288)))
    for i in range(num):
        u = ulist[i]
        print(tplt.format(u[0],u[1],u[2],chr(12288)))

def main():
    uinfo = []
    url = "http://www.zuihaodaxue.cn/zuihaodaxuepaiming2018.html"
    html = GetHTMLText(url)
    fillUnivList(uinfo,html)
    printUnivlist(uinfo,10)

main()

```
![](https://i.imgur.com/8X92UkB.png)
---