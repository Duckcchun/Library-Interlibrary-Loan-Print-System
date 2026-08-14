import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

interface LoanRecord {
  이용자명: string
  요청도서관: string
  등록번호: string
  자료실: string
  청구기호: string
  서명: string
}

/* ── 도서관명 자동 변환 ── */
const LIBRARY_NAME_MAP: Record<string, string> = {
  '중곡문화체육센터도서관': '중곡도서관',
}

function normalizeLibraryName(name: string): string {
  return LIBRARY_NAME_MAP[name] || name
}

/* ── 광진구립 8개관 색상 (새마을문고 제외) ── */
const LIBRARY_COLORS: Record<string, string> = {
  '광진정보도서관': '#135198',
  '자양한강도서관': '#F15C22',
  '중곡도서관': '#4B7725',
  '자양제4동도서관': '#EDCA00',
  '구의제3동도서관': '#5F5BB3',
  '군자동도서관': '#E77F9B',
  '아차산숲속도서관': '#446E98',
  '광진어린이영어도서관': '#EF4036',
}

/* ── 스마트도서관 (통일 색상) ── */
const SMART_LIBRARIES = [
  '군자역스마트도서관',
  '중곡스마트도서관',
  '구의역스마트도서관',
  '광진구민체육센터스마트도서관',
  '광진문화예술회관스마트도서관',
  '어린이대공원역스마트도서관',
  '아차산역스마트도서관',
]
const SMART_LIBRARY_COLOR = '#555555'

/* ── 폴백 색상 ── */
const FALLBACK_COLORS = [
  '#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6',
  '#F97316', '#14B8A6', '#EC4899', '#84CC16', '#06B6D4',
]

function getLibraryColor(name: string): string {
  if (LIBRARY_COLORS[name]) return LIBRARY_COLORS[name]
  if (SMART_LIBRARIES.includes(name)) return SMART_LIBRARY_COLOR
  if (name.includes('스마트도서관')) return SMART_LIBRARY_COLOR
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

/* ── 엑셀 파싱 ── */
function parseExcel(buffer: ArrayBuffer): LoanRecord[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]

  // Auto-detect header row
  let headerRowIdx = -1
  for (let i = 0; i < Math.min(10, raw.length); i++) {
    const row = raw[i].map((c) => String(c).trim())
    if (row.includes('이용자명') || row.includes('서명')) { headerRowIdx = i; break }
  }
  if (headerRowIdx === -1) return []

  const headers = raw[headerRowIdx].map((h) => String(h).trim())
  const col = (name: string) => headers.findIndex((h) => h.includes(name))

  const idxName = col('이용자명')
  const idxReqLib = col('요청도서관')
  const idxReg = col('등록번호')
  const idxRoom = col('자료실')
  const idxCall = col('청구기호')
  const idxTitle = col('서명')

  if (idxName === -1 || idxTitle === -1) return []

  const records: LoanRecord[] = []
  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const row = raw[i]
    const name = String(row[idxName] ?? '').trim()
    const title = String(row[idxTitle] ?? '').trim()
    if (!name || !title) continue
    const rawLibName = idxReqLib !== -1 ? String(row[idxReqLib] ?? '').trim() : ''
    records.push({
      이용자명: name,
      요청도서관: normalizeLibraryName(rawLibName),
      등록번호: idxReg !== -1 ? String(row[idxReg] ?? '').trim() : '',
      자료실: idxRoom !== -1 ? String(row[idxRoom] ?? '').trim() : '',
      청구기호: idxCall !== -1 ? String(row[idxCall] ?? '').trim() : '',
      서명: title,
    })
  }
  return records
}

/* ── 카드 컴포넌트 ── */
function LoanCard({ record }: { record: LoanRecord }) {
  const bgColor = getLibraryColor(record.요청도서관)
  return (
    <div className="border-2 border-black flex flex-col" style={{ height: '100%', overflow: 'hidden' }}>
      {/* Row 1: 이용자명 — 크게 강조, 자간 넓게 */}
      <div className="border-b-2 border-black flex items-center justify-center py-2 flex-shrink-0" style={{ flex: 2 }}>
        <span
          className="font-black text-center leading-tight"
          style={{ fontSize: '2.2rem', letterSpacing: '0.2em' }}
        >
          {record.이용자명}
        </span>
      </div>

      {/* Row 2: 요청도서관 — 색상 배경, 자간 */}
      <div
        className="library-badge border-b-2 border-black flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: bgColor, padding: '0.5rem 0.25rem', flex: 1.5 }}
      >
        <span
          className="font-bold text-white text-center leading-tight"
          style={{ fontSize: '1.4rem', letterSpacing: '0.15em' }}
        >
          {record.요청도서관 || '—'}
        </span>
      </div>

      {/* Row 3: 등록번호 | 자료실 */}
      <div className="border-b border-black flex flex-shrink-0" style={{ minHeight: '1.6rem' }}>
        <div className="flex items-center px-1.5" style={{ flex: 1, fontSize: '0.82rem', fontFamily: 'var(--font-sans)' }}>
          {record.등록번호}
        </div>
        <div className="border-l border-black flex items-center justify-end px-1.5" style={{ flex: 1, fontSize: '0.78rem', textAlign: 'right' }}>
          {record.자료실}
        </div>
      </div>

      {/* Row 4: 청구기호 */}
      <div className="border-b border-black flex items-center justify-center px-1 py-0.5 flex-shrink-0" style={{ fontSize: '0.85rem', minHeight: '1.6rem' }}>
        <span className="text-center leading-tight break-all">{record.청구기호}</span>
      </div>

      {/* Row 5: 서명 (나머지 공간 채움) */}
      <div className="flex items-start p-1.5" style={{ flex: 1, fontSize: '0.82rem', lineHeight: '1.3', overflow: 'hidden' }}>
        {record.서명}
      </div>
    </div>
  )
}

/* ── A4 페이지 (3×4 = 12칸) ── */
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

/* ── 메인 앱 ── */
export default function App() {
  const [records, setRecords] = useState<LoanRecord[]>([])
  const [filename, setFilename] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [visible, setVisible] = useState(false)
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
    setVisible(true)
    requestAnimationFrame(() => window.print())
  }

  const pages: LoanRecord[][] = []
  for (let i = 0; i < records.length; i += 12) pages.push(records.slice(i, i + 12))

  const hasFile = !!filename

  return (
    <div style={{ backgroundColor: '#F2F4F6', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

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

              {/* Disabled print button */}
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
