import React from 'react';
import './StatusState.css';

const StatusState = ({ status = 'empty', title, children }) => (
  <section
    className={`status-state status-state--${status}`}
    role={status === 'error' ? 'alert' : 'status'}
  >
    {status === 'loading' && <span className="status-state__spinner" aria-label="Loading" />}
    {status !== 'loading' && (
      <span className="status-state__icon" aria-hidden="true">
        {status === 'error' ? '!' : '◇'}
      </span>
    )}
    <h2>{title}</h2>
    {children && <div className="status-state__message">{children}</div>}
  </section>
);

export default StatusState;
