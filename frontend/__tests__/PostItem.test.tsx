import React from 'react';
import { render, screen } from '@testing-library/react';
import PostItem from '@/app/post/page';

const mockUseWallet = jest.fn();

jest.mock('@/context/WalletContext', () => ({
  useWallet: () => mockUseWallet(),
}));

jest.mock('@/context/EventContext', () => ({
  useEvents: () => ({}),
}));

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

describe('PostItem Page', () => {
  beforeEach(() => {
    mockUseWallet.mockReturnValue({
      account: '0x123',
      provider: {},
      connectWallet: jest.fn(),
      disconnectWallet: jest.fn(),
    });
  });

  it('renders the form inputs for posting an item', () => {
    render(<PostItem />);

    expect(
      screen.getByText(/Item Description/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Hyperlocal Pune Location/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Escrow Reward Amount/i)
    ).toBeInTheDocument();
  });
});
