---
title: 使用 Kubeadm 搭建个公网 k8s 集群（单控制平面集群）
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
headimg: https://z3.ax1x.com/2021/10/24/5fAWlQ.jpg
date: 2021-10-24 13:51:19
tags: [Kubernetes, Kubeadm]
categories: Kubernetes
keywords: "Kubernetes Cluster, Kubeadm"
---

## 前言

YY：国庆的时候趁着阿里云和腾讯云的轻量级服务器做促销一不小心剁了个手😎😢，2 Cores，4G RAM 还是阔以的，既然买了，那不能不用呀🚩，之前一直想着搭建个 k8s 集群玩玩，本地开发机虽然起了个 k8s（拿 Docker Desktop 起的，不 dei 劲），但就一个 Node，不爽，对 k8s 的体验不到位😒，1024，是时候用起来了，折腾一下，顺便让最近浮躁的心冷静一下。

这次拿官方的 Kubeadm 耍一下，以阿里云的轻量级应用服务器为 Control 节点，腾讯云的轻量级应用服务器为 Worker 节点，说干就干。

<!-- more -->

## Check 一下文档要求 - 准备工作

Kubenetes 官方文档给出了 Kubeadm 起 k8s 集群的几点要求，在这里微微检查下两台轻量级云服务器：

- [x] A compatible Linux host. The Kubernetes project provides generic instructions for Linux distributions based on Debian and Red Hat, and those distributions without a package manager.[我们用的 Ubuntu 20.04，那肯定符合 Debian 系的].
- [x] 2 GB or more of RAM per machine (any less will leave little room for your apps).[4G, 我们很 OK, 但感觉后面会拉跨].
- [x] 2 CPUs or more. [正好一台 2个 CPU, nice].
- [x] Full network connectivity between all machines in the cluster (public or private network is fine).[两台轻量级应用服务器都有公网 IP，那必须互通啊].
- [x] Unique hostname, MAC address, and product_uuid for every node.[这里得微微 check 一下两台服务器，`cat /sys/class/net/eth0/address` 看下 MAC 地址，`sudo cat /sys/class/dmi/id/product_uuid` 看下 product_uuid, `hostname` 看下主机名，emmm, correct！]
- [x] Certain ports are open on your machines. [这里得到阿里云轻量级服务器 & 腾讯云的轻量级应用服务器的防火墙开放下相关 TCP 端口]。

阿里云轻量级应用服务器开启 Control（控制平面）节点的 TCP 端口，这里要对照下[文档](https://kubernetes.io/docs/reference/ports-and-protocols/#control-plane)给出的需要开放的端口：

{% gallery %}

![Control Plane Open Ports](https://z3.ax1x.com/2021/10/24/5W83Ae.png)

![Aliyun Control Node](https://z3.ax1x.com/2021/10/24/5W3Azt.png)

{% endgallery %}

腾讯云轻量级应用服务器开启 Worker（工作）节点的 TCP 端口：

{% gallery %}

![Worker Node Open Ports](https://z3.ax1x.com/2021/10/24/5W8H3R.png)

![Tencent Cloud Worker Node](https://z3.ax1x.com/2021/10/24/5W3hYd.png)

{% endgallery %}

- [x] Swap disabled. You MUST disable swap in order for the kubelet to work properly. [为了让 kubelet 起来，要把 Swap 分区关闭，使用 `free -mh` 看下 Swap 是否在使用， `swapoff -a` [关闭 Swap 分区](https://askubuntu.com/questions/214805/how-do-i-disable-swap)].

参考：https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/

为什么需要关闭 Swap 分区，有 dalao 做了分析：https://www.jianshu.com/p/6f3268ce642f

- [x] Letting iptables see bridged traffic.

这里照着[文档](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#letting-iptables-see-bridged-traffic)，一波操作下两台服务器：

```shell
sudo modprobe br_netfilter

cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sudo sysctl --system

lsmod | grep br_netfilter
```

- [x] Container Runtime Interface（CRI）. [这里需要安装下 Pod 运行需要的容器运行时，我们选择 [Docker](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)].

```shell
apt-get update
apt-get install -y apt-transport-https \
    software-properties-common \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io
```

安装完毕还需要将 Docker 的 cgroup driver 替换为 systemd，确保与 Kubeneters 使用的一致。

```shell
cat>>/etc/docker/daemon.json<<EOF
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF

systemctl daemon-reload
systemctl restart docker
```

## 安装 kubeadm, kubelet, kubectl

上面检查工作如果很顺利的话，接下来就可以准备 kubeadm, kubelet, kubectl 安装了，不过我们还得给 apt 添加 Kubenetest [软件源](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#installing-kubeadm-kubelet-and-kubectl)，官方文档中使用的如软件源是 Google 域名下的，国内云服务器访问会有问题（懂得都懂了😂），这里使用国内得源，这里两台服务器都操作一下：

```shell
# 1、添加 GPG Key
sudo curl -fsSL http://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | sudo apt-key add -
# 2、添加 k8s 软件源
sudo add-apt-repository "deb http://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial main"
3、update 一下
apt-get update
```

上面执行没有问题的话，就可以开始安装 kubelet kubeadm kubectl了：

```shell
sudo apt-get install -y kubelet kubeadm kubectl

# 查看安装的版本, apt install apt-show-versions
apt-show-versions kubectl kubelet kubeadm
# 让 kubelet 开机启动
sudo systemctl start kubelet
sudo systemctl enable kubelet
```

- kubeadm: 引导启动 Kubernate 集群的命令行工具。
- kubelet: 在群集中的所有计算机上运行的组件, 并用来执行如启动 Pods 和 Containers 等操作。
- kubectl: 用于操作运行中的集群的命令行工具。

## 初始化集群

为了能够让集群初始化更快，我们可以先预拉取集群初始化依赖的镜像，emmm，官方文档给出的又是 Google 的网址，这里我们基于 GitHub -> [AliyunContainerService/k8s-for-docker-desktop](https://github.com/AliyunContainerService/k8s-for-docker-desktop) 项目做镜像的快速拉取。确保相关镜像版本与 kubelet 保持一致（这里是 v1.22.2）, `kubeadm config images list --kubernetes-version v1.22.2` 可查看需要哪些镜像。

```shell
git clone https://github.com/AliyunContainerService/k8s-for-docker-desktop.git && cd k8s-for-docker-desktop

rm -f images.properties
# 调整镜像版本
cat>>images.properties<<EOF
k8s.gcr.io/pause:3.5=registry.cn-hangzhou.aliyuncs.com/google_containers/pause:3.5
k8s.gcr.io/kube-controller-manager:v1.22.2=registry.cn-hangzhou.aliyuncs.com/google_containers/kube-controller-manager:v1.22.2
k8s.gcr.io/kube-scheduler:v1.22.2=registry.cn-hangzhou.aliyuncs.com/google_containers/kube-scheduler:v1.22.2
k8s.gcr.io/kube-proxy:v1.22.2=registry.cn-hangzhou.aliyuncs.com/google_containers/kube-proxy:v1.22.2
k8s.gcr.io/kube-apiserver:v1.22.2=registry.cn-hangzhou.aliyuncs.com/google_containers/kube-apiserver:v1.22.2
k8s.gcr.io/etcd:3.5.0-0=registry.cn-hangzhou.aliyuncs.com/google_containers/etcd:3.5.0-0
k8s.gcr.io/coredns/coredns:v1.8.4=registry.cn-hangzhou.aliyuncs.com/google_containers/coredns:1.8.4
quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.26.1=registry.cn-hangzhou.aliyuncs.com/google_containers/nginx-ingress-controller:0.26.1
EOF
# 拉取镜像
./load_images.sh
```

### 初始化控制平面节点（Control Plane Node(s)）

控制（Control）节点 {阿里云轻量级应用服务器} 的镜像预拉取完毕后，可执行如下命令进行初始化操作：

```shell
# api server IPv4 地址使用公网 IP
kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \
  --kubernetes-version v1.22.2
  # --apiserver-advertise-address 120.79.73.159
```

为当前 root 用户生成 kubeconfig：

```shell
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

安装 CNI（Container Network Interface） -> Flannel

```shell
curl --insecure -sfL https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml | kubectl apply -f -
```

查看节点状况，emmm，Ready 没毛病

```shell
root@iZwz92a65mqaa8zwy83dpnZ:~/k8s-for-docker-desktop# kubectl get nodes
NAME                      STATUS   ROLES                  AGE    VERSION
izwz92a65mqaa8zwy8   Ready    control-plane,master   4m6s   v1.22.2
```

### 添加工作节点（Worker Node(s)）

接下来我们将 Worker 节点加入到集群中，由于我们在初始化控制平面所在的主节点时并没有指定公网 IP，所以这里先做个 IP 转发，让 Worker 节点能够和控制平面节点间进行通信。

```shell
iptables -t nat -A OUTPUT -d <初始化控制平面节点得到的 IP> -j DNAT --to-destination <阿里云轻量级服务器公网 IP>
```

然后我们将 Worker 节点 join 进集群中：

```shell
kubeadm join <初始化控制平面节点得到的 IP>:6443 --token 4zicbp.d1wertghxdgcgz6y --discovery-token-ca-cert-hash sha256:1912dbf415da652f97b9fa728cb85dd338e17b24ee338ec48b073c8fa8sdfgth
```

顺利的话😊，那么结果如下：

{% gallery %}
![worker join](https://z3.ax1x.com/2021/10/24/5fFKtU.png)
{% endgallery %}

然后到控制节点看下集群节点状态，**顺利的话**结果如下🤣：

```shell
root@iZwz92a65mqdpnZ:~/k8s-for-docker-desktop# kubectl get nodes
NAME                      STATUS   ROLES                  AGE    VERSION
izwz92a65mqaa8zwy83dpnz   Ready    control-plane,master   48m    v1.22.2
vm-8-4-ubuntu             Ready    <none>                 8m9s   v1.22.2
```

## 参考

- [Installing kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)
- [使用 Kubeadm 部署](http://icyfenix.cn/appendix/deployment-env-setup/setup-kubernetes/setup-kubeadm.html)
- [解决阿里云ECS下kubeadm部署k8s无法指定公网IP](https://www.cnblogs.com/life-of-coding/p/11879067.html)
