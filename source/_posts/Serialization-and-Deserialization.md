---
title: Serialization and Deserialization
toc: true
comments: true
popular_posts: true
mathjax: true
music:
  enable: true
  server: netease
  type: song
  id: 31877127
date: 2019-11-25 16:25:23
tags: [Python, Json]
categories: Python
keywords: "python, marshmallow"
---

# 序列化与反序列化

>Serialization：Data Structure/Object --> Binary String
>Deserialization：Binary String --> Data Structure/Object
>Goals：Cross-platform Communication、Persistent Storage and More

# Python中对象的序列化与反序列化

## pickle module

>pickle 仅可用于 Python，pickle所使用的数据流格式仅可用于 Python
>pickle 模块可以将复杂对象转换为字节流，也可以将字节流转换为具有相同内部结构的对象。
>可被pickling和unpickling的对象：https://docs.python.org/zh-cn/3/library/pickle.html#what-can-be-pickled-and-unpickled

pickle提供了优秀的方法方便我们对对象进行pickling（封存）和unpickling（解封）

<!-- more -->

### 使用dumps和loads方法进行序列化和反序列化

```Python
>>> import pickle
>>> person = dict(name='shan', age=20, sex="man")
>>> pickle.dumps(person)  # dumps方法会将obj序列化为bytes返回
b'\x80\x03}q\x00(X\x04\x00\x00\x00nameq\x01X\x04\x00\x00\x00shanq\x02X\x03\x00\x00\x00ageq\x03K\x14X\x03\x00\x00\x00sexq\x04X\x03\x00\x00\x00manq\x05u.
>>>
>>> with open("dump.txt","wb") as f:
...     pickle.dump(person, f)
...
>>> f = open("dump.txt","rb")
>>> d = pickle.load(f)
>>> f.close()
>>> d
{'name': 'shan', 'age': 20, 'sex': 'man'}
>>> pickle.loads(pickle.dumps(d))
{'name': 'shan', 'age': 20, 'sex': 'man'}
```

- https://docs.python.org/zh-cn/3/library/pickle.html#pickle.dump
- bytes对象是由单个字节组成的不可变序列
- 使用`dump`方法可将序列化的对象写入file obj
- load用于还原封存生成的bytes_object，loads方法用于还原从文件中读取的封存对象

## json module

>相比于pickle，json只能表示内置类型的子集，不能表示自定义的类
>json格式的文件的易读性更好
>Python json模块提供的API与pickle模块很相似

### 使用dumps和loads进行序列化和反序列化

```Python
>>> import json
>>> person = dict(name='shan', age=20, sex="man")
>>> json.dumps(person)
'{"name": "shan", "age": 20, "sex": "man"}'
>>>
>>> json_str = json.dumps(person)
>>> json.loads(json_str)
{'name': 'shan', 'age': 20, 'sex': 'man'}
```

- dumps方法会将obj转换为标准格式的JSON str并返回
- loads方法可将包含JSON文档的str、bytes或者bytearray反序列化为Python对象

### 自定义对象的序列化与反序列化

>对于自定义对象的序列化和反序列化操作需要我们实现专门的encoder和decoder
>需要用到dumps方法的default参数和loads方法的object_hook参数
>https://docs.python.org/3/library/json.html#json.loads
>https://docs.python.org/3/library/json.html#json.loads

```Python
>>> import json
>>>
>>> class Student(object):
...     def __init__(self, name, age, score):
...         self.name = name
...         self.age = age
...         self.score = score
...
>>> def student2dict(std):
...     return {
...         'name': std.name,
...         'age': std.age,
...         'score': std.score
...     }
...
>>> def dict2student(d):
...     return Student(d['name'], d['age'], d['score'])
...
>>> s = Student('Bob', 20, 88)
>>> print(json.dumps(s, default=student2dict))
{"name": "Bob", "age": 20, "score": 88}
>>> json_str = json.dumps(s, default=student2dict)
>>> print(json.loads(json_str, object_hook=dict2student))
<__main__.Student object at 0x000001B101675198>
>>> json.loads(json_str, object_hook=dict2student)
<__main__.Student object at 0x000001B101675128>
>>> old = json.loads(json_str, object_hook=dict2student)
>>> old.name
'Bob'
```

## third-party module：marshmallow

>marshmallow is an ORM/ODM/framework-agnostic library for converting complex datatypes, such as objects, to and from native Python datatypes.

```Python
>>> import datetime as dt
>>> import marshmallow
>>> from dataclasses import dataclass
>>>
>>> from marshmallow import Schema, fields
>>>
>>> @dataclass
... class Album:
...     title: str
...     release_date: dt.date
...
>>> class AlbumSchema(Schema):
...     title = fields.Str()
...     release_date = fields.Date()
...
>>> album = Album("Seven Innovation Base", dt.date(2019, 11, 23))
>>> schema = AlbumSchema()
>>> data = schema.dump(album)  # obj -> dict
>>> data
{'title': 'Seven Innovation Base', 'release_date': '2019-11-23'}
>>> data_str = schema.dumps(album)  # obj -> str
>>> data_str
'{"title": "Seven Innovation Base", "release_date": "2019-11-23"}'
```

- 使用 marshmallow 可以很方便的对自定义对象进行序列化和反序列化
- 对object进行在序列化之前，需要为object创建一个schema,schema中的字段名必须与自定义的object中的成员一致
- dumps method：obj -> str, dump method：obj -> dict
- 反序列化的 dict -> obj 需要使用decorator：`post_load`自己实现

```Python
from marshmallow import Schema, fields, post_load

class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email

    def __repr__(self):
        return "<User(name={self.name!r})>".format(self=self)

class UserSchema(Schema):
    name = fields.Str()
    email = fields.Email()

    @post_load
    def make_user(self, data, **kwargs):
        return User(**data)

user_data = {
    "email": "ken@yahoo.com",
    "name": "Ken",
}
schema = UserSchema()
result = schema.load(user_data)
print(result)  # 输出结果：<User(name='Ken')>
```

# References

- [序列化与反序列化](https://www.infoq.cn/article/serialization-and-deserialization)
- [pickle module](https://docs.python.org/zh-cn/3/library/pickle.html)
- [json module](https://docs.python.org/zh-cn/3/library/json.html#module-json)
- [bytes](https://docs.python.org/zh-cn/3/library/stdtypes.html#bytes)
- [RESTful API编写指南](https://blog.igevin.info/posts/restful-api-get-started-to-write/)
- [Flask RESTful API开发之序列化与反序列化](https://blog.igevin.info/posts/flask-rest-serialize-deserialize/)
- [marshmallow](https://marshmallow.readthedocs.io/en/stable/quickstart.html)