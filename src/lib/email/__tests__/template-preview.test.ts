import { describe, it, expect } from 'vitest'
import {
  applyTemplateVariables,
  buildSampleContext,
  parseTemplateVariables,
} from '../template-preview'

describe('template-preview', () => {
  it('parses variables from template text', () => {
    expect(parseTemplateVariables('Hi {{customer_name}}, order {{order_number}}')).toEqual([
      'customer_name',
      'order_number',
    ])
  })

  it('substitutes known and custom variables', () => {
    const ctx = buildSampleContext(['customer_name'], 'Hello {{customer_name}}', '{{custom_field}}')
    expect(applyTemplateVariables('Hello {{customer_name}} — {{custom_field}}', ctx)).toBe(
      'Hello Jane Mukasa — [custom field]'
    )
  })

  it('replaces variables in subject lines', () => {
    const ctx = buildSampleContext([], 'Order {{order_number}} confirmed')
    expect(applyTemplateVariables('Order {{order_number}} confirmed', ctx)).toContain('KDC-')
  })
})
