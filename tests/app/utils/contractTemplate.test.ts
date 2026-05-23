import { describe, it, expect } from 'vitest'
import { interpolateTemplate, formatArrayAsList, formatArrayAsText } from '../../../src/utils/contractTemplate'

describe('interpolateTemplate', () => {
  it('substitui variável simples', () => {
    expect(interpolateTemplate('Olá {{name}}', { name: 'Ana' })).toBe('Olá Ana')
  })
})
