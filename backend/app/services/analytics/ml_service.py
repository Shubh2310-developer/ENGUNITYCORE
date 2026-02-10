import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.metrics import (
    mean_squared_error, r2_score, mean_absolute_error,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
    silhouette_score, davies_bouldin_score
)
import pickle
import io
from datetime import datetime


class MLService:
    """Service for machine learning operations"""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
    
    def prepare_features(self, df: pd.DataFrame, feature_columns: List[str], target_column: Optional[str] = None) -> Tuple[pd.DataFrame, Optional[pd.Series]]:
        """Prepare features for ML by handling missing values and encoding"""
        # Select feature columns
        X = df[feature_columns].copy()
        
        # Handle missing values
        for col in X.columns:
            if X[col].dtype in ['float64', 'int64']:
                X[col].fillna(X[col].mean(), inplace=True)
            else:
                X[col].fillna(X[col].mode()[0] if not X[col].mode().empty else 'Unknown', inplace=True)
        
        # Encode categorical variables
        for col in X.columns:
            if X[col].dtype == 'object':
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                self.encoders[col] = le
        
        # Prepare target if provided
        y = None
        if target_column:
            y = df[target_column].copy()
            if y.dtype == 'object':
                le = LabelEncoder()
                y = pd.Series(le.fit_transform(y.astype(str)), index=y.index)
                self.encoders[target_column] = le
        
        return X, y
    
    def _clean_results(self, obj: Any) -> Any:
        """Recursively replace NaN/Inf with None for JSON serialization"""
        if isinstance(obj, dict):
            return {k: self._clean_results(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._clean_results(x) for x in obj]
        elif isinstance(obj, float):
            if np.isnan(obj) or np.isinf(obj):
                return None
        return obj

    async def train_regression(
        self,
        df: pd.DataFrame,
        target_column: str,
        feature_columns: List[str],
        model_type: str = 'linear',
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        """Train a regression model"""
        try:
            # Prepare data
            X, y = self.prepare_features(df, feature_columns, target_column)

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)

            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            self.scalers['regression'] = scaler

            # Select and train model
            if model_type == 'linear':
                model = LinearRegression()
            elif model_type == 'ridge':
                model = Ridge(alpha=1.0)
            elif model_type == 'lasso':
                model = Lasso(alpha=1.0)
            elif model_type == 'elasticnet':
                model = ElasticNet(alpha=1.0, l1_ratio=0.5)
            elif model_type == 'random_forest':
                model = RandomForestRegressor(n_estimators=100, random_state=42)
            elif model_type == 'gradient_boosting':
                model = GradientBoostingRegressor(n_estimators=100, random_state=42)
            else:
                raise ValueError(f"Unsupported model type: {model_type}")

            model.fit(X_train_scaled, y_train)
            self.models['regression'] = model

            # Make predictions
            y_train_pred = model.predict(X_train_scaled)
            y_test_pred = model.predict(X_test_scaled)

            # Calculate metrics
            train_metrics = {
                'mse': float(mean_squared_error(y_train, y_train_pred)),
                'rmse': float(np.sqrt(mean_squared_error(y_train, y_train_pred))),
                'mae': float(mean_absolute_error(y_train, y_train_pred)),
                'r2': float(r2_score(y_train, y_train_pred))
            }

            test_metrics = {
                'mse': float(mean_squared_error(y_test, y_test_pred)),
                'rmse': float(np.sqrt(mean_squared_error(y_test, y_test_pred))),
                'mae': float(mean_absolute_error(y_test, y_test_pred)),
                'r2': float(r2_score(y_test, y_test_pred))
            }

            # Feature importance (if available)
            feature_importance = {}
            if hasattr(model, 'feature_importances_'):
                feature_importance = {
                    col: float(imp)
                    for col, imp in zip(feature_columns, model.feature_importances_)
                }
            elif hasattr(model, 'coef_'):
                feature_importance = {
                    col: float(coef)
                    for col, coef in zip(feature_columns, model.coef_)
                }

            # Prepare results
            results = {
                'model_type': model_type,
                'target_column': target_column,
                'feature_columns': feature_columns,
                'train_size': len(X_train),
                'test_size': len(X_test),
                'train_metrics': train_metrics,
                'test_metrics': test_metrics,
                'feature_importance': feature_importance,
                'predictions': {
                    'actual': y_test.tolist()[:100],
                    'predicted': y_test_pred.tolist()[:100]
                }
            }

            return self._clean_results(results)

        except Exception as e:
            return {'error': str(e)}

    async def train_classification(
        self,
        df: pd.DataFrame,
        target_column: str,
        feature_columns: List[str],
        model_type: str = 'logistic',
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        """Train a classification model"""
        try:
            # Prepare data
            X, y = self.prepare_features(df, feature_columns, target_column)

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42, stratify=y)

            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            self.scalers['classification'] = scaler

            # Select and train model
            if model_type == 'logistic':
                model = LogisticRegression(max_iter=1000, random_state=42)
            elif model_type == 'decision_tree':
                model = DecisionTreeClassifier(random_state=42)
            elif model_type == 'random_forest':
                model = RandomForestClassifier(n_estimators=100, random_state=42)
            elif model_type == 'svm':
                model = SVC(kernel='rbf', random_state=42)
            elif model_type == 'gradient_boosting':
                model = GradientBoostingClassifier(n_estimators=100, random_state=42)
            else:
                raise ValueError(f"Unsupported model type: {model_type}")

            model.fit(X_train_scaled, y_train)
            self.models['classification'] = model

            # Make predictions
            y_train_pred = model.predict(X_train_scaled)
            y_test_pred = model.predict(X_test_scaled)

            # Calculate metrics
            train_metrics = {
                'accuracy': float(accuracy_score(y_train, y_train_pred)),
                'precision': float(precision_score(y_train, y_train_pred, average='weighted', zero_division=0)),
                'recall': float(recall_score(y_train, y_train_pred, average='weighted', zero_division=0)),
                'f1_score': float(f1_score(y_train, y_train_pred, average='weighted', zero_division=0))
            }

            test_metrics = {
                'accuracy': float(accuracy_score(y_test, y_test_pred)),
                'precision': float(precision_score(y_test, y_test_pred, average='weighted', zero_division=0)),
                'recall': float(recall_score(y_test, y_test_pred, average='weighted', zero_division=0)),
                'f1_score': float(f1_score(y_test, y_test_pred, average='weighted', zero_division=0))
            }

            # Confusion matrix
            cm = confusion_matrix(y_test, y_test_pred)

            # Feature importance
            feature_importance = {}
            if hasattr(model, 'feature_importances_'):
                feature_importance = {
                    col: float(imp)
                    for col, imp in zip(feature_columns, model.feature_importances_)
                }
            elif hasattr(model, 'coef_'):
                # For multi-class, take mean of absolute coefficients
                coef = np.abs(model.coef_).mean(axis=0) if model.coef_.ndim > 1 else np.abs(model.coef_)
                feature_importance = {
                    col: float(c)
                    for col, c in zip(feature_columns, coef)
                }

            # Get class labels
            classes = self.encoders.get(target_column)
            class_labels = classes.classes_.tolist() if classes else sorted(y.unique().tolist())

            results = {
                'model_type': model_type,
                'target_column': target_column,
                'feature_columns': feature_columns,
                'train_size': len(X_train),
                'test_size': len(X_test),
                'classes': class_labels,
                'train_metrics': train_metrics,
                'test_metrics': test_metrics,
                'confusion_matrix': cm.tolist(),
                'feature_importance': feature_importance,
                'predictions': {
                    'actual': y_test.tolist()[:100],
                    'predicted': y_test_pred.tolist()[:100]
                }
            }

            return self._clean_results(results)

        except Exception as e:
            return {'error': str(e)}

    async def perform_clustering(
        self,
        df: pd.DataFrame,
        feature_columns: List[str],
        n_clusters: int = 3,
        algorithm: str = 'kmeans'
    ) -> Dict[str, Any]:
        """Perform clustering analysis"""
        try:
            # Prepare data
            X, _ = self.prepare_features(df, feature_columns)

            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            self.scalers['clustering'] = scaler

            # Select and fit clustering algorithm
            if algorithm == 'kmeans':
                model = KMeans(n_clusters=n_clusters, random_state=42)
            elif algorithm == 'dbscan':
                model = DBSCAN(eps=0.5, min_samples=5)
            elif algorithm == 'hierarchical':
                model = AgglomerativeClustering(n_clusters=n_clusters)
            else:
                raise ValueError(f"Unsupported algorithm: {algorithm}")

            labels = model.fit_predict(X_scaled)
            self.models['clustering'] = model

            # Calculate metrics
            silhouette = float(silhouette_score(X_scaled, labels))
            davies_bouldin = float(davies_bouldin_score(X_scaled, labels))

            # Cluster sizes
            unique_labels, counts = np.unique(labels, return_counts=True)
            cluster_sizes = {int(label): int(count) for label, count in zip(unique_labels, counts)}

            # Cluster centers (for KMeans)
            cluster_centers = {}
            if hasattr(model, 'cluster_centers_'):
                for i, center in enumerate(model.cluster_centers_):
                    cluster_centers[i] = {
                        col: float(val)
                        for col, val in zip(feature_columns, center)
                    }

            results = {
                'algorithm': algorithm,
                'n_clusters': len(unique_labels),
                'feature_columns': feature_columns,
                'metrics': {
                    'silhouette_score': silhouette,
                    'davies_bouldin_score': davies_bouldin
                },
                'cluster_sizes': cluster_sizes,
                'cluster_centers': cluster_centers,
                'labels': labels.tolist()[:1000]  # Limit to first 1000
            }

            return self._clean_results(results)

        except Exception as e:
            return {'error': str(e)}
    
    async def generate_insights(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Generate AI insights from the dataset"""
        insights = []

        try:
            # 1. Check for correlations
            numeric_df = df.select_dtypes(include=[np.number])
            if not numeric_df.empty and len(numeric_df.columns) >= 2:
                corr = numeric_df.corr()
                for i in range(len(corr.columns)):
                    for j in range(i + 1, len(corr.columns)):
                        val = corr.iloc[i, j]
                        if abs(val) > 0.7:
                            insights.append({
                                'type': 'correlation',
                                'title': 'Strong Correlation Found',
                                'description': f"Column '{corr.columns[i]}' and '{corr.columns[j]}' have a strong {'positive' if val > 0 else 'negative'} correlation of {val:.2f}.",
                                'confidence': float(abs(val)),
                                'timestamp': datetime.utcnow().isoformat(),
                                'data': {'columns': [corr.columns[i], corr.columns[j]], 'value': float(val)}
                            })

            # 2. Check for distribution anomalies
            for col in numeric_df.columns:
                mean = numeric_df[col].mean()
                std = numeric_df[col].std()
                if std > 0:
                    outliers = numeric_df[(numeric_df[col] > mean + 3 * std) | (numeric_df[col] < mean - 3 * std)]
                    if len(outliers) > 0:
                        percentage = (len(outliers) / len(df)) * 100
                        insights.append({
                            'type': 'anomaly',
                            'title': f'Outliers detected in {col}',
                            'description': f"Found {len(outliers)} data points ({percentage:.1f}%) in '{col}' that are significantly different from the average.",
                            'confidence': 0.85,
                            'timestamp': datetime.utcnow().isoformat(),
                            'data': {'column': col, 'count': len(outliers), 'percentage': percentage}
                        })

            # 3. Categorical insights
            cat_cols = df.select_dtypes(include=['object', 'category']).columns
            for col in cat_cols:
                counts = df[col].value_counts()
                if not counts.empty:
                    top_val = counts.index[0]
                    percentage = (counts.iloc[0] / len(df)) * 100
                    if percentage > 50:
                        insights.append({
                            'type': 'pattern',
                            'title': f'Dominant category in {col}',
                            'description': f"'{top_val}' accounts for {percentage:.1f}% of all entries in '{col}'.",
                            'confidence': 0.9,
                            'timestamp': datetime.utcnow().isoformat(),
                            'data': {'column': col, 'category': str(top_val), 'percentage': percentage}
                        })

            # If no specific insights found, add a general one
            if not insights:
                insights.append({
                    'type': 'pattern',
                    'title': 'Dataset Analysis Complete',
                    'description': 'The dataset looks balanced across its primary dimensions.',
                    'confidence': 0.5,
                    'timestamp': datetime.utcnow().isoformat(),
                    'data': {}
                })

            return insights
        except Exception as e:
            print(f"Error generating insights: {e}")
            return []


# Global instance
ml_service = MLService()
