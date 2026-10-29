import React from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-slate-50 p-4 border-t border-slate-200 ${className}`} {...props}>
      {children}
    </div>
  );
}
