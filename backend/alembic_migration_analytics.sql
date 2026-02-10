-- Analytics Dashboard Database Migration
-- Run this SQL script to create analytics tables

-- Create analytics_datasets table
CREATE TABLE IF NOT EXISTS analytics_datasets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    row_count INTEGER,
    column_count INTEGER,
    columns_info JSON,
    status VARCHAR(20) DEFAULT 'uploading',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_datasets_user_id ON analytics_datasets(user_id);

-- Create analytics_analyses table
CREATE TABLE IF NOT EXISTS analytics_analyses (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES analytics_datasets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,
    parameters JSON,
    results JSON,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_analyses_dataset_id ON analytics_analyses(dataset_id);
CREATE INDEX IF NOT EXISTS idx_analytics_analyses_user_id ON analytics_analyses(user_id);

-- Create analytics_charts table
CREATE TABLE IF NOT EXISTS analytics_charts (
    id SERIAL PRIMARY KEY,
    dataset_id INTEGER NOT NULL REFERENCES analytics_datasets(id) ON DELETE CASCADE,
    analysis_id INTEGER REFERENCES analytics_analyses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    chart_type VARCHAR(50) NOT NULL,
    config JSON NOT NULL,
    data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_charts_dataset_id ON analytics_charts(dataset_id);
CREATE INDEX IF NOT EXISTS idx_analytics_charts_analysis_id ON analytics_charts(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analytics_charts_user_id ON analytics_charts(user_id);

-- Create analytics_dashboards table
CREATE TABLE IF NOT EXISTS analytics_dashboards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSON,
    is_default INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_user_id ON analytics_dashboards(user_id);

-- Create analytics_dashboard_widgets table
CREATE TABLE IF NOT EXISTS analytics_dashboard_widgets (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER NOT NULL REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
    chart_id INTEGER NOT NULL REFERENCES analytics_charts(id) ON DELETE CASCADE,
    position JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_dashboard_widgets_dashboard_id ON analytics_dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboard_widgets_chart_id ON analytics_dashboard_widgets(chart_id);
