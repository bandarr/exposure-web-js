import http from 'http';
import fs from 'fs';
import path, {dirname} from 'path';
import {CableValues, calc_uncontrolled_safe_distance, FrequencyValues} from './src/rfexposure.js';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = 8080;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'GET' && pathname === '/') {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.method === 'GET' && pathname === '/styles.css') {
    fs.readFile(path.join(__dirname, 'public', 'styles.css'), (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(data);
    });
  } else if (req.method === 'POST' && pathname === '/submit') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const params = JSON.parse(body);

      const distance = calculateDistance(params);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ frequency: params.frequency, distance }));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

function calculateDistance(params) {
  const freq_values = new FrequencyValues(
    parseFloat(params.frequency),
    parseFloat(params.swr),
    parseFloat(params.gaindbi)
  );

  const cable_values = new CableValues(
    parseFloat(params.k1),
    parseFloat(params.k2)
  );

  const transmitter_power = parseInt(params.transmitterpower, 10);

  const feedline_length = parseInt(params.feedlinelength, 10);

  const duty_cycle = parseFloat(params.dutycycle);

  const uncontrolled_percentage_30_minutes = parseFloat(params.uncontrolledpercentage30minutes);

  return calc_uncontrolled_safe_distance(
    freq_values,
    cable_values,
    transmitter_power,
    feedline_length,
    duty_cycle,
    uncontrolled_percentage_30_minutes
  );
}