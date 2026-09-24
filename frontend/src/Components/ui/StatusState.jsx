import React from 'react';
import './StatusState.css';

const icons = {
  loading: '◌',
  error: '!',
  empty: '◇',
};

const StatusState = ({ status = 'empty', title, children, action }) => (
  <section
    className={`status-state status-state--${status}`}
    role={status === 'error' ? 'alert' : 'status'}
  >
    <span className="status-state__icon" aria-hidden="true">
      {status === 'loading' ? <span className="status-state__spinner" /> : icons[status]}
    </span>
    <h2>{title}</h2>
    {children && <div className="status-state__message">{children}</div>}
    {action}
  </section>
);

export default StatusState;
