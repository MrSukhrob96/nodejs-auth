const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const router = express.Router();
const config = require('../config');

const User = require('../models/User');

router.get('/forgot', function(req, res) {
  if (req.session.userId) {
    res.redirect('/');
  } else {
    res.render('forgot');
  }
});

router.post('/forgot', function(req, res) {
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

module.exports = router;
