"use strict";

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
  } else if (req.method === 'GET' && pathname === '/script.js') {
    fs.readFile(path.join(__dirname, 'public', 'script.js'), (err, data) => {
      if (err) {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not Found');
        return;
      }
      res.writeHead(200, {'Content-Type': 'application/javascript'});
      res.end(data);
    });
  } else if (req.method === 'POST' && pathname === '/submit') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const data = JSON.parse(body);
      const distances = calculateDistances(data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(distances));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

function calculateDistances(params) {

  const cable_values = new CableValues(
    parseFloat(params.k1),
    parseFloat(params.k2)
  );

  const transmitter_power = parseInt(params.transmitterpower, 10);

  const feedline_length = parseInt(params.feedlinelength, 10);

  const duty_cycle = parseFloat(params.dutycycle);

  const uncontrolled_percentage_30_minutes = parseFloat(params.uncontrolledpercentage30minutes);

  const yarg = params.frequencyValues.map(f => new FrequencyValues(parseFloat(f.frequency), parseFloat(f.swr), parseFloat(f.gaindbi)));

  let distances = [];

  yarg.forEach(freq_val => {
    let distance = calc_uncontrolled_safe_distance(freq_val, cable_values, transmitter_power, feedline_length, duty_cycle, uncontrolled_percentage_30_minutes);
    distances.push({frequency: freq_val.freq, distance: distance.toFixed( 2)});
  });

  return distances;
}
