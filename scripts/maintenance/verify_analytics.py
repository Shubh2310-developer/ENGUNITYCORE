
import requests
import os
import pandas as pd
import io
import json

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "test_analytics@example.com"
PASSWORD = "testpassword123"

def test_analytics_e2e():
    # 1. Register/Login
    print("1. Authenticating...")
    try:
        # Try to register first
        requests.post(f"{BASE_URL}/auth/register", json={
            "email": EMAIL,
            "password": PASSWORD,
            "full_name": "Test User"
        })
    except Exception:
        pass

    login_res = requests.post(f"{BASE_URL}/auth/login", data={
        "username": EMAIL,
        "password": PASSWORD
    })

    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        return

    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Authenticated successfully.")

    # 2. Upload Dataset
    print("\n2. Uploading dataset...")
    csv_content = "x,y,category\n1,10,A\n2,20,B\n3,30,A\n4,40,C\n5,50,B"
    files = {"file": ("test.csv", io.StringIO(csv_content), "text/csv")}
    params = {"name": "Test Dataset", "description": "Test description"}

    # Re-read content for requests
    files = {"file": ("test.csv", csv_content, "text/csv")}

    upload_res = requests.post(
        f"{BASE_URL}/analytics/datasets/upload",
        params=params,
        files=files,
        headers={"Authorization": f"Bearer {token}"}
    )

    if upload_res.status_code != 200:
        print(f"Upload failed: {upload_res.text}")
        return

    dataset = upload_res.json()
    dataset_id = dataset["id"]
    print(f"Dataset uploaded. ID: {dataset_id}")

    # 3. Get Statistics
    print("\n3. Testing statistics endpoint...")
    stats_res = requests.get(f"{BASE_URL}/analytics/datasets/{dataset_id}/statistics", headers=headers)
    if stats_res.status_code == 200:
        stats = stats_res.json()
        print(f"Stats received: {json.dumps(stats['summary'], indent=2)}")
    else:
        print(f"Stats failed: {stats_res.text}")

    # 4. Get Data Preview
    print("\n4. Testing data preview endpoint...")
    data_res = requests.get(f"{BASE_URL}/analytics/datasets/{dataset_id}/data", headers=headers)
    if data_res.status_code == 200:
        data = data_res.json()
        print(f"Data preview received. Rows: {len(data['data'])}")
    else:
        print(f"Data preview failed: {data_res.text}")

    # 5. Create Chart
    print("\n5. Testing chart creation (Bar Chart)...")
    chart_data = {
        "name": "Test Bar Chart",
        "chart_type": "bar",
        "config": {
            "x_axis": "category",
            "y_axis": ["y"]
        }
    }
    chart_res = requests.post(f"{BASE_URL}/analytics/datasets/{dataset_id}/charts", json=chart_data, headers=headers)
    if chart_res.status_code == 200:
        chart = chart_res.json()
        print(f"Chart created. Data points: {len(chart['data']['data'])}")
        print(f"Chart data keys: {chart['data'].keys()}")
    else:
        print(f"Chart creation failed: {chart_res.text}")

    # 6. Test ML Regression
    print("\n6. Testing ML Regression...")
    ml_data = {
        "target_column": "y",
        "feature_columns": ["x"],
        "model_type": "linear",
        "test_size": 0.2
    }
    ml_res = requests.post(f"{BASE_URL}/analytics/datasets/{dataset_id}/ml/regression", json=ml_data, headers=headers)
    if ml_res.status_code == 200:
        ml_results = ml_res.json()
        # Analysis model has status, name, results, etc.
        status = ml_results.get('status', 'unknown')
        print(f"ML Regression request successful. Status: {status}")
        if status == 'completed' and 'results' in ml_results:
            results = ml_results['results']
            if results and 'test_metrics' in results:
                print(f"R2 Score: {results['test_metrics'].get('r2')}")
        elif status == 'error':
            print(f"ML Error: {ml_results.get('error_message')}")
    else:
        print(f"ML Regression failed: {ml_res.text}")

    print("\n7. Testing Scatter Chart creation...")
    scatter_data = {
        "name": "Test Scatter Plot",
        "chart_type": "scatter",
        "config": {
            "x_axis": "x",
            "y_axis": "y"
        }
    }
    scatter_res = requests.post(f"{BASE_URL}/analytics/datasets/{dataset_id}/charts", json=scatter_data, headers=headers)
    if scatter_res.status_code == 200:
        scatter_chart = scatter_res.json()
        print(f"Scatter chart created. xKey: {scatter_chart['data']['xKey']}, yKey: {scatter_chart['data']['yKey']}")
        if len(scatter_chart['data']['data']) > 0:
            print(f"First data point: {scatter_chart['data']['data'][0]}")
    else:
        print(f"Scatter chart failed: {scatter_res.text}")

    # 8. Test Analysis Sessions
    print("\n8. Testing Analysis Sessions...")
    session_data = {
        "title": "Test Session",
        "description": "A test session description",
        "dataset_id": dataset_id,
        "data_summary": {"rows": 5, "cols": 3},
        "column_metadata": [{"name": "x", "type": "numeric"}],
        "custom_charts": [{"title": "Custom Bar", "type": "bar", "xAxis": "category", "yAxis": "y"}]
    }

    # Create Session
    create_session_res = requests.post(f"{BASE_URL}/analytics/sessions", json=session_data, headers=headers)
    if create_session_res.status_code == 200:
        session = create_session_res.json()
        session_id = session["id"]
        print(f"Session created. ID: {session_id}")

        # List Sessions
        list_sessions_res = requests.get(f"{BASE_URL}/analytics/sessions", headers=headers)
        if list_sessions_res.status_code == 200:
            print(f"Sessions listed. Count: {len(list_sessions_res.json())}")

        # Update Session
        update_data = {"title": "Updated Test Session"}
        update_session_res = requests.put(f"{BASE_URL}/analytics/sessions/{session_id}", json=update_data, headers=headers)
        if update_session_res.status_code == 200:
            print(f"Session updated successfully.")

        # Delete Session
        delete_session_res = requests.delete(f"{BASE_URL}/analytics/sessions/{session_id}", headers=headers)
        if delete_session_res.status_code == 200:
            print(f"Session deleted successfully.")
    else:
        print(f"Session creation failed: {create_session_res.text}")

    # 9. Test AI Insights
    print("\n9. Testing AI Insights...")
    insights_res = requests.get(f"{BASE_URL}/analytics/datasets/{dataset_id}/insights", headers=headers)
    if insights_res.status_code == 200:
        insights_data = insights_res.json()
        print(f"Insights received. Count: {len(insights_data.get('insights', []))}")
        print(f"Anomalies received. Count: {len(insights_data.get('anomalies', []))}")
    else:
        print(f"Insights failed: {insights_res.text}")

    print("\nVerification complete.")

if __name__ == "__main__":
    test_analytics_e2e()
