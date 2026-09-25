import { render, screen } from '@testing-library/react';
import ReviewCard from './ReviewCard';

const baseReview = {
  _id: 'r1',
  userName: 'Grace',
  date: '2024-05-01T12:00:00.000Z',
  rating: 4,
  comment: 'Lovely trip',
  photos: ['https://cdn.example/one.png', 'uploads/two.png'],
};

describe('ReviewCard', () => {
  test('renders the reviewer, the comment and the tour name', () => {
    render(<ReviewCard review={baseReview} tourName="Beach escape" />);

    expect(screen.getByText('Grace')).toBeInTheDocument();
    expect(screen.getByText('Lovely trip')).toBeInTheDocument();
    expect(screen.getByText(/Beach escape/)).toBeInTheDocument();
    expect(screen.getAllByAltText('Review')).toHaveLength(2);
  });

  test('falls back to Unknown Tour and hides an empty comment', () => {
    render(<ReviewCard review={{ ...baseReview, comment: '', photos: [] }} />);

    expect(screen.getByText(/Unknown Tour/)).toBeInTheDocument();
    expect(screen.queryByText('Lovely trip')).not.toBeInTheDocument();
  });
});
