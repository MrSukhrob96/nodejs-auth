const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt-nodejs');

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
    // require('./mocks')();
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

app.get('/logout', function(req, res) {
  if (req.session) {
    // delete session object
    req.session.destroy(() => {
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  var errors = {};
  res.render('login', errors);
});

app.get('/register', function(req, res) {
  res.render('register');
});

app.post('/register', function(req, res) {
  let errors = {};
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const terms = req.body.terms;
  if (!terms) {
    errors.formError = 'Terms no checked';
  } else if (!name || !email || !password) {
    if (!name) errors.errorName = 'Name not found';
    if (!email) errors.errorEmail = 'Email not found';
    if (!password) errors.errorPassword = 'Password not found';
  } else if (name.length < 3) {
    errors.errorName = 'Length Name min 3 symbol';
  } else if (
    !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    )
  ) {
    errors.errorEmail = 'Email in valid';
  } else if (password.length < 6) {
    errors.errorPassword = 'Length Name min 6 symbol';
  } else {
    errors.noError = true;
  }

  if (errors.noError) {
    User.findOne({
      email
    }).then(user => {
      if (!user) {
        bcrypt.hash(password, null, null, (err, hash) => {
          User.create({
            name,
            email,
            password: hash
          })
            .then(user => {
              req.session.userId = user.id;
              req.session.userName = user.name;
              res.redirect('/');
            })
            .catch(err => {
              errors.formError = 'Error';
            });
        });
      } else {
        errors.errorEmail = 'E-mail isset';
        res.render('register', errors);
      }
    });
  } else {
    res.render('register', errors);
  }
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
