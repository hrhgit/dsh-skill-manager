import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { z } from 'zod'
import type { SaveSkillInput, SkillImportCandidate, SkillImportReceipt, SkillSnapshot, SkillView } from './types.js'

const skill = z.object({ id: z.string(), slug: z.string(), name: z.string(), description: z.string(), content: z.string(), source: z.enum(['global', 'agents', 'project', 'custom']), sourceRoot: z.string(), filePath: z.string() }).readonly()
const candidate = z.object({ id: z.string(), slug: z.string(), name: z.string(), description: z.string(), sourceRoot: z.string(), sourcePath: z.string() }).readonly()
const snapshot = z.object({ skills: z.array(skill).readonly(), globalRoot: z.string() }).readonly()
const receipt = z.object({ imported: z.array(skill).readonly(), skipped: z.array(z.object({ slug: z.string(), reason: z.string() }).readonly()).readonly() }).readonly()
const strict = (typeSymbol: string, schema: z.ZodType) => ({ mode: 'strict' as const, typeSymbol, schema })
const parameter = (name: string, schema: z.ZodType) => ({ name, wire: name, source: 'json' as const, codec: strict(`@hrhgit/dsh-skill-manager/types#${name}`, schema) })
const descriptor = (method: string, parameters: readonly ReturnType<typeof parameter>[], result: z.ZodType, resultType: string) => ({ id: `@hrhgit/dsh-skill-manager#skillManager/${method}`, service: 'skillManager', namespace: 'skillManager', method, invocation: { kind: 'direct' as const }, parameters, result: strict(`@hrhgit/dsh-skill-manager/types#${resultType}`, result) })
const descriptors = [
  descriptor('snapshot', [], snapshot, 'SkillSnapshot'),
  descriptor('discover', [], z.array(candidate).readonly(), 'SkillImportCandidate[]'),
  descriptor('save', [parameter('input', z.object({ id: z.string().optional(), slug: z.string(), name: z.string(), description: z.string(), content: z.string() }).readonly())], skill, 'SkillView'),
  descriptor('import', [parameter('ids', z.array(z.string()).readonly())], receipt, 'SkillImportReceipt'),
] as const

export const TYPERT_REMOTE: TypertRemoteContribution = { package: '@hrhgit/dsh-skill-manager', descriptors }
export const TYPERT = { package: '@hrhgit/dsh-skill-manager', face: 'host', schemas: [], invocations: descriptors, model: { services: [], events: [], objects: [] } }

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteMap {
    'skillManager/snapshot': () => Promise<RemoteResult<SkillSnapshot>>
    'skillManager/discover': () => Promise<RemoteResult<readonly SkillImportCandidate[]>>
    'skillManager/save': (input: SaveSkillInput) => Promise<RemoteResult<SkillView>>
    'skillManager/import': (ids: readonly string[]) => Promise<RemoteResult<SkillImportReceipt>>
  }
  interface TypertRemoteNamespaceMap {
    skillManager: {
      snapshot: () => Promise<RemoteResult<SkillSnapshot>>
      discover: () => Promise<RemoteResult<readonly SkillImportCandidate[]>>
      save: (input: SaveSkillInput) => Promise<RemoteResult<SkillView>>
      import: (ids: readonly string[]) => Promise<RemoteResult<SkillImportReceipt>>
    }
  }
}

export default TYPERT_REMOTE
