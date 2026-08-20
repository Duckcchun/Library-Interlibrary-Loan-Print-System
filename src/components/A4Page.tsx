import type { LoanRecord } from '@/types/loan'
import { LoanCard } from '@/components/LoanCard'

export function A4Page({ records, visible }: { records: LoanRecord[]; visible: boolean }) {
  return (
    <div
      className="a4-page bg-white mx-auto"
      style={{
        width: '210mm',
        height: '297mm',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        padding: '4mm',
        gap: '0',
        boxSizing: 'border-box',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {records.map((r, i) => <LoanCard key={i} record={r} />)}
      {Array.from({ length: 12 - records.length }).map((_, i) => (
        <div key={`empty-${i}`} className="border-2 border-black border-dashed opacity-20" />
      ))}
    </div>
  )
}
