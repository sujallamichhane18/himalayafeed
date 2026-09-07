import { useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max rotation in degrees at the card edges. */
  maxTilt?: number
  /** CSS color of the cursor light that rides the surface. */
  glow?: string
}

/**
 * Perspective tilt + cursor light. The card leans toward the pointer on a
 * spring (6 deg default) and a soft radial light tracks it across the face,
 * which is what makes flat panels read as physical material. Children can
 * lift off the surface with translateZ since the card preserves 3d.
 *
 * Static on touch and reduced-motion (same guard as Magnetic). The light
 * position is written as CSS custom properties on the node directly, so
 * pointer tracking never re-renders React.
 */
export function TiltCard({ children, className, maxTilt = 6, glow = 'rgba(207,23,51,0.16)' }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const [fine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  )
  const active = fine && !reduceMotion

  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 220, damping: 20, mass: 0.6 })
  const sry = useSpring(ry, { stiffness: 220, damping: 20, mass: 0.6 })

  const onMove = (e: PointerEvent) => {
    if (!active || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 2 * maxTilt)
    rx.set(-(py - 0.5) * 2 * maxTilt)
    ref.current.style.setProperty('--tilt-mx', `${(px * 100).toFixed(1)}%`)
    ref.current.style.setProperty('--tilt-my', `${(py * 100).toFixed(1)}%`)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <div style={{ perspective: 1200 }} className="h-full">
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{
          ...(active ? { rotateX: srx, rotateY: sry } : null),
          transformStyle: 'preserve-3d',
        }}
        className={`group relative h-full ${className ?? ''}`}
      >
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(480px circle at var(--tilt-mx, 50%) var(--tilt-my, 50%), ${glow}, transparent 65%)`,
          }}
        />
      </motion.div>
    </div>
  )
}
