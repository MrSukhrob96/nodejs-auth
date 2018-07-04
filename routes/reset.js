const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const router = express.Router();

const User = require('../models/User');

router.get('/reset', function(req, res) {
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

router.post('/reset', function(req, res) {
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

module.exports = router;
