-- Enable Row Level Security on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- 1. Users Table: A user can only see and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id::text = auth.jwt()->>'sub');

-- 2. Chat Sessions: Owner-only access
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
    FOR SELECT USING (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can insert own chat sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
    FOR UPDATE USING (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can delete own chat sessions" ON public.chat_sessions
    FOR DELETE USING (user_id::text = auth.jwt()->>'sub');

-- 3. Chat Messages: Accessed via their session's ownership
CREATE POLICY "Users can view messages from own sessions" ON public.chat_messages
    FOR SELECT USING (
        session_id IN (SELECT id FROM public.chat_sessions WHERE user_id::text = auth.jwt()->>'sub')
    );

CREATE POLICY "Users can insert messages to own sessions" ON public.chat_messages
    FOR INSERT WITH CHECK (
        session_id IN (SELECT id FROM public.chat_sessions WHERE user_id::text = auth.jwt()->>'sub')
    );

-- 4. Documents: Owner-only access
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (user_id::text = auth.jwt()->>'sub');

-- 5. Document Links: Accessed via the document's ownership
CREATE POLICY "Users can view links for own documents" ON public.document_links
    FOR SELECT USING (
        document_id IN (SELECT id FROM public.documents WHERE user_id::text = auth.jwt()->>'sub')
    );

CREATE POLICY "Users can manage links for own documents" ON public.document_links
    FOR ALL USING (
        document_id IN (SELECT id FROM public.documents WHERE user_id::text = auth.jwt()->>'sub')
    );

-- 6. Research Papers: Owner-only access
CREATE POLICY "Users can view own research papers" ON public.research_papers
    FOR SELECT USING (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can manage own research papers" ON public.research_papers
    FOR ALL USING (user_id::text = auth.jwt()->>'sub');

-- 7. Code Projects: Owner-only access
CREATE POLICY "Users can view own code projects" ON public.code_projects
    FOR SELECT USING (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can manage own code projects" ON public.code_projects
    FOR ALL USING (user_id::text = auth.jwt()->>'sub');

-- 8. Code Files: Accessed via the project's ownership
CREATE POLICY "Users can view files for own projects" ON public.code_files
    FOR SELECT USING (
        project_id IN (SELECT id FROM public.code_projects WHERE user_id::text = auth.jwt()->>'sub')
    );

CREATE POLICY "Users can manage files for own projects" ON public.code_files
    FOR ALL USING (
        project_id IN (SELECT id FROM public.code_projects WHERE user_id::text = auth.jwt()->>'sub')
    );

-- 9. GitHub Repositories: Owner-only access
CREATE POLICY "Users can view own github repos" ON public.github_repositories
    FOR SELECT USING (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can manage own github repos" ON public.github_repositories
    FOR ALL USING (user_id::text = auth.jwt()->>'sub');

-- 10. Decisions: Owner-only access
CREATE POLICY "Users can view own decisions" ON public.decisions
    FOR SELECT USING (user_id::text = auth.jwt()->>'sub');

CREATE POLICY "Users can manage own decisions" ON public.decisions
    FOR ALL USING (user_id::text = auth.jwt()->>'sub');
