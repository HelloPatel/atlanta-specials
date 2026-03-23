import { useState } from 'react';

function Star({ fill, size = 18 }) {
  // fill: 0 (empty) to 1 (full), supports partial
  const id = `grad-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="#f39c12" />
          <stop offset={`${fill * 100}%`} stopColor="#ddd" />
        </linearGradient>
      </defs>
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={`url(#${id})`}
        stroke="#f39c12"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StarRating({ averageRating, totalRatings, userRating, onRate, readOnly }) {
  const [hovered, setHovered] = useState(0);

  const displayRating = hovered || (readOnly ? averageRating : (userRating || averageRating));

  return (
    <div className="star-rating">
      <div
        className={`stars${readOnly ? '' : ' stars-interactive'}`}
        onMouseLeave={() => !readOnly && setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = Math.min(1, Math.max(0, displayRating - (n - 1)));
          return (
            <span
              key={n}
              onMouseEnter={() => !readOnly && setHovered(n)}
              onClick={() => !readOnly && onRate(n)}
              style={{ cursor: readOnly ? 'default' : 'pointer' }}
            >
              <Star fill={fill} size={16} />
            </span>
          );
        })}
      </div>
      <span className="star-label">
        {totalRatings > 0
          ? `${averageRating.toFixed(1)} (${totalRatings} ${totalRatings === 1 ? 'rating' : 'ratings'})`
          : 'No ratings yet'}
      </span>
      {!readOnly && userRating > 0 && (
        <span className="star-yours">Your rating: {userRating}★</span>
      )}
    </div>
  );
}
