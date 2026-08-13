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

## 배포

이 프로젝트는 **백엔드 없는 정적 SPA**라서 빌드 결과물(`dist/`)만 호스팅하면 됩니다.

### 1. GitHub Pages (추천 — 무료, 이미 설정됨)

저장소에 GitHub Actions 워크플로가 포함되어 있습니다.

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions** 선택
3. `main` 브랜치에 push하면 자동 빌드·배포

배포 URL: `https://duckcchun.github.io/Library-Interlibrary-Loan-Print-System/`

### 2. Vercel (추천 — 가장 간단)

1. [vercel.com](https://vercel.com) → GitHub 연동
2. `Library-Interlibrary-Loan-Print-System` 저장소 Import
3. Framework: **Vite** (자동 감지) → Deploy

커스텀 도메인 연결, HTTPS, push마다 자동 배포가 기본 제공됩니다.

### 3. Netlify

Vercel과 동일하게 GitHub 연동 후 `pnpm build`, publish directory: `dist` 설정.

### 4. 사내 PC에서만 사용 (오프라인)

도서관 내부 PC에서만 쓸 경우:

```bash
pnpm build
pnpm preview   # 또는 dist/ 폴더를 간단한 HTTP 서버로 서빙
```

엑셀 파일은 브라우저에서만 처리되므로 서버 업로드 없이 **완전 로컬**로 동작합니다.

## 기술 스택

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- SheetJS (xlsx)
