require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./db');
const seedJobs = require('./seedJobs');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

(async () => {
  await connectDB();
  await seedJobs();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
