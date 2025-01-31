require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const WebSocket = require('ws');
const { setupWebSocket } = require('./src/utils/websocket');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

setupWebSocket(wss);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
