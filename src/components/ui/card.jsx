import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/15 bg-[linear-gradient(150deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_45%,rgba(79,70,229,0.08))] backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/5',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn('p-4 md:p-5', className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-display text-lg font-semibold tracking-tight text-white', className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn('px-4 pb-4 md:px-5 md:pb-5', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent };
