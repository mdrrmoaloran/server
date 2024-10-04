const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { randomInt } = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const cooldowns = new Map();

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
    let parsedMessage;

    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      console.error('Error parsing message:', error);
      return;
    }

    const { coordinates } = parsedMessage; e
    const now = Date.now();
    const cooldownPeriod = 5000;

    if (cooldowns.has(coordinates) && (now - cooldowns.get(coordinates) < cooldownPeriod)) {
      ws.send(JSON.stringify({ type: 'cooldown', message: 'Server is in cooldown for these coordinates. Try again later.' }));
      return;
    }

    cooldowns.set(coordinates, now);
    console.log(`Received message => ${message}`);

    try {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('Error broadcasting message:', error);
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
        message: `Your OTP is: ${otp}. Use this in your account registration in order to proceed`,
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
