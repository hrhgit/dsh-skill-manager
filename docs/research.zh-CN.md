# 同类插件调查

开发前检查了当前插件市场目录，发现社区已有 `YTxue/dsh-skill-manager` 候选，功能覆盖技能池、规范审计、自动修复和批量导入。该候选当前因 npm `repository` 元数据不符合市场规范而被拒绝，且其职责范围明显大于本次需求。

本实现选择独立开发，原因如下：

- 本次范围明确限定为设置页中的浏览、编辑、新建和按目录分组导入，不引入额外技能池和自动修复状态。
- Host 通过 Typert Remote 统一拥有文件发现、校验和原子写入；Client 只维护弹窗选择和编辑草稿，符合当前 Harness 的 Host/Client 职责边界。
- 直接使用 `settings.section`、Cordis 服务生命周期和官方 bundle 声明，不依赖宿主内部状态。
- npm 包使用 `@ruihuahe/dsh-skill-manager`，避免与现有社区包的未限定名称冲突；插件目录和显示名称仍为 `dsh-skill-manager` / “技能管理器”。

由于本机 GitHub 代理端口不可用，本轮未拉取社区仓库源码；对候选能力和拒绝原因的判断来自当前插件市场已生成目录。
