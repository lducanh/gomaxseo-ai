import * as React from 'react';

export function PageHeader({
  title,
  description,
  breadcrumb,
  children,
}: {
  title: string;
  description?: string;
  breadcrumb?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1.5">{breadcrumb}</div>}
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}

/** Standard page width + padding wrapper. */
export function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8 ${className}`}>
      {children}
    </div>
  );
}
