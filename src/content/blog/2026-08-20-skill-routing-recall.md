---
title: 'Agent 技能路由：大量 Skill 场景下如何精准召回'
description: '当 Agent 的 skill 从几个涨到上百个，"选对技能"就变成一个检索与排序问题。本文整理一套可落地的方案：skill 元数据标准化、三层路由（领域路由 → 混合召回 → LLM 精排）、置信度门控、Readiness 检查、混淆集与评测闭环。'
pubDate: 2026-08-20
category: '技术笔记'
tags: ['AI', 'Agent']
---

当 Agent 的 skill 只有几个时，把全部描述塞给 LLM 让它选就行；当 skill 涨到上百个，这条路就走不通了——上下文装不下、相似能力互相干扰、误执行的代价越来越高。"大量 skill 下的精准召回"本质上是一个**分层检索 + 排序 + 决策**问题。

## Skill 元数据标准化

一切召回的前提是元数据结构化：

| 字段               | 作用                       |
| ------------------ | -------------------------- |
| skill_id           | 唯一标识                   |
| domain             | 所属领域，用于第一层路由    |
| description        | 能力说明，用于语义理解      |
| **positive_examples** | 用户可能怎么表达         |
| **negative_examples** | 容易混淆但不属于它的情况 |
| inputs             | 调用需要什么参数           |
| **boundary**       | 适用 / 不适用边界          |
| risk               | 执行风险                   |

> **Skill metadata = 给 Agent 做能力分类的训练数据结构，不是普通文档。**重点描述 skill 的意图、例子和边界，而不是只描述功能。

## 三层路由

### 第一层：粗粒度领域路由

领域路由（Domain Router）可以选用：

- 轻量分类模型
- LLM 结构化分类
- embedding 检索
- 规则 + 模型混合

> 粗粒度领域路由 = 第一层分类器。先判断用户属于哪个业务领域，把 200 个 skill 缩小到几十个候选。它不负责最终选择 skill，只负责降低搜索空间，提高后续召回和排序准确率。

### 第二层：混合召回候选 skill

- 语义召回（embedding）
- 关键词 / BM25 召回
- 规则召回

> 混合召回 = 在领域范围内，用 embedding 找语义相似、BM25 找关键词匹配、规则找业务确定性，三者融合得到 Top-K skill 候选。目标不是选最终 skill，而是不漏掉正确候选。

### 第三层：LLM 精排

输入：

```text
用户请求 + 上下文 + 候选 skill 列表 + 每个 skill 的 metadata
```

> LLM Reranker = 最后一层决策器。它不负责搜索，而负责在少量候选 skill 中理解用户意图、比较边界、选择最匹配能力。设计重点是给候选 skill 做对比判断，而不是让 LLM 从全部 skill 中自由选择。

## 置信度门控

```text
score + margin + risk
```

> Confidence Gate = skill 调用前的安全阀。根据 Top1 分数、Top1-Top2 差距、skill 风险等级决定自动执行、追问确认还是拒绝调用，避免模型"自信地选错 skill"。

## 区分"召回正确"和"可执行"

两个概念必须分开：

- **Skill Selection**：选择哪个 skill。
- **Skill Readiness**：当前是否具备调用条件。

Readiness 检查什么：

- 参数完整性（Slot Checking）
- 前置条件（Precondition）
- 权限检查（Permission）
- 风险确认（Confirmation）

## 利用上下文改写 query

这一步常见的叫法：query rewriting / context condensation / standalone query generation。

改写的两条关键原则：

1. 只能补充已知信息
2. 保留用户真实意图

三种实现方式：规则拼接、LLM rewrite、Memory + Retriever。

> Query Rewrite = 在检索前，把多轮对话中的省略、指代、不完整请求转换成独立完整 query，提高 skill 召回准确率。核心原则是不改变用户意图，只补充已有上下文。

## 给 skill 建立混淆集

名称和目标接近的 skill，应主动维护混淆集（Confusion Set）：

- 人工定义
- 根据 embedding 自动发现
- 根据线上错误发现

> Skill 混淆集 = 主动维护容易互相误选的 skill 集合。通过 hard negative 和对比判断提升 Reranker 精度，重点解决"相似能力之间选错"的问题。

## 建立离线评测集

没有评测集，就无法判断"精准召回"到底有没有提升。建议每个 skill 至少准备：

- 20～50 条正例
- 10～30 条边界负例
- 10～30 条与相邻 skill 混淆的 hard negative
- 多轮上下文样本
- 口语、省略、错别字样本

核心指标：

```text
Recall@K               正确 skill 是否进入 Top-K
Top-1 Accuracy         第一名是否正确
MRR                    正确 skill 的平均排序位置
No-skill Accuracy      本不该调用 skill 时，是否拒绝调用
Clarification Accuracy 需要追问时，是否正确追问
Execution Precision    真正执行的 skill 中，正确比例
```

按指标定位问题层：

```text
召回失败？      → Retrieval 问题
召回到了但选错？ → Reranker 问题
选对但不能执行？ → Readiness 问题
```

> 离线评测集 = Skill Router 的测试基准。通过 Recall@K、Top1 Accuracy、No-Skill Accuracy、Clarification Accuracy 等指标定位问题，避免凭感觉优化。

## 在线反馈闭环

重点收集：

- 用户改口或纠正
- tool 调用失败
- 参数缺失
- 用户取消确认
- Top1/Top2 分数接近
- 最终转人工
- 同一个请求连续切换 skill

这些数据可以用来：补充 hard negative、调整 skill 描述、训练领域分类器、训练 reranker、动态调整阈值、合并或拆分 skill。

> 在线反馈闭环 = 收集线上真实请求、模型决策、执行结果和用户纠正，用于持续优化 skill 描述、召回、排序和边界。重点不是收集所有数据，而是找到模型最容易犯错的数据。

## 一套实际可落地的流程

```text
用户输入
  ↓
上下文改写
  ↓
规则检测：风险、动作类型、实体
  ↓
Domain Router，召回 1～3 个领域
  ↓
Embedding + BM25 + Rule 混合召回 Top 10
  ↓
加入历史上下文和混淆 skill
  ↓
LLM/Reranker 精排 Top 3
  ↓
置信度 + Top1/Top2 margin 判断
  ↓
检查参数、权限、前置条件
  ↓
直接调用 / 追问 / 不调用 skill
```

## 总结

大量 skill 场景下的精准召回，核心是**把"选 skill"从一次 LLM 自由决策拆成分层的工程问题**：元数据定义召回质量的上限，三层路由压缩搜索空间，置信度门控与 Readiness 检查守住执行安全，评测集与反馈闭环保证持续变好。每一层只做自己擅长的事，出了问题也才知道该修哪一层。
