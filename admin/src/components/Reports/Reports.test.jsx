import { fireEvent, render, screen, within } from '@testing-library/react';
import Reports from './Reports';

// Card titles are read in render order, so sorting and filtering are asserted
// the way a user sees them rather than by reaching into the DOM.
const cardTitles = () =>
  screen.queryAllByRole('listitem').map((card) => card.getAttribute('aria-label'));

const renderReports = () => render(<Reports />);

const searchBox = () => screen.getByRole('textbox', { name: 'Search reports' });

const sortControl = () => screen.getByRole('combobox');
// The direction toggle is icon-only, so it is addressed by the aria-label that
// states which end of the sort the next click moves to.
const sortToggle = () => screen.getByRole('button', { name: /Sort (newest|oldest) first/ });

const cardFor = (title) => screen.getByRole('listitem', { name: title });

test('renders every sample report on the default all tab, newest first', () => {
  renderReports();

  expect(cardTitles()).toHaveLength(6);
  expect(cardTitles()[0]).toBe("Poor service during Cox's Bazar tour");
});

test('filters the list down to the selected tab', () => {
  renderReports();

  fireEvent.click(screen.getByRole('button', { name: 'User Reports' }));
  expect(cardTitles()).toHaveLength(3);

  fireEvent.click(screen.getByRole('button', { name: 'Company Reports' }));
  expect(cardTitles()).toHaveLength(3);

  fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
  expect(cardTitles()).toHaveLength(2);

  fireEvent.click(screen.getByRole('button', { name: 'All Reports' }));
  expect(cardTitles()).toHaveLength(6);
});

test('searches across title, submitter and submittee', () => {
  renderReports();

  fireEvent.change(searchBox(), { target: { value: 'cox' } });
  expect(cardTitles()).toEqual(["Poor service during Cox's Bazar tour"]);

  fireEvent.change(searchBox(), { target: { value: 'green tours' } });
  expect(cardTitles()).toEqual(['Customer refused to follow safety guidelines']);

  fireEvent.change(searchBox(), { target: { value: 'karim uddin' } });
  expect(cardTitles()).toEqual(['Customer refused to follow safety guidelines']);
});

test('explains an empty result instead of rendering a blank page', () => {
  renderReports();

  fireEvent.change(searchBox(), { target: { value: 'no report mentions this' } });

  expect(screen.getByText('No reports found matching your criteria')).toBeInTheDocument();
  expect(cardTitles()).toHaveLength(0);
});

test('sorts by date ascending and descending', () => {
  renderReports();

  const newestFirst = cardTitles();
  expect(newestFirst[0]).toBe("Poor service during Cox's Bazar tour");
  expect(sortToggle()).toHaveAccessibleName('Sort oldest first');

  fireEvent.click(sortToggle());
  expect(sortToggle()).toHaveAccessibleName('Sort newest first');
  expect(cardTitles()[0]).toBe('Customer misbehavior with staff');

  fireEvent.click(sortToggle());
  expect(cardTitles()).toEqual(newestFirst);
});

test('sorts by priority rank rather than by title', () => {
  renderReports();

  fireEvent.change(sortControl(), { target: { value: 'priority' } });

  expect(cardTitles()[0]).toBe("Poor service during Cox's Bazar tour");
  expect(cardTitles()[cardTitles().length - 1]).toBe('Customer damaged hotel property');
});

test('moves a pending report to in-progress and offers the resolve action next', () => {
  renderReports();

  const card = cardFor("Poor service during Cox's Bazar tour");
  expect(within(card).getByRole('button', { name: /Process Report/ })).toBeInTheDocument();

  fireEvent.click(within(card).getByRole('button', { name: /Process Report/ }));

  const updated = cardFor("Poor service during Cox's Bazar tour");
  expect(within(updated).queryByRole('button', { name: /Process Report/ })).not.toBeInTheDocument();
  expect(within(updated).getByRole('button', { name: /Mark as Resolved/ })).toBeInTheDocument();
});

test('resolving every pending report drains the pending tab', () => {
  renderReports();

  fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
  expect(cardTitles()).toHaveLength(2);

  // A pending report can only be processed first, then resolved.
  for (const title of cardTitles()) {
    fireEvent.click(within(cardFor(title)).getByRole('button', { name: /Process Report/ }));
  }
  for (const title of cardTitles()) {
    fireEvent.click(within(cardFor(title)).getByRole('button', { name: /Mark as Resolved/ }));
  }

  expect(screen.getByText('No reports found matching your criteria')).toBeInTheDocument();
});
