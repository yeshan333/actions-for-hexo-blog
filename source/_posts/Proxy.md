---
title: 代理相关
date: 2018-10-07 15:23:48
tags: Proxy
categories: Proxy
declare: true
toc: false
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
password: 123456
---

# 代理工具

- SS
  - Windows：[https://github.com/shadowsocks/shadowsocks-windows/releases](https://github.com/shadowsocks/shadowsocks-windows/releases)
  - Android：[https://github.com/shadowsocks/shadowsocks-android/releases](https://github.com/shadowsocks/shadowsocks-android/releases)
- SSR
  - Windows：[https://github.com/shadowsocksrr/shadowsocksr-csharp/releases](https://github.com/shadowsocksrr/shadowsocksr-csharp/releases)
  - Android：[https://github.com/shadowsocksr-backup/shadowsocksr-android/releases](https://github.com/shadowsocksr-backup/shadowsocksr-android/releases)
- SSTap
  - 官方已停止维护和下载，[官网](https://www.sockscap64.com/zh-hans/)
  - 蓝奏云[https://www.lanzous.com/i50q8qf](https://www.lanzous.com/i50q8qf)

# 脚本

## SSR单端口管理脚本
```bash
# 1.安装wget下载器，http://www.gnu.org/software/wget/
yum -y install wget
# 2.逗比ssr脚本，https://github.com/ToyoDAdoubi/doubi#ssrsh
wget -N --no-check-certificate https://raw.githubusercontent.com/ToyoDAdoubi/doubi/master/ssr.sh && chmod +x ssr.sh && bash ssr.sh
```
## SSR多用户多端口管理脚本
```bash
# 安装教程：http://www.nbmao.com/archives/3052
# 脚本：https://github.com/FunctionXJB/SSR-Bash-Python
yum -y install wget yum install perl
	
# 安装&更新
wget -q -N --no-check-certificate https://raw.githubusercontent.com/hotmop/SSR-duoyonghu/master/install.sh && bash install.sh

# 卸载
wget -q -N --no-check-certificate https://raw.githubusercontent.com/hotmop/SSR-duoyonghu/master/install.sh && bash install.sh uninstall
```