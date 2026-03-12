import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default:
          'border border-indigo-300/30 bg-[linear-gradient(100deg,#4338ca,#2563eb)] text-white shadow-glow hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0',
        secondary:
          'border border-white/20 bg-[linear-gradient(140deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] text-foreground hover:-translate-y-0.5 hover:bg-white/20',
        ghost: 'text-foreground hover:bg-white/10',
        accent:
          'border border-amber-200/40 bg-[linear-gradient(100deg,#fcd34d,#fb923c)] text-slate-900 shadow-gold hover:-translate-y-0.5 hover:brightness-105',
        danger:
          'border border-rose-300/35 bg-[linear-gradient(100deg,#f43f5e,#dc2626)] text-white hover:-translate-y-0.5 hover:brightness-110',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});

Button.displayName = 'Button';

export { Button, buttonVariants };
