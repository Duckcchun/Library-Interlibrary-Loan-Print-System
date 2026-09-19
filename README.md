# 자양한강도서관 상호대차 인쇄 시스템

상호대차(ILL) 엑셀 파일을 업로드하면 A4 용지에 12장씩 카드 형태로 배치해 인쇄할 수 있는 웹 앱입니다.

## 기능

- `.xlsx`, `.xls` 파일 드래그 앤 드롭 또는 클릭 업로드
- 상호대차 양식의 헤더 행 자동 감지 (`이용자명`, `서명` 등)
- 제공도서관별 색상 구분 카드
- A4 페이지당 12장(3×4) 레이아웃
- 브라우저 인쇄 지원 (화면 UI는 인쇄 시 숨김)

## 로컬 실행

```bash
pnpm install
pnpm dev
```

## Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 로그인
2. **Add New… → Project**
3. `Library-Interlibrary-Loan-Print-System` 저장소 **Import**
4. 설정 확인 (자동 감지됨):
   - Framework: **Vite**
   - Build Command: `pnpm build`
   - Output Directory: `dist`
5. **Deploy** 클릭

이후 `main` 브랜치에 push할 때마다 자동으로 재배포됩니다.

`vercel.json`이 포함되어 있어 별도 설정 없이 바로 배포할 수 있습니다.

## 데이터 소스 정책

- 도서관 정보(이름·표시명·색상)의 **단일 진실 소스는 Supabase `libraries` 테이블**입니다.
- 관리자 패널의 추가/수정/삭제는 모두 Supabase에만 반영됩니다.
- `src/data/library-config.json`은 **Supabase 연결 실패 시에만 쓰이는 비상용 기본값**입니다. 관리자 변경 사항은 여기에 반영되지 않으므로 최신이 아닐 수 있습니다.

## 보안 설정 (중요)

관리자 쓰기(도서관 추가/수정/삭제)는 **DB에서 PIN을 검증**한 뒤에만 동작합니다. 최초 배포 시 아래 마이그레이션을 실행해야 합니다.

1. Supabase 대시보드 → **SQL Editor**
2. `supabase-schema.sql` 실행 (테이블 생성 — 최초 1회)
3. `supabase-security-migration.sql` 실행 (쓰기 차단 + PIN 검증 함수)
4. 기본 PIN(`1234`)을 변경:
   ```sql
   UPDATE app_config SET value = '새로운핀' WHERE key = 'admin_pin';
   ```

> 이 방식은 `libraries` 테이블의 직접 쓰기를 RLS로 차단하고, PIN을 아는 사람만 `admin_*` 함수를 통해 변경할 수 있게 합니다. PIN은 프론트엔드 번들에 포함되지 않습니다.

## 기술 스택

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- SheetJS (xlsx)
- @dnd-kit (카드 드래그앤드롭 재정렬)
