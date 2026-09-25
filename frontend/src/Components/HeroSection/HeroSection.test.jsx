import { act, render, screen } from '@testing-library/react';
import HeroSection from './HeroSection';

describe('HeroSection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders the hero content from the external stylesheet', () => {
    render(<HeroSection />);

    act(() => jest.advanceTimersByTime(100));

    expect(
      screen.getByRole('heading', { name: /discover your next adventure/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });
});
