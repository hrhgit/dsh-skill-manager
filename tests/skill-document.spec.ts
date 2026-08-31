import { describe, expect, it } from 'vitest'
import { parseSkillSource, serializeSkill } from '../src/host/document.js'

describe('skill document', () => {
  it('parses standard frontmatter and keeps the markdown body', () => {
    expect(parseSkillSource('---\nname: release-notes\ndisplay-name: Release Notes\ndescription: "Write concise: release notes"\n---\n\nFollow the repository format.\n', 'C:/skills/release-notes/SKILL.md')).toEqual({
      slug: 'release-notes',
      name: 'Release Notes',
      description: 'Write concise: release notes',
      content: 'Follow the repository format.',
    })
  })

  it('serializes an editable display name without changing the skill slug', () => {
    const source = serializeSkill({ slug: 'release-notes', name: 'Release Notes', description: 'Write release notes', content: '# Instructions\n\nBe concise.' })
    expect(source).toContain('name: release-notes\n')
    expect(source).toContain('display-name: Release Notes\n')
    expect(parseSkillSource(source, 'C:/skills/release-notes/SKILL.md').name).toBe('Release Notes')
  })

  it('rejects an invalid skill slug', () => {
    expect(() => parseSkillSource('---\nname: Bad_Name\ndescription: invalid\n---\n\nbody', 'C:/skills/Bad_Name/SKILL.md')).toThrow('技能标识')
  })
})
