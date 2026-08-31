import { describe, expect, it } from 'vitest'

describe('Typert host export', () => {
  it('exposes the skill manager host manifest through the Loader convention', async () => {
    const module = await import('@hrhgit/dsh-skill-manager/typert')

    expect(module.TYPERT).toMatchObject({ package: '@hrhgit/dsh-skill-manager', face: 'host' })
    expect(module.TYPERT.invocations.some(invocation => invocation.namespace === 'skillManager' && invocation.method === 'snapshot')).toBe(true)
  })
})
