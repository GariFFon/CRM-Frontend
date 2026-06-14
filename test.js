const fetch = require('node:fetch') || globalThis.fetch;
fetch('http://localhost:3001/api/segments').then(r => r.json()).then(data => {
  console.log(typeof data.data[0].rules);
  console.log(data.data[0].rules.conditions);
}).catch(console.error);
