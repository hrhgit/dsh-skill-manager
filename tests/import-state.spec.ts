import { describe, expect, it } from 'vitest'
import type { SkillImportCandidate } from '../src/types.js'
import { createImportDialogState, groupCandidates } from '../src/client/SkillManagerSection.js'

const candidates: SkillImportCandidate[] = [
  { id: 'b', slug: 'beta', name: 'Beta', description: 'Beta skill', sourceRoot: 'C:/shared/skills', sourcePath: 'C:/shared/skills/beta/SKILL.md' },
  { id: 'a', slug: 'alpha', name: 'Alpha', description: 'Alpha skill', sourceRoot: 'C:/shared/skills', sourcePath: 'C:/shared/skills/alpha/SKILL.md' },
  { id: 'c', slug: 'custom', name: 'Custom', description: 'Custom skill', sourceRoot: 'D:/other/skills', sourcePath: 'D:/other/skills/custom/SKILL.md' },
]

describe('skill import dialog state', () => {
  it('starts with every candidate unselected and every source directory expanded', () => {
    const state = createImportDialogState(candidates)
    expect([...state.selected]).toEqual([])
    expect([...state.expanded].sort()).toEqual(['C:/shared/skills', 'D:/other/skills'])
  })

  it('groups candidates by source directory and sorts skills by slug', () => {
    expect(groupCandidates(candidates).map(group => [group.root, group.items.map(item => item.slug)])).toEqual([
      ['C:/shared/skills', ['alpha', 'beta']],
      ['D:/other/skills', ['custom']],
    ])
  })
})
