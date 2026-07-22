interface StatusBadgeProps {
  status: 'detected' | 'not_detected' | 'unable_to_verify';
}

const config = {
  detected: { label: 'Detected', className: 'bg-success-50 text-success-700 border-success-200', dot: 'bg-success-500' },
  not_detected: { label: 'Not Detected', className: 'bg-neutral-50 text-neutral-600 border-neutral-200', dot: 'bg-neutral-400' },
  unable_to_verify: { label: 'Unable to Verify', className: 'bg-warning-50 text-warning-700 border-warning-200', dot: 'bg-warning-500' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
