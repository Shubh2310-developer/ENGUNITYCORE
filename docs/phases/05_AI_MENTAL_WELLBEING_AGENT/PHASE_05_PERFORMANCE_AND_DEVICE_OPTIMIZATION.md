# Phase 05 - Performance and Device Optimization

## Objective

Guarantee wellbeing integration remains lightweight across desktop and lower-power devices.

## Targets

- Wellbeing check API p95 under 120 ms (cached path)
- Wellbeing payload under 3 KB
- Client polling overhead under 1% average CPU
- Extra memory footprint under 20 MB on analytics page

## Backend Optimizations

- Cache check results per user for short TTL (3-5 minutes).
- Bound event scans by period and max document count.
- Ensure timestamp-index-friendly query filters.

## Frontend Optimizations

- Memoize wellbeing components and derived state.
- Avoid rerendering entire analytics tree on status updates.
- Lazy-load optional pomodoro/timer UI.
- Keep motion minimal and reduced-motion aware.

## Network Optimizations

- Visibility-aware polling only.
- Backoff and fail-soft behavior on repeated network errors.
- No hard dependency that blocks analytics if wellbeing API fails.

## Device-tier Behavior

High-capability devices:
- Full interaction path and timer visuals.

Mid/low-capability devices:
- Banner-first support and reduced update frequency.

## Exit Criteria

- Performance checks meet thresholds.
- No noticeable lag introduced in analytics interactions.
- Hidden-tab network churn is eliminated.