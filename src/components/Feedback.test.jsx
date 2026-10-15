import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusPill, EmptyState, Notice, RatingStars } from './Feedback'

describe('StatusPill', () => {
  it('renders nothing for a missing status', () => {
    const { container } = render(<StatusPill status={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('renders the status text with underscores replaced by spaces', () => {
    render(<StatusPill status="DEPARTMENT_HEAD" />)
    expect(screen.getByText('DEPARTMENT HEAD')).toBeInTheDocument()
  })
  it('applies the good tone for COMPLETED', () => {
    render(<StatusPill status="COMPLETED" />)
    expect(screen.getByText('COMPLETED')).toHaveClass('pill--good')
  })
})

describe('EmptyState', () => {
  it('renders a title and optional hint', () => {
    render(<EmptyState title="No courses found" hint="Try a different search" />)
    expect(screen.getByText('No courses found')).toBeInTheDocument()
    expect(screen.getByText('Try a different search')).toBeInTheDocument()
  })
})

describe('Notice', () => {
  it('renders nothing when there is no message', () => {
    const { container } = render(<Notice tone="error">{''}</Notice>)
    expect(container).toBeEmptyDOMElement()
  })
  it('renders the message when provided', () => {
    render(<Notice tone="error">Something went wrong</Notice>)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})

describe('RatingStars', () => {
  it('shows "New" when there is no rating yet', () => {
    render(<RatingStars rating={null} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })
  it('formats a numeric rating to one decimal place', () => {
    render(<RatingStars rating={4.6} />)
    expect(screen.getByText('4.6')).toBeInTheDocument()
  })
})
