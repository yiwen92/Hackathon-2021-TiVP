<!--
This is a template for TiDB's change proposal process, documented [here](./README.md).
-->

# RFC: <!-- Title --> TiVP - Visual Plan For TiDB

- Author(s): [@92hackers](https://github.com/92hackers), [@chrysan](https://github.com/chrysan), [@Tammyxia](https://github.com/Tammyxia), [@yiwen92](https://github.com/yiwen92) (in alphabetical order)
- Last updated: 2021-12-27 <!-- Date -->
- Discussion at: <!-- https://github.com/pingcap/tidb/issues/XXX -->
- Project at: https://github.com/yiwen92/TiDB-Hackathon-2021-TiVP

## 项目介绍

<!--
A short summary of the proposal:
- What is the issue that the proposal aims to solve?
- What needs to be done in this proposal?
- What is the impact of this proposal?
-->

TiVP is a Visual Plan for TiDB SQL explaination integreted with Dashboard.
该项目旨在将执行计划做可视化。

## 背景&动机

<!--
An introduction of the necessary background and the problem being solved by the proposed change:
- The drawback of the current feature and the corresponding use case
- The expected outcome of this proposal.
-->

随着 TiDB 被运用到更加复杂的分析场景，sql 语句会变得异常复杂，由此 explain 出来的执行计划（https://docs.pingcap.com/zh/tidb/stable/explain-walkthrough/#使用-explain-解读执行计划） 就会令人费解，影响性能调优效率。

当使用者对着 explain 生成的复杂计划抓耳挠腮的时候，我们更希望化繁为简，用可视化的方式将每一条复杂 sql 语句的执行流程清楚地展示出来，在帮助技术人员快速了解 SQL Plan 的同时给予智能优化的提示。

## 项目设计

<!--
A precise statement of the proposed change:
- The new named concepts and a set of metrics to be collected in this proposal (if applicable)
- The overview of the design.
- How it works?
- What needs to be changed to implement this design?
- What may be positively influenced by the proposed change?
- What may be negatively impacted by the proposed change?
-->

收集数据库侧 SQL 执行信息，基于 TiDB 当前管理工具 Dashboard，开发一个显示界面，用于图像化展示 SQL 的执行计划，帮助使用者快速分析 SQL 语句和执行逻辑，快速定位以及解决问题

主要功能：
- 从数据库运行时中收集必要信息，如执行计划（包括逻辑计划和物理计划）、各步骤运行耗时、访问信息（estRows 和 actRows）等
- 将执行计划的算子和代价通过树状结构进行可视化展现，明确显示耗时最长或代价最大的执行路径
- 集成于 TiDB 现有的管理工具 Dashboard

高级功能：
- Optimize Trace？
- SQL 助手：智能 Hint 和改写？
- 统计信息可视化？

图片待补充

## Rationale

<!--
A discussion of alternate approaches and the trade-offs, advantages, and disadvantages of the specified approach:
- How other systems solve the same issue?
- What other designs have been considered and what are their disadvantages?
- What is the advantage of this design compared with other designs?
- What is the disadvantage of this design?
- What is the impact of not doing this?
-->
相比于自定义一套独立的 WebUI 界面或从头设计一套 TiDB 数据库管理套件，我们计划和 Dashboard 做集成，因为 Dashboard 方便易用，自动部署，官方维护，风格统一。

## Compatibility and Migration Plan

<!--
A discussion of the change with regard to the compatibility issues:
- Does this proposal make TiDB not compatible with the old versions?
- Does this proposal make TiDB not compatible with TiDB tools?
    + [BR](https://github.com/pingcap/br)
    + [DM](https://github.com/pingcap/dm)
    + [Dumpling](https://github.com/pingcap/dumpling)
    + [TiCDC](https://github.com/pingcap/ticdc)
    + [TiDB Binlog](https://github.com/pingcap/tidb-binlog)
    + [TiDB Lightning](https://github.com/pingcap/tidb-lightning)
- If the existing behavior will be changed, how will we phase out the older behavior?
- Does this proposal make TiDB more compatible with MySQL?
- What is the impact(if any) on the data migration:
    + from MySQL to TiDB
    + from TiDB to MySQL
    + from old TiDB cluster to new TiDB cluster
-->
冇。

## Implementation

<!--
A detailed description for each step in the implementation:
- Does any former steps block this step?
- Who will do it?
- When to do it?
- How long it takes to accomplish it?
-->
TBD。

## Testing Plan

<!--
A brief description on how the implementation will be tested. Both integration test and unit test should consider the following things:
- How to ensure that the implementation works as expected?
- How will we know nothing broke?
-->
演示。

## Open issues (if applicable)

<!--
A discussion of issues relating to this proposal for which the author does not know the solution. This section may be omitted if there are none.
-->
冇。
