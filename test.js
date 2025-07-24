// test.js
import express from 'express';
const app = express();
app.get('/ping', (req, res) => res.send('pong'));
app.listen(5000, '0.0.0.0', () => console.log('Listening on 5000'));
