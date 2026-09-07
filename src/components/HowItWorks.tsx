import type { CSSProperties } from 'react'
import Section from './layout/Section'
import { SectionHeading } from './motion/SectionHeading'
import './HowItWorks.css'

/**
 * How it works, as the system diagram it always wanted to be: one rail, four
 * stages, each stage listing its own components as nodes.
 *
 * The three-card row this replaces described the visitor's workflow (scan,
 * analyze, defend) with an animated gauge and a shield. It looked like every
 * other feature row on the web and said nothing about how the data gets built.
 * The stages below are the real pipeline, so the nodes are the actual
 * artifacts: refang and classify, de-dupe, the committed files, the ways out.
 *
 * Layout and motion live in HowItWorks.css (grid + one opacity cycle), so this
 * file stays the content.
 */
const STAGES = [
  {
    name: 'Collect',
    desc: 'Public source feeds and community reports arrive as raw indicator lines.',
    nodes: ['public source feeds', 'community reports'],
  },
  {
    name: 'Reduce',
    desc: 'Lines are refanged, typed, and merged into one record per indicator.',
    nodes: ['refang + classify', 'de-duplicate', 'expire stale entries'],
  },
  {
    name: 'Publish',
    desc: 'Each run commits the lists and a stats file back to the open repo.',
    nodes: ['ioc/*.txt', 'stats.json', 'chunks + release mirror'],
  },
  {
    name: 'Consume',
    desc: 'Scan one indicator here, call the API, or pull the raw list on a timer.',
    nodes: ['scan console', 'REST API', 'firewall, IDS, SIEM'],
  },
]

export default function HowItWorks() {
  return (
    <Section id="how-it-works" className="overflow-hidden" containerClassName="relative z-10">
      <SectionHeading
        title="How the system works"
        subtitle="The path one report takes to reach your firewall. Four stages, one direction."
      />

      <div className="hiw-arch">
        {STAGES.map((s, i) => (
          /* --hiw-i / --hiw-n drive every animation delay in the CSS: stage i
             owns quarter i of the cycle, node n lights 0.11s after node n-1. */
          <div className="hiw-stage" key={s.name} style={{ '--hiw-i': i } as CSSProperties}>
            <div className="hiw-rail" aria-hidden>
              <span className="hiw-dot" />
              <span className="hiw-wire" />
            </div>

            <h3 className="text-base font-bold tracking-tight text-white md:text-lg">{s.name}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.desc}</p>

            <ul className="mt-4 flex flex-col items-start gap-1.5">
              {s.nodes.map((n, ni) => (
                <li className="hiw-node" key={n} style={{ '--hiw-n': ni } as CSSProperties}>{n}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-10 border-t border-white/[0.06] pt-5 text-xs text-slate-500 md:text-sm">
        The rebuild runs on a schedule. Every publish is a commit, so you can diff what changed and when.
      </p>
    </Section>
  )
}
