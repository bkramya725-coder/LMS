import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Field from './Field'

describe('Field', () => {
  it('renders a label and forwards typed input', async () => {
    const handleChange = vi.fn()
    render(<Field label="Email" name="email" value="" onChange={handleChange} />)
    expect(screen.getByText('Email')).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox'), 'a')
    expect(handleChange).toHaveBeenCalled()
  })
  it('shows a validation error and marks the control as errored', () => {
    render(<Field label="Email" name="email" value="" onChange={() => {}} error="Enter a valid email address" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address')
  })
  it('renders a select when as="select" is passed', () => {
    render(<Field label="Role" name="role" as="select" value="STUDENT" onChange={() => {}}><option value="STUDENT">Student</option></Field>)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
  it('shows the required marker only when required is true', () => {
    const { rerender } = render(<Field label="Title" name="title" value="" onChange={() => {}} required />)
    expect(screen.getByText('*')).toBeInTheDocument()
    rerender(<Field label="Title" name="title" value="" onChange={() => {}} />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })
})
