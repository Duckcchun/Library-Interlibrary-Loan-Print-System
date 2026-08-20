import * as XLSX from 'xlsx'
import type { LoanRecord } from '@/types/loan'
import { normalizeLibraryName } from '@/lib/library-utils'

/**
 * 엑셀 파일 버퍼를 파싱하여 LoanRecord 배열로 변환
 *
 * - 첫 10행 내에서 헤더 자동 감지
 * - 컬럼명 부분 매칭 (띄어쓰기, 변형 대응)
 * - 중간 빈 행 건너뛰기
 */
export function parseExcel(buffer: ArrayBuffer): LoanRecord[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]

  // 헤더 행 자동 감지 (첫 15행 내에서)
  let headerRowIdx = -1
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    const row = raw[i].map((c) => String(c).trim())
    if (matchesColumn(row, '이용자') || matchesColumn(row, '예약자') || matchesColumn(row, '서명')) {
      headerRowIdx = i
      break
    }
  }
  if (headerRowIdx === -1) return []

  const headers = raw[headerRowIdx].map((h) => String(h).trim())

  // 유연한 컬럼 매칭 — 여러 변형을 지원
  const idxName = findColumn(headers, ['이용자명', '이용자성명', '이용자 명', '예약자', '신청자', '대출자'])
  const idxReqLib = findColumn(headers, ['요청도서관', '요청 도서관', '신청도서관', '수령도서관'])
  const idxReg = findColumn(headers, ['등록번호', '등록 번호', '자료등록번호'])
  const idxRoom = findColumn(headers, ['자료실', '소장위치', '배가위치', '서고'])
  const idxCall = findColumn(headers, ['청구기호', '청구 기호'])
  const idxTitle = findColumn(headers, ['서명', '도서명', '자료명', '책제목'])

  if (idxName === -1 && idxTitle === -1) return []

  const records: LoanRecord[] = []
  for (let i = headerRowIdx + 1; i < raw.length; i++) {
    const row = raw[i]
    if (!row || row.every((cell) => String(cell).trim() === '')) continue // 빈 행 무시

    const name = idxName !== -1 ? String(row[idxName] ?? '').trim() : ''
    const title = idxTitle !== -1 ? String(row[idxTitle] ?? '').trim() : ''

    // 이름과 서명 둘 다 비어있으면 무의미한 행
    if (!name && !title) continue

    const rawLibName = idxReqLib !== -1 ? String(row[idxReqLib] ?? '').trim() : ''
    records.push({
      이용자명: name,
      요청도서관: normalizeLibraryName(rawLibName),
      요청도서관_원본: rawLibName,
      등록번호: idxReg !== -1 ? String(row[idxReg] ?? '').trim() : '',
      자료실: idxRoom !== -1 ? String(row[idxRoom] ?? '').trim() : '',
      청구기호: idxCall !== -1 ? String(row[idxCall] ?? '').trim() : '',
      서명: title,
    })
  }
  return records
}

/** 행에서 키워드를 포함하는 셀이 있는지 확인 */
function matchesColumn(row: string[], keyword: string): boolean {
  return row.some((cell) => cell.includes(keyword))
}

/** 여러 가능한 컬럼명 중 매칭되는 인덱스 반환 */
function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h.replace(/\s/g, '').includes(candidate.replace(/\s/g, '')))
    if (idx !== -1) return idx
  }
  return -1
}
