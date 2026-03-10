import { describe, expect, it } from 'vitest'

import { ApiRequestError } from '@/lib/api'
import { getErrorDetails, getErrorMessage, pluralize } from '@/lib/format'

describe('format helpers', () => {
  it('reads api request error messages and details', () => {
    const error = new ApiRequestError(422, 'validation_error', 'CSV validation failed', [
      { row: 4, field: 'quantity', issue: 'Must be greater than zero' },
    ])

    expect(getErrorMessage(error)).toBe('CSV validation failed')
    expect(getErrorDetails(error)).toEqual([
      'Row 4: quantity - Must be greater than zero',
    ])
  })

  it('pluralizes labels correctly', () => {
    expect(pluralize(1, 'portfolio')).toBe('portfolio')
    expect(pluralize(2, 'portfolio')).toBe('portfolios')
  })
})
