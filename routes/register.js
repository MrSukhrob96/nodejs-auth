const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const router = express.Router();

const User = require('../models/User');

router.get('/', function(req, res) {
  if (req.session.userId) {
    res.redirect('/');
  } else {
    res.render('register');
  }
});

router.post('/', function(req, res) {
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

module.exports = router;
