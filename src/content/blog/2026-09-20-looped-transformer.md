---
title: '循环 Transformer：用参数共享换计算深度'
description: 'Looped Transformer 让同一组 Transformer 层重复执行来增加计算深度而不增加参数量。它省的是参数不是计算，核心风险是计算无分化——本文梳理其原理、挑战、实验规律与新的 Scaling 维度。'
pubDate: 2026-09-20
category: '技术笔记'
tags: ['AI', 'Transformer']
---

## 什么是 Looped Transformer

Looped Transformer，也可以理解为**循环 Transformer / Recurrent Depth Transformer**。它的核心思想是：

> **让同一组 Transformer 层重复运行多次。**

- **普通 Transformer** 的深度大致是 `F1 → F2 → F3 → F4`，每一层通常有自己独立的参数。
- **循环 Transformer** 则是 `F → F → F → F`，不同轮次反复使用同一套参数。

因此它增加的是**计算深度（Computation Depth）**，而不是同比例增加**独立参数数量（Parameter Count）**。

### 具体含义

假设某个 Transformer Core 只有 20 层：

- 普通模型可能只运行一次：20 层。
- 循环模型则可以让这 20 层连续运行两次：20 × 2 = 40。

于是模型实际上经历了接近 40 层的计算过程，但并不需要保存 40 套不同的 Transformer 参数。所以它本质上是一种**沿模型深度方向进行 Weight Sharing（参数共享）**。

### 每次循环处理的东西完全一样吗

不是。虽然 Transformer 参数相同，但每一轮接收到的 **Hidden State（隐藏状态）** 不同：

```text
h1 = F(h0)   # 最初的内部表示经过第一轮计算
h2 = F(h1)   # 基于第一轮结果继续计算
h3 = F(h2)   # 再基于第二轮结果继续计算
```

所以它不是简单地"把完全相同的问题重新输入一遍"，而是**在上一轮已经形成的内部表示上继续计算**。

## 为什么要这么做

最直接的目的，是把**参数规模**和**计算深度**部分解耦。

- 普通 Transformer 如果想把模型做得更深，通常需要增加新的层 F1, F2, …, Fn，参数量也跟着增加。
- 循环 Transformer 则希望用**同一组参数 + 更多执行次数**来获得更深的计算。

因此它探索的是一种不同的 Scaling 思路：

> **不完全依赖增加参数，而是增加现有参数被使用的次数。**

### 循环 Transformer 省的是什么

主要省的是**独立参数**，而不是**计算**。这是理解循环 Transformer 非常重要的一点。

虽然 `F1 → F2 → F3 → F4` 变成了 `F → F → F → F`，意味着不用保存四套不同参数，但 F 每执行一次，Attention、MLP、矩阵乘法等操作仍然需要真正跑一次。

> **关键点**：参数可以共享，但 FLOPs 不会因为参数共享就自动消失。循环省下的是参数，不是计算。

## 核心挑战：计算冗余与无分化

### 循环更多次，模型自然就会越来越强吗

不是。这正是 Looped Transformer 最大的疑问之一：

> **多运行一轮，不代表这一轮真的产生了新的有效计算。**

内部分析观察到一个很典型的现象：

- 第一轮循环时，Hidden State 往往变化很大；
- 之后 h1 → h2 变化开始缩小；
- 再到 h2 → h3 变化可能进一步缩小。

同时，相邻循环之间的 Hidden State 会越来越相似，很可能出现 h2 ≈ h1、h3 ≈ h2。模型虽然继续支付了一整轮 Transformer 的计算成本，但内部表示已经没有发生多少有意义的变化。

### 直观理解

可以类比成人思考一道题。一个人想了十分钟没有解决，再给他十分钟不代表他一定会获得新的思路。如果第二个十分钟仍然沿着完全相同的思路（思路 A → 思路 A → 思路 A），那么只是消耗了更多时间。

真正有价值的是：理解问题 → 找到突破口 → 进行推导 → 验证答案。

```text
More Computation ≠ More Intelligence
```

更准确地说：**额外 Computation 只有产生新的、有用的内部状态变化时才有价值。**

### 为什么容易出现这个问题

一个重要原因是**不同循环之间天然缺少明确的功能分工**。

- 普通深层 Transformer（F1 → F2 → F3 → F4）因为每一层参数不同，可以自然形成不同功能（如前层处理基础信息，中层建立高层表示，后层处理复杂关系）。
- 循环 Transformer（F → F → F → F）中，同一个 F 必须根据当前 Hidden State 自己判断"我现在已经计算到哪个阶段了"，否则不同轮次很容易继续执行类似的 Transformation。

这一现象可以称为**计算无分化（Undifferentiated Computation）**。

### Hidden State 的角色

Hidden State 可以理解成模型的**内部工作状态**。循环 Transformer 不断进行 `h(t+1) = F(h(t))`，模型能不能从更多循环中受益，本质上取决于 h0, h1, h2, h3, … 是不是在持续发生有意义的变化。

- **理想情况**：每一步都加入新的有效计算结果。
- **不理想情况**：h1 ≈ h1' ≈ h1''，内部状态已经接近某种稳定状态，却还在继续计算。

### 最大的问题：计算冗余

观察中发现，三个 Core Loop 里第一轮 Hidden State 更新明显，后面的更新幅度快速下降。但更新变小并不代表计算成本也变小，Attention、MLP、矩阵计算仍然完整执行。

因此可能出现 Compute Cost 上升但 Useful Information Gain 趋近于零的情况。这就是循环模型最大的效率问题。

## 实验规律与新 Scaling 维度

### 循环比例越高越好吗

现有实验并不支持这个结论。在保持参数量和训练算力相近的情况下，提高循环层比例时，模型性能表现出**先提升，随后下降**。

相关实验中，大约在 **30%–40% 循环层占比**附近达到较好表现；继续提高循环比例以后，过度的参数共享反而会拖累性能。所以 More Weight Sharing 并不是无限有利，模型仍然需要在**独立参数**和**重复计算**之间寻找平衡。

### 与"思维链"的区别

- **传统 Reasoning Model**：通过生成更多 Token 来增加计算（问题 → Reasoning Tokens → Answer），属于**显式计算**。
- **循环 Transformer**：把一部分额外 Computation 放在 Hidden State / Latent Space 里面完成（问题 → h1 → h2 → h3 → 输出），属于**隐式计算**。

### 提供的新 Scaling 维度

传统模型 Scaling 主要围绕 Parameters、Training Data、Training Compute，后来 Reasoning Model 加入了 Inference-time Tokens。循环 Transformer 进一步增加了 **Recurrent Depth**（同一个模型在 Hidden State 上运行多少轮）。

于是模型能力可能不再只取决于"模型有多大"，还取决于 `Parameters × Computation Depth`。

这也是循环 Transformer 最值得关注的地方。

## 总结

Looped Transformer 的核心思想是：

> **重复使用同一组 Transformer 参数，通过增加循环次数获得更深的 Computation，而不同比例增加模型参数。**

- **最大优势**：参数复用。
- **最大风险**：重复计算。

因此判断循环 Transformer 是否真正有效，不能只问"循环了多少次？"，更应该问**"第 n+1 次循环相比第 n 次，到底产生了多少新的有效 Computation？"**

可以把整个问题浓缩成：

```text
Value of Looping = Useful New Computation / Additional Compute Cost
```

如果后面的循环持续产生新的有效内部状态，Recurrent Depth 就有价值；如果 Hidden State 很快趋于相似，那么循环更多次只是花更多算力重复思考，而不等于模型变得更聪明。
