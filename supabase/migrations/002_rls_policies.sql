-- =============================================
-- Row Level Security ポリシー
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_required_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "自分のプロフィールは参照・更新可能"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "他のユーザーのプロフィールは読み取り専用"
  ON profiles FOR SELECT
  USING (true);

-- qualifications（マスターデータ：全員が読める）
CREATE POLICY "資格マスターは誰でも読める"
  ON qualifications FOR SELECT
  USING (true);

CREATE POLICY "管理者のみ資格マスターを変更可能"
  ON qualifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- user_qualifications
CREATE POLICY "自分の資格は参照・登録可能"
  ON user_qualifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "自分の資格を新規登録"
  ON user_qualifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "管理者は全ての資格を参照・審査可能"
  ON user_qualifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- jobs
CREATE POLICY "公開中の案件は誰でも参照可能"
  ON jobs FOR SELECT
  USING (status = 'open' OR employer_id = auth.uid());

CREATE POLICY "雇用主は自分の案件を作成・更新可能"
  ON jobs FOR INSERT
  WITH CHECK (
    employer_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('employer', 'admin'))
  );

CREATE POLICY "雇用主は自分の案件を更新可能"
  ON jobs FOR UPDATE
  USING (employer_id = auth.uid());

-- job_required_qualifications
CREATE POLICY "必須資格は誰でも参照可能"
  ON job_required_qualifications FOR SELECT
  USING (true);

CREATE POLICY "雇用主は自分の案件の必須資格を管理可能"
  ON job_required_qualifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND employer_id = auth.uid())
  );

-- job_tags
CREATE POLICY "タグは誰でも参照可能"
  ON job_tags FOR SELECT
  USING (true);

CREATE POLICY "雇用主は自分の案件のタグを管理可能"
  ON job_tags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND employer_id = auth.uid())
  );

-- applications
CREATE POLICY "自分の応募は参照可能"
  ON applications FOR SELECT
  USING (worker_id = auth.uid());

CREATE POLICY "雇用主は自社案件への応募を参照可能"
  ON applications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND employer_id = auth.uid())
  );

CREATE POLICY "承認済み資格があれば応募可能"
  ON applications FOR INSERT
  WITH CHECK (
    worker_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM worker_eligible_jobs
      WHERE job_id = applications.job_id AND worker_id = auth.uid()
    )
  );

CREATE POLICY "自分の応募をキャンセル可能"
  ON applications FOR UPDATE
  USING (worker_id = auth.uid() AND status = 'applied')
  WITH CHECK (status = 'cancelled');

CREATE POLICY "雇用主は応募ステータスを更新可能"
  ON applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND employer_id = auth.uid())
  );
