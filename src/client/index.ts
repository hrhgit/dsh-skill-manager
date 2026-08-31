import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import remoteContribution from '@hrhgit/dsh-skill-manager/remote'
import type { SaveSkillInput, SkillImportCandidate, SkillImportReceipt, SkillSnapshot, SkillView } from '../types.js'
import { en, zh, type LocaleKey } from './locales.js'
import { SkillManagerSection, type SkillManagerApi } from './SkillManagerSection.js'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { 'settings.skills': LocaleKey }
}

export const inject = ['slots', 'locale', 'remote']

export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(remoteContribution)
  const disposeLocale = ctx.locale.register('settings.skills', { zh, en })
  const feature = ctx.inject(['remote.skillManager'], (scope: ClientContext) => {
    const api: SkillManagerApi = {
      snapshot: async (): Promise<SkillSnapshot> => unwrap(await scope.remote.skillManager.snapshot()),
      discover: async (): Promise<readonly SkillImportCandidate[]> => unwrap(await scope.remote.skillManager.discover()),
      save: async (input: SaveSkillInput): Promise<SkillView> => unwrap(await scope.remote.skillManager.save(input)),
      importSkills: async (ids: readonly string[]): Promise<SkillImportReceipt> => unwrap(await scope.remote.skillManager.import(ids)),
    }
    scope.slots.inject('settings.section', () => scope.slots.register({ name: 'settings.section', id: 'skills', order: 25, label: () => scope.locale.bind('settings.skills')('nav'), locale: 'settings.skills', inject: () => ({ ...api, t: scope.locale.bind('settings.skills') }) }, SkillManagerSection))
  })
  return async () => { await feature.dispose(); disposeLocale(); await disposeRemote() }
}

function unwrap<T>(result: { ok: true; value: T } | { ok: false; error: { code: string; message: string } }): T { if (result.ok) return result.value; throw new Error(`${result.error.code}: ${result.error.message}`) }
export { SkillManagerSection } from './SkillManagerSection.js'
