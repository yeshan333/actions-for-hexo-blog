---
title: 基于Typecho搭建个人博客
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2018-12-31 12:40:34
tags: blog
categories: blog
keywords: "Typecho, blog, server"
---

**本页图片已挂，需跨越 G-F?W **

# 搭建依托于我的个人服务器的博客

emmm。。。 2018年12月24日0点10分，忽然觉得无聊，打开某云，手一贱租了台云服务器（233~~~~）。
嗯，既然都租了，那就再来个博客吧。


# 基于typecho搭建的个人博客

# 宝塔面板安装

```
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install.sh && sh install.sh
```

![示例](https://i.imgur.com/7k0eFLi.png)

![示例](https://i.imgur.com/MLaYQzB.png)


# 网站搭建

点击添加，创建网站

![示例](https://i.imgur.com/rPTqZ0n.png)

![示例](https://i.imgur.com/dcCn02Y.png)

嗯，接下来访问自己域名（公网ip地址），看看是否创建成功

![示例](https://i.imgur.com/iNutNVu.png)

接下来配置伪静态规则

![示例](https://i.imgur.com/oDZ2Kti.png)


# 嗯，接下来搭建博客，~~这里使用宝塔后台无脑安装~~(不好意思，我太菜),还是用命令行操作吧

![示例](https://i.imgur.com/M4TkXvL.png)

记得填写常用邮箱、管理员名和密码

[http://typecho.org/download](http://typecho.org/download)

嗯，接下来访问自己的域名就ok了

![示例](https://i.imgur.com/60Pwc6P.png)


emm，是不是少了什么，SSL证书没有，少了小绿锁

那就去申请吧

![示例](https://i.imgur.com/VxD0APt.png)
站点管理，设置

因为我的web服务器是nigix

![示例](https://i.imgur.com/W2Ld2PJ.png)