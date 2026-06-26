import * as React from 'react';
import { cn } from '@/lib/utils';

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn('mb-1.5 block text-sm font-medium text-fg', className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-accent">*</span>}
    </label>
  );
}
