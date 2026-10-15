import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

function setStoredUser(role) {
  localStorage.setItem('lms_token', 'fake-token')
  localStorage.setItem('lms_user', JSON.stringify({ userId: 1, fullName: 'Test User', email: 't@example.com', role }))
}

function PermissionProbe({ checks }) {
  const { can, user } = useAuth()
  return <ul>{checks.map((c) => <li key={c} data-testid={c}>{user.role}:{c}:{String(can(c))}</li>)}</ul>
}

function renderWithRole(role, checks) {
  setStoredUser(role)
  render(<AuthProvider><PermissionProbe checks={checks} /></AuthProvider>)
}

function LoggedOutProbe() {
  const { can } = useAuth()
  return <div data-testid="result">{String(can('manageCourses'))}</div>
}

describe('AuthContext permission matrix', () => {
  beforeEach(() => { localStorage.clear() })

  it('only STUDENT can enroll and submit (backend requires a StudentProfile)', () => {
    renderWithRole('STUDENT', ['enroll', 'submit'])
    expect(screen.getByTestId('enroll')).toHaveTextContent('true')
    expect(screen.getByTestId('submit')).toHaveTextContent('true')
  })
  it('PARENT cannot enroll even though they can browse', () => {
    renderWithRole('PARENT', ['enroll', 'browse'])
    expect(screen.getByTestId('enroll')).toHaveTextContent('false')
    expect(screen.getByTestId('browse')).toHaveTextContent('true')
  })
  it('only INSTRUCTOR can create a course (backend requires an InstructorProfile)', () => {
    renderWithRole('INSTRUCTOR', ['createCourse', 'manageCourses'])
    expect(screen.getByTestId('createCourse')).toHaveTextContent('true')
    expect(screen.getByTestId('manageCourses')).toHaveTextContent('true')
  })
  it('ADMIN can manage courses but not create one', () => {
    renderWithRole('ADMIN', ['createCourse', 'manageCourses', 'adminPanel'])
    expect(screen.getByTestId('createCourse')).toHaveTextContent('false')
    expect(screen.getByTestId('manageCourses')).toHaveTextContent('true')
    expect(screen.getByTestId('adminPanel')).toHaveTextContent('true')
  })
  it('TUTOR has grading access only', () => {
    renderWithRole('TUTOR', ['grading', 'manageCourses', 'enroll'])
    expect(screen.getByTestId('grading')).toHaveTextContent('true')
    expect(screen.getByTestId('manageCourses')).toHaveTextContent('false')
    expect(screen.getByTestId('enroll')).toHaveTextContent('false')
  })
  it('returns false for every permission when logged out', () => {
    localStorage.clear()
    render(<AuthProvider><LoggedOutProbe /></AuthProvider>)
    expect(screen.getByTestId('result')).toHaveTextContent('false')
  })
})
