-- =============================================
-- プロイ (PROAI) 初期スキーマ
-- =============================================

-- ユーザーロール
CREATE TYPE user_role AS ENUM ('worker', 'employer', 'admin');

-- 資格審査ステータス
CREATE TYPE qualification_status AS ENUM ('pending', 'approved', 'rejected');

-- 応募ステータス
CREATE TYPE application_status AS ENUM ('applied', 'accepted', 'rejected', 'cancelled', 'completed');

-- 案件ステータス
CREATE TYPE job_status AS ENUM ('draft', 'open', 'closed', 'done');

-- =============================================
-- profiles（auth.usersと1:1）
-- =============================================
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  phone        text,
  role         user_role NOT NULL DEFAULT 'worker',
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- qualifications（資格マスター）
-- =============================================
CREATE TABLE qualifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  category        text NOT NULL, -- 'driver' | 'special'
  icon            text NOT NULL,
  description     text,
  requires_renewal boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- user_qualifications（ユーザーの保有資格）
-- =============================================
CREATE TABLE user_qualifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qualification_id  uuid NOT NULL REFERENCES qualifications(id),
  certificate_url   text NOT NULL,
  issued_at         date NOT NULL,
  expires_at        date,
  status            qualification_status NOT NULL DEFAULT 'pending',
  reviewed_by       uuid REFERENCES profiles(id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, qualification_id)
);

-- =============================================
-- jobs（案件）
-- =============================================
CREATE TABLE jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text NOT NULL,
  location        text NOT NULL,
  prefecture      text NOT NULL,
  hourly_rate     integer NOT NULL,
  work_date       date NOT NULL,
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  slots           integer NOT NULL DEFAULT 1,
  status          job_status NOT NULL DEFAULT 'open',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- job_required_qualifications（案件の必須資格）
-- =============================================
CREATE TABLE job_required_qualifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  qualification_id  uuid NOT NULL REFERENCES qualifications(id),
  is_mandatory      boolean NOT NULL DEFAULT true,
  UNIQUE (job_id, qualification_id)
);

-- =============================================
-- job_tags（案件タグ）
-- =============================================
CREATE TABLE job_tags (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id  uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tag     text NOT NULL
);

-- =============================================
-- applications（応募）
-- =============================================
CREATE TABLE applications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      application_status NOT NULL DEFAULT 'applied',
  message     text,
  applied_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, worker_id)
);

-- =============================================
-- 残り枠数を計算するビュー
-- =============================================
CREATE VIEW jobs_with_remaining AS
SELECT
  j.*,
  j.slots - COUNT(a.id) FILTER (WHERE a.status IN ('applied', 'accepted')) AS remaining_slots
FROM jobs j
LEFT JOIN applications a ON a.job_id = j.id
GROUP BY j.id;

-- =============================================
-- 応募可否チェックビュー（資格が全て揃っているか）
-- =============================================
CREATE VIEW worker_eligible_jobs AS
SELECT DISTINCT
  j.id AS job_id,
  uq.user_id AS worker_id
FROM jobs j
JOIN job_required_qualifications jrq ON jrq.job_id = j.id AND jrq.is_mandatory = true
JOIN user_qualifications uq
  ON uq.qualification_id = jrq.qualification_id
  AND uq.status = 'approved'
  AND (uq.expires_at IS NULL OR uq.expires_at > CURRENT_DATE)
GROUP BY j.id, uq.user_id
HAVING COUNT(jrq.id) = COUNT(uq.id);

-- =============================================
-- updated_at 自動更新トリガー
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 新規ユーザー登録時に自動でprofileを作成
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'worker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
