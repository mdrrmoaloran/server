const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

wss.on('connection', ws => {
  console.log('New client connected');

  // Send a confirmation message to the client when they connect
  ws.send(JSON.stringify({ type: 'connection', message: 'Connection established' }));

  ws.on('message', message => {
    console.log(`Received message => ${message}`);
    try {
      // Broadcast the message to all clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('Error parsing or broadcasting message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
