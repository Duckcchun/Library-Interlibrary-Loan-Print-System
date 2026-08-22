import type { LoanRecord } from '@/types/loan'

/**
 * 청구기호 정렬을 위한 비교 키 추출
 *
 * 청구기호 구조 예시: "한 808.3-ㅅ374미-88", "한서 982.02-ㅇ582ㅇ-2=2"
 * 정렬 기준: 분류번호(숫자) 우선 → 같으면 저자기호(한글 ㄱㄴㄷ순)
 */
function extractSortKey(callNumber: string): { classification: number; rest: string } {
  if (!callNumber) return { classification: Infinity, rest: '' }

  // 앞의 자료구분(한, 한서, 아 등) 제거하고 분류번호 부분 추출
  const match = callNumber.match(/(\d+\.?\d*)/)
  const classification = match ? parseFloat(match[1]) : Infinity
  // 분류번호 이후 전체를 rest로 사용 (저자기호 + 나머지)
  const restStart = match ? callNumber.indexOf(match[0]) + match[0].length : 0
  const rest = callNumber.slice(restStart).trim()

  return { classification, rest }
}

/**
 * 레코드를 정렬
 * 1순위: 예약전환 건이 맨 위
 * 2순위: 청구기호 순 (분류번호 오름차순 → 저자기호 ㄱㄴㄷ순)
 */
export function sortByCallNumber(records: LoanRecord[]): LoanRecord[] {
  return [...records].sort((a, b) => {
    // 예약전환 건을 맨 위로
    if (a.예약전환 !== b.예약전환) {
      return a.예약전환 ? -1 : 1
    }

    const keyA = extractSortKey(a.청구기호)
    const keyB = extractSortKey(b.청구기호)

    // 분류번호 숫자 비교
    if (keyA.classification !== keyB.classification) {
      return keyA.classification - keyB.classification
    }

    // 나머지 부분 한글 사전순 비교
    return keyA.rest.localeCompare(keyB.rest, 'ko')
  })
}
