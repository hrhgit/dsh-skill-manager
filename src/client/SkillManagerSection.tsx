import { ChevronDown, FilePenLine, FolderInput, Plus, RefreshCw, Save, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SaveSkillInput, SkillImportCandidate, SkillImportReceipt, SkillSnapshot, SkillSource, SkillView } from '../types.js'
import type { LocaleKey } from './locales.js'
import css from './SkillManagerSection.module.css'

export interface SkillManagerApi {
  readonly snapshot: () => Promise<SkillSnapshot>
  readonly discover: () => Promise<readonly SkillImportCandidate[]>
  readonly save: (input: SaveSkillInput) => Promise<SkillView>
  readonly importSkills: (ids: readonly string[]) => Promise<SkillImportReceipt>
}
export type SkillManagerSectionProps = SkillManagerApi & { readonly t: (key: LocaleKey) => string }
type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; snapshot: SkillSnapshot }
interface Draft { id?: string; slug: string; name: string; description: string; content: string }
interface ImportDialogState { candidates: readonly SkillImportCandidate[]; selected: ReadonlySet<string>; expanded: ReadonlySet<string>; busy: boolean }

export function SkillManagerSection(api: SkillManagerSectionProps): ReactNode {
  const { t } = api
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [discovering, setDiscovering] = useState(false)
  const [dialog, setDialog] = useState<ImportDialogState | null>(null)

  const load = (pending = true): void => {
    if (pending) setState({ status: 'loading' })
    void api.snapshot().then(snapshot => setState({ status: 'ready', snapshot }), error => setState({ status: 'error', message: messageOf(error) }))
  }
  useEffect(() => { let active = true; void api.snapshot().then(snapshot => { if (active) setState({ status: 'ready', snapshot }) }, error => { if (active) setState({ status: 'error', message: messageOf(error) }) }); return () => { active = false } }, [api.snapshot])

  const openImport = (): void => {
    if (discovering) return
    setFeedback(null)
    setDiscovering(true)
    void api.discover().then(candidates => setDialog(createImportDialogState(candidates)), error => setFeedback(messageOf(error))).finally(() => setDiscovering(false))
  }
  const saveDraft = (): void => {
    if (draft === null || saving) return
    if ([draft.name, draft.description, draft.content].some(value => value.trim() === '')) { setFeedback(t('required')); return }
    setSaving(true); setFeedback(null)
    void api.save(draft).then(saved => {
      setState(current => current.status !== 'ready' ? current : { status: 'ready', snapshot: { ...current.snapshot, skills: [...current.snapshot.skills.filter(skill => skill.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)) } })
      setDraft(null); setFeedback(t('saved'))
    }, error => setFeedback(messageOf(error))).finally(() => setSaving(false))
  }

  if (state.status === 'loading') return <p className={css.message}>{t('loading')}</p>
  if (state.status === 'error') return <div className={css.error} role="alert"><span>{t('loadFailed')}<small>{state.message}</small></span><button type="button" onClick={() => load()}>{t('retry')}</button></div>

  return <section className={css.root} aria-label={t('title')}>
    <header className={css.header}>
      <div className={css.actions}>
        <button type="button" className={css.primaryButton} disabled={discovering} onClick={openImport}>{discovering ? <RefreshCw size={16} className={css.spin} /> : <FolderInput size={16} />}{discovering ? t('loading') : t('import')}</button>
        <button type="button" className={css.secondaryButton} onClick={() => setDraft({ slug: '', name: '', description: '', content: '' })}><Plus size={16} />{t('add')}</button>
        <button type="button" className={css.iconButton} title={t('refresh')} aria-label={t('refresh')} onClick={() => load(false)}><RefreshCw size={16} /></button>
      </div>
      <div><h2>{t('title')}</h2><p>{t('subtitle')}</p></div>
    </header>
    {feedback === null ? null : <p className={css.feedback} role="status">{feedback}</p>}
    {draft === null
      ? <SkillList skills={state.snapshot.skills} t={t} onEdit={skill => setDraft({ id: skill.id, slug: skill.slug, name: skill.name, description: skill.description, content: skill.content })} />
      : <SkillEditor draft={draft} saving={saving} t={t} onChange={setDraft} onCancel={() => setDraft(null)} onSave={saveDraft} />}
    {dialog === null ? null : <ImportDialog state={dialog} t={t} onChange={setDialog} onClose={() => { if (!dialog.busy) setDialog(null) }} onImport={() => {
      if (dialog.busy || dialog.selected.size === 0) return
      setDialog({ ...dialog, busy: true })
      void api.importSkills([...dialog.selected]).then(receipt => {
        setDialog(null); setFeedback(`${t('imported').replace('{count}', String(receipt.imported.length))}${receipt.skipped.length > 0 ? ` ${t('skipped').replace('{count}', String(receipt.skipped.length))}` : ''}`); load(false)
      }, error => { setDialog(current => current === null ? null : { ...current, busy: false }); setFeedback(messageOf(error)) })
    }} />}
  </section>
}

function SkillList({ skills, t, onEdit }: { skills: readonly SkillView[]; t: SkillManagerSectionProps['t']; onEdit: (skill: SkillView) => void }): ReactNode {
  if (skills.length === 0) return <p className={css.empty}>{t('empty')}</p>
  return <ul className={css.list}>{skills.map(skill => <li key={skill.id}><button type="button" className={css.skillRow} onClick={() => onEdit(skill)}><span className={css.skillIcon}><FilePenLine size={17} /></span><span className={css.skillText}><strong>{skill.name}</strong><span>{skill.description}</span><code>{skill.slug}</code></span><span className={css.source}>{sourceLabel(skill.source, t)}</span><span className={css.editLabel}>{t('edit')}</span></button></li>)}</ul>
}

function SkillEditor({ draft, saving, t, onChange, onCancel, onSave }: { draft: Draft; saving: boolean; t: SkillManagerSectionProps['t']; onChange: (draft: Draft) => void; onCancel: () => void; onSave: () => void }): ReactNode {
  const update = (key: keyof Draft, value: string): void => onChange({ ...draft, [key]: value })
  return <form className={css.editor} onSubmit={event => { event.preventDefault(); onSave() }}>
    <div className={css.editorHead}><button type="button" className={css.iconButton} aria-label={t('cancel')} onClick={onCancel}><X size={17} /></button><h3>{draft.id === undefined ? t('add') : t('edit')}</h3><button type="submit" className={css.primaryButton} disabled={saving}><Save size={16} />{saving ? t('saving') : t('save')}</button></div>
    <div className={css.fieldGrid}><label>{t('name')}<input autoFocus value={draft.name} onChange={event => update('name', event.currentTarget.value)} /></label><label>{t('slug')}<input value={draft.slug} disabled={draft.id !== undefined} onChange={event => update('slug', slugify(event.currentTarget.value))} /></label></div>
    <label>{t('description')}<input value={draft.description} onChange={event => update('description', event.currentTarget.value)} /></label>
    <label>{t('instructions')}<textarea value={draft.content} onChange={event => update('content', event.currentTarget.value)} /></label>
  </form>
}

function ImportDialog({ state, t, onChange, onClose, onImport }: { state: ImportDialogState; t: SkillManagerSectionProps['t']; onChange: (state: ImportDialogState) => void; onClose: () => void; onImport: () => void }): ReactNode {
  const groups = useMemo(() => groupCandidates(state.candidates), [state.candidates])
  const allSelected = state.candidates.length > 0 && state.selected.size === state.candidates.length
  const toggleIds = (ids: readonly string[]): void => { const next = new Set(state.selected); const selected = ids.every(id => next.has(id)); for (const id of ids) selected ? next.delete(id) : next.add(id); onChange({ ...state, selected: next }) }
  return <div className={css.backdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className={css.dialog} role="dialog" aria-modal="true" aria-labelledby="skill-import-title">
    <header className={css.dialogHead}><div><h3 id="skill-import-title">{t('importTitle')}</h3><p>{t('importSubtitle')}</p></div><button type="button" className={css.iconButton} aria-label={t('close')} disabled={state.busy} onClick={onClose}><X size={17} /></button></header>
    <div className={css.selectionBar}><span>{t('found').replace('{count}', String(state.candidates.length))} · {t('selected').replace('{count}', String(state.selected.size))}</span><label><input type="checkbox" checked={allSelected} disabled={state.busy || state.candidates.length === 0} onChange={() => toggleIds(state.candidates.map(item => item.id))} />{allSelected ? t('deselectAll') : t('selectAll')}</label></div>
    <div className={css.groupList}>{groups.length === 0 ? <p className={css.empty}>{t('noCandidates')}</p> : groups.map(group => {
      const ids = group.items.map(item => item.id); const selected = ids.every(id => state.selected.has(id)); const expanded = state.expanded.has(group.root)
      return <section className={css.group} key={group.root}><header><input type="checkbox" checked={selected} disabled={state.busy} aria-label={`${selected ? t('deselectDirectory') : t('selectDirectory')}: ${group.root}`} onChange={() => toggleIds(ids)} /><button type="button" onClick={() => { const next = new Set(state.expanded); expanded ? next.delete(group.root) : next.add(group.root); onChange({ ...state, expanded: next }) }}><span><small>{group.items.length}</small><code title={group.root}>{group.root}</code></span><ChevronDown size={16} className={expanded ? '' : css.collapsed} /></button></header>{expanded ? <ul>{group.items.map(item => <li key={item.id}><label><input type="checkbox" checked={state.selected.has(item.id)} disabled={state.busy} onChange={() => toggleIds([item.id])} /><span><strong>{item.name}</strong><small>{item.description}</small></span></label></li>)}</ul> : null}</section>
    })}</div>
    <footer className={css.dialogFoot}><button type="button" className={css.secondaryButton} disabled={state.busy} onClick={onClose}>{t('cancel')}</button><button type="button" className={css.primaryButton} disabled={state.busy || state.selected.size === 0} onClick={onImport}>{state.busy ? t('importing') : t('importSelected').replace('{count}', String(state.selected.size))}</button></footer>
  </section></div>
}

export function createImportDialogState(candidates: readonly SkillImportCandidate[]): ImportDialogState { return { candidates, selected: new Set(), expanded: new Set(candidates.map(item => item.sourceRoot)), busy: false } }
export function groupCandidates(candidates: readonly SkillImportCandidate[]): { root: string; items: SkillImportCandidate[] }[] { const groups = new Map<string, SkillImportCandidate[]>(); for (const item of candidates) groups.set(item.sourceRoot, [...(groups.get(item.sourceRoot) ?? []), item]); return [...groups].map(([root, items]) => ({ root, items: items.sort((a, b) => a.slug.localeCompare(b.slug)) })).sort((a, b) => a.root.localeCompare(b.root)) }
function sourceLabel(source: SkillSource, t: SkillManagerSectionProps['t']): string { return source === 'global' ? t('sourceGlobal') : source === 'agents' ? t('sourceAgents') : source === 'project' ? t('sourceProject') : t('sourceCustom') }
function slugify(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) }
function messageOf(error: unknown): string { return error instanceof Error ? error.message : String(error) }
