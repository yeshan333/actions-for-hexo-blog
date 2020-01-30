---
title: Requests库入门(2)
date: 2018-10-01 18:58:54
tags: [Requests, 爬虫]
categories: Python
declare: true
updated:
toc: true
---
# requests库入门实操
* 京东商品页面爬取
* 亚马逊商品页面的爬取
* 百度/360搜索关键字提交
* IP地址归属地查询
* 网络图片的爬取和储存

<!-- more -->
## 1.京东商品页面的爬取

[华为nova3](https://item.jd.com/30185690434.html)

```python
import requests
def GetHTMLText(url):
    try:
        r = requests.get(url)
        r.raise_for_status()
        r.encoding = r.apparent_encoding
        return r.text[:1000]
    except:
        print("爬取失败")
if __name__ == '__main__':
    url = "https://item.jd.com/30185690434.html"
    print(GetHTMLText(url))
```
![](https://i.imgur.com/O7iGEFC.png)

## 2.亚马孙商品页面的爬取
某些网站可能有反爬机制。通常的反爬策略有:
1. 通过Headers反爬虫
2. 基于用户行为反爬虫
3. 动态页面的反爬虫
[参考](https://www.cnblogs.com/sishuinianhua/p/5501883.html)

```python
#如网站对Headers的User-Agent进行检测，可定制请求头伪装成浏览器
import requests
def GetHTMLText(url):
    try:
        #定制请求头
        headers = {"user-agent":"Mozilla/5.0"}

        r = requests.get(url,headers = headers)
        r.raise_for_status()
        r.encoding = r.apparent_encoding
        return r.text[:1000]
    except:
        print("爬取失败")
if __name__ == '__main__':
    url = "https://www.amazon.cn/gp/product/B01M8L5Z3Y"
    print(GetHTMLText(url))
```

## 3.百度/360搜索关键字提交
使用params参数,利用接口keyword
```python
#百度搜索引擎关键词提交接口: http://www.baidu.com/s?wd=keyword
#360搜索引擎关键词提交接口: http://www.so.com/s?q=keyword

import requests


def Get(url):
    headers = {'user-agent':'Mozilla/5.0'}
    key_word = {'wd':'python'}
    try:
        r=requests.get(url,headers=headers,params=key_word)
        r.raise_for_status()
        r.encoding = r.apparent_encoding
        print(r.request.url)
        #return r.request.url
        return r.text
    except:
        return "爬取失败"

if __name__ == '__main__':
    url = "http://www.baidu.com/s"
    #print(Get(url))
    print(len(Get(url)))
```
![](https://i.imgur.com/jp8Zd7Y.png)

## 4.IP地址归属地查询
使用IP138的API接口
[http://m.ip138.com/ip.asp?ip=ipaddress](http://m.ip138.com/ip.asp?ip=ipaddress)

```python
# ip地址查询
import requests

url ="http://m.ip138.com/ip.asp?ip="
ip = str(input())
try:
    r= requests.get(url+ip)
    r.raise_for_status()
    print(r.status_code)
    #r.encoding = r.apparent_encoding
    print(r.text[-500:])
except:
    print("failed")
```
![](http://pflr7ix8q.bkt.clouddn.com/GIF.gif)

## 5.网络图片的爬取和储存

```python
# spider_for_imgs

import requests
import os

url = "http://n.sinaimg.cn/sinacn12/w495h787/20180315/1923-fyscsmv9949374.jpg"
#C:\Users\Administrator\Desktop\spider\first week\imgs/
root = "C://Users/Administrator/Desktop/spider/first week/imgs/"

path = root + url.split('/')[-1]

try:
    if not os.path.exists(root):
        os.mkdir(root)
    if not os.path.exists(path):
        r = requests.get(url)
        with open(path, 'wb') as f:
            f.write(r.content)
            f.close()
            print("save successfully!")
    else:
        print("file already exist!")
except:
    print("spider fail")
```
![](http://pflr7ix8q.bkt.clouddn.com/122.gif)

![](http://pflr7ix8q.bkt.clouddn.com/1923-fyscsmv9949374.jpg)
---