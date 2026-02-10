import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
import io
import json
from datetime import datetime


class DataProcessor:
    """Service for processing and analyzing datasets"""
    
    def __init__(self):
        self.supported_formats = ['csv', 'excel', 'json']
    
    async def read_file(self, file_content: bytes, file_type: str) -> pd.DataFrame:
        """Read file content into pandas DataFrame"""
        try:
            if file_type == 'csv':
                df = pd.read_csv(io.BytesIO(file_content))
            elif file_type in ['excel', 'xlsx', 'xls']:
                df = pd.read_excel(io.BytesIO(file_content))
            elif file_type == 'json':
                df = pd.read_json(io.BytesIO(file_content))
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            return df
        except Exception as e:
            raise ValueError(f"Error reading file: {str(e)}")
    
    def get_column_info(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Extract column information from DataFrame"""
        columns_info = []
        
        for col in df.columns:
            info = {
                'name': col,
                'dtype': str(df[col].dtype),
                'null_count': int(df[col].isnull().sum()),
                'unique_count': int(df[col].nunique()),
                'sample_values': df[col].dropna().head(5).tolist()
            }
            columns_info.append(info)
        
        return columns_info
    
    def get_descriptive_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate descriptive statistics for the dataset"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        stats = {
            'summary': {
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'numeric_columns': len(numeric_cols),
                'categorical_columns': len(categorical_cols),
                'memory_usage': int(df.memory_usage(deep=True).sum())
            },
            'numeric_stats': {},
            'categorical_stats': {},
            'missing_values': {}
        }
        
        # Numeric statistics
        if numeric_cols:
            numeric_desc = df[numeric_cols].describe().to_dict()
            stats['numeric_stats'] = numeric_desc
        
        # Categorical statistics
        if categorical_cols:
            cat_stats = {}
            for col in categorical_cols[:10]:  # Limit to first 10 categorical columns
                value_counts = df[col].value_counts().head(10).to_dict()
                cat_stats[col] = {
                    'unique_count': int(df[col].nunique()),
                    'top_values': value_counts
                }
            stats['categorical_stats'] = cat_stats
        
        # Missing values
        missing = df.isnull().sum()
        stats['missing_values'] = {col: int(count) for col, count in missing.items() if count > 0}
        
        return stats
    
    def get_correlation_matrix(self, df: pd.DataFrame, method: str = 'pearson') -> Dict[str, Any]:
        """Calculate correlation matrix for numeric columns"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            return {'error': 'No numeric columns found'}
        
        corr_matrix = numeric_df.corr(method=method)
        
        return {
            'columns': corr_matrix.columns.tolist(),
            'data': corr_matrix.values.tolist(),
            'method': method
        }
    
    def detect_outliers(self, df: pd.DataFrame, column: str, method: str = 'iqr') -> Dict[str, Any]:
        """Detect outliers in a numeric column"""
        if column not in df.columns:
            return {'error': f'Column {column} not found'}
        
        if not pd.api.types.is_numeric_dtype(df[column]):
            return {'error': f'Column {column} is not numeric'}
        
        col_data = df[column].dropna()
        
        if method == 'iqr':
            Q1 = col_data.quantile(0.25)
            Q3 = col_data.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            outliers = col_data[(col_data < lower_bound) | (col_data > upper_bound)]
        elif method == 'zscore':
            z_scores = np.abs((col_data - col_data.mean()) / col_data.std())
            outliers = col_data[z_scores > 3]
        else:
            return {'error': f'Unknown method: {method}'}
        
        return {
            'column': column,
            'method': method,
            'outlier_count': len(outliers),
            'outlier_percentage': (len(outliers) / len(col_data)) * 100,
            'outliers': outliers.tolist()[:100]  # Limit to first 100
        }
    
    def filter_data(self, df: pd.DataFrame, filters: List[Dict[str, Any]]) -> pd.DataFrame:
        """Apply filters to DataFrame"""
        filtered_df = df.copy()
        
        for f in filters:
            column = f.get('column')
            operator = f.get('operator')
            value = f.get('value')
            
            if column not in filtered_df.columns:
                continue
            
            if operator == 'equals':
                filtered_df = filtered_df[filtered_df[column] == value]
            elif operator == 'not_equals':
                filtered_df = filtered_df[filtered_df[column] != value]
            elif operator == 'greater_than':
                filtered_df = filtered_df[filtered_df[column] > value]
            elif operator == 'less_than':
                filtered_df = filtered_df[filtered_df[column] < value]
            elif operator == 'contains':
                filtered_df = filtered_df[filtered_df[column].astype(str).str.contains(str(value), na=False)]
        
        return filtered_df
    
    def aggregate_data(self, df: pd.DataFrame, group_by: List[str], agg_functions: Dict[str, str]) -> pd.DataFrame:
        """Aggregate data by grouping"""
        if not group_by or not agg_functions:
            return df
        
        # Validate columns exist
        for col in group_by:
            if col not in df.columns:
                raise ValueError(f"Column {col} not found")
        
        for col in agg_functions.keys():
            if col not in df.columns:
                raise ValueError(f"Column {col} not found")
        
        return df.groupby(group_by).agg(agg_functions).reset_index()
    
    def prepare_chart_data(self, df: pd.DataFrame, chart_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare data for different chart types"""
        
        if chart_type == 'line' or chart_type == 'area':
            x_col = config.get('x_axis')
            y_cols = config.get('y_axis', [])
            
            if not x_col or not y_cols:
                raise ValueError("x_axis and y_axis are required for line charts")
            
            data = []
            for _, row in df.iterrows():
                point = {x_col: row[x_col]}
                for y_col in y_cols:
                    point[y_col] = float(row[y_col]) if pd.notna(row[y_col]) else None
                data.append(point)
            
            return {'data': data, 'xKey': x_col, 'yKeys': y_cols}
        
        elif chart_type == 'bar' or chart_type == 'column':
            x_col = config.get('x_axis')
            y_cols = config.get('y_axis', [])
            
            if not x_col or not y_cols:
                raise ValueError("x_axis and y_axis are required for bar/column charts")
            
            data = []
            for _, row in df.iterrows():
                point = {x_col: str(row[x_col])}
                for y_col in y_cols:
                    point[y_col] = float(row[y_col]) if pd.notna(row[y_col]) else 0
                data.append(point)
            
            return {'data': data, 'xKey': x_col, 'yKeys': y_cols}
        
        elif chart_type == 'pie' or chart_type == 'donut':
            name_col = config.get('name_column')
            value_col = config.get('value_column')
            
            if not name_col or not value_col:
                # Fallback: try x_axis and y_axis for compatibility
                name_col = config.get('x_axis')
                y_cols = config.get('y_axis', [])
                if name_col and y_cols:
                    value_col = y_cols[0] if isinstance(y_cols, list) else y_cols
                else:
                    raise ValueError("name_column and value_column (or x_axis and y_axis) are required for pie/donut charts")
            
            data = []
            for _, row in df.iterrows():
                data.append({
                    'name': str(row[name_col]),
                    'value': float(row[value_col]) if pd.notna(row[value_col]) else 0
                })
            
            return {'data': data}
        
        elif chart_type == 'scatter':
            x_col = config.get('x_axis')
            y_col = config.get('y_axis')

            if not x_col or not y_col:
                raise ValueError("x_axis and y_axis are required for scatter plots")

            # Handle if y_col is a list
            if isinstance(y_col, list):
                if len(y_col) > 0:
                    y_col = y_col[0]
                else:
                    raise ValueError("y_axis cannot be empty for scatter plots")

            data = []
            for _, row in df.iterrows():
                if pd.notna(row[x_col]) and pd.notna(row[y_col]):
                    data.append({
                        x_col: float(row[x_col]),
                        y_col: float(row[y_col])
                    })

            return {'data': data, 'xKey': x_col, 'yKey': y_col}
        
        elif chart_type == 'heatmap':
            # Assume correlation matrix or pivot table
            x_cols = config.get('x_columns', df.select_dtypes(include=[np.number]).columns.tolist())
            
            corr_matrix = df[x_cols].corr()
            data = []
            
            for i, row_name in enumerate(corr_matrix.index):
                for j, col_name in enumerate(corr_matrix.columns):
                    data.append({
                        'x': col_name,
                        'y': row_name,
                        'value': float(corr_matrix.iloc[i, j])
                    })
            
            return {'data': data}
        
        elif chart_type == 'histogram':
            column = config.get('column')
            bins = config.get('bins', 10)

            if not column:
                raise ValueError("column is required for histogram")

            hist, bin_edges = np.histogram(df[column].dropna(), bins=bins)

            data = []
            for i in range(len(hist)):
                data.append({
                    'range': f"{bin_edges[i]:.2f}-{bin_edges[i+1]:.2f}",
                    'count': int(hist[i])
                })

            return {'data': data}

        elif chart_type == 'box':
            column = config.get('column')
            group_by = config.get('group_by')

            if not column:
                raise ValueError("column is required for box plot")

            if group_by and group_by in df.columns:
                data = []
                for name, group in df.groupby(group_by):
                    col_data = group[column].dropna()
                    if not col_data.empty:
                        data.append({
                            'name': str(name),
                            'min': float(col_data.min()),
                            'q1': float(col_data.quantile(0.25)),
                            'median': float(col_data.median()),
                            'q3': float(col_data.quantile(0.75)),
                            'max': float(col_data.max())
                        })
                return {'data': data}
            else:
                col_data = df[column].dropna()
                if col_data.empty:
                    return {'data': []}
                return {
                    'data': [{
                        'name': column,
                        'min': float(col_data.min()),
                        'q1': float(col_data.quantile(0.25)),
                        'median': float(col_data.median()),
                        'q3': float(col_data.quantile(0.75)),
                        'max': float(col_data.max())
                    }]
                }

        else:
            raise ValueError(f"Unsupported chart type: {chart_type}")


# Global instance
data_processor = DataProcessor()
