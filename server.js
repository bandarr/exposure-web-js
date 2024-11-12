const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const rfexposure = require('./lib/rfexposure.js');



const port = 8080;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  if (req.method === 'GET' && pathname === '/') {
    fs.readFile(path.join(__dirname, 'public', 'form.html'), (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.method === 'POST' && pathname === '/submit') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const params = JSON.parse(body);

      const freq_values = Object.create(rfexposure.FrequencyValues);
      freq_values.freq = parseFloat(params.frequency);
      freq_values.swr = parseFloat(params.swr);
      freq_values.gaindbi = parseFloat(params.gaindbi);

      const cable_values = Object.create(rfexposure.CableValues);
      cable_values.k1 = parseFloat(params.k1);
      cable_values.k2 = parseFloat(params.k2);

      transmitter_power = parseInt(params.transmitterpower, 10);

      feedline_length = parseInt(params.feedlinelength, 10);

      duty_cycle = parseFloat(params.dutycycle);

      uncontrolled_percentage_30_minutes = parseFloat(params.uncontrolledpercentage30minutes);

      const distance = rfexposure.calc_uncontrolled_safe_distance(
        freq_values,
        cable_values,
        transmitter_power,
        feedline_length,
        duty_cycle,
        uncontrolled_percentage_30_minutes
      );

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