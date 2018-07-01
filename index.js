const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');

const app = express();

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  '/js',
  express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist'))
);

// catch 404 and forward to error handler
// app.use((req, res, next) => {
//   const err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// error handler
// eslint-disable-next-line no-unused-vars
// app.use((error, req, res, next) => {
//   res.status(error.status || 500);
//   res.render('error', {
//     message: error.message,
//     error: !config.IS_PRODUCTION ? error : {}
//   });
// });

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  let errors = {};
  res.render('login', errors);
});

app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/register', function(req, res) {
  let errors = {};
  res.render('register', errors);
});

app.get('/forgot', function(req, res) {
  res.render('forgot');
});

app.post('/forgot', function(req, res) {
  let errors = {};
  res.render('forgot', errors);
});

app.listen(config.PORT, () =>
  console.log(`Example app listening on port ${config.PORT}!`)
);
