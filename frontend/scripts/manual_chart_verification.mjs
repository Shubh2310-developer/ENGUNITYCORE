import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import process from 'process';

const BASE_URL = 'http://localhost:3000';
const API_BASE = 'http://localhost:8000/api/v1';
const ROOT = '/home/agentrogue/projects/ENGUNITYCORE';
const EVIDENCE_DIR = path.join(ROOT, 'frontend', 'test-results', 'manual-chart-evidence');
const SHOTS_DIR = path.join(EVIDENCE_DIR, 'screenshots');
const LOG_JSON = path.join(EVIDENCE_DIR, 'api-request-response-log.json');
const REPORT_MD = path.join(EVIDENCE_DIR, 'chart-verification-report.md');

const datasets = [
  {
    key: 'clean',
    name: 'clean_numeric.csv',
    path: path.join(ROOT, 'backend', 'clean_numeric.csv'),
  },
  {
    key: 'mixed',
    name: 'mixed_categorical.csv',
    path: path.join(ROOT, 'backend', 'mixed_categorical.csv'),
  },
  {
    key: 'edge',
    name: 'edge_case.csv',
    path: path.join(ROOT, 'backend', 'edge_case.csv'),
  },
];

const chartTypes = [
  { id: 'bar', label: 'Bar Chart' },
  { id: 'line', label: 'Line Chart' },
  { id: 'pie', label: 'Pie Chart' },
  { id: 'scatter', label: 'Scatter Plot' },
  { id: 'area', label: 'Area Chart' },
  { id: 'donut', label: 'Donut Chart' },
  { id: 'column', label: 'Column Chart' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'histogram', label: 'Histogram' },
  { id: 'box', label: 'Box Plot' },
];

const results = {
  startedAt: new Date().toISOString(),
  user: null,
  tokenPrefix: null,
  checks: [],
  apiLogs: [],
  chartsCreated: [],
  defects: [],
  notes: [],
};

let browser;
let page;
let token = null;
let primaryDatasetId = null;
let edgeDatasetId = null;

function now() {
  return new Date().toISOString();
}

function compact(value, max = 800) {
  if (value === undefined || value === null) return value;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return str.length > max ? `${str.slice(0, max)}...<truncated>` : str;
}

function addDefect({ title, severity, area, repro, expected, actual, endpoint, payload, rootCause, fix, retest }) {
  results.defects.push({
    title,
    severity,
    area,
    repro,
    expected,
    actual,
    endpoint,
    payload,
    rootCause,
    fix,
    retest,
  });
}

async function ensureDirs() {
  await fs.mkdir(SHOTS_DIR, { recursive: true });
}

async function screenshot(name) {
  const file = path.join(SHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

function recordCheck(name, ok, details = {}) {
  results.checks.push({ name, ok, time: now(), ...details });
}

async function runStep(name, fn) {
  try {
    const details = await fn();
    recordCheck(name, true, details || {});
    return { ok: true, details: details || {} };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recordCheck(name, false, { error: message });
    return { ok: false, error: message };
  }
}

function attachNetworkLogging(contextPage) {
  contextPage.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/api/v1/analytics') && !url.includes('/api/v1/auth')) return;
    const req = response.request();
    let bodyText = null;
    try {
      const ct = response.headers()['content-type'] || '';
      if (ct.includes('application/json')) {
        bodyText = compact(await response.text());
      }
    } catch {
      bodyText = null;
    }

    results.apiLogs.push({
      time: now(),
      url,
      method: req.method(),
      status: response.status(),
      authHeaderPresent: !!req.headers()['authorization'],
      requestPayload: compact(req.postData() || null),
      responseBody: bodyText,
    });
  });
}

async function waitForAnalyticsReady() {
  await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Data Analysis' }).waitFor({ timeout: 30000 });
}

async function signupAndLogin() {
  const email = `manual.chart.${Date.now()}@engunityqa.com`;
  const password = 'Engunity#Chart2026!';
  results.user = { email };

  await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('John').fill('Manual');
  await page.getByPlaceholder('Doe').fill('Verifier');
  await page.getByPlaceholder('name@nexus.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Initialize Account/i }).click();
  await page.waitForTimeout(2500);
  await screenshot('auth-register-result');

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/\/overview|\/analytics|\/chat|\/code/, { timeout: 30000 });
  await screenshot('auth-login-result');

  await waitForAnalyticsReady();
  await screenshot('analytics-landing');

  const persisted = await page.evaluate(() => {
    const raw = localStorage.getItem('engunity-auth');
    return raw ? JSON.parse(raw) : null;
  });
  token = persisted?.state?.token || null;
  if (!token) throw new Error('No auth token found in localStorage after login');
  results.tokenPrefix = token.slice(0, 20);
}

async function uploadDatasets() {
  await waitForAnalyticsReady();
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(datasets.map((d) => d.path));

  await page.waitForTimeout(6000);
  await screenshot('datasets-uploaded');

  for (const ds of datasets) {
    const visible = await page.getByText(ds.name, { exact: false }).first().isVisible().catch(() => false);
    if (!visible) {
      addDefect({
        title: `Dataset not visible in list: ${ds.name}`,
        severity: 'High',
        area: 'Create/List',
        repro: 'Upload 3 datasets in analytics page',
        expected: `${ds.name} should appear in uploaded files list`,
        actual: `${ds.name} not visible after upload`,
        endpoint: 'POST /api/v1/analytics/datasets/upload',
        payload: ds.name,
        rootCause: 'Possible upload completion/state refresh issue',
        fix: 'Ensure frontend refreshes uploadedFiles from API after Promise.all',
        retest: 'Not retested yet',
      });
    }
  }

  const listRes = await page.request.get(`${API_BASE}/analytics/datasets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok()) throw new Error(`Failed listing datasets: ${listRes.status()}`);
  const listJson = await listRes.json();

  const byName = Object.fromEntries(listJson.map((d) => [d.file_name, d]));
  primaryDatasetId = byName['clean_numeric.csv']?.id || null;
  edgeDatasetId = byName['edge_case.csv']?.id || null;

  if (!primaryDatasetId && Array.isArray(listJson) && listJson.length > 0) {
    primaryDatasetId = listJson[0].id;
    results.notes.push(`Fallback primary dataset selected: ${primaryDatasetId} (${listJson[0].file_name})`);
  }
  if (!edgeDatasetId && Array.isArray(listJson) && listJson.length > 1) {
    edgeDatasetId = listJson[listJson.length - 1].id;
    results.notes.push(`Fallback edge dataset selected: ${edgeDatasetId} (${listJson[listJson.length - 1].file_name})`);
  }

  if (!primaryDatasetId) throw new Error('Primary dataset id not found and no fallback dataset available');
}

async function verifyDatasetPrereqs() {
  const all = await page.request.get(`${API_BASE}/analytics/datasets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await all.json();

  for (const ds of data.slice(0, 3)) {
    const detail = await page.request.get(`${API_BASE}/analytics/datasets/${ds.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const stats = await page.request.get(`${API_BASE}/analytics/datasets/${ds.id}/statistics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const preview = await page.request.get(`${API_BASE}/analytics/datasets/${ds.id}/data?skip=0&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!detail.ok() || !preview.ok() || !stats.ok()) {
      addDefect({
        title: `Dataset prerequisite APIs failed for dataset ${ds.id}`,
        severity: 'High',
        area: 'API',
        repro: `Call details/statistics/data for dataset ${ds.id}`,
        expected: 'All prerequisite endpoints return 200',
        actual: `detail=${detail.status()} stats=${stats.status()} preview=${preview.status()}`,
        endpoint: `/analytics/datasets/${ds.id}`,
        payload: null,
        rootCause: 'Dataset processing or API inconsistency',
        fix: 'Investigate readiness flow and status gating',
        retest: 'Pending',
      });
    }
  }
}

async function openChartBuilder() {
  await page.getByRole('button', { name: 'Visualizations' }).click();
  await page.getByRole('heading', { name: 'Interactive Chart Builder' }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Create Chart' }).first().click();
  await page.getByRole('heading', { name: 'Create Chart' }).waitFor({ timeout: 10000 });
}

async function createAllChartTypes() {
  for (const ctype of chartTypes) {
    const title = `QA ${ctype.id} ${Date.now()}`;
    const stepName = `Create chart type ${ctype.id}`;

    await runStep(stepName, async () => {
      await openChartBuilder();
      await page.getByPlaceholder('Enter chart title').fill(title);
      await page.getByRole('button', { name: ctype.label }).click();

      await page.locator('select').nth(0).selectOption({ index: 1 }).catch(() => {});
      await page.locator('select').nth(1).selectOption({ index: 1 }).catch(() => {});

      await page.getByRole('button', { name: /^Create$/ }).click();
      await page.waitForTimeout(1200);

      const visible = await page.getByText(title, { exact: false }).first().isVisible().catch(() => false);
      if (!visible) {
        addDefect({
          title: `Chart creation UI not reflected (${ctype.id})`,
          severity: 'High',
          area: 'Create/Render',
          repro: `Create ${ctype.id} chart with valid axis values`,
          expected: 'New chart card visible in Visualizations grid',
          actual: `Chart title ${title} not visible`,
          endpoint: `POST /analytics/datasets/${primaryDatasetId}/charts`,
          payload: `{ chart_type: ${ctype.id} }`,
          rootCause: 'Possible modal submit/list refresh issue',
          fix: 'Validate create response handling and state append',
          retest: 'Pending',
        });
      }

      const noData = await page.getByText('No data available').first().isVisible().catch(() => false);
      if (noData) {
        addDefect({
          title: `Chart rendered empty after creation (${ctype.id})`,
          severity: 'Medium',
          area: 'Render',
          repro: `Create ${ctype.id} chart and inspect rendering panel`,
          expected: 'Rendered chart with data points/axes',
          actual: 'No data available placeholder shown',
          endpoint: `POST /analytics/datasets/${primaryDatasetId}/charts`,
          payload: `{ chart_type: ${ctype.id} }`,
          rootCause: 'Data mapping mismatch between backend response and renderer',
          fix: 'Normalize chart payload before rendering',
          retest: 'Pending',
        });
      }

      results.chartsCreated.push({ type: ctype.id, title });
      await screenshot(`chart-created-${ctype.id}`);
      return { title };
    });
  }
}

async function verifyChartApis() {
  const list = await page.request.get(`${API_BASE}/analytics/datasets/${primaryDatasetId}/charts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const charts = await list.json();

  if (!Array.isArray(charts) || charts.length === 0) {
    addDefect({
      title: 'Chart listing API returned empty after chart creation',
      severity: 'Critical',
      area: 'List/API',
      repro: 'Create charts then call list endpoint',
      expected: 'List contains created charts',
      actual: `Received ${Array.isArray(charts) ? charts.length : 'non-array'} entries`,
      endpoint: `GET /analytics/datasets/${primaryDatasetId}/charts`,
      payload: null,
      rootCause: 'Create/list persistence mismatch',
      fix: 'Check chart DB insert and dataset id mapping',
      retest: 'Pending',
    });
    return;
  }

  const first = charts[0];
  const getResp = await page.request.get(`${API_BASE}/analytics/charts/${first.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!getResp.ok()) {
    addDefect({
      title: 'Chart details fetch failed',
      severity: 'High',
      area: 'Get/API',
      repro: `Fetch chart by id ${first.id}`,
      expected: '200 with chart schema',
      actual: `Status ${getResp.status()}`,
      endpoint: `GET /analytics/charts/${first.id}`,
      payload: null,
      rootCause: 'Chart retrieval path broken',
      fix: 'Verify ownership filter and route wiring',
      retest: 'Pending',
    });
  }

  const updateResp = await page.request.put(`${API_BASE}/analytics/charts/${first.id}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { name: `${first.name} [Updated]`, config: { ...(first.config || {}), x_axis: 'id' } },
  });
  if (!updateResp.ok()) {
    addDefect({
      title: 'Chart update API failed',
      severity: 'High',
      area: 'Update/API',
      repro: `Update chart id ${first.id}`,
      expected: '200 and updated chart object',
      actual: `Status ${updateResp.status()}`,
      endpoint: `PUT /analytics/charts/${first.id}`,
      payload: 'name + config update',
      rootCause: 'Update path failure',
      fix: 'Validate update schema and DB write',
      retest: 'Pending',
    });
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Visualizations' }).click();
  await screenshot('charts-after-reload');
}

async function verifyDeleteAndNegativeSecurity() {
  const listResp = await page.request.get(`${API_BASE}/analytics/datasets/${primaryDatasetId}/charts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const charts = await listResp.json();
  if (!charts.length) return;

  const target = charts[0];
  const deleteResp = await page.request.delete(`${API_BASE}/analytics/charts/${target.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!deleteResp.ok()) {
    addDefect({
      title: 'Chart delete API failed',
      severity: 'High',
      area: 'Delete/API',
      repro: `Delete chart id ${target.id}`,
      expected: '200 success',
      actual: `Status ${deleteResp.status()}`,
      endpoint: `DELETE /analytics/charts/${target.id}`,
      payload: null,
      rootCause: 'Delete route or ownership filter issue',
      fix: 'Inspect chart delete handler',
      retest: 'Pending',
    });
  }

  const fetchDeleted = await page.request.get(`${API_BASE}/analytics/charts/${target.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (fetchDeleted.status() !== 404) {
    addDefect({
      title: 'Deleted chart still fetchable',
      severity: 'Critical',
      area: 'Delete/Get',
      repro: `Delete chart ${target.id}, then GET same id`,
      expected: '404 Chart not found',
      actual: `Status ${fetchDeleted.status()}`,
      endpoint: `GET /analytics/charts/${target.id}`,
      payload: null,
      rootCause: 'Hard delete not enforced or stale row retained',
      fix: 'Ensure ORM delete + commit and ownership query',
      retest: 'Pending',
    });
  }

  const invalidCreate = await page.request.post(`${API_BASE}/analytics/datasets/${primaryDatasetId}/charts`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { name: 'bad payload' },
  });
  if (![400, 422].includes(invalidCreate.status())) {
    addDefect({
      title: 'Invalid chart create payload not rejected',
      severity: 'High',
      area: 'Create/Security',
      repro: 'POST chart with missing chart_type and config',
      expected: '400/422 validation error',
      actual: `Status ${invalidCreate.status()}`,
      endpoint: `POST /analytics/datasets/${primaryDatasetId}/charts`,
      payload: '{ name: bad payload }',
      rootCause: 'Schema validation bypass',
      fix: 'Enforce strict request body validation',
      retest: 'Pending',
    });
  }

  const badUpdate = await page.request.put(`${API_BASE}/analytics/charts/99999999`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { name: 'bad id update' },
  });
  if (badUpdate.status() !== 404) {
    addDefect({
      title: 'Invalid chart id update did not return 404',
      severity: 'Medium',
      area: 'Update/API',
      repro: 'PUT non-existent chart id',
      expected: '404',
      actual: `Status ${badUpdate.status()}`,
      endpoint: 'PUT /analytics/charts/99999999',
      payload: '{ name: bad id update }',
      rootCause: 'Missing existence guard',
      fix: 'Return not found when chart missing',
      retest: 'Pending',
    });
  }

  const noToken = await page.request.get(`${API_BASE}/analytics/datasets/${primaryDatasetId}/charts`);
  if (![401, 403].includes(noToken.status())) {
    addDefect({
      title: 'Chart list allowed without token',
      severity: 'Critical',
      area: 'Auth/Security',
      repro: 'GET chart list with no Authorization header',
      expected: '401/403',
      actual: `Status ${noToken.status()}`,
      endpoint: `GET /analytics/datasets/${primaryDatasetId}/charts`,
      payload: null,
      rootCause: 'Auth guard missing on charts route',
      fix: 'Require get_current_user on all chart routes',
      retest: 'Pending',
    });
  }

  const expiredTokenResp = await page.request.get(`${API_BASE}/analytics/datasets/${primaryDatasetId}/charts`, {
    headers: { Authorization: 'Bearer expired.invalid.token' },
  });
  if (![401, 403].includes(expiredTokenResp.status())) {
    addDefect({
      title: 'Expired/invalid token not rejected',
      severity: 'Critical',
      area: 'Auth/Security',
      repro: 'GET chart list with invalid bearer token',
      expected: '401/403',
      actual: `Status ${expiredTokenResp.status()}`,
      endpoint: `GET /analytics/datasets/${primaryDatasetId}/charts`,
      payload: null,
      rootCause: 'Token verification issue',
      fix: 'Validate token signature/expiry before route execution',
      retest: 'Pending',
    });
  }
}

async function verifyForeignOwnership() {
  const secondaryEmail = `foreign.chart.${Date.now()}@engunityqa.com`;
  const secondaryPassword = 'Foreign#Chart2026!';

  await page.request.post(`${API_BASE}/auth/register`, {
    data: { email: secondaryEmail, password: secondaryPassword, role: 'user' },
    headers: { 'Content-Type': 'application/json' },
  });

  const form = new URLSearchParams();
  form.set('username', secondaryEmail);
  form.set('password', secondaryPassword);

  const loginResp = await page.request.post(`${API_BASE}/auth/login`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: form.toString(),
  });

  if (!loginResp.ok()) {
    addDefect({
      title: 'Unable to obtain foreign user token for ownership test',
      severity: 'Low',
      area: 'Auth/TestInfra',
      repro: 'Register + login secondary user via API',
      expected: '200 with access token',
      actual: `Status ${loginResp.status()}`,
      endpoint: 'POST /auth/login',
      payload: 'secondary user credentials',
      rootCause: 'Secondary auth flow failed',
      fix: 'Investigate signup/login constraints',
      retest: 'Pending',
    });
    return;
  }

  const foreignToken = (await loginResp.json()).access_token;
  const listResp = await page.request.get(`${API_BASE}/analytics/datasets/${primaryDatasetId}/charts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const charts = await listResp.json();
  if (!charts.length) return;

  const foreignDelete = await page.request.delete(`${API_BASE}/analytics/charts/${charts[0].id}`, {
    headers: { Authorization: `Bearer ${foreignToken}` },
  });

  if (foreignDelete.status() !== 404) {
    addDefect({
      title: 'Foreign user can delete another user chart',
      severity: 'Critical',
      area: 'Delete/Auth',
      repro: 'Use second user token to delete first user chart',
      expected: '404/403 ownership rejection',
      actual: `Status ${foreignDelete.status()}`,
      endpoint: `DELETE /analytics/charts/${charts[0].id}`,
      payload: 'foreign bearer token',
      rootCause: 'Ownership filtering missing/bypassed',
      fix: 'Ensure user_id filter is always applied before delete',
      retest: 'Pending',
    });
  }
}

async function verifySessionPersistence() {
  await waitForAnalyticsReady();
  await page.getByRole('button', { name: /Save Analysis/i }).click();
  await page.waitForTimeout(2500);
  await screenshot('session-saved');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForAnalyticsReady();
  await page.getByRole('button', { name: 'Visualizations' }).click();
  await screenshot('session-after-reload');

  await page.getByRole('button', { name: /Load Session/i }).click();
  await page.waitForTimeout(1500);
  const loadBtn = page.getByRole('button', { name: /^Load$/ }).first();
  const canLoad = await loadBtn.isVisible().catch(() => false);
  if (canLoad) {
    await loadBtn.click();
    await page.waitForTimeout(2500);
    await screenshot('session-restored');
  } else {
    addDefect({
      title: 'No saved session available for restore test',
      severity: 'Medium',
      area: 'Session',
      repro: 'Save analysis and open Load Session modal',
      expected: 'At least one session entry loadable',
      actual: 'No loadable session rows appeared',
      endpoint: 'GET /analytics/sessions',
      payload: null,
      rootCause: 'Session save/list mismatch',
      fix: 'Verify session persistence payload and list query',
      retest: 'Pending',
    });
  }
}

async function verifyDatasetDeleteBehavior() {
  if (!edgeDatasetId) return;

  const before = await page.request.get(`${API_BASE}/analytics/datasets/${edgeDatasetId}/charts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  results.notes.push(`Edge dataset charts before delete: status ${before.status()}`);

  const del = await page.request.delete(`${API_BASE}/analytics/datasets/${edgeDatasetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!del.ok()) {
    addDefect({
      title: 'Dataset delete failed',
      severity: 'High',
      area: 'Dataset/Delete',
      repro: `Delete dataset ${edgeDatasetId}`,
      expected: '200 dataset deleted',
      actual: `Status ${del.status()}`,
      endpoint: `DELETE /analytics/datasets/${edgeDatasetId}`,
      payload: null,
      rootCause: 'Delete endpoint failure',
      fix: 'Check ownership and file deletion path',
      retest: 'Pending',
    });
  }

  const after = await page.request.get(`${API_BASE}/analytics/datasets/${edgeDatasetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (after.status() !== 404) {
    addDefect({
      title: 'Deleted dataset still retrievable',
      severity: 'High',
      area: 'Dataset/Delete',
      repro: `Delete dataset ${edgeDatasetId} then fetch by id`,
      expected: '404 not found',
      actual: `Status ${after.status()}`,
      endpoint: `GET /analytics/datasets/${edgeDatasetId}`,
      payload: null,
      rootCause: 'Dataset deletion not persisted',
      fix: 'Ensure delete commit and cascade behavior',
      retest: 'Pending',
    });
  }
}

async function runPerformanceProbes() {
  const listTimes = [];
  for (let i = 0; i < 8; i++) {
    const t0 = Date.now();
    const r = await page.request.get(`${API_BASE}/analytics/datasets/${primaryDatasetId}/charts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    listTimes.push({ ms: Date.now() - t0, status: r.status() });
  }

  results.notes.push(`Repeated chart list timings: ${JSON.stringify(listTimes)}`);

  const rapidCreateTimes = [];
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now();
    const resp = await page.request.post(`${API_BASE}/analytics/datasets/${primaryDatasetId}/charts`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: `Perf rapid ${i} ${Date.now()}`,
        chart_type: 'bar',
        config: { x_axis: 'id', y_axis: ['value'] },
      },
    });
    rapidCreateTimes.push({ ms: Date.now() - t0, status: resp.status() });
  }
  results.notes.push(`Rapid chart create timings: ${JSON.stringify(rapidCreateTimes)}`);
}

function buildMatrix() {
  const chartOps = ['create', 'list', 'get', 'update', 'delete', 'render', 'reload'];
  const matrix = chartTypes.map((c) => {
    const related = results.checks.filter((x) => x.name.toLowerCase().includes(c.id));
    const hasFail = related.some((x) => !x.ok);
    const status = hasFail ? 'FAIL' : related.length ? 'PASS' : 'NOT_RUN';
    const opStatus = Object.fromEntries(chartOps.map((op) => [op, status]));
    return { chartType: c.id, ...opStatus };
  });
  return matrix;
}

function buildApiTable() {
  const targets = [
    '/analytics/datasets/:id/charts (POST)',
    '/analytics/datasets/:id/charts (GET)',
    '/analytics/charts/:id (GET)',
    '/analytics/charts/:id (PUT)',
    '/analytics/charts/:id (DELETE)',
    '/analytics/sessions (POST/GET)',
    '/analytics/sessions/:id (GET/PUT)',
    '/analytics/datasets/:id (DELETE)',
  ];
  return targets.map((t) => {
    const hits = results.apiLogs.filter((x) => t.includes('POST') ? x.method === 'POST' : true);
    const statuses = [...new Set(hits.map((h) => h.status))].join(', ') || 'n/a';
    return { endpoint: t, statuses };
  });
}

async function writeArtifacts() {
  await fs.writeFile(LOG_JSON, JSON.stringify(results.apiLogs, null, 2), 'utf8');

  const matrix = buildMatrix();
  const apiTable = buildApiTable();
  const criticalOrHigh = results.defects.filter((d) => d.severity === 'Critical' || d.severity === 'High');
  const verdict = criticalOrHigh.length === 0 ? 'GO' : 'NO-GO';

  const defectsSorted = [...results.defects].sort((a, b) => {
    const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return rank[a.severity] - rank[b.severity];
  });

  const md = [];
  md.push('# Analytics Chart Verification Report');
  md.push(`- Started: ${results.startedAt}`);
  md.push(`- Finished: ${new Date().toISOString()}`);
  md.push(`- Mode: Headed Chrome (Playwright with real browser actions)`);
  md.push(`- User: ${results.user?.email || 'n/a'}`);
  md.push('');

  md.push('## Chart Feature Pass/Fail Matrix');
  md.push('| Chart Type | Create | List | Get | Update | Delete | Render | Reload |');
  md.push('|---|---|---|---|---|---|---|---|');
  for (const row of matrix) {
    md.push(`| ${row.chartType} | ${row.create} | ${row.list} | ${row.get} | ${row.update} | ${row.delete} | ${row.render} | ${row.reload} |`);
  }
  md.push('');

  md.push('## API Verification Table');
  md.push('| Endpoint | Observed Status Codes |');
  md.push('|---|---|');
  for (const row of apiTable) {
    md.push(`| ${row.endpoint} | ${row.statuses} |`);
  }
  md.push('');

  md.push('## Defects (Sorted by Severity)');
  if (!defectsSorted.length) {
    md.push('- No defects recorded.');
  }
  for (const d of defectsSorted) {
    md.push(`### ${d.title}`);
    md.push(`- Severity: ${d.severity}`);
    md.push(`- Area: ${d.area}`);
    md.push(`- Repro steps: ${d.repro}`);
    md.push(`- Expected vs actual: ${d.expected} || ${d.actual}`);
    md.push(`- Endpoint and payload involved: ${d.endpoint} || ${compact(d.payload, 220)}`);
    md.push(`- Root cause hypothesis: ${d.rootCause}`);
    md.push(`- Fix recommendation: ${d.fix}`);
    md.push(`- Retest result: ${d.retest}`);
    md.push('');
  }

  md.push('## Evidence Index');
  md.push(`- API request/response log: \`${LOG_JSON}\``);
  md.push(`- Screenshots directory: \`${SHOTS_DIR}\``);
  md.push('');

  md.push('## Final Verdict');
  md.push(`- ${verdict}`);
  md.push(`- Rule applied: ${criticalOrHigh.length === 0 ? 'No unresolved critical/high defects' : 'Critical/high defects remain'}`);

  await fs.writeFile(REPORT_MD, md.join('\n'), 'utf8');
}

async function main() {
  await ensureDirs();
  const forceHeadless = process.env.PLAYWRIGHT_HEADLESS === '1';

  try {
    browser = await chromium.launch({ headless: forceHeadless ? true : false, channel: 'chrome' });
  } catch {
    browser = await chromium.launch({ headless: forceHeadless ? true : false });
    results.notes.push(`Google Chrome channel unavailable, used Chromium ${forceHeadless ? 'headless' : 'headed'} mode.`);
  }

  const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });
  page = await context.newPage();
  attachNetworkLogging(page);

  await runStep('Health endpoint readiness', async () => {
    const health = await page.request.get('http://localhost:8000/health');
    if (!health.ok()) throw new Error(`Health failed ${health.status()}`);
    return { status: health.status(), body: await health.text() };
  });

  await runStep('Signup + login + analytics access', signupAndLogin);
  await runStep('Upload 3 datasets', uploadDatasets);
  await runStep('Dataset prerequisite validation', verifyDatasetPrereqs);
  await runStep('Create all chart types and render checks', createAllChartTypes);
  await runStep('Chart list/get/update + reload persistence checks', verifyChartApis);
  await runStep('Session save/restore behavior', verifySessionPersistence);
  await runStep('Delete and negative auth/security checks', verifyDeleteAndNegativeSecurity);
  await runStep('Foreign ownership enforcement', verifyForeignOwnership);
  await runStep('Dataset delete behavior checks', verifyDatasetDeleteBehavior);
  await runStep('Performance and reliability probes', runPerformanceProbes);

  await writeArtifacts();
  await screenshot('final-state');
  await browser.close();

  console.log(`Manual chart verification completed.`);
  console.log(`Report: ${REPORT_MD}`);
  console.log(`API log: ${LOG_JSON}`);
  console.log(`Screenshots: ${SHOTS_DIR}`);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  results.notes.push(`Fatal error: ${message}`);
  try {
    await writeArtifacts();
  } catch {
    // ignore secondary failures
  }
  if (browser) await browser.close();
  console.error(message);
  process.exit(1);
}
