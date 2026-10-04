import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import * as reportsApi from '../../api/reports';
import Reports from './Reports';

jest.mock('../../api/reports');

// The server owns the queue, so every test states what the API returns rather
// than relying on component seed data. `id` mirrors the API's flat public shape.
const report = (overrides = {}) => ({
  id: 'r1',
  type: 'user',
  title: "Poor service during Cox's Bazar tour",
  submittedBy: 'Rahul Ahmed',
  submittedAgainst: 'Travel Buddy Ltd',
  date: '2023-05-15T00:00:00.000Z',
  status: 'pending',
  priority: 'high',
  description: 'The tour guide was not knowledgeable.',
  ...overrides,
});

const QUEUE = [
  report(),
  report({
    id: 'r2',
    type: 'company',
    title: 'Customer refused to follow safety guidelines',
    submittedBy: 'Green Tours',
    submittedAgainst: 'Karim Uddin',
    date: '2023-05-12T00:00:00.000Z',
    status: 'resolved',
    priority: 'medium',
  }),
  report({
    id: 'r3',
    type: 'user',
    title: 'Misleading tour package information',
    submittedBy: 'Sabina Akter',
    submittedAgainst: 'Explore Bangladesh',
    date: '2023-05-10T00:00:00.000Z',
    status: 'in-progress',
    priority: 'high',
  }),
  report({
    id: 'r4',
    type: 'company',
    title: 'Customer damaged hotel property',
    submittedBy: 'Adventure Tours',
    submittedAgainst: 'Momin Khan',
    date: '2023-05-08T00:00:00.000Z',
    status: 'pending',
    priority: 'low',
  }),
];

// Card titles are read in render order, so sorting and filtering are asserted
// the way a user sees them rather than by reaching into the DOM.
const cardTitles = () =>
  screen.queryAllByRole('listitem').map((card) => card.getAttribute('aria-label'));

// Waits for the request *and* the state update it triggers: asserting on the
// mock alone leaves the component still rendering its loading state.
const renderReports = async () => {
  const result = render(<Reports />);
  await waitFor(() => expect(reportsApi.fetchReports).toHaveBeenCalled());
  await waitFor(() => expect(screen.queryByText('Loading reports')).not.toBeInTheDocument());
  return result;
};

const searchBox = () => screen.getByRole('textbox', { name: 'Search reports' });

const sortControl = () => screen.getByRole('combobox');
// The direction toggle is icon-only, so it is addressed by the aria-label that
// states which end of the sort the next click moves to.
const sortToggle = () => screen.getByRole('button', { name: /Sort (newest|oldest) first/ });

const cardFor = (title) => screen.getByRole('listitem', { name: title });

beforeEach(() => {
  reportsApi.fetchReports.mockResolvedValue({ success: true, reports: QUEUE });
  // The endpoint echoes the stored report back, so the mock must too: returning a
  // bare fixture would let the confirmation overwrite every card's real title.
  reportsApi.updateReportStatus.mockImplementation(async (id, { status }) => {
    const stored = QUEUE.find((item) => item.id === id);
    return { success: true, report: { ...stored, status } };
  });
});

test('announces a loading state and renders the queue the API returns', async () => {
  let resolveReports;
  reportsApi.fetchReports.mockReturnValue(
    new Promise((resolve) => {
      resolveReports = resolve;
    })
  );

  render(<Reports />);

  expect(screen.getByRole('status')).toHaveTextContent('Loading reports');
  expect(cardTitles()).toHaveLength(0);

  resolveReports({ success: true, reports: QUEUE });

  await waitFor(() => expect(screen.queryByText('Loading reports')).not.toBeInTheDocument());
  expect(cardTitles()).toHaveLength(4);
  expect(cardTitles()[0]).toBe("Poor service during Cox's Bazar tour");
});

test('explains an empty queue instead of rendering a blank page', async () => {
  reportsApi.fetchReports.mockResolvedValue({ success: true, reports: [] });

  await renderReports();

  expect(screen.getByText('No reports have been filed yet')).toBeInTheDocument();
  expect(cardTitles()).toHaveLength(0);
});

test('reports a failed load with a retry that calls the API again', async () => {
  reportsApi.fetchReports.mockRejectedValue(new Error('Network request failed.'));

  await renderReports();

  expect(await screen.findByRole('alert')).toHaveTextContent('Network request failed.');
  expect(screen.queryByText('No reports have been filed yet')).not.toBeInTheDocument();

  reportsApi.fetchReports.mockResolvedValue({ success: true, reports: QUEUE });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

  await waitFor(() => expect(reportsApi.fetchReports).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(cardTitles()).toHaveLength(4);
});

test('filters the list down to the selected tab', async () => {
  await renderReports();

  fireEvent.click(screen.getByRole('button', { name: 'User Reports' }));
  expect(cardTitles()).toHaveLength(2);

  fireEvent.click(screen.getByRole('button', { name: 'Company Reports' }));
  expect(cardTitles()).toHaveLength(2);

  fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
  expect(cardTitles()).toHaveLength(2);

  fireEvent.click(screen.getByRole('button', { name: 'All Reports' }));
  expect(cardTitles()).toHaveLength(4);
});

test('searches across title, submitter and submittee', async () => {
  await renderReports();

  fireEvent.change(searchBox(), { target: { value: 'cox' } });
  expect(cardTitles()).toEqual(["Poor service during Cox's Bazar tour"]);

  fireEvent.change(searchBox(), { target: { value: 'green tours' } });
  expect(cardTitles()).toEqual(['Customer refused to follow safety guidelines']);

  fireEvent.change(searchBox(), { target: { value: 'karim uddin' } });
  expect(cardTitles()).toEqual(['Customer refused to follow safety guidelines']);
});

test('explains an empty result instead of rendering a blank page', async () => {
  await renderReports();

  fireEvent.change(searchBox(), { target: { value: 'no report mentions this' } });

  expect(screen.getByText('No reports found matching your criteria')).toBeInTheDocument();
  expect(cardTitles()).toHaveLength(0);
});

test('sorts by date ascending and descending', async () => {
  await renderReports();

  const newestFirst = cardTitles();
  expect(newestFirst[0]).toBe("Poor service during Cox's Bazar tour");
  expect(sortToggle()).toHaveAccessibleName('Sort oldest first');

  fireEvent.click(sortToggle());
  expect(sortToggle()).toHaveAccessibleName('Sort newest first');
  expect(cardTitles()[0]).toBe('Customer damaged hotel property');

  fireEvent.click(sortToggle());
  expect(cardTitles()).toEqual(newestFirst);
});

test('sorts by priority rank rather than by title', async () => {
  await renderReports();

  fireEvent.change(sortControl(), { target: { value: 'priority' } });

  expect(cardTitles()[0]).toBe("Poor service during Cox's Bazar tour");
  expect(cardTitles()[cardTitles().length - 1]).toBe('Customer damaged hotel property');
});

test('persists a status change through the API and offers the next action', async () => {
  await renderReports();

  const card = cardFor("Poor service during Cox's Bazar tour");
  expect(within(card).getByRole('button', { name: /Process Report/ })).toBeInTheDocument();

  fireEvent.click(within(card).getByRole('button', { name: /Process Report/ }));

  await waitFor(() =>
    expect(reportsApi.updateReportStatus).toHaveBeenCalledWith('r1', { status: 'in-progress' })
  );

  const updated = cardFor("Poor service during Cox's Bazar tour");
  expect(within(updated).queryByRole('button', { name: /Process Report/ })).not.toBeInTheDocument();
  expect(within(updated).getByRole('button', { name: /Mark as Resolved/ })).toBeInTheDocument();
});

test('restores the previous status and explains a rejected change', async () => {
  reportsApi.updateReportStatus.mockRejectedValue(new Error('Report not found'));
  await renderReports();

  const card = cardFor("Poor service during Cox's Bazar tour");
  fireEvent.click(within(card).getByRole('button', { name: /Process Report/ }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Report not found');
  // The optimistic update is rolled back, so the action is offered again.
  expect(
    within(cardFor("Poor service during Cox's Bazar tour")).getByRole('button', {
      name: /Process Report/,
    })
  ).toBeInTheDocument();
});

test('resolving every pending report drains the pending tab', async () => {
  await renderReports();

  // Stay on "All Reports" while triaging: a processed report leaves the
  // "Pending" tab, so filtering first would hide the very card being resolved
  // and the second half of the flow would silently do nothing.
  const pending = cardTitles().filter(
    (title) =>
      title === "Poor service during Cox's Bazar tour" ||
      title === 'Customer damaged hotel property'
  );
  expect(pending).toHaveLength(2);

  for (const title of pending) {
    fireEvent.click(within(cardFor(title)).getByRole('button', { name: /Process Report/ }));
    await waitFor(() =>
      expect(
        within(cardFor(title)).getByRole('button', { name: /Mark as Resolved/ })
      ).toBeInTheDocument()
    );
  }
  for (const title of pending) {
    fireEvent.click(within(cardFor(title)).getByRole('button', { name: /Mark as Resolved/ }));
    await waitFor(() =>
      expect(within(cardFor(title)).queryByRole('button', { name: /Mark as Resolved/ })).toBeNull()
    );
  }

  expect(reportsApi.updateReportStatus).toHaveBeenCalledTimes(4);

  fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
  expect(screen.getByText('No reports found matching your criteria')).toBeInTheDocument();
});
test('treats a malformed payload as an empty queue rather than throwing', async () => {
  reportsApi.fetchReports.mockResolvedValue({ success: true });

  await renderReports();

  expect(screen.getByText('No reports have been filed yet')).toBeInTheDocument();
});
