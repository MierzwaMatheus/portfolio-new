import { describe, it, expect } from 'vitest'
import { interpolateTemplate, formatArrayAsList, formatArrayAsText } from '../../../src/utils/contractTemplate'

describe('interpolateTemplate', () => {
  it('substitui variável simples', () => {
    expect(interpolateTemplate('Olá {{name}}', { name: 'Ana' })).toBe('Olá Ana')
  })

  it('substitui múltiplas ocorrências da mesma variável', () => {
    expect(interpolateTemplate('{{x}} e {{x}}', { x: 'A' })).toBe('A e A')
  })
})
