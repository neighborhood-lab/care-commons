const fs = require('fs');
const path = require('path');

const resultsDir = process.argv[2] || 'tests/load/results';

// Read all JSON result files
const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));

const results = {};

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf-8'));

  // Extract key metrics
  const metrics = {
    http_req_duration: data.metrics.http_req_duration,
    http_req_failed: data.metrics.http_req_failed,
    http_reqs: data.metrics.http_reqs,
    vus: data.metrics.vus,
  };

  results[file.replace('.json', '')] = {
    metrics,
    thresholds: data.root_group.checks,
  };
});

// Generate HTML report
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Care Commons Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    .metric { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Care Commons Load Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  ${Object.entries(results).map(([test, data]) => `
    <h2>${test.replace(/-/g, ' ').toUpperCase()}</h2>
    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
        <th>Status</th>
      </tr>
      <tr class="metric">
        <td>Average Response Time</td>
        <td>${data.metrics.http_req_duration.values.avg.toFixed(2)} ms</td>
        <td class="${data.metrics.http_req_duration.values.avg < 500 ? 'pass' : 'fail'}">
          ${data.metrics.http_req_duration.values.avg < 500 ? 'PASS' : 'FAIL'}
        </td>
      </tr>
      <tr class="metric">
        <td>P95 Response Time</td>
        <td>${data.metrics.http_req_duration.values['p(95)'].toFixed(2)} ms</td>
        <td class="${data.metrics.http_req_duration.values['p(95)'] < 1000 ? 'pass' : 'fail'}">
          ${data.metrics.http_req_duration.values['p(95)'] < 1000 ? 'PASS' : 'FAIL'}
        </td>
      </tr>
      <tr class="metric">
        <td>Error Rate</td>
        <td>${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</td>
        <td class="${data.metrics.http_req_failed.values.rate < 0.01 ? 'pass' : 'fail'}">
          ${data.metrics.http_req_failed.values.rate < 0.01 ? 'PASS' : 'FAIL'}
        </td>
      </tr>
      <tr class="metric">
        <td>Total Requests</td>
        <td>${data.metrics.http_reqs.values.count}</td>
        <td>-</td>
      </tr>
      <tr class="metric">
        <td>Requests/sec</td>
        <td>${data.metrics.http_reqs.values.rate.toFixed(2)}</td>
        <td>-</td>
      </tr>
      <tr class="metric">
        <td>Peak VUs</td>
        <td>${data.metrics.vus.values.max}</td>
        <td>-</td>
      </tr>
    </table>
  `).join('')}

  <h2>Performance Baselines</h2>
  <table>
    <tr>
      <th>Endpoint Type</th>
      <th>Target P95</th>
      <th>Target Error Rate</th>
      <th>Min Throughput</th>
    </tr>
    <tr>
      <td>Authentication</td>
      <td>&lt; 500ms</td>
      <td>&lt; 1%</td>
      <td>100 req/sec</td>
    </tr>
    <tr>
      <td>EVV Operations</td>
      <td>&lt; 1000ms</td>
      <td>&lt; 0.5%</td>
      <td>50 req/sec</td>
    </tr>
    <tr>
      <td>API Reads</td>
      <td>&lt; 500ms</td>
      <td>&lt; 1%</td>
      <td>200 req/sec</td>
    </tr>
    <tr>
      <td>API Writes</td>
      <td>&lt; 800ms</td>
      <td>&lt; 1%</td>
      <td>50 req/sec</td>
    </tr>
  </table>
</body>
</html>
`;

fs.writeFileSync(path.join(resultsDir, 'report.html'), html);
console.log('Report generated: tests/load/results/report.html');
