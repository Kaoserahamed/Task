import { fireEvent, render, screen, within } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

const setup = (props = {}) => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const view = render(
    <ConfirmDialog
      open
      title="Delete tour package"
      message="This permanently removes “Hill Weekend”."
      confirmLabel="Delete package"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
  return { view, onConfirm, onCancel };
};

/** Scoped to the dialog so a stray button elsewhere on the page cannot match. */
const dialogButtons = () => within(screen.getByRole('alertdialog')).getAllByRole('button');

test('renders nothing while closed', () => {
  const { container } = render(<ConfirmDialog open={false} message="hidden" />);

  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('exposes the question as a labelled modal alertdialog', () => {
  setup();

  const dialog = screen.getByRole('alertdialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAccessibleName('Delete tour package');
  expect(dialog).toHaveAccessibleDescription('This permanently removes “Hill Weekend”.');
});

test('moves focus to the confirm button on open', () => {
  setup();

  expect(screen.getByRole('button', { name: 'Delete package' })).toHaveFocus();
});

test('confirms only when the confirm button is pressed', () => {
  const { onConfirm, onCancel } = setup();

  fireEvent.click(screen.getByRole('button', { name: 'Delete package' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onCancel).not.toHaveBeenCalled();
});

test('cancels on the cancel button without confirming', () => {
  const { onConfirm, onCancel } = setup();

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
});

test('cancels on Escape, matching the native dialog it replaces', () => {
  const { onConfirm, onCancel } = setup();

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
});

test('cancels on a backdrop press but not on a press inside the panel', () => {
  const { onConfirm, onCancel } = setup();

  // The overlay is the alertdialog itself, so a press on it is a press on the
  // backdrop area and dismisses.
  fireEvent.mouseDown(screen.getByRole('alertdialog'));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();

  onCancel.mockClear();

  // A press on the panel or its controls is inside the dialog and must not.
  fireEvent.mouseDown(screen.getByRole('button', { name: 'Delete package' }));
  fireEvent.mouseDown(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).not.toHaveBeenCalled();
});

test('disables both actions and announces progress while busy', () => {
  setup({ busy: true });

  expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-busy', 'true');
  for (const button of dialogButtons()) {
    expect(button).toBeDisabled();
  }
});

test('traps Tab inside the dialog', () => {
  setup();

  const cancel = screen.getByRole('button', { name: 'Cancel' });
  const confirm = screen.getByRole('button', { name: 'Delete package' });

  // Focus starts on confirm (the last control): Tab wraps back to cancel.
  expect(confirm).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Tab' });
  expect(cancel).toHaveFocus();

  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  expect(confirm).toHaveFocus();
});

test('uses the default title and label when none are supplied', () => {
  setup({ title: undefined, confirmLabel: undefined });

  expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Please confirm');
  expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
});
