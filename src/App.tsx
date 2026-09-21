import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Header } from '@/components/Header'
import { DropZone } from '@/components/DropZone'
import { A4Page } from '@/components/A4Page'
import { LoanCard } from '@/components/LoanCard'
import { ErrorBanner } from '@/components/ErrorBanner'
import { PinDialog } from '@/components/PinDialog'
import { AdminPanel } from '@/components/AdminPanel'
import { FloatingPrintButton } from '@/components/FloatingPrintButton'
import { Toast } from '@/components/Toast'
import { parseExcel } from '@/lib/excel-parser'
import { sortByCallNumber } from '@/lib/call-number-sort'
import { loadLibraries, invalidateCache } from '@/lib/library-utils'
import { useAdminMode } from '@/hooks/useAdminMode'
import { CARDS_PER_PAGE } from '@/lib/layout'
import type { LoanRecord } from '@/types/loan'

export default function App() {
  // 원본(청구기호 정렬) — 정렬 초기화 시 복원용
  const [sortedRecords, setSortedRecords] = useState<LoanRecord[]>([])
  // 편집용 순서 — 화면/인쇄에 실제 사용
  const [records, setRecords] = useState<LoanRecord[]>([])
  const [filename, setFilename] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  // 드래그 중인 카드
  const [activeId, setActiveId] = useState<string | null>(null)
  // 삭제 실행 취소용 임시 보관 (삭제된 레코드 + 원래 위치)
  const deletedRef = useRef<{ record: LoanRecord; index: number } | null>(null)
  const [undoToast, setUndoToast] = useState(false)

  const { isAdmin, adminPin, showPinDialog, verifyPin, exitAdmin, closePinDialog } = useAdminMode()

  const sensors = useSensors(
    // 8px 이상 움직여야 드래그 시작 — 클릭(삭제 버튼 등)과 구분
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // 앱 시작 시 Supabase에서 도서관 데이터 사전 로드
  useEffect(() => {
    loadLibraries()
  }, [])

  const handleFile = async (file: File) => {
    setError(null)
    setVisible(false)

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('올바른 엑셀 파일(.xlsx, .xls)을 업로드해 주세요.')
      return
    }

    try {
      // 파싱 전에 최신 도서관 데이터 로드
      await loadLibraries()
      const buffer = await file.arrayBuffer()
      const parsed = parseExcel(buffer)
      if (parsed.length === 0) {
        setError("데이터를 찾을 수 없습니다. '이용자명'과 '서명' 컬럼이 포함된 상호대차 양식인지 확인해 주세요.")
        return
      }
      // 청구기호 순 정렬 (분류번호 오름차순 → 저자기호 ㄱㄴㄷ순)
      const sorted = sortByCallNumber(parsed)
      setSortedRecords(sorted)
      setRecords(sorted)
      setFilename(file.name)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } catch {
      setError('파일을 읽는 중 오류가 발생했습니다. 파일이 손상되지 않았는지 확인해 주세요.')
    }
  }

  const handleReset = () => {
    setSortedRecords([])
    setRecords([])
    setFilename(null)
    setVisible(false)
    setError(null)
    deletedRef.current = null
    setUndoToast(false)
  }

  const handlePrint = () => {
    setVisible(true)
    requestAnimationFrame(() => window.print())
  }

  const handleAdminUpdate = () => {
    // 관리자가 도서관 정보를 변경하면 캐시 무효화
    invalidateCache()
    loadLibraries()
  }

  // 청구기호 순으로 되돌리기
  const handleRestoreSort = () => {
    setRecords(sortedRecords)
    deletedRef.current = null
    setUndoToast(false)
  }

  // 카드 삭제 + 실행 취소용 보관
  const handleDelete = (id: string) => {
    setRecords((prev) => {
      const index = prev.findIndex((r) => r.id === id)
      if (index === -1) return prev
      deletedRef.current = { record: prev[index], index }
      return prev.filter((r) => r.id !== id)
    })
    setUndoToast(true)
  }

  // 삭제 실행 취소 — 원래 위치로 복원
  const handleUndoDelete = () => {
    const deleted = deletedRef.current
    if (!deleted) return
    setRecords((prev) => {
      const next = [...prev]
      next.splice(Math.min(deleted.index, next.length), 0, deleted.record)
      return next
    })
    deletedRef.current = null
    setUndoToast(false)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  // 끼워넣기 재정렬 — 전체 배열 기준(페이지 넘나듦)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    setRecords((prev) => {
      const from = prev.findIndex((r) => r.id === active.id)
      const to = prev.findIndex((r) => r.id === over.id)
      if (from === -1 || to === -1) return prev
      return arrayMove(prev, from, to)
    })
  }

  const pages: LoanRecord[][] = []
  for (let i = 0; i < records.length; i += CARDS_PER_PAGE) pages.push(records.slice(i, i + CARDS_PER_PAGE))

  const activeRecord = activeId ? records.find((r) => r.id === activeId) ?? null : null
  // 편집 여부 — 순서가 원본과 다르거나 개수가 줄었으면 편집됨
  const isEdited =
    records.length !== sortedRecords.length ||
    records.some((r, i) => r.id !== sortedRecords[i]?.id)

  return (
    <div style={{ backgroundColor: '#F2F4F6', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <Header />

      <DropZone
        onFile={handleFile}
        filename={filename}
        recordCount={records.length}
        pageCount={pages.length}
        onReset={handleReset}
        onPrint={handlePrint}
        onRestoreSort={handleRestoreSort}
        canRestoreSort={isEdited}
      />

      {error && <ErrorBanner message={error} />}

      {/* A4 페이지 영역 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={records.map((r) => r.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-col items-center gap-8 pb-20 print:gap-0 print:pb-0 print:bg-white" style={{ backgroundColor: '#E5E7EB' }}>
            {pages.length === 0 && (
              <div className="no-print text-center py-20">
                <p className="font-semibold text-gray-400" style={{ fontSize: '0.95rem' }}>
                  엑셀 파일을 업로드하면 A4 인쇄 카드가 여기에 표시됩니다.
                </p>
              </div>
            )}
            {pages.map((pageRecords, pi) => (
              <A4Page key={pi} records={pageRecords} visible={visible} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>

        {/* 드래그 중인 카드가 마우스를 부드럽게 따라다니는 오버레이 */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeRecord ? (
            <div style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.28)', cursor: 'grabbing', width: '100%', height: '100%' }}>
              <LoanCard record={activeRecord} overlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 관리자 PIN 다이얼로그 */}
      {showPinDialog && (
        <PinDialog onVerify={verifyPin} onClose={closePinDialog} />
      )}

      {/* 관리자 패널 */}
      {isAdmin && adminPin && (
        <AdminPanel pin={adminPin} onExit={exitAdmin} onUpdate={handleAdminUpdate} />
      )}

      {/* 플로팅 인쇄 버튼 — 스크롤 내리면 표시 */}
      <FloatingPrintButton onPrint={handlePrint} show={records.length > 0} />

      {/* 삭제 실행 취소 토스트 */}
      {undoToast && (
        <Toast
          message="카드를 삭제했습니다."
          type="success"
          actionLabel="실행 취소"
          onAction={handleUndoDelete}
          onClose={() => setUndoToast(false)}
        />
      )}
    </div>
  )
}
