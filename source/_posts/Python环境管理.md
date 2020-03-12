---
title: Python环境管理与项目依赖管理
toc: true
comments: true
popular_posts: true
mathjax: true
top: false
date: 2019-09-02 13:07:13
tags: [Python, 环境管理]
categories: Python
---

>个人简单记录下

# virtualenv + pip

>virtualenv是一个用于创建"隔离的ython运行环境"的工具，[Docs](https://virtualenv.pypa.io/en/latest/)
>pip是Python的包管理工具，[Docs](https://pip.pypa.io/en/stable/)

```bash
# 安装virtualenv
pip install virtualenv

# -------------------------------- #
# 虚拟环境的创建与使用
# 1、在当前工程目录下使用virtualenv创建一套独立的Python运行环境
virtualenv venv  # 环境名为venv（自由定义）
# 2、cd 到创建好的虚拟环境的Scripts目录，执行如下命令可激活或者退出虚拟环境
activate    # 激活，激活后命令提示符会变成当前工程目录Python环境名
deactivate  # 退出
# 3、激活虚拟环境后可使用pip为当前项目安装依赖，example：
pip install numpy
# 4、使用pip freeze > requirements.txt 可导出项目依赖到requirements.txt中
# 为项目创建一个新的、干净的环境时，可使用 pip install -r requiremen.txt 为项目安装依赖
```

<!-- more -->

# Pipenv

>Pipenv集包管理和虚拟环境管理于一身，使用Pipfile和Pipfile.lock管理项目依赖（Pipfile中保存着各个依赖包的版本信息，Pipfile.lock保存着依赖包的锁信息）。[Docs](https://docs.pipenv.org/en/latest/)

[Pipenv playground](https://rootnroll.com/d/pipenv/)

[Pipfile and Pipfile.lock](https://blog.windrunner.me/python/pip.html#pipfile-%E4%B8%8E-pipfilelock)

```bash
# 安装
pip install pipenv
# ------------------ #
# Pipenv的使用
# 1、为当前工程创建虚拟环境
pipenv install  # 这里会生成Pipfile和Pipfile.lock文件
# 2、虚拟环境的激活
pipenv shell    # 激活虚拟环境
# 3、安装依赖
pipenv install [package_name]
# 4、在虚拟环境中运行Python脚本
pipenv run xxx.py
```

![help](https://img.vim-cn.com/d0/174c52397492e29396bd3b35be1b842c560a5f.png)

# Poetry

>Poetry是新一代的用来处理依赖项的安装、构建和打包成Python包的工具（2018年2月28日发布0.1.0版本），Poetry使用pyproject.toml管理项目依赖。[Docs](https://poetry.eustace.io/docs/)

```bash
# Poetry的安装
pip install poetry

# ---------------------- #
# poetry的使用
# 1、快速创建一个Python项目
poetry new [project_name]
# 2、以交互式的方式为当前项目创建pyproject.toml文件
poetry init
# 3、为当前项目添加依赖
poetry add [package_name]
# 4、构建源码并对当前项目进行wheels archive（打包成Python包）
poetry build
```

![help](https://img.vim-cn.com/19/0c0b38a2733929e1d9f5e29ed870b5f0ce7ac3.png )

# 拓展

[关于Wheel打包格式《PEP427》](https://www.python.org/dev/peps/pep-0427/)


