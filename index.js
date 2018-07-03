const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt-nodejs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
  if (req.session.userId) {
    res.redirect('/');
  } else {
    res.render('login');
  }
});

app.post('/login', function(req, res) {
  let errors = {};
  const email = req.body.email;
  const password = req.body.password;
  const remember = req.body.remember;
  if (!email || !password) {
    if (!email) errors.errorEmail = 'Email not found';
    if (!password) errors.errorPassword = 'Password not found';
  } else if (
    !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    )
  ) {
    errors.errorEmail = 'Email in valid';
  } else {
    errors.noError = true;
  }

  if (errors.noError) {
    User.findOne({
      email
    })
      .then(user => {
        if (!user) {
          errors.formError = 'Error E-mail or Password';
        } else {
          bcrypt.compare(password, user.password, function(err, result) {
            if (!result) {
              errors.formError = 'Error E-mail or Password';
            } else {
              req.session.userId = user.id;
              req.session.userName = user.name;

              res.redirect('/');
            }
          });
        }
      })
      .catch(err => {
        console.log(err);
        errors.formError = 'Error';
      });
  } else {
    res.render('login', errors);
  }
});

app.get('/register', function(req, res) {
  if (req.session.userId) {
    res.redirect('/');
  } else {
    res.render('register');
  }
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
  if (req.session.userId) {
    res.redirect('/');
  } else {
    res.render('forgot');
  }
});

app.post('/forgot', function(req, res) {
  let errors = {};
  const email = req.body.email;
  // setup email data with unicode symbols
  if (!email) {
    errors.errorEmail = 'Email not found';
  } else if (
    !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    )
  ) {
    errors.errorEmail = 'Email in valid';
  } else {
    errors.noError = true;
  }

  if (errors.noError) {
    User.findOne({
      email
    })
      .then(user => {
        if (!user) {
          res.render('forgot', {
            errorSend: 'Error E-mail'
          });
        } else {
          nodemailer.createTestAccount((err, account) => {
            const mailConfig = {
              host: config.SMTP.HOST,
              port: config.SMTP.PORT,
              secure: config.SMTP.SECURE === 'true',
              auth: {
                user: config.SMTP.USERNAME,
                pass: config.SMTP.PASSWORD
              }
            };
            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport(mailConfig);

            let token = crypto.randomBytes(48).toString('hex');

            let mailOptions = {
              from: '"Islomkhuja " <nanotexnolagiya@mail.ru>', // sender address
              to: email, // list of receivers
              subject: 'Password Reset', // Subject line
              text: '',
              html:
                '<a href="http://localhost:' +
                config.PORT +
                '/reset?email=' +
                email +
                '&token=' +
                token +
                '">Password Reset</a>'
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                res.render('forgot', {
                  errorSend: 'Error not send'
                });
                console.log(error);
              } else {
                User.update(
                  {
                    _id: user.id
                  },
                  {
                    token
                  }
                )
                  .then(() => {
                    res.render('forgot', {
                      successSend: 'Message send'
                    });
                  })
                  .catch(() => {
                    console.log('Not Update');
                  });
              }
            });
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.render('forgot', {
          errorSend: 'Error'
        });
      });
  } else {
    res.render('forgot', errors);
  }
});

app.get('/reset', function(req, res) {
  const email = req.query.email;
  const token = req.query.token;

  if (email && token) {
    User.findOne({
      email,
      token
    })
      .then(user => {
        res.render('reset', {
          user: {
            id: user.id
          }
        });
      })
      .catch(() => {
        res.redirect('/login');
      });
  } else {
    res.redirect('/login');
  }
});

app.post('/reset', function(req, res) {
  let errors = {};
  const password = req.body.password;
  const userId = req.body.userId;

  if (!password) {
    errors.errorPassword = 'Password empty';
  } else {
    errors.noError = true;
  }

  if (errors.noError) {
    bcrypt.hash(password, null, null, (err, hash) => {
      User.update({ _id: userId }, { password: hash, token: '' })
        .then(() => {
          res.redirect('/');
        })
        .catch(() => {
          res.redirect('/login');
        });
    });
  } else {
    res.render('reset', errors);
  }
});

app.listen(config.PORT, () =>
  console.log(`Example app listening on port ${config.PORT}!`)
);
