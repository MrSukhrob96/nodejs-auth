const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt-nodejs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const routes = require('./routes');

const User = require('./models/User');

const MongoStore = require('connect-mongo')(session);

// database
mongoose.Promise = global.Promise;
mongoose.set('debug', config.IS_PRODUCTION);
mongoose.connection
  .on('error', error => console.log(error))
  .on('close', () => console.log('Database connection closed.'))
  .once('open', () => {
    const info = mongoose.connections[0];
    console.log(`Connected to ${info.host}:${info.port}/${info.name}`);
  });
mongoose.connect(config.MONGO_URL);

const app = express();

// sessions
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    }),
    expires: new Date(Date.now() + 60 * 60 * 24 * 30)
  })
);

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  if (req.session.userId) {
    const userId = req.session.userId;
    const userName = req.session.userName;
    res.render('index', { userId, userName });
  } else {
    res.redirect('/login');
  }
});

app.use('/logout', routes.logout);

app.use('/login', routes.login);

app.use('/register', routes.register);

app.use('/forgot', routes.forgot);

app.use('/reset', routes.reset);

app.listen(config.PORT, () =>
  console.log(`Example app listening on port ${config.PORT}!`)
);
