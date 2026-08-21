import type { LoanRecord } from '@/types/loan'
import { getLibraryColor } from '@/lib/library-utils'

export function LoanCard({ record }: { record: LoanRecord }) {
  const bgColor = getLibraryColor(record.요청도서관_원본)
  return (
    <div className="border-2 border-black flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>
      {/* Row 1: 이용자명 */}
      <div className="border-b-2 border-black flex items-center justify-center flex-shrink-0" style={{ flex: 2.4, minHeight: 0, paddingTop: '0.3rem' }}>
        <span
          className="font-black text-center leading-tight"
          style={{ fontSize: record.이용자명.length > 3 ? '1.8rem' : '2.2rem', letterSpacing: record.이용자명.length > 3 ? '0.12em' : '0.2em' }}
        >
          {record.이용자명}
        </span>
      </div>

      {/* Row 2: 요청도서관 */}
      <div
        className="library-badge border-b-2 border-black flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: bgColor, flex: 1.8, minHeight: 0 }}
      >
        <span
          className="font-bold text-white text-center leading-tight"
          style={{ fontSize: record.요청도서관.length > 8 ? '1.05rem' : '1.4rem', letterSpacing: '0.08em' }}
        >
          {record.요청도서관 || '—'}
        </span>
      </div>

      {/* Row 3: 등록번호 | 자료실 */}
      <div className="border-b border-black flex flex-shrink-0" style={{ flex: 1.3, minHeight: 0 }}>
        <div className="flex items-center px-1.5" style={{ flex: 1, fontSize: '0.85rem' }}>
          {record.등록번호}
        </div>
        <div className="border-l border-black flex items-center justify-end px-1.5" style={{ flex: 1, fontSize: '0.8rem', textAlign: 'right' }}>
          {record.자료실}
        </div>
      </div>

      {/* Row 4: 청구기호 */}
      <div className="border-b border-black flex items-center justify-center px-1 flex-shrink-0" style={{ fontSize: '1.1rem', flex: 1.5, minHeight: 0 }}>
        <span className="text-center leading-tight break-all">{record.청구기호}</span>
      </div>

      {/* Row 5: 서명 */}
      <div className="flex items-start p-1.5" style={{ flex: 1.8, lineHeight: '1.3', overflow: 'hidden', minHeight: 0 }}>
        <span style={{ fontSize: record.서명.length > 30 ? '0.75rem' : record.서명.length > 20 ? '0.85rem' : '0.95rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {record.서명}
        </span>
      </div>
    </div>
  )
}
