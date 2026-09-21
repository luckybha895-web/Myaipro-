CREATE TABLE public.project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  version_number integer NOT NULL CHECK (version_number > 0),
  title text NOT NULL,
  description text,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_id text NOT NULL DEFAULT 'creative-ai-1.1',
  restored_from_version integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_versions TO authenticated;
GRANT ALL ON public.project_versions TO service_role;

ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project versions"
ON public.project_versions FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own project versions"
ON public.project_versions FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own project versions"
ON public.project_versions FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own project versions"
ON public.project_versions FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
  )
);

CREATE INDEX project_versions_project_created_idx
ON public.project_versions (project_id, created_at DESC);