import React from 'react';
import './StatCard.css';

const StatCard = ({ label, value, icon, tone = 'primary', trend }) => (
  <article className={`stat-card stat-card--${tone}`}>
    <span className="stat-card__icon" aria-hidden="true">
      {icon}
    </span>
    <div className="stat-card__body">
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {trend && (
        <p className={`stat-card__trend stat-card__trend--${trend.tone || 'positive'}`}>
          {trend.label}
        </p>
      )}
    </div>
  </article>
);

export default StatCard;
