/* SigmaBadge — inline z-score badge. */

interface SigmaBadgeProps {
  zScore: number;
  classification: 'noise' | 'notable' | 'meaningful';
}

export function SigmaBadge({ zScore, classification }: SigmaBadgeProps) {
  if (classification === 'noise') return null;

  const absZ = Math.abs(zScore);
  const variant = classification === 'meaningful' ? 'meaningful' : 'notable';

  return (
    <span className={`sigma-badge sigma-badge--${variant}`}>
      {absZ.toFixed(1)}σ
    </span>
  );
}
