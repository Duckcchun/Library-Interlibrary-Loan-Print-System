import { useRef, useState } from 'react'

interface DropZoneProps {
  onFile: (file: File) => void
  filename: string | null
  recordCount: number
  pageCount: number
  onReset: () => void
  onPrint: () => void
}

export function DropZone({ onFile, filename, recordCount, pageCount, onReset, onPrint }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  const hasFile = !!filename

  return (
    <div className="no-print py-10 px-6">
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} aria-label="엑셀 파일 선택" />
      <div
        className="bg-white rounded-3xl mx-auto"
        style={{ maxWidth: '42rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '2rem' }}
      >
        {!hasFile ? (
          <>
            {/* 드롭존 */}
            <div
              role="button"
              tabIndex={0}
              aria-label="엑셀 파일 업로드 — 클릭하거나 파일을 드래그하세요"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
              onDragOver={(e) => { e.preventDefault(); dragCounterRef.current += 1; setDragging(true) }}
              onDragLeave={() => { dragCounterRef.current -= 1; if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setDragging(false) } }}
              onDrop={(e) => { dragCounterRef.current = 0; onDrop(e) }}
              className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-2xl transition-all duration-200 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
              style={{
                border: `2px dashed ${dragging ? '#3182F6' : '#D1D5DB'}`,
                backgroundColor: dragging ? '#EFF6FF' : '#F9FAFB',
                padding: '2.5rem 2rem',
                transform: dragging ? 'scale(1.015)' : 'scale(1)',
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                style={{ backgroundColor: dragging ? '#DBEAFE' : '#F3F4F6' }}
              >
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#3182F6' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <span className="font-semibold text-gray-700" style={{ fontSize: '0.95rem' }}>
                엑셀 파일 업로드
              </span>
              <span className="text-gray-400" style={{ fontSize: '0.78rem' }}>
                클릭하거나 파일을 드래그하세요 · .xlsx, .xls
              </span>
            </div>

            {/* 비활성 인쇄 버튼 */}
            <button
              disabled
              className="mt-4 w-full font-bold rounded-2xl"
              style={{
                backgroundColor: '#E5E7EB',
                color: '#9CA3AF',
                cursor: 'not-allowed',
                fontSize: '1rem',
                padding: '0.85rem',
                opacity: 0.55,
                letterSpacing: '0.01em',
              }}
            >
              인쇄하기
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div
              role="button"
              tabIndex={0}
              aria-label="다른 엑셀 파일로 교체 — 클릭하거나 드래그하세요"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click() } }}
              onDragOver={(e) => { e.preventDefault(); dragCounterRef.current += 1; setDragging(true) }}
              onDragLeave={() => { dragCounterRef.current -= 1; if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setDragging(false) } }}
              onDrop={(e) => { dragCounterRef.current = 0; onDrop(e) }}
              className="flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-all duration-200 flex-1 min-w-0 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
              style={{
                border: `1.5px dashed ${dragging ? '#3182F6' : '#D1D5DB'}`,
                backgroundColor: dragging ? '#EFF6FF' : '#F9FAFB',
              }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#DBEAFE' }}>
                <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3182F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate" style={{ fontSize: '0.85rem' }}>{filename}</p>
                <p className="text-gray-400" style={{ fontSize: '0.72rem' }}>총 {recordCount}건 · {pageCount}페이지 · 클릭해서 교체</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onReset}
                className="font-medium rounded-2xl transition-all duration-150 text-gray-500 hover:bg-gray-200"
                style={{ fontSize: '0.85rem', padding: '0.7rem 1.1rem', backgroundColor: '#F3F4F6' }}
              >
                초기화
              </button>
              <button
                onClick={onPrint}
                className="font-bold text-white rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  backgroundColor: '#3182F6',
                  fontSize: '1rem',
                  padding: '0.75rem 1.6rem',
                  boxShadow: '0 4px 14px rgba(49,130,246,0.35)',
                  letterSpacing: '0.01em',
                }}
              >
                인쇄하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
