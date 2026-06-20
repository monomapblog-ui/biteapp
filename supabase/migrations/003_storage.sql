-- =============================================
-- Storage バケット設定（Supabase Dashboard で実行）
-- =============================================

-- 資格証書用プライベートバケット
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,  -- プライベート（署名付きURLのみアクセス可）
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- アバター用パブリックバケット
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- certificates バケットのRLS
CREATE POLICY "自分の証書のみアップロード可能"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "自分の証書を参照可能"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "管理者は全証書を参照可能"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- avatars バケットのRLS
CREATE POLICY "自分のアバターをアップロード・更新可能"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
