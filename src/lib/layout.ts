/**
 * A4 인쇄 카드 레이아웃 상수
 *
 * A4 한 장을 3열 × 4행 = 12칸 그리드로 배치한다.
 * 이 값들은 App(페이지 분할)과 A4Page(그리드 렌더링)에서 공유된다.
 */
export const CARD_COLS = 3
export const CARD_ROWS = 4
export const CARDS_PER_PAGE = CARD_COLS * CARD_ROWS // 12
