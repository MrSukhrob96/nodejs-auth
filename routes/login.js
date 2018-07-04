const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const router = express.Router();

const User = require('../models/User');

router.get('/', function(req, res) {
  if (req.session.userId) {
    res.redirect('/');
  } else {
    res.render('login');
  }
});

router.post('/', function(req, res) {
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

module.exports = router;
