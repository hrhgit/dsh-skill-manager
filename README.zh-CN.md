# dsh-skill-manager

DeepSeek Harness 技能管理插件。在设置中提供独立的“技能”页面，用于编辑、新建和批量导入本地技能。它读取宿主的 `ctx.skills` 活动目录，不再维护第二套发现、优先级或文件监听逻辑。

## 功能

- 浏览宿主解析后的活动技能目录。
- 直接编辑现有 `SKILL.md`，新增技能写入 `$DSH_HOME/skills/<slug>/SKILL.md`。
- 导入弹窗按来源目录分组，支持目录级选择、全选，并在每次打开时默认全不选。
- 导入到 DSH 用户技能目录；同名目标不会覆盖，而是明确跳过。
- Host 负责通过技能注册表读取和原子写入，Web Client 只维护当前交互状态。

## 配置

```yaml
- id: dsh-skill-manager
  name: dsh-skill-manager
  config:
    dshHome: D:/dsh-home
```

`dshHome` 仅覆盖新建和导入目标的 DSH 用户目录。技能来源、优先级、额外目录和文件监听由宿主的 `dsh-skill-filesystem` 配置统一决定。
