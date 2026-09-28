const { getProducts } = require('./src/controllers/productController');

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
  await getProducts(req, res);
  process.exit(0);
})();
