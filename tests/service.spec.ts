import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { SkillRegistry, type SkillCandidate, type SkillDefinition } from '@deepseek-ai/dsh-skill'
import { afterEach, describe, expect, it } from 'vitest'
import SkillManagerService from '../lib/index.js'

const cleanups: Array<() => Promise<void>> = []
afterEach(async () => { while (cleanups.length > 0) await cleanups.pop()?.() })

describe('SkillManagerService', () => {
  it('discovers, imports, edits, and skips a duplicate skill', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dsh-skill-manager-'))
    const dshHome = join(directory, 'home')
    const sourceRoot = join(directory, 'shared-skills')
    const sourcePath = join(sourceRoot, 'release-notes', 'SKILL.md')
    await mkdir(join(sourceRoot, 'release-notes'), { recursive: true })
    await writeFile(sourcePath, '---\nname: release-notes\ndescription: Write release notes\n---\n\nUse the project changelog.\n')

    const ctx = new Context()
    const sourceDefinition: SkillDefinition = { name: 'release-notes', description: 'Write release notes', content: 'Use the project changelog.', source: 'custom', provider: 'test', invocation: { modelInvocable: true, userInvocable: true }, path: sourcePath, resourceBase: { kind: 'directory', path: join(sourceRoot, 'release-notes') } }
    const definitions = new Map<string, SkillDefinition>([[sourceDefinition.name, sourceDefinition]])
    await ctx.plugin(SkillRegistry)
    ctx.skills.registerProvider(() => ({
      name: 'test',
      list: async (): Promise<readonly SkillCandidate[]> => [...definitions.values()].map(({ content: _content, ...summary }, index) => ({ ...summary, rank: index, locator: summary.path })),
      get: async (candidate): Promise<SkillDefinition | undefined> => definitions.get(candidate.name),
    }))
    await ctx.plugin(SkillManagerService, { dshHome })
    cleanups.push(async () => { await ctx.fiber.dispose(); await rm(directory, { recursive: true, force: true }) })

    const candidates = await ctx.skillManager.discover()
    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({ slug: 'release-notes', sourceRoot: join(sourceRoot, 'release-notes'), sourcePath })

    const first = await ctx.skillManager.import([candidates[0]!.id])
    expect(first.imported).toHaveLength(1)
    expect(first.skipped).toEqual([])
    const saved = await ctx.skillManager.save({ ...first.imported[0]!, name: 'Release Notes', description: 'Write polished release notes', content: 'Follow the repository changelog format.' })
    expect(saved.name).toBe('Release Notes')
    expect(await readFile(saved.filePath, 'utf8')).toContain('display-name: Release Notes')
    definitions.set('release-notes', { ...sourceDefinition, description: 'Write polished release notes', content: 'Follow the repository changelog format.', source: 'user-dsh', path: saved.filePath, metadata: { 'display-name': 'Release Notes' }, resourceBase: { kind: 'directory', path: join(dshHome, 'skills', 'release-notes') } })
    expect((await ctx.skillManager.snapshot()).skills.find(skill => skill.source === 'global')).toEqual(saved)

    await ctx.skillManager.discover()
    const duplicate = await ctx.skillManager.import([sourcePath])
    expect(duplicate.imported).toEqual([])
    expect(duplicate.skipped[0]?.slug).toBe(sourcePath)
  })
})
