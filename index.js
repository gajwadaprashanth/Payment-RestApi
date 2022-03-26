'use strict';
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000
const transactionroutes = require('./routes/transactionroutes');

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use('/', transactionroutes.routes);

const server=app.listen(PORT, () => console.log('App is listening on url http://localhost:' + PORT));
server.timeout = 60000;
