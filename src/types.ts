export type SkillSource = 'global' | 'agents' | 'project' | 'custom'

export interface SkillView {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly content: string
  readonly source: SkillSource
  readonly sourceRoot: string
  readonly filePath: string
}

export interface SkillImportCandidate {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly sourceRoot: string
  readonly sourcePath: string
}

export interface SkillSnapshot {
  readonly skills: readonly SkillView[]
  readonly globalRoot: string
}

export interface SkillImportReceipt {
  readonly imported: readonly SkillView[]
  readonly skipped: readonly { slug: string; reason: string }[]
}

export interface SaveSkillInput {
  readonly id?: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly content: string
}
