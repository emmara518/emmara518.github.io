import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

// ULTRA P3 fix: expected 401 authentication responses must NOT count as
// server failures. Metrics are reported separately:
//   expected_4xx   – 401/403/404 on auth-gated endpoints (correct behavior)
//   unexpected_4xx – any other 4xx (contract smell, triage)
//   server_5xx     – actual 5xx (product failure, P0/P1)
//   no_5xx         – per-request gate, must stay 1.0
const expected4xx = new Counter("expected_4xx");
const unexpected4xx = new Counter("unexpected_4xx");
const server5xx = new Counter("server_5xx");
const no5xx = new Rate("no_5xx");

export const options = {
  vus: 1,
  duration: "10s",
  thresholds: {
    server_5xx: ["count==0"],
    unexpected_4xx: ["count==0"],
    no_5xx: ["rate==1"],
  },
};

// Standalone default; production runs pass __ENV.TARGET explicitly and only
// as a small bounded smoke (never a blast: 1 VU, short duration).
const BASE = __ENV.TARGET || "http://127.0.0.1:3040";

// [path, [expectedStatuses...]] — statuses listed here are CORRECT answers.
const CASES = [
  ["/api/health", [200]],
  ["/api/v1/me/preferences", [401]],
  ["/api/v1/catalog", [200]],
];

export default function () {
  for (const [pg, expected] of CASES) {
    const r = http.get(BASE + pg);
    const ok5xx = r.status < 500;
    check(r, { [`${pg} no-5xx`]: () => ok5xx });
    no5xx.add(ok5xx);
    if (r.status >= 500) {
      server5xx.add(1);
    } else if (r.status >= 400) {
      if (expected.includes(r.status)) expected4xx.add(1);
      else unexpected4xx.add(1);
    }
    sleep(0.5);
  }
}
