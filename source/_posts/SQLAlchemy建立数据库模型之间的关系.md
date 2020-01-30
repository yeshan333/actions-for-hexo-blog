---
title: SQLAlchemy建立数据库模型之间的关系
toc: true
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2019-03-20 17:45:17
tags: Flask
categories: Flask
declare:
password:
updated:
---

# 常见关系：

- 一对多关系
- 多对一关系
- 多对多关系
- 一对一关系

# 一对多关系（一个作者，多篇文章）

```python
## 一对多关系，单作者-多文章，外键不可少
## 外键(ForeignKey)总在多的那边定义,关系(relationship)总在单的那边定义

class Author(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(70), unique=True)
    phone = db.Column(db.String(20))
    # articles为关系属性(一个集合，可以像列表一样操作，在关系的出发侧定义
    ## relationship()函数的第一个参数为关系另一侧的模型名称(Article)
    articles = db.relationship('Article')

class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(15), index=True)
    body = db.Column(db.Text)
    # 传入ForeignKey的参数形式为："表名.字段名"
    ## 模型类对应的表名由Flask-SQLAlchemy生成，默认为类名称的小写形式，多个单词通过下划线分隔
    author_id = db.Column(db.Integer, db.ForeignKey('author.id')) #

# 外键字段(author_id)和关系属性(articles)的命名没有限制
## 建立关系可通过操作关系属性进行
>>>shansan = Author(name="shansan")
>>>hello = Article(title="Hello world !")
>>>boy = Article(title="Hello Boy !")
>>>db.session.add(shansan) # 将创建的数据库记录添加到会话中
>>>db.session.add(hello)
>>>db.session.add(boy)
>>>shansan.articles.append(hello) # 操作关系属性
>>>shansan.articles.append(boy)
>>>db.session.commit()
```

<!-- more -->

## 基于一对多的双向关系（bidirectional relationship）

在这里我们希望可以在Book类中存在这样一个属性：通过调用它可以获取对应的作者的记录，这类返回单个值的关系属性称为**标量关系属性**

```python
# 建立双向关系时，关系两边都有关系函数
# 在关系函数中，我们使用back_populates参数连接对方，参数的值设置为关系另一侧的关系属性名
class Writer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True)
    # back_populates的参数值为关系另一侧的关系属性名
    books = db.relationship('Book', back_populates='writer')

    def __repr__(self):
        return '<Writer %r>' % self.name


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), index=True)
    writer_id = db.Column(db.Integer, db.ForeignKey('writer.id'))
    
    writer = db.relationship('Writer', back_populates='books')

    def __repr__(self):
        return '<Book %r>' % self.name

# 设置双向属性后，我们既可以通过集合属性操作关系，也可通过标量关系属性操作关系
```

# 多对一关系（多个市民都在同一个城市）

```python
# 外键总在多的一侧定义
## 多对一关系中，外键和关系属性都在多的一侧定义
## 这里的关系属性是标量关系属性（返回单一数据）
class Citizen(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True)
    city_id = db.Column(db.Integer, db.ForeignKey('city.id'))
    city = db.relationship('City')

class City(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True)
```

# 一对一关系（国家和首都）

```python
## 一对一关系，将关系函数的uselist参数设为False，使得集合关系属性无法使用列表语义操作
## 这里使用的是一对一双向关系

class Country(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True)
    capital = db.relationship('Capital', uselist=False)

class Capital(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), unique=True)
    country_id= db.Column(db.Integer, db.ForeignKey('country.id'))
    country = db.relationship('Country')
```

# 多对多双向关系（老师和学生）

- 多对多关系的建立需要使用关联表（association table）。关联表不存储数据，只用来存储关系两侧模型的外键对应关系
- 定义关系两侧的关系函数时，需要添加一个**secondary**参数，值设为关联表的名称 
- 关联表由使用db.Table类定义，传入的第一个参数为关联表的名称
- 我们在关联表中将多对多的关系分化成了两个一对多的关系

```python
## 多对多关系，使用关联表（association table），关联表由db.Table定义
## 关系函数需要设置secondary参数，值为关系表名

association_table = db.Table('association_table',
                             db.Column('student_id', db.Integer, db.ForeignKey('teacher.id')),
                             db.Column('teacher_id', db.Integer, db.ForeignKey('student.id'))
                             )

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(70), unique=True)
    grade = db.Column(db.String(20))
    teachers = db.relationship('Teacher', secondary=association_table,back_populates='students')


class Teacher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(70), unique=True)
    office = db.Column(db.String(20))
    students = db.relationship('Student', secondary=association_table, back_populates='teachers')

```

# 常用的SQLAlchemy关系函数参数和常用的SQLAlchemy关系记录加载方式（lazy参数可选值）

- 使用关系函数定义的属性不是数据库字段，而是类似于特定的查询函数
- 当关系属性被调用时，关系函数会加载相应的记录

![AKnfCq.png](https://s2.ax1x.com/2019/03/20/AKnfCq.png)

![AKn5vT.png](https://s2.ax1x.com/2019/03/20/AKn5vT.png)

# 相关
[http://www.sqlalchemy.org/](http://www.sqlalchemy.org/)

[https://github.com/sqlalchemy/sqlalchemy](https://github.com/sqlalchemy/sqlalchemy)

[https://github.com/mitsuhiko/flask-sqlalchemy ](https://github.com/mitsuhiko/flask-sqlalchemy)


---