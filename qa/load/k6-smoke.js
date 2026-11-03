import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.K6_BASE_URL || "http://127.0.0.1:3000";
const routes = ["/", "/explorar", "/login"];

export const options = {
  vus: 3,
  duration: "15s",
  thresholds: {
    checks: ["rate>0.98"],
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<5000"],
  },
};

export default function () {
  for (const route of routes) {
    const response = http.get(`${baseUrl}${route}`, {
      redirects: 3,
      tags: { route },
    });

    check(response, {
      [`${route} responde sem erro HTTP`]: (res) =>
        res.status >= 200 && res.status < 400,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    "qa/reports/k6/summary.json": JSON.stringify(data, null, 2),
  };
}
