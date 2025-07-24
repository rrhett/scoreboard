const express = require('express');
const { createServer } = require('http');
const fs = require('fs');
const https = require('https');
const hbs = require('hbs');
const routes = require('./routes/routes');
const path = require('path');
const { Server } = require('socket.io');

/*
import express from 'express';
import { createServer } from 'http';
import hbs from 'hbs';
import routes from './routes/routes';
import path from 'path';
import { Server } from 'socket.io';
*/


/*
const credentials = {
    key: fs.readFileSync('key.pem', 'utf-8'),
    cert: fs.readFileSync('cert.pem', 'utf-8')
};
*/
const app = express();
const port = process.env.PORT || 5000;

app.set('view engine', hbs);
app.use('/', routes);
app.use(express.static(path.join(__dirname, '/public')));

const server = createServer(app);
//const httpsServer = https.createServer(credentials, app);
const io = new Server(server);
//const httpsIo = new Server(httpsServer);
let lastState = {};
const onConnection = (socket) => {
  console.log('a user connected');
  socket.emit('state', lastState);
  socket.on('state', (state) => {
    lastState = state;
    // For now, broadcast to all listening clients.
    io.emit('state', state);
    //httpsIo.emit('state', state);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
};
//httpsIo.on('connection', onConnection);
io.on('connection', onConnection);
server.listen(port, () => {
  console.log(`app is running on port ${port}`);
});
const httpsPort = port + 443;
/*
httpsServer.listen(httpsPort, () => {
  console.log(`app is running https on port ${httpsPort}`);
});
*/
