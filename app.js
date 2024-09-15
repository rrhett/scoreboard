const express = require('express');
const { createServer } = require('http');
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


const app = express();
const port = process.env.PORT || 5000;

app.set('view engine', hbs);
app.use('/', routes);
app.use(express.static(path.join(__dirname, '/public')));

const server = createServer(app);
const io = new Server(server);
let lastState = {};
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('state', lastState);
  socket.on('state', (state) => {
    lastState = state;
    // For now, broadcast to all listening clients.
    io.emit('state', state);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
server.listen(port, () => {
  console.log(`app is running on port ${port}`);
});
