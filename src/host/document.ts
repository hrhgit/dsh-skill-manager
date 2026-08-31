import { sep } from 'node:path'
import { parse as parseYaml } from 'yaml'

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface ParsedSkillDocument { readonly slug: string; readonly name: string; readonly description: string; readonly content: string }

export function normalizeSlug(value: string): string {
  const slug = value.trim().toLowerCase()
  if (!SKILL_NAME.test(slug)) throw new Error('技能标识必须使用小写字母、数字和短横线')
  return slug
}

export function parseSkillSource(source: string, path: string): ParsedSkillDocument {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/)
  const frontmatter = match?.[1] ?? ''
  const content = (match?.[2] ?? source).trim()
  let metadata: unknown = {}
  try { metadata = frontmatter.trim().length === 0 ? {} : parseYaml(frontmatter) } catch (error) { throw new Error(`技能 frontmatter 无效: ${error instanceof Error ? error.message : String(error)}`) }
  const fields = typeof metadata === 'object' && metadata !== null ? metadata as Record<string, unknown> : {}
  const text = (key: string): string | undefined => typeof fields[key] === 'string' ? fields[key].trim() : undefined
  const slug = normalizeSlug(text('name') ?? basenameOfSkill(path))
  const name = text('display-name') || text('displayName') || text('title') || slug
  const description = text('description') || '未提供描述'
  if (content.length === 0) throw new Error('技能正文为空')
  return { slug, name, description, content }
}

export function serializeSkill(parsed: ParsedSkillDocument): string {
  const displayName = parsed.name === parsed.slug ? '' : `display-name: ${quoteYaml(parsed.name)}\n`
  return `---\nname: ${parsed.slug}\n${displayName}description: ${quoteYaml(parsed.description)}\n---\n\n${parsed.content.trim()}\n`
}

export function basenameOfSkill(path: string): string { return path.endsWith(`${sep}SKILL.md`) ? path.split(sep).at(-2) ?? 'skill' : path.split(sep).at(-1)?.replace(/\.md$/i, '') ?? 'skill' }
function quoteYaml(value: string): string { return /[:#\n\r"']/.test(value) ? JSON.stringify(value) : value }
