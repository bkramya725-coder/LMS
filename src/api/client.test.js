import { describe, it, expect } from 'vitest'
import { normalizeError } from './client'

describe('normalizeError', () => {
  it('prefers the backend GlobalExceptionHandler message field', () => {
    const err = { response: { data: { message: 'Course title is required and must be 5-200 characters' }, status: 400 } }
    expect(normalizeError(err).message).toBe('Course title is required and must be 5-200 characters')
  })
  it('falls back to the error field when message is absent', () => {
    expect(normalizeError({ response: { data: { error: 'Bad Request' }, status: 400 } }).message).toBe('Bad Request')
  })
  it('falls back to the generic axios message when there is no response body', () => {
    expect(normalizeError({ message: 'Network Error' }).message).toBe('Network Error')
  })
  it('falls back to a generic message when nothing else is available', () => {
    expect(normalizeError({}).message).toBe('Something went wrong')
  })
  it('handles backend response with structured errors map and message', () => {
    const err = { response: { data: { status: 400, message: 'Full name is required', errors: { fullName: 'Full name is required' } }, status: 400 } }
    const normalized = normalizeError(err)
    expect(normalized.message).toBe('Full name is required')
    expect(normalized.fieldErrors).toEqual({ fullName: 'Full name is required' })
    expect(normalized.status).toBe(400)
  })
  it('handles backend response with array of errors', () => {
    const err = { response: { data: { errors: [{ defaultMessage: 'Invalid phone number' }] }, status: 400 } }
    expect(normalizeError(err).message).toBe('Invalid phone number')
  })
  it('always returns a real Error instance', () => {
    expect(normalizeError({})).toBeInstanceOf(Error)
  })
})
