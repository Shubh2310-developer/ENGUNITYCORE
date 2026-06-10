import pytest
import pandas as pd
import numpy as np
from app.services.analytics.data_processor import data_processor, DataProcessor
from app.services.analytics.ml_service import ml_service, MLService

@pytest.mark.asyncio
async def test_data_processor_async_methods():
    csv_bytes = b"col1,col2\n1,a\n2,b\n3,c\n4,\n"
    df = await data_processor.read_file(csv_bytes, 'csv')
    assert len(df) == 4
    assert list(df.columns) == ['col1', 'col2']

    # Test JSON
    json_bytes = b'[{"col1": 1, "col2": "a"}, {"col1": 2, "col2": "b"}]'
    df_json = await data_processor.read_file(json_bytes, 'json')
    assert len(df_json) == 2

    # Unsupported format
    with pytest.raises(ValueError, match="Unsupported file type"):
        await data_processor.read_file(csv_bytes, 'unknown')

def test_data_processor_sync_methods():
    df = pd.DataFrame({
        'num1': [10.0, 20.0, 30.0, 100.0, None],
        'num2': [1, 2, 3, 4, 5],
        'cat1': ['A', 'A', 'B', 'B', 'C'],
        'cat2': ['x', 'y', 'x', 'y', 'z']
    })

    # 1. Column info
    info = data_processor.get_column_info(df)
    assert len(info) == 4
    assert info[0]['name'] == 'num1'
    assert info[0]['null_count'] == 1
    assert info[0]['unique_count'] == 4

    # 2. Descriptive statistics
    stats = data_processor.get_descriptive_statistics(df)
    assert stats['summary']['total_rows'] == 5
    assert stats['summary']['total_columns'] == 4
    assert stats['missing_values']['num1'] == 1

    # 3. Correlation
    corr = data_processor.get_correlation_matrix(df)
    assert 'columns' in corr
    assert len(corr['columns']) == 2 # num1, num2

    # 4. Outliers
    outliers_iqr = data_processor.detect_outliers(df, 'num1', method='iqr')
    assert outliers_iqr['outlier_count'] == 1
    assert outliers_iqr['outliers'] == [100.0]

    outliers_z = data_processor.detect_outliers(df, 'num1', method='zscore')
    assert 'outlier_count' in outliers_z

    # Error handling
    err_col = data_processor.detect_outliers(df, 'missing_col')
    assert 'error' in err_col
    err_type = data_processor.detect_outliers(df, 'cat1')
    assert 'error' in err_type

    # 5. Filter data
    filters = [
        {'column': 'num2', 'operator': 'greater_than', 'value': 2},
        {'column': 'cat1', 'operator': 'equals', 'value': 'B'}
    ]
    filtered = data_processor.filter_data(df, filters)
    assert len(filtered) == 2
    assert list(filtered['num2']) == [3, 4]

    # 6. Aggregate data
    agg = data_processor.aggregate_data(df, group_by=['cat1'], agg_functions={'num2': 'sum'})
    assert len(agg) == 3
    assert agg.loc[agg['cat1'] == 'A', 'num2'].values[0] == 3

def test_prepare_chart_data():
    df = pd.DataFrame({
        'x': [1, 2, 3],
        'y': [10, 20, 30],
        'label': ['A', 'B', 'C']
    })

    # Line/Area chart
    line_data = data_processor.prepare_chart_data(df, 'line', {'x_axis': 'x', 'y_axis': ['y']})
    assert line_data['xKey'] == 'x'
    assert len(line_data['data']) == 3

    # Bar chart
    bar_data = data_processor.prepare_chart_data(df, 'bar', {'x_axis': 'label', 'y_axis': ['y']})
    assert bar_data['xKey'] == 'label'

    # Pie chart
    pie_data = data_processor.prepare_chart_data(df, 'pie', {'name_column': 'label', 'value_column': 'y'})
    assert len(pie_data['data']) == 3
    assert pie_data['data'][0]['name'] == 'A'

    # Scatter chart
    scatter_data = data_processor.prepare_chart_data(df, 'scatter', {'x_axis': 'x', 'y_axis': 'y'})
    assert scatter_data['xKey'] == 'x'

    # Heatmap
    heatmap_data = data_processor.prepare_chart_data(df, 'heatmap', {})
    assert 'data' in heatmap_data

    # Histogram
    hist_data = data_processor.prepare_chart_data(df, 'histogram', {'column': 'y', 'bins': 2})
    assert len(hist_data['data']) == 2

    # Box plot
    box_data = data_processor.prepare_chart_data(df, 'box', {'column': 'y', 'group_by': 'label'})
    assert len(box_data['data']) == 3

@pytest.mark.asyncio
async def test_ml_service_lifecycle():
    # Construct a dataset suitable for regression, classification and clustering
    np.random.seed(42)
    n_samples = 100
    df = pd.DataFrame({
        'feat1': np.random.randn(n_samples),
        'feat2': np.random.randn(n_samples) * 5 + 2,
        'cat_feat': np.random.choice(['small', 'medium', 'large'], size=n_samples),
        'target_reg': np.random.randn(n_samples) * 2,
        'target_clf': np.random.choice([0, 1], size=n_samples)
    })
    df['target_reg'] += df['feat1'] * 3.5 + df['feat2'] * 0.8

    # 1. Feature preparation
    X, y = ml_service.prepare_features(df, ['feat1', 'feat2', 'cat_feat'], 'target_reg')
    assert X.shape == (100, 3)
    assert y.shape == (100,)
    assert X['cat_feat'].dtype in [np.int32, np.int64] # encoded

    # 2. Regression
    reg_results = await ml_service.train_regression(
        df, 'target_reg', ['feat1', 'feat2', 'cat_feat'], model_type='linear'
    )
    assert 'error' not in reg_results
    assert reg_results['model_type'] == 'linear'
    assert 'train_metrics' in reg_results
    assert 'r2' in reg_results['test_metrics']

    # Test other model types
    for m_type in ['ridge', 'lasso', 'elasticnet', 'random_forest', 'gradient_boosting']:
        res = await ml_service.train_regression(
            df, 'target_reg', ['feat1', 'feat2'], model_type=m_type
        )
        assert 'error' not in res

    # 3. Classification
    clf_results = await ml_service.train_classification(
        df, 'target_clf', ['feat1', 'feat2', 'cat_feat'], model_type='logistic'
    )
    assert 'error' not in clf_results
    assert clf_results['model_type'] == 'logistic'
    assert 'confusion_matrix' in clf_results

    for m_type in ['decision_tree', 'random_forest', 'svm', 'gradient_boosting']:
        res = await ml_service.train_classification(
            df, 'target_clf', ['feat1', 'feat2'], model_type=m_type
        )
        assert 'error' not in res

    # 4. Clustering
    clust_results = await ml_service.perform_clustering(
        df, ['feat1', 'feat2'], n_clusters=3, algorithm='kmeans'
    )
    assert 'error' not in clust_results
    assert clust_results['algorithm'] == 'kmeans'
    assert len(clust_results['cluster_sizes']) == 3

    for algo in ['dbscan', 'hierarchical']:
        res = await ml_service.perform_clustering(
            df, ['feat1', 'feat2'], algorithm=algo
        )
        assert 'error' not in res

    # 5. Generate insights
    insights = await ml_service.generate_insights(df)
    assert len(insights) >= 1
    assert 'type' in insights[0]
