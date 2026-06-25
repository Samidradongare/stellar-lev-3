import React from 'react';
import { render, screen } from '@testing-library/react'
import Dashboard from '@/app/dashboard/page'

const mockUseWallet = jest.fn()

jest.mock('@/context/WalletContext', () => ({
  useWallet: () => mockUseWallet(),
}))

describe('Dashboard Page', () => {
  it('shows disconnected message when no account is connected', () => {
    mockUseWallet.mockReturnValue({
      account: null,
      provider: null,
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
    })

    render(<Dashboard />)
    expect(screen.getByText(/Wallet Disconnected/i)).toBeInTheDocument()
    expect(screen.getByText(/Connect Freighter/i)).toBeInTheDocument()
  })


})
