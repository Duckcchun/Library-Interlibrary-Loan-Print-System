-- 광진구립도서관 상호대차 인쇄 시스템 - Supabase 테이블 스키마
-- Supabase 대시보드의 SQL Editor에서 실행하세요.

CREATE TABLE IF NOT EXISTS libraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,          -- 엑셀에 표시되는 원본 도서관명
  display_name TEXT NOT NULL,          -- 카드에 표시될 짧은 이름
  color TEXT NOT NULL DEFAULT '#6366F1', -- 배지 색상 (HEX)
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'smart')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 도서관 데이터 삽입
INSERT INTO libraries (name, display_name, color, type, sort_order) VALUES
  ('광진정보도서관', '광진정보도서관', '#044984', 'general', 0),
  ('자양한강도서관', '한강도서관', '#e8630f', 'general', 1),
  ('중곡문화체육센터도서관', '중곡도서관', '#406d0f', 'general', 2),
  ('자양제4동도서관', '자양4동도서관', '#d9c000', 'general', 3),
  ('구의제3동도서관', '구의3동도서관', '#6969be', 'general', 4),
  ('군자동도서관', '군자동도서관', '#e591ab', 'general', 5),
  ('아차산숲속도서관', '아차산숲속', '#487497', 'general', 6),
  ('광진어린이영어도서관', '어린이영어', '#e84b4b', 'general', 7),
  ('군자역스마트도서관', '군자역 스마트', '#8bbeeb', 'smart', 8),
  ('중곡스마트도서관', '중곡 스마트', '#abe46e', 'smart', 9),
  ('구의역스마트도서관', '구의역 스마트', '#8bbeeb', 'smart', 10),
  ('광진구민체육센터스마트도서관', '구민체육센터 스마트', '#8bbeeb', 'smart', 11),
  ('광진문화예술회관스마트도서관', '문화예술회관 스마트', '#f4ac80', 'smart', 12),
  ('어린이대공원역스마트도서관', '어린이대공원 스마트', '#f4ac80', 'smart', 13),
  ('아차산역스마트도서관', '아차산역 스마트', '#abe46e', 'smart', 14)
ON CONFLICT (name) DO NOTHING;

-- RLS (Row Level Security) 설정
-- 모든 사용자가 읽기 가능, 쓰기도 허용 (PIN 인증은 클라이언트에서 처리)
ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read libraries"
  ON libraries FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert libraries"
  ON libraries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update libraries"
  ON libraries FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete libraries"
  ON libraries FOR DELETE
  USING (true);
