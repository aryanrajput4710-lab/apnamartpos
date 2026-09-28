const { getDashboardSummary } = require('./src/controllers/reportController');

const req = { query: {} };
const res = {
  status: (code) => {
    console.log('Status:', code);
    return res;
  },
  json: (data) => {
    console.log('JSON:', JSON.stringify(data, null, 2));
  }
};

(async () => {
  await getDashboardSummary(req, res);
  process.exit(0);
})();
