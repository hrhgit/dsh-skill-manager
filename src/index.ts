import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { writeFileAtomic } from '@deepseek-ai/dsh-atomic-write'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import type { SkillDefinition, SkillSource as RegistrySkillSource } from '@deepseek-ai/dsh-skill'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { z } from 'zod'
import { normalizeSlug, parseSkillSource, serializeSkill, type ParsedSkillDocument } from './host/document.js'
import type { SaveSkillInput, SkillImportCandidate, SkillImportReceipt, SkillSnapshot, SkillView } from './types.js'

const ConfigSchema = z.object({ dshHome: z.string().min(1).optional() }).default({})
export interface Config { readonly dshHome?: string }
type ResolvedConfig = z.output<typeof ConfigSchema>

declare module '@deepseek-ai/cordis' { interface Context { skillManager: SkillManagerService } }

export { parseSkillSource, serializeSkill } from './host/document.js'
export type { ParsedSkillDocument } from './host/document.js'

export class SkillManagerService extends TypertRemoteService {
  static Config = ConfigSchema
  static inject = ['skills']
  private readonly home: string
  private readonly globalRoot: string
  private readonly candidates = new Map<string, SkillImportCandidate>()
  private readonly candidateDocuments = new Map<string, ParsedSkillDocument>()
  private readonly editable = new Map<string, SkillView>()

  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'skillManager')
    const resolved = ConfigSchema.parse(config)
    this.home = resolveDshHome(resolved.dshHome)
    this.globalRoot = join(this.home, 'skills')
  }

  @Remote('snapshot')
  async snapshot(): Promise<SkillSnapshot> {
    this.editable.clear()
    const skills: SkillView[] = []
    const catalog = await this.ctx.skills.snapshot({ cwd: process.cwd() })
    for (const summary of catalog.skills) {
      const definition = await this.ctx.skills.get(summary.name, { cwd: process.cwd() })
      const view = definition === undefined ? undefined : asView(definition)
      if (view === undefined) continue
      this.editable.set(view.id, view)
      skills.push(view)
    }
    skills.sort((a, b) => a.name.localeCompare(b.name) || a.filePath.localeCompare(b.filePath))
    return { skills, globalRoot: this.globalRoot }
  }

  @Remote('discover')
  async discover(): Promise<readonly SkillImportCandidate[]> {
    this.candidates.clear()
    this.candidateDocuments.clear()
    const found: SkillImportCandidate[] = []
    for (const skill of (await this.snapshot()).skills) {
      if (skill.source === 'global') continue
      const candidate = { id: skill.filePath, slug: skill.slug, name: skill.name, description: skill.description, sourceRoot: skill.sourceRoot, sourcePath: skill.filePath }
      this.candidates.set(candidate.id, candidate)
      this.candidateDocuments.set(candidate.id, { slug: skill.slug, name: skill.name, description: skill.description, content: skill.content })
      found.push(candidate)
    }
    return found.sort((a, b) => a.sourceRoot.localeCompare(b.sourceRoot) || a.slug.localeCompare(b.slug))
  }

  @Remote('save')
  async save(input: SaveSkillInput): Promise<SkillView> {
    const slug = normalizeSlug(input.slug)
    const name = input.name.trim()
    const description = input.description.trim()
    const content = input.content.trim()
    if (name.length === 0 || description.length === 0 || content.length === 0) throw new Error('技能名称、描述和正文不能为空')
    const existing = input.id === undefined ? undefined : this.editable.get(input.id)
    if (input.id !== undefined && existing === undefined) throw new Error('请刷新技能目录后再编辑')
    const target = existing?.filePath ?? join(this.globalRoot, slug, 'SKILL.md')
    if (existing !== undefined && existing.slug !== slug) throw new Error('编辑时不能修改技能标识')
    await writeSkill(target, { slug, name, description, content })
    const saved = { id: target, slug, name, description, content, source: existing?.source ?? 'global', sourceRoot: existing?.sourceRoot ?? dirname(target), filePath: target }
    this.editable.set(target, saved)
    return saved
  }

  @Remote('import')
  async import(ids: readonly string[]): Promise<SkillImportReceipt> {
    const imported: SkillView[] = []
    const skipped: { slug: string; reason: string }[] = []
    const occupied = new Set([...this.editable.values()].filter(skill => skill.source === 'global').map(skill => skill.slug))
    for (const id of ids) {
      const candidate = this.candidates.get(id)
      if (candidate === undefined) { skipped.push({ slug: id, reason: '候选已过期，请重新发现技能' }); continue }
      if (occupied.has(candidate.slug)) { skipped.push({ slug: candidate.slug, reason: '目标目录已有同名技能' }); continue }
      const parsed = this.candidateDocuments.get(id)
      if (parsed === undefined) { skipped.push({ slug: candidate.slug, reason: '候选已过期，请重新发现技能' }); continue }
      const target = join(this.globalRoot, parsed.slug, 'SKILL.md')
      await writeSkill(target, parsed)
      occupied.add(parsed.slug)
      const view = { id: target, slug: parsed.slug, name: parsed.name, description: parsed.description, content: parsed.content, source: 'global' as const, sourceRoot: dirname(target), filePath: target }
      this.editable.set(target, view)
      imported.push(view)
    }
    return { imported, skipped }
  }

}

async function writeSkill(path: string, parsed: ParsedSkillDocument): Promise<void> {
  const source = serializeSkill(parsed)
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  await writeFileAtomic(path, source, { mode: 0o600, dirMode: 0o700 })
}

function asView(definition: SkillDefinition): SkillView | undefined {
  if (definition.path === undefined) return undefined
  return { id: definition.path, slug: definition.name, name: displayNameOf(definition), description: definition.description, content: definition.content, source: sourceOf(definition.source), sourceRoot: sourceRootOf(definition), filePath: definition.path }
}

function displayNameOf(definition: SkillDefinition): string {
  const displayName = definition.metadata?.['display-name'] ?? definition.metadata?.displayName ?? definition.metadata?.title
  return typeof displayName === 'string' && displayName.trim().length > 0 ? displayName.trim() : definition.name
}

function sourceOf(source: RegistrySkillSource): SkillView['source'] {
  if (source === 'user-dsh') return 'global'
  if (source === 'user-agents') return 'agents'
  if (source === 'project-dsh' || source === 'project-agents') return 'project'
  return 'custom'
}

function sourceRootOf(definition: SkillDefinition): string {
  return definition.resourceBase?.kind === 'directory' ? definition.resourceBase.path : dirname(definition.path!)
}

export default SkillManagerService
