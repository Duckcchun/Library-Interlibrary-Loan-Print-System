import type { LoanRecord } from '@/types/loan'

/**
 * "신착" 자료실로 인식할 키워드 목록.
 *
 * 자료실 이름에 이 단어들 중 하나라도 포함되면 신착 그룹으로 보고 맨 앞에 배치한다.
 * 도서관마다 신착 자료실 이름이 조금씩 달라도(예: "신착도서", "신간코너") 대응된다.
 *
 * 다른 도서관에서 새로운 표현을 쓴다면 여기에 단어만 추가하면 된다.
 */
const NEW_ARRIVAL_KEYWORDS = ['신착', '신간', '새책', '뉴북', '신규']

/** 자료실 이름이 신착 자료실인지 판별 */
function isNewArrival(room: string): boolean {
  if (!room) return false
  const normalized = room.replace(/\s/g, '')
  return NEW_ARRIVAL_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

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
 * 2순위: 신착 자료실 그룹이 그다음(맨 앞)
 * 3순위: 나머지는 자료실 이름 가나다순으로 묶기
 * 4순위: 같은 묶음 안에서는 청구기호 순 (분류번호 오름차순 → 저자기호 ㄱㄴㄷ순)
 */
export function sortByCallNumber(records: LoanRecord[]): LoanRecord[] {
  return [...records].sort((a, b) => {
    // 1) 예약전환 건을 맨 위로
    if (a.예약전환 !== b.예약전환) {
      return a.예약전환 ? -1 : 1
    }

    // 2) 신착 자료실을 그다음 우선순위로
    const aNew = isNewArrival(a.자료실)
    const bNew = isNewArrival(b.자료실)
    if (aNew !== bNew) {
      return aNew ? -1 : 1
    }

    // 3) 자료실 이름으로 묶기 (신착 그룹끼리는 이 단계에서 서로 가나다순, 나머지도 가나다순)
    //    같은 자료실 값은 항상 함께 모인다 — 신착 키워드 인식 여부와 무관.
    if (a.자료실 !== b.자료실) {
      return a.자료실.localeCompare(b.자료실, 'ko')
    }

    // 4) 같은 자료실 묶음 안에서 청구기호 순
    const keyA = extractSortKey(a.청구기호)
    const keyB = extractSortKey(b.청구기호)

    if (keyA.classification !== keyB.classification) {
      return keyA.classification - keyB.classification
    }

    return keyA.rest.localeCompare(keyB.rest, 'ko')
  })
}
