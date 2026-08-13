# 자양한강도서관 상호대차 인쇄 시스템

상호대차(ILL) 엑셀 파일을 업로드하면 A4 용지에 12장씩 카드 형태로 배치해 인쇄할 수 있는 웹 앱입니다.

## 기능

- `.xlsx`, `.xls` 파일 드래그 앤 드롭 또는 클릭 업로드
- 상호대차 양식의 헤더 행 자동 감지 (`이용자명`, `서명` 등)
- 제공도서관별 색상 구분 카드
- A4 페이지당 12장(3×4) 레이아웃
- 브라우저 인쇄 지원 (화면 UI는 인쇄 시 숨김)

## 실행 방법

```bash
pnpm install
pnpm dev
```

빌드:

```bash
pnpm build
pnpm preview
```

## 기술 스택

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- SheetJS (xlsx)
