import { describe, it, expect } from 'vitest'
import { validateRegister, validateLogin, validateCourse, validateAssessment, validateQuestion, validateGrade } from './validators'

describe('validateRegister', () => {
  it('accepts a fully valid registration', () => {
    expect(validateRegister({ fullName: 'Ramya B', email: 'ramya@example.com', phoneNumber: '9876543210', password: 'supersecure', role: 'STUDENT' })).toEqual({})
  })
  it('rejects a name with digits', () => {
    expect(validateRegister({ fullName: 'Ramya2', email: 'a@b.com', password: 'supersecure', role: 'STUDENT' }).fullName).toBeDefined()
  })
  it('rejects a malformed email', () => {
    expect(validateRegister({ fullName: 'Ramya B', email: 'not-an-email', password: 'supersecure', role: 'STUDENT' }).email).toBeDefined()
  })
  it('rejects a phone number that is not exactly 10 digits', () => {
    expect(validateRegister({ fullName: 'Ramya B', email: 'a@b.com', phoneNumber: '12345', password: 'supersecure', role: 'STUDENT' }).phoneNumber).toBeDefined()
  })
  it('treats phone number as optional when omitted', () => {
    expect(validateRegister({ fullName: 'Ramya B', email: 'a@b.com', password: 'supersecure', role: 'STUDENT' }).phoneNumber).toBeUndefined()
  })
  it('rejects a password shorter than 8 characters', () => {
    expect(validateRegister({ fullName: 'Ramya B', email: 'a@b.com', password: 'short', role: 'STUDENT' }).password).toBeDefined()
  })
  it('requires a role', () => {
    expect(validateRegister({ fullName: 'Ramya B', email: 'a@b.com', password: 'supersecure', role: '' }).role).toBeDefined()
  })
})

describe('validateLogin', () => {
  it('requires both fields', () => {
    const errors = validateLogin({ email: '', password: '' })
    expect(errors.email).toBeDefined()
    expect(errors.password).toBeDefined()
  })
  it('passes with valid credentials shape', () => {
    expect(validateLogin({ email: 'a@b.com', password: 'anything' })).toEqual({})
  })
})

describe('validateCourse', () => {
  it('enforces the 5-200 character title length', () => {
    expect(validateCourse({ title: 'Hi', price: '' }).title).toBeDefined()
    expect(validateCourse({ title: 'A perfectly good title', price: '' })).toEqual({})
  })
  it('rejects a negative price', () => {
    expect(validateCourse({ title: 'A perfectly good title', price: '-5' }).price).toBeDefined()
  })
})

describe('validateAssessment', () => {
  it('requires title and type', () => {
    const errors = validateAssessment({ title: '', assessmentType: '', timeLimitMinutes: '', maxPoints: '' })
    expect(errors.title).toBeDefined()
    expect(errors.assessmentType).toBeDefined()
  })
  it('rejects a non-positive time limit or max points', () => {
    const errors = validateAssessment({ title: 'Quiz 1', assessmentType: 'QUIZ', timeLimitMinutes: '0', maxPoints: '-1' })
    expect(errors.timeLimitMinutes).toBeDefined()
    expect(errors.maxPoints).toBeDefined()
  })
})

describe('validateQuestion', () => {
  it('requires at least two MCQ options and a correct answer', () => {
    const errors = validateQuestion({ questionText: 'What is 2+2?', questionType: 'MCQ', options: 'Four', correctAnswer: '', points: '1' })
    expect(errors.options).toBeDefined()
    expect(errors.correctAnswer).toBeDefined()
  })
  it('accepts a well-formed MCQ question', () => {
    expect(validateQuestion({ questionText: 'What is 2+2?', questionType: 'MCQ', options: 'Three\nFour\nFive', correctAnswer: 'Four', points: '1' })).toEqual({})
  })
  it('does not require options for a short-answer question', () => {
    expect(validateQuestion({ questionText: 'Explain gravity', questionType: 'SHORT_ANSWER', points: '2' }).options).toBeUndefined()
  })
})

describe('validateGrade', () => {
  it('requires a score', () => { expect(validateGrade({ score: '' }).score).toBeDefined() })
  it('rejects a negative score', () => { expect(validateGrade({ score: '-1' }).score).toBeDefined() })
  it('accepts a valid score', () => { expect(validateGrade({ score: '85' })).toEqual({}) })
})
