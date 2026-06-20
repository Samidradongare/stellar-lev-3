import React from 'react';
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

jest.mock('@/context/WalletContext', () => ({
  useWallet: () => ({
    account: null,
    provider: null,
    isCorrectNetwork: false,
    connectWallet: jest.fn(),
  }),
}))

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />)
    expect(screen.getByText(/Find What's/i)).toBeInTheDocument()
    expect(screen.getByText(/Reward What's/i)).toBeInTheDocument()
  })

  it('renders the call to action buttons', () => {
    render(<Home />)
    expect(screen.getAllByText(/Browse Lost Items/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Report Lost Item/i)[0]).toBeInTheDocument()
  })
})
