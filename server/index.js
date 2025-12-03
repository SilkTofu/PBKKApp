require('dotenv').config();
const http = require('http');
const app = require('./src/app');

const PORT = process.env.PORT || 5050;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Calorie tracker API listening on http://localhost:${PORT}`);
});
