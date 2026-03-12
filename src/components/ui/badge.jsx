import { cn } from '@/lib/utils';

export function Badge({ className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-amber-200/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.25),rgba(79,70,229,0.25))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_0_16px_rgba(251,191,36,0.22)]',
        className
      )}
      {...props}
    />
  );
}
