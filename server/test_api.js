fetch('http://localhost:5000/api/reports/dashboard?range=Today')
  .then(res => res.text())
  .then(text => console.log(text))
  .catch(err => console.error(err));
