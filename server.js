const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { randomInt } = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const cooldownMap = new Map();  // Store the last time a message was received for each coordinate
const COOLDOWN_PERIOD = 5000;   // 5 seconds cooldown

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

wss.on('connection', ws => {
  console.log('New client connected');
  ws.send(JSON.stringify({ type: 'connection', message: 'Connection established' }));

  ws.on('message', message => {
    try {
      const parsedMessage = JSON.parse(message);
      const { coordinates } = parsedMessage;  // Assuming message contains coordinates

      if (!coordinates) {
        ws.send(JSON.stringify({ type: 'error', message: 'Coordinates not provided' }));
        return;
      }

      const currentTime = Date.now();

      // Check if the coordinates are in cooldown
      if (cooldownMap.has(coordinates)) {
        const lastMessageTime = cooldownMap.get(coordinates);
        const timeSinceLastMessage = currentTime - lastMessageTime;

        if (timeSinceLastMessage < COOLDOWN_PERIOD) {
          ws.send(JSON.stringify({ type: 'cooldown', message: 'Server is in cooldown for these coordinates. Try again later.' }));
          return;
        }
      }

      // Broadcast the message to all clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });

      // Set cooldown for the current coordinates
      cooldownMap.set(coordinates, currentTime);

    } catch (error) {
      console.error('Error parsing or broadcasting message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Error processing your message' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

app.post('/send-sms', async (req, res) => {
  const { mobilenumber, message } = req.body;

  try {
    const fetch = await import('node-fetch');
    const apiKey = 'c0075e53d1adb4170fb0a7a89c34911f';
    const apiUrl = 'https://api.semaphore.co/api/v4/messages';

    const response = await fetch.default(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apikey: apiKey,
        number: mobilenumber,
        message: message,
        sendername: 'CODERIED'
      })
    });

    const data = await response.json();
    if (response.ok) {
      res.json({ success: true, data });
    } else {
      res.status(400).json({ success: false, error: data });
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ success: false, error: 'Failed to send SMS' });
  }
});

app.post('/send-otp', async (req, res) => {
  const { mobilenumber } = req.body;
  const otp = randomInt(100000, 999999).toString();

  try {
    const fetch = await import('node-fetch');
    const apiKey = 'c0075e53d1adb4170fb0a7a89c34911f';
    const apiUrl = 'https://api.semaphore.co/api/v4/messages';

    const response = await fetch.default(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apikey: apiKey,
        number: mobilenumber,
        message: `Your OTP is: ${otp}`,
        sendername: 'CODERIED'
      })
    });

    const data = await response.json();
    if (response.ok) {
      res.json({ success: true, otp });
    } else {
      res.status(400).json({ success: false, error: data });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
