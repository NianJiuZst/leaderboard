import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GraphSkeleton } from '@/components/graph-skeleton'

describe('GraphSkeleton', () => {
  it('should render loading skeleton', () => {
    render(<GraphSkeleton />)
    expect(screen.getByTestId('graph-skeleton')).toBeInTheDocument()
  })
})
