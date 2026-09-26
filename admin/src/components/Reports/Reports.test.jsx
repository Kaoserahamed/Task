import { fireEvent, render, screen, within } from '@testing-library/react';
import Reports from './Reports';

const reportCards = () =>
  Array.from(document.querySelectorAll('.report-card')).map(
    (card) => card.querySelector('h3').textContent
  );

const sortControl = () => screen.getByRole('combobox');
// The direction toggle is an icon-only button, so it is addressed by its stable
// class rather than an accessible name it does not have.
const sortToggle = () => document.querySelector('.sort-options button');

const cardFor = (title) => screen.getByText(title).closest('.report-card');

beforeEach(() => {
  render(<Reports />);
});

test('renders every sample report on the default all tab, newest first', () => {
  expect(reportCards()).toHaveLength(6);
  expect(reportCards()[0]).toBe("Poor service during Cox's Bazar tour");
});

test('filters the list down to the selected tab', () => {
  fireEvent.click(screen.getByRole('button', { name: 'User Reports' }));
  expect(reportCards()).toHaveLength(3);

  fireEvent.click(screen.getByRole('button', { name: 'Company Reports' }));
  expect(reportCards()).toHaveLength(3);

  fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
  expect(reportCards()).toHaveLength(2);

  fireEvent.click(screen.getByRole('button', { name: 'All Reports' }));
  expect(reportCards()).toHaveLength(6);
});

test('searches across title, submitter and submittee', () => {
  const search = screen.getByPlaceholderText(/Search by title/);

  fireEvent.change(search, { target: { value: 'cox' } });
  expect(reportCards()).toEqual(["Poor service during Cox's Bazar tour"]);

  fireEvent.change(search, { target: { value: 'green tours' } });
  expect(reportCards()).toEqual(['Customer refused to follow safety guidelines']);

  fireEvent.change(search, { target: { value: 'karim uddin' } });
  expect(reportCards()).toEqual(['Customer refused to follow safety guidelines']);
});

test('explains an empty result instead of rendering a blank page', () => {
  fireEvent.change(screen.getByPlaceholderText(/Search by title/), {
    target: { value: 'no report mentions this' },
  });

  expect(screen.getByText('No reports found matching your criteria')).toBeInTheDocument();
  expect(reportCards()).toHaveLength(0);
});

test('sorts by date ascending and descending', () => {
  const newestFirst = reportCards();
  expect(newestFirst[0]).toBe("Poor service during Cox's Bazar tour");

  fireEvent.click(sortToggle());
  expect(sortToggle().querySelector('i')).toHaveClass('fa-sort-up');
  expect(reportCards()[0]).toBe('Customer misbehavior with staff');

  fireEvent.click(sortToggle());
  expect(reportCards()).toEqual(newestFirst);
});

test('sorts by priority rank rather than by title', () => {
  fireEvent.change(sortControl(), { target: { value: 'priority' } });

  expect(reportCards()[0]).toBe("Poor service during Cox's Bazar tour");
  expect(reportCards()[reportCards().length - 1]).toBe('Customer damaged hotel property');
});

test('moves a pending report to in-progress and offers the resolve action next', () => {
  const card = cardFor("Poor service during Cox's Bazar tour");
  expect(within(card).getByRole('button', { name: /Process Report/ })).toBeInTheDocument();

  fireEvent.click(within(card).getByRole('button', { name: /Process Report/ }));

  const updated = cardFor("Poor service during Cox's Bazar tour");
  expect(within(updated).queryByRole('button', { name: /Process Report/ })).not.toBeInTheDocument();
  expect(within(updated).getByRole('button', { name: /Mark as Resolved/ })).toBeInTheDocument();
});

test('resolving every pending report drains the pending tab', () => {
  fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
  expect(reportCards()).toHaveLength(2);

  // A pending report can only be processed first, then resolved.
  for (const title of reportCards()) {
    fireEvent.click(within(cardFor(title)).getByRole('button', { name: /Process Report/ }));
  }
  for (const title of reportCards()) {
    fireEvent.click(within(cardFor(title)).getByRole('button', { name: /Mark as Resolved/ }));
  }

  expect(screen.getByText('No reports found matching your criteria')).toBeInTheDocument();
});
