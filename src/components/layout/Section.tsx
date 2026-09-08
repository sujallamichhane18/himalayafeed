import { cn } from '@/lib/utils'
import Container from './Container'

type Spacing = 'md' | 'lg'

const SPACING: Record<Spacing, string> = {
  md: 'py-16 md:py-24',
  lg: 'py-20 md:py-28',
}

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: Spacing
  containerClassName?: string
}

/**
 * Vertical rhythm wrapper for a page section. Sections with an `id` get scroll-margin
 * so anchored navigation lands clear of the fixed navbar.
 */
export default function Section({
  spacing = 'lg',
  containerClassName,
  className,
  id,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn('relative', SPACING[spacing], id && 'scroll-mt-24', className)}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  )
}
