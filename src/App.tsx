import { useState } from 'react'
import { Header } from '@/components/Header'
import { DropZone } from '@/components/DropZone'
import { A4Page } from '@/components/A4Page'
import { ErrorBanner } from '@/components/ErrorBanner'
import { parseExcel } from '@/lib/excel-parser'
import { sortByCallNumber } from '@/lib/call-number-sort'
import type { LoanRecord } from '@/types/loan'

export default function App() {
  const [records, setRecords] = useState<LoanRecord[]>([])
  const [filename, setFilename] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

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
      // 청구기호 순 정렬 (분류번호 오름차순 → 저자기호 ㄱㄴㄷ순)
      const sorted = sortByCallNumber(parsed)
      setRecords(sorted)
      setFilename(file.name)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } catch {
      setError('파일을 읽는 중 오류가 발생했습니다. 파일이 손상되지 않았는지 확인해 주세요.')
    }
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
      />

      {error && <ErrorBanner message={error} />}

      {/* A4 페이지 영역 */}
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
