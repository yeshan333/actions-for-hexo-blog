---
title: Go json Marshal & UnMarshal 的一点小 trick
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
music:
  enable: false
  server: netease
  type: song
  id: 26664345
date: 2022-03-30 23:58:46
tags: [json, Marshal, UnMarshal]
categories: Go
keywords: "Go, encoding/json, "
---

在编写 Web Service 等涉及数据序列化和反序列化的场景，对于 JSON 类型的数据，在 Go 中我们经常会使用到 [encoding/json](https://pkg.go.dev/encoding/json) Package。最近微有所感，小水一篇

## omitempty

JSON 数据的 UnMarshal 我们经常会配合 Struct Tags 使用，让 Struct 的 Filed 与 JSON 数据的指定 property 绑定。

如果要序列化为 Go Struct 的 JSON 数据对应的 Fields 相关的 JSON properties 是缺失的，我们经常会用 omitempty 标记 Go Fields，序列化时，JSON 数据中缺少的属性将会被设置为 Go 中对应的 [zero-value](https://golangbyexample.com/go-default-zero-value-all-types/)，比如：

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Person struct {
	Name string `json:"name"`
	Age  string `json:"age,omitempty"`
	Weak bool   `json:"weak,omitempty"`
}

func main() {
	jsonData := `{"name":"ShanSan"}`
	req := Person{}
	_ = json.Unmarshal([]byte(jsonData), &req)
	fmt.Printf("%+v", req)
	fmt.Println(req.Age)
}
// output
// {Name:ShanSan Age: Weak:false}
//
```

[Go Playground Link](https://play.golang.com/p/bMHVOEmIld-)

但上面的例子对于一些场景的处理可能会有问题。看下下面这个例子：

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Person struct {
	Name string `json:"name"`
	Age  string `json:"age,omitempty"`
	Weak bool   `json:"weak,omitempty"`
}

func main() {
	jsonData := `{"name":"ShanSan", "age": ""}`
	req := Person{}
	_ = json.Unmarshal([]byte(jsonData), &req)
	fmt.Printf("%+v", req)
	fmt.Println(req.Age)
}
// output
// {Name:ShanSan Age: Weak:false}
//
```

可以看到 age 为 `""` 时，和缺省时的结果是一样的。很显然，上面的写法，缺省的字段和空字段是没有被区分开的。对于一些数据的 Update 操作，比如我们只想 Update Name 字段，对应的 JSON 数据为 `{"name":"ShanSan"}`，执行上述的反序列化动作，Age 字段会被设置为 empty string，Waek 也被设置为了 false，这显然不是我们想看到的。

### nil 一下

我们可以指针类型（pointer type）对上面的情况区分一下：

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Person struct {
	Name *string `json:"name"`
	Age  *string `json:"age,omitempty"`
	Weak *bool   `json:"weak,omitempty"`
}

func main() {
	jsonData := `{"name":"ShanSan"}`
	jsonDataEmptyAge := `{"name":"ShanSan", "age": ""}`
	req := Person{}
	reqEmptyAge := Person{}
	_ = json.Unmarshal([]byte(jsonData), &req)
	_ = json.Unmarshal([]byte(jsonDataEmptyAge), &reqEmptyAge)
	fmt.Printf("%+v", req)
	fmt.Printf("%+v", reqEmptyAge)
}
// {Name:0xc000010390 Age:<nil> Weak:<nil>}{Name:0xc0000103c0 Age:0xc0000103d0 Weak:<nil>}
```

emmm，缺省的字段为 nil 了。

### Marshal 的时候

序列化 struct 的时候，如果使用了 omitempty，也会出现类似上面反序列化的情况，对于缺省的 field 或者 zero-value，序列化得到的 JSON 数据也会缺省相关属性，此时我们也可以通过 pointer 保留相关字段，如下：

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Student struct {
	Name  string `json:"name"`
	Score int    `json:"score,omitempty"`
}

type StudentWithPointer struct {
	Name  string `json:"name"`
	Score *int   `json:"score,omitempty"`
}

func main() {
	student := Student{
		Name:  "ShanSan",
		Score: 0,
	}

	score := 0
	studentWithPointer := StudentWithPointer{
		Name:  "ShanSan",
		Score: &score,
	}

	data, _ := json.Marshal(student)
	dataWithPointer, _ := json.Marshal(studentWithPointer)
	fmt.Println(string(data))
	fmt.Println(string(dataWithPointer))
}
// {"name":"ShanSan"}
// {"name":"ShanSan","score":0}
```

[Go Playground](https://play.golang.com/p/og6ANaMQ0D3)

## 参考

- [encoding/json](https://pkg.go.dev/encoding/json)
- [Differentiate between empty and not-set fields with JSON in Golang](https://medium.com/@arpitkh96/differentiate-between-empty-and-not-set-fields-with-json-in-golang-957bb2c5c065)
- [Go's "omitempty" explained](https://www.sohamkamani.com/golang/omitempty/)





