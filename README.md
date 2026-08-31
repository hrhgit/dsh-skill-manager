# dsh-skill-manager

DeepSeek Harness settings plugin for editing, creating, and importing local skills. It reads the active catalog from the host `ctx.skills` registry instead of maintaining a second discovery, priority, or file-watching implementation.

- Browses the host's active, resolved skill catalog.
- Writes new skills to `$DSH_HOME/skills/<slug>/SKILL.md`.
- Groups import candidates by source directory with group selection, select-all, and an empty default selection.
- Skips duplicate target slugs instead of overwriting them.
- Keeps edits and imports in the Host and transient interaction state in the Web Client.

See [README.zh-CN.md](./README.zh-CN.md) for configuration details.
