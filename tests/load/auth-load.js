import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50 },   // Ramp up
        { duration: '1m', target: 100 },  // Sustained load
        { duration: '30s', target: 200 },  // Peak
        { duration: '30s', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95th percentile < 500ms
        http_req_failed: ['rate<0.01'],    // <1% failure rate
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000/api/v1';

export default function () {
    // Login flow
    const loginRes = http.post(`${BASE_URL}/auth/login`,
        `username=loadtest@test.com&password=LoadTestP@ss1`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    check(loginRes, {
        'login status 200': (r) => r.status === 200,
        'login response time < 500ms': (r) => r.timings.duration < 500,
        'has access_token': (r) => JSON.parse(r.body).access_token !== undefined,
    });

    if (loginRes.status === 200) {
        const token = JSON.parse(loginRes.body).access_token;
        // Fetch /me with token
        const meRes = http.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        check(meRes, {
            'me status 200': (r) => r.status === 200,
            'me response time < 200ms': (r) => r.timings.duration < 200,
        });
    }

    sleep(1);
}
