import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { LoanRecord } from '@/types/loan'
import { getLibraryColor } from '@/lib/library-utils'

interface LoanCardProps {
  record: LoanRecord
  onDelete?: (id: string) => void
  /** DragOverlay에서 렌더링될 때 — 정적으로 표시 */
  overlay?: boolean
}

export function LoanCard({ record, onDelete, overlay }: LoanCardProps) {
  const bgColor = getLibraryColor(record.요청도서관_원본)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id, disabled: overlay })

  const style: React.CSSProperties = overlay
    ? { height: '100%' }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        // 드래그 중인 원본은 자리에 흐리게 남김 (오버레이가 마우스를 따라감)
        opacity: isDragging ? 0.35 : 1,
        height: '100%',
        cursor: 'grab',
        touchAction: 'none',
        position: 'relative',
      }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className="group border-2 border-black flex flex-col"
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
    >
      {/* 삭제 버튼 — hover 시 나타남, 인쇄 시 숨김 */}
      {!overlay && onDelete && (
        <button
          type="button"
          aria-label="카드 삭제"
          // 드래그 센서로 이벤트가 넘어가지 않도록 차단
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(record.id)
          }}
          className="no-print absolute top-1 right-1 z-10 w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md hover:bg-red-600"
          style={{ fontSize: '1rem', lineHeight: 1 }}
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>
      )}

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
