-- ============================================================================
-- 보안 강화 마이그레이션
-- ----------------------------------------------------------------------------
-- 목적: 기존에는 libraries 테이블의 INSERT/UPDATE/DELETE가 anon(익명) 키로
--       누구나 가능했다(RLS가 USING(true)). anon 키는 프론트엔드 번들에
--       그대로 노출되므로, 사실상 아무나 데이터를 조작할 수 있었다.
--
-- 방식: 읽기(SELECT)만 공개로 두고, 쓰기는 전부 차단한다.
--       쓰기는 PIN을 인자로 받아 "DB 안에서" 검증하는 SECURITY DEFINER 함수를
--       통해서만 수행한다. PIN은 클라이언트가 아니라 서버(DB)에서 대조되므로
--       anon 키만으로는 데이터를 변경할 수 없다.
--
-- 실행: Supabase 대시보드 > SQL Editor 에서 "이 파일 전체"를 붙여넣고 실행하세요.
--       (테이블이 없다면 supabase-schema.sql 로 먼저 테이블을 만든 뒤 실행)
--
--       이 스크립트는 멱등(idempotent)합니다 — 여러 번 실행해도 에러 없이
--       동일한 결과가 됩니다. 이전에 일부만 실행돼 에러가 났더라도,
--       이 파일 전체를 다시 한 번 실행하면 깔끔하게 정리됩니다.
--
-- 주의: 옛 supabase-schema.sql 하단의 "Anyone can insert/update/delete" 정책과는
--       충돌하지 않습니다. 이 파일이 해당 정책을 DROP 후 재구성하기 때문입니다.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) 관리자 PIN 저장용 설정 테이블
--    - 프론트엔드 번들에 PIN을 넣지 않고 DB에만 보관한다.
--    - RLS로 SELECT/쓰기를 모두 막아, anon 키로는 값을 읽을 수도 없다.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
-- 정책을 하나도 만들지 않으면 anon/authenticated 는 접근 불가(기본 거부).
-- SECURITY DEFINER 함수만 소유자 권한으로 이 테이블을 읽는다.

-- 초기 PIN 설정 (기존 기본값 1234와 동일하게 두되, 배포 후 반드시 변경 권장)
INSERT INTO app_config (key, value)
VALUES ('admin_pin', '1234')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2) libraries 테이블 RLS 재설정: 읽기만 공개, 쓰기는 차단
-- ----------------------------------------------------------------------------
ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;

-- 기존의 개방형 정책 제거
DROP POLICY IF EXISTS "Anyone can read libraries" ON libraries;
DROP POLICY IF EXISTS "Anyone can insert libraries" ON libraries;
DROP POLICY IF EXISTS "Anyone can update libraries" ON libraries;
DROP POLICY IF EXISTS "Anyone can delete libraries" ON libraries;

-- 읽기만 공개 (카드 색상/표시명은 모두가 조회 가능해야 함)
-- 이미 있으면 지우고 다시 만든다 → 여러 번 실행해도 안전(멱등)
DROP POLICY IF EXISTS "Public read libraries" ON libraries;
CREATE POLICY "Public read libraries"
  ON libraries FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE 정책은 만들지 않는다 → anon/authenticated 직접 쓰기 전면 차단.
-- (쓰기는 아래 SECURITY DEFINER 함수를 통해서만 수행)

-- ----------------------------------------------------------------------------
-- 3) PIN 검증 헬퍼 (내부용)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_admin_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  SELECT value INTO stored_pin FROM app_config WHERE key = 'admin_pin';
  RETURN stored_pin IS NOT NULL AND stored_pin = p_pin;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4) 쓰기 함수들 (PIN 검증 후에만 동작)
-- ----------------------------------------------------------------------------

-- 4-1) 도서관 추가
CREATE OR REPLACE FUNCTION admin_add_library(
  p_pin TEXT,
  p_name TEXT,
  p_display_name TEXT,
  p_color TEXT,
  p_type TEXT,
  p_sort_order INTEGER
)
RETURNS libraries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_row libraries;
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'INVALID_PIN' USING ERRCODE = '28000';
  END IF;

  INSERT INTO libraries (name, display_name, color, type, sort_order)
  VALUES (p_name, p_display_name, p_color, p_type, p_sort_order)
  RETURNING * INTO new_row;

  RETURN new_row;
END;
$$;

-- 4-2) 도서관 수정 (표시명/색상)
CREATE OR REPLACE FUNCTION admin_update_library(
  p_pin TEXT,
  p_id UUID,
  p_display_name TEXT,
  p_color TEXT
)
RETURNS libraries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row libraries;
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'INVALID_PIN' USING ERRCODE = '28000';
  END IF;

  UPDATE libraries
  SET display_name = p_display_name, color = p_color
  WHERE id = p_id
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

-- 4-3) 도서관 삭제
CREATE OR REPLACE FUNCTION admin_delete_library(
  p_pin TEXT,
  p_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT verify_admin_pin(p_pin) THEN
    RAISE EXCEPTION 'INVALID_PIN' USING ERRCODE = '28000';
  END IF;

  DELETE FROM libraries WHERE id = p_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5) 권한 정리
--    - anon/authenticated 는 쓰기 함수와 PIN 검증 함수만 실행 가능.
--    - app_config 테이블에는 직접 접근 불가(함수 내부에서만 사용).
-- ----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION verify_admin_pin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_admin_pin(TEXT) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION admin_add_library(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_update_library(TEXT, UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_library(TEXT, UUID) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- PIN 변경 방법 (SQL Editor에서 실행):
--   UPDATE app_config SET value = '새로운핀' WHERE key = 'admin_pin';
-- ----------------------------------------------------------------------------
