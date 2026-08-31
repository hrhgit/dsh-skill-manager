export const zh = {
  nav: '技能', title: '技能', subtitle: '浏览、编辑和导入本机可用的技能。', loading: '正在读取技能...', retry: '重试', loadFailed: '技能服务暂时不可用。',
  import: '导入技能', importing: '正在导入', add: '新建技能', refresh: '刷新', empty: '还没有可管理的技能。', edit: '编辑', sourceGlobal: 'DSH 用户技能', sourceAgents: 'Agents 用户技能', sourceProject: '项目技能', sourceCustom: '自定义目录',
  name: '名称', slug: '标识', description: '描述', instructions: '技能正文', save: '保存', cancel: '取消', saving: '正在保存', saved: '技能已保存。', required: '名称、描述和正文不能为空。',
  importTitle: '导入技能', importSubtitle: '按来源目录选择要复制到 DSH 用户技能目录的技能。', found: '发现 {count} 个可导入技能', selected: '已选择 {count} 个', selectAll: '全选', deselectAll: '全不选', selectDirectory: '选择此目录', deselectDirectory: '取消此目录', noCandidates: '没有发现可导入的技能。', importSelected: '导入所选技能（{count}）', imported: '已导入 {count} 个技能。', skipped: '跳过 {count} 个同名或失效技能。', close: '关闭', operationFailed: '操作失败，请重试。',
} as const
export type LocaleKey = keyof typeof zh
export const en: Record<LocaleKey, string> = {
  nav: 'Skills', title: 'Skills', subtitle: 'Browse, edit, and import skills available on this machine.', loading: 'Reading skills...', retry: 'Retry', loadFailed: 'The skill service is temporarily unavailable.',
  import: 'Import skills', importing: 'Importing', add: 'New skill', refresh: 'Refresh', empty: 'No manageable skills yet.', edit: 'Edit', sourceGlobal: 'DSH user skills', sourceAgents: 'Agents user skills', sourceProject: 'Project skills', sourceCustom: 'Custom directory',
  name: 'Name', slug: 'Slug', description: 'Description', instructions: 'Skill instructions', save: 'Save', cancel: 'Cancel', saving: 'Saving', saved: 'Skill saved.', required: 'Name, description, and instructions are required.',
  importTitle: 'Import skills', importSubtitle: 'Choose skills by source directory to copy into the DSH user skill directory.', found: '{count} importable skills found', selected: '{count} selected', selectAll: 'Select all', deselectAll: 'Select none', selectDirectory: 'Select this directory', deselectDirectory: 'Deselect this directory', noCandidates: 'No importable skills were found.', importSelected: 'Import selected ({count})', imported: 'Imported {count} skills.', skipped: 'Skipped {count} duplicate or stale skills.', close: 'Close', operationFailed: 'Operation failed. Try again.',
}
