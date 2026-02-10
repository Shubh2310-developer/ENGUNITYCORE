-- =====================================================================
-- COMPREHENSIVE PERFORMANCE INDEXES FOR ENGUNITY AI PLATFORM
-- =====================================================================
-- Description: Optimized database indexes for all tables
-- Run this after initial deployment to improve query performance
-- Author: Full Stack Developer
-- Date: 2026-01-30
-- =====================================================================

-- =====================================================================
-- CHAT SYSTEM INDEXES
-- =====================================================================
-- Optimize chat session and message queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created ON chat_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at DESC);

-- =====================================================================
-- ANALYTICS SYSTEM INDEXES
-- =====================================================================
-- Analytics Datasets
CREATE INDEX IF NOT EXISTS idx_analytics_datasets_user_id ON analytics_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_datasets_created_at ON analytics_datasets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_datasets_status ON analytics_datasets(status);
CREATE INDEX IF NOT EXISTS idx_analytics_datasets_user_created ON analytics_datasets(user_id, created_at DESC);

-- Analytics Analyses
CREATE INDEX IF NOT EXISTS idx_analytics_analyses_dataset_id ON analytics_analyses(dataset_id);
CREATE INDEX IF NOT EXISTS idx_analytics_analyses_user_id ON analytics_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_analyses_status ON analytics_analyses(status);
CREATE INDEX IF NOT EXISTS idx_analytics_analyses_created_at ON analytics_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_analyses_completed_at ON analytics_analyses(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Analytics Charts
CREATE INDEX IF NOT EXISTS idx_analytics_charts_dataset_id ON analytics_charts(dataset_id);
CREATE INDEX IF NOT EXISTS idx_analytics_charts_analysis_id ON analytics_charts(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analytics_charts_user_id ON analytics_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_charts_created_at ON analytics_charts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_charts_chart_type ON analytics_charts(chart_type);

-- Analytics Dashboards
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_user_id ON analytics_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_created_at ON analytics_dashboards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_is_default ON analytics_dashboards(is_default) WHERE is_default = 1;

-- Analytics Dashboard Widgets
CREATE INDEX IF NOT EXISTS idx_analytics_widgets_dashboard_id ON analytics_dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_analytics_widgets_chart_id ON analytics_dashboard_widgets(chart_id);

-- Analytics Sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_dataset_id ON analytics_sessions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_created_at ON analytics_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_public ON analytics_sessions(is_public) WHERE is_public = 1;

-- =====================================================================
-- DECISION VAULT INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_decisions_user_id ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_updated_at ON decisions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_tags ON decisions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_decisions_user_created ON decisions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_user_status ON decisions(user_id, status);

-- =====================================================================
-- DOCUMENT MANAGEMENT INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_user_created ON documents(user_id, created_at DESC);

-- =====================================================================
-- IMAGE MANAGEMENT INDEXES
-- =====================================================================
-- Images table
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_context ON images(context);
CREATE INDEX IF NOT EXISTS idx_images_processing_status ON images(processing_status);
CREATE INDEX IF NOT EXISTS idx_images_user_created ON images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_user_context ON images(user_id, context);
-- GIN index for array tags search
CREATE INDEX IF NOT EXISTS idx_images_tags ON images USING GIN(tags);

-- Image Variants
CREATE INDEX IF NOT EXISTS idx_image_variants_image_id ON image_variants(image_id);
CREATE INDEX IF NOT EXISTS idx_image_variants_variant_type ON image_variants(variant_type);

-- =====================================================================
-- GITHUB REPOSITORY INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_github_repos_user_id ON github_repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_github_repos_created_at ON github_repositories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_github_repos_owner ON github_repositories(owner);
CREATE INDEX IF NOT EXISTS idx_github_repos_language ON github_repositories(language);
CREATE INDEX IF NOT EXISTS idx_github_repos_stars ON github_repositories(stars DESC);
CREATE INDEX IF NOT EXISTS idx_github_repos_user_created ON github_repositories(user_id, created_at DESC);

-- =====================================================================
-- USER MANAGEMENT INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;

-- =====================================================================
-- RESEARCH SYSTEM INDEXES (if research table exists)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_research_user_id ON research(user_id);
CREATE INDEX IF NOT EXISTS idx_research_created_at ON research(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_status ON research(status);

-- =====================================================================
-- CODE LAB INDEXES (if code_sessions table exists)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_code_sessions_user_id ON code_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_sessions_created_at ON code_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_sessions_language ON code_sessions(language);

-- =====================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =====================================================================
-- User activity across all features
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated ON chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_user_updated ON documents(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_user_updated ON decisions(user_id, updated_at DESC);

-- Status filtering with user
CREATE INDEX IF NOT EXISTS idx_analytics_datasets_user_status ON analytics_datasets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON documents(user_id, status);

-- =====================================================================
-- TEXT SEARCH INDEXES (for full-text search capabilities)
-- =====================================================================
-- Document content search (if content column exists)
-- CREATE INDEX IF NOT EXISTS idx_documents_content_search ON documents USING GIN(to_tsvector('english', content));
-- Decision content search
-- CREATE INDEX IF NOT EXISTS idx_decisions_content_search ON decisions USING GIN(to_tsvector('english', title || ' ' || description));

-- =====================================================================
-- VACUUM AND ANALYZE
-- =====================================================================
-- Update table statistics for query planner
VACUUM ANALYZE;

-- =====================================================================
-- VERIFICATION: Show all created indexes
-- =====================================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- =====================================================================
-- PERFORMANCE MONITORING QUERIES
-- =====================================================================
-- Check index usage statistics
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan as index_scans,
--     idx_tup_read as tuples_read,
--     idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Check table sizes with indexes
-- SELECT 
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
--     pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================================
-- END OF INDEX CREATION SCRIPT
-- =====================================================================
