const app = require('./src/app');
const server = app.listen(5000, () => {
  console.log('Server started for testing');
  
  fetch('http://localhost:5000/api/reports/dashboard?range=Today')
    .then(res => res.text())
    .then(text => {
      console.log('Response:', text);
      server.close();
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      server.close();
      process.exit(1);
    });
});
