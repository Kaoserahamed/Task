import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

/**
 * Accessible confirmation dialog.
 *
 * Deleting a tour package used to call `window.confirm`, which blocks the main
 * thread, cannot be styled, is suppressed in some embedded browsers, and is
 * invisible to a screen-reader user beyond a bare native string. This is the
 * app's own replacement, matching the inline status feedback used elsewhere.
 *
 * Accessibility contract:
 *   - `role="alertdialog"` with `aria-modal` and a label/description, so assistive
 *     technology announces what is being asked and interrupts politely.
 *   - focus moves to the confirm button on open and returns to the trigger on
 *     close, and Tab is trapped inside the dialog for as long as it is open.
 *   - Escape and the backdrop both cancel, matching the native behaviour users
 *     already expect from `window.confirm`.
 */
const ConfirmDialog = ({
  open,
  title = 'Please confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const lastFocusedRef = useRef(null);

  // Remember the trigger so focus can be handed back when the dialog closes.
  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement;
      confirmRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel?.();
        return;
      }
      if (event.key !== 'Tab') return;

      // Only two controls are focusable, so the trap is a cycle between them.
      const focusable = dialogRef.current?.querySelectorAll('button:not([disabled])');
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  // Hand focus back to whatever opened the dialog once it goes away.
  useEffect(() => {
    if (!open && lastFocusedRef.current instanceof HTMLElement) {
      lastFocusedRef.current.focus();
      lastFocusedRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  const titleId = 'confirm-dialog-title';
  const messageId = 'confirm-dialog-message';

  return (
    <div className="confirm-dialog" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-dialog__panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        aria-busy={busy}
        ref={dialogRef}
        // A click inside the panel must not reach the backdrop's dismiss handler.
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={messageId}>{message}</p>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__cancel"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-dialog__confirm"
            onClick={onConfirm}
            disabled={busy}
            ref={confirmRef}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
