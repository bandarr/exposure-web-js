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

  console.log(`Request for ${pathname} received.`);

  if (req.method === 'GET') {
    handleGetRequest(pathname, res);
  } else if (req.method === 'POST' && pathname === '/submit') {
    handlePostRequest(req, res);
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

function handleGetRequest(pathname, res) {
  const fileTypes = {
    '/': { fileName: 'index.html', type: 'text/html' },
    '/styles.css': { fileName: 'styles.css', type: 'text/css' },
    '/script.js': { fileName: 'script.js', type: 'application/javascript' }
  };

  const fileType = fileTypes[pathname];

  if (fileType) {
    serveStaticFile(fileType.fileName, fileType.type, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

function serveStaticFile(fileName, type, res) {
  fs.readFile(path.join(__dirname, 'public', fileName), (err, data) => {
    if (err) {
      const error = fileName === 'index.html' ? 500 : 404;
      res.writeHead(error, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

function handlePostRequest(req, res) {
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
}
