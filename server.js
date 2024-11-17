const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const rfexposure = require('./src/rfexposure.js');

const port = 8080;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
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
  const freq_values = new rfexposure.FrequencyValues(
    parseFloat(params.frequency),
    parseFloat(params.swr),
    parseFloat(params.gaindbi)
  );

  const cable_values = new rfexposure.CableValues(
    parseFloat(params.k1),
    parseFloat(params.k2)
  );

  let transmitter_power = parseInt(params.transmitterpower, 10);

  let feedline_length = parseInt(params.feedlinelength, 10);

  let duty_cycle = parseFloat(params.dutycycle);

  let uncontrolled_percentage_30_minutes = parseFloat(params.uncontrolledpercentage30minutes);

  return rfexposure.calc_uncontrolled_safe_distance(
    freq_values,
    cable_values,
    transmitter_power,
    feedline_length,
    duty_cycle,
    uncontrolled_percentage_30_minutes
  );
}