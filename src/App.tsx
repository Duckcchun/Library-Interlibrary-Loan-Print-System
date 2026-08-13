import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

interface LoanRecord {
  이용자명: string
  제공도서관: string
  등록번호: string
  자료실: string
  청구기호: string
  서명: string
}

const LIBRARY_COLORS: Record<string, string> = {
  '광진정보도서관': '#5D9CE3',
  '구의제3동도서관': '#A359C5',
  '광진구립도서관': '#2563EB',
  '자양한강도서관': '#0891B2',
  '중곡도서관': '#16A34A',
  '군자역도서관': '#EA580C',
  '어린이영어도서관': '#D97706',
  '자양제4동도서관': '#DB2777',
  '예술회관도서관': '#7C3AED',
  '아차산역도서관': '#059669',
  '체육센터도서관': '#DC2626',
}

const DEFAULT_COLORS = [
  '#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6',
  '#F97316', '#14B8A6', '#EC4899', '#84CC16', '#06B6D4',
]

function getLibraryColor(name: string): string {
  if (LIBRARY_COLORS[name]) return LIBRARY_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length]
}

function parseExcel(buffer: ArrayBuffer): LoanRecord[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]

  // Auto-detect header row (first row containing '서명' or '이용자명', up to row 10)
  let headerRowIdx = 5
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    const row = raw[i].map((c) => String(c).trim())
    if (row.includes('서명') || row.includes('이용자명')) { headerRowIdx = i; break }
  }

  const headers = raw[headerRowIdx].map((h) => String(h).trim())
  const col = (name: string) => headers.findIndex((h) => h.includes(name))

  const idxName = col('이용자명')
  const idxLib = col('제공도서관') !== -1 ? col('제공도서관') : col('요청도서관')
  const idxReg = col('등록번호')
  const idxRoom = col('자료실')
  const idxCall = col('청구기호')
  const idxTitle = col('서명')

  // If critical columns are missing, return empty to trigger error message
  if (idxName === -1 || idxTitle === -1) return []

  const records: LoanRecord[] = []
  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const row = raw[i]
    const name = String(row[idxName] ?? '').trim()
    const title = String(row[idxTitle] ?? '').trim()
    if (!name || !title) continue
    records.push({
      이용자명: name,
      제공도서관: idxLib !== -1 ? String(row[idxLib] ?? '').trim() : '',
      등록번호: idxReg !== -1 ? String(row[idxReg] ?? '').trim() : '',
      자료실: idxRoom !== -1 ? String(row[idxRoom] ?? '').trim() : '',
      청구기호: idxCall !== -1 ? String(row[idxCall] ?? '').trim() : '',
      서명: title,
    })
  }
  return records
}

function LoanCard({ record }: { record: LoanRecord }) {
  const bgColor = getLibraryColor(record.제공도서관)
  return (
    <div className="border-2 border-black flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>
      {/* Row 1: 이용자명 */}
      <div className="border-b-2 border-black flex items-center justify-center py-1.5 flex-shrink-0">
        <span className="font-black text-center leading-tight" style={{ fontSize: '2.1rem' }}>
          {record.이용자명}
        </span>
      </div>

      {/* Row 2: 제공도서관 */}
      <div
        className="library-badge border-b-2 border-black flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: bgColor, minHeight: '3.8rem', padding: '0.5rem 0.25rem' }}
      >
        <span className="font-black text-white text-center leading-tight" style={{ fontSize: '1.6rem' }}>
          {record.제공도서관 || '—'}
        </span>
      </div>

      {/* Row 3: 등록번호 | 자료실 */}
      <div className="border-b border-black flex flex-shrink-0" style={{ minHeight: '2rem' }}>
        <div className="flex items-center px-1.5" style={{ flex: 1, fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
          {record.등록번호}
        </div>
        <div className="border-l border-black flex items-center justify-end px-1.5" style={{ flex: 1, fontSize: '0.85rem', textAlign: 'right' }}>
          {record.자료실}
        </div>
      </div>

      {/* Row 4: 청구기호 */}
      <div className="border-b border-black flex items-center justify-center px-1 py-1 flex-shrink-0" style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', minHeight: '2.2rem' }}>
        <span className="text-center leading-tight break-all">{record.청구기호}</span>
      </div>

      {/* Row 5: 서명 (fills remaining height) */}
      <div className="flex items-start p-1.5" style={{ flex: 1, fontSize: '0.9rem', lineHeight: '1.35', overflow: 'hidden' }}>
        {record.서명}
      </div>
    </div>
  )
}

function A4Page({ records, visible }: { records: LoanRecord[]; visible: boolean }) {
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
        // Screen shadow; suppressed in print via .a4-page rule in CSS
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
        // Always fully opaque for printing — transition only on mount
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

export default function App() {
  const [records, setRecords] = useState<LoanRecord[]>([])
  const [filename, setFilename] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [visible, setVisible] = useState(false)
  // Single hidden file input, always mounted — avoids ref conflicts between branches
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setVisible(false)

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('올바른 엑셀 파일(.xlsx, .xls)을 업로드해 주세요.')
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseExcel(buffer)
      if (parsed.length === 0) {
        setError("데이터를 찾을 수 없습니다. '이용자명'과 '서명' 컬럼이 포함된 상호대차 양식인지 확인해 주세요.")
        return
      }
      setRecords(parsed)
      setFilename(file.name)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } catch {
      setError('파일을 읽는 중 오류가 발생했습니다. 파일이 손상되지 않았는지 확인해 주세요.')
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleReset = () => {
    setRecords([])
    setFilename(null)
    setVisible(false)
    setError(null)
  }

  const handlePrint = () => {
    // Ensure pages are fully visible before printing
    setVisible(true)
    requestAnimationFrame(() => window.print())
  }

  const pages: LoanRecord[][] = []
  for (let i = 0; i < records.length; i += 12) pages.push(records.slice(i, i + 12))

  const hasFile = !!filename

  return (
    <div style={{ backgroundColor: '#F2F4F6', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* Single always-mounted file input — avoids ref conflicts */}
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />

      {/* ── Header ── */}
      <header
        className="no-print bg-white border-b border-gray-200 sticky top-0 z-20"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="자양한강도서관 로고" className="flex-shrink-0 w-10 h-10 object-contain" />
          <div>
            <h1 className="font-bold text-gray-900 leading-tight" style={{ fontSize: '1.05rem' }}>
              자양한강도서관
            </h1>
            <p className="text-gray-500 font-medium leading-tight" style={{ fontSize: '0.78rem' }}>
              상호대차 인쇄 시스템
            </p>
          </div>
        </div>
      </header>

      {/* ── Control Section ── */}
      <div className="no-print py-10 px-6">
        <div
          className="bg-white rounded-3xl mx-auto"
          style={{ maxWidth: '42rem', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '2rem' }}
        >
          {!hasFile ? (
            <>
              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-2xl transition-all duration-200"
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#3182F6' : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

              {/* Disabled print button — visual hint */}
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
            /* After upload: file chip + buttons, perfectly center-aligned */
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className="flex items-center gap-3 cursor-pointer rounded-2xl px-4 py-3 transition-all duration-200 flex-1 min-w-0"
                style={{
                  border: `1.5px dashed ${dragging ? '#3182F6' : '#D1D5DB'}`,
                  backgroundColor: dragging ? '#EFF6FF' : '#F9FAFB',
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#DBEAFE' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3182F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate" style={{ fontSize: '0.85rem' }}>{filename}</p>
                  <p className="text-gray-400" style={{ fontSize: '0.72rem' }}>총 {records.length}건 · {pages.length}페이지 · 클릭해서 교체</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleReset}
                  className="font-medium rounded-2xl transition-all duration-150 text-gray-500 hover:bg-gray-200"
                  style={{ fontSize: '0.85rem', padding: '0.7rem 1.1rem', backgroundColor: '#F3F4F6' }}
                >
                  초기화
                </button>
                <button
                  onClick={handlePrint}
                  className="font-bold text-white rounded-2xl transition-all duration-200"
                  style={{
                    backgroundColor: '#3182F6',
                    fontSize: '1rem',
                    padding: '0.75rem 1.6rem',
                    boxShadow: '0 4px 14px rgba(49,130,246,0.35)',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement
                    b.style.transform = 'translateY(-2px)'
                    b.style.boxShadow = '0 8px 20px rgba(49,130,246,0.45)'
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement
                    b.style.transform = 'translateY(0)'
                    b.style.boxShadow = '0 4px 14px rgba(49,130,246,0.35)'
                  }}
                >
                  인쇄하기
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl px-4 py-3" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="font-medium text-red-600" style={{ fontSize: '0.85rem' }}>{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── A4 Pages ── */}
      <div className="flex flex-col items-center gap-8 pb-20" style={{ backgroundColor: '#E5E7EB' }}>
        {pages.length === 0 && (
          <div className="no-print text-center py-20">
            <p className="font-semibold text-gray-400" style={{ fontSize: '0.95rem' }}>
              엑셀 파일을 업로드하면 A4 인쇄 카드가 여기에 표시됩니다.
            </p>
          </div>
        )}
        {pages.map((pageRecords, pi) => (
          <A4Page key={pi} records={pageRecords} visible={visible} />
        ))}
      </div>
    </div>
  )
}
