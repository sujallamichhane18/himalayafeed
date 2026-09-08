import { cn } from '@/lib/utils'

/** Horizontal layout wrapper: centered, width-capped, with consistent responsive gutters. */
export default function Container({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-6 lg:px-12', className)} {...props}>
      {children}
    </div>
  )
}
