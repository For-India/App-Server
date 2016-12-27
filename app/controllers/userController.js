//Importing dependencies
var User = require("../models/user");
var jwt = require("jsonwebtoken");
var config = require("../../config/main");
var async = require("async");
var crypto = require("crypto");
var nodemailer = require("nodemailer");
var mg = require('nodemailer-mailgun-transport');
var path = require("path");

//Function to handle Singup route
exports.signup = function(req,res) {
    async.waterfall([
      function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    //Anonymous function to save User
    function(token, done) {
      var newUser = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        gender: req.body.gender,
        dob: req.body.dob,
        email: req.body.email,
        password: req.body.password,
        aadharNo: req.body.aadharNo,
        resedentialAddress: { address: req.body.address, city: req.body.city, state: req.body.state, pincode: req.body.pincode },
        mobileNo: req.body.mobileNo,
        verificationToken: token
      });

      // Attempt to save the user
      newUser.save(function(err) {
        if (err) {
          return res.json({ success: false, message: 'That email address already exists.'});
        }
        // res.status(201);
        // res.json({ success: true, message: 'Successfully created new user.' });
        done(err, token, newUser);
      });
    },
    //Anonymous function to send verification mail to User
    function(token, newUser, done) {
      var auth = {
          auth: {
            api_key: 'key-faa7974bda757edaf7a0b94de860c06b',
            domain: 'sandbox1f29f50c71f24689ac0e16d17df30acf.mailgun.org'
          }
        }

        var nodemailerMailgun = nodemailer.createTransport(mg(auth));

        nodemailerMailgun.sendMail({
          from: 'NoReply <admin@forindia.com> ',
          to: newUser.email,
          subject: 'Account verification - ForIndia',
          text: 'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
           'http://' + req.headers.host + '/user/verify/' + token + '\n\n' + 'Regards,' + '\n\n' + 'admin@forindia.com'
        }, function (err, info) {
          if (err) {
            res.json({ success: false, message: 'Internal server error.' });
          }
          else {
            res.json({ success: true, message: 'Successfully created new user.' });
          }
        });
    }
  ], function (error) {
      if (error) {
         res.json({ success: false, message: 'Internal server error.' });
      }
  });
}


//Function to handle Login route
exports.login = function(req, res) {
  User.findOne({
    email: req.body.email
  }, function(err, user) {
    if (err) throw err;
    if (req.body.email == null) {
      res.send({success: false, message: 'Please provide an email ID'});
    }
    else if (!user) {
      res.send({ success: false, message: 'Authentication failed. User not found.'});
    } 
    else if (!user['isVerified']) {
      res.send({ success: false, message: 'User is not verified.'});
    } 
    else {
      // Check if password matches
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          
          var token = jwt.sign(user, config.secret, {
            expiresIn: 10080 //in seconds
          });
          
          res.json({ success: true, token: 'JWT ' + token });
        } else {
          res.send({ success: false, message: 'Authentication failed. Passwords did not match.'});
        }
      });
    }
  });
};

//Function to verify User
exports.verify = function(req, res){
  User.findOne({verificationToken: req.params.token},function(err, user){
      if(!user){
        res.json({ success: false, message: "User not found."});
      }

      user.verificationToken = undefined;
      user.isVerified = true;
      user.save(function(err){
        if(err){
         res.json({ success: false, message: "User is not verified"});
       }
      });
      res.json({ success: true, message: "User verified Successfully."});
  });
};

//Function to handle forgot password
exports.forgot = function(req,res) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if(!req.body.email){
          res.send({ status: false, message: "Please provide an email ID"});
        }
        else if (!user) {
          res.send({ status: false, message: "User not found."});
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err) {
          if(err){
            res.send({ status: false, message: "User not found"});
          }
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var auth = {
          auth: {
            api_key: 'key-faa7974bda757edaf7a0b94de860c06b',
            domain: 'sandbox1f29f50c71f24689ac0e16d17df30acf.mailgun.org'
          }
        }
      var nodemailerMailgun = nodemailer.createTransport(mg(auth));
      nodemailerMailgun.sendMail({
          from: 'NoReply <admin@forindia.com> ',
          to: user.email,
          subject: 'Passoword reset - ForIndia',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        }, function (err, info) {
          if (err) {
            res.json({ success: false, message: 'Internal server error.' });
          }
          else {
            res.json({ success: true, message: 'Reset email successfully sent.' });
          }
        });
    }
  ], function(err) {
      if (error) {
         res.json({ success: false, message: 'Internal server error.' });
      }
  });
};

//Function to render reset page
exports.getReset = function(req,res){
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.sendFile(path.join(__dirname+'../../../public/reset.html'));
  });
};

//Function to reset password
exports.postReset = function(req,res){
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          res.send({ status: false, message: "Password reset token is invalid or expired"});
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          if(err){
            res.send({ status: false, message: "User not found"});
          }
          done(err, user);
        });
      });
    },
    function(user, done) {
      var auth = {
          auth: {
            api_key: 'key-faa7974bda757edaf7a0b94de860c06b',
            domain: 'sandbox1f29f50c71f24689ac0e16d17df30acf.mailgun.org'
          }
        }
      var nodemailerMailgun = nodemailer.createTransport(mg(auth));
      nodemailerMailgun.sendMail({
          from: 'NoReply <admin@forindia.com> ',
          to: user.email,
          subject: 'Your password has been changed - ForIndia',
          text: 'Hello,\n\n' +
           'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        }, function (err, info) {
          if (err) {
            res.json({ success: false, message: 'Internal server error.' });
          }
          else {
            res.json({ success: true, message: 'Success! Your password has been changed.' });
          }
        });
    }
  ], function(err) {
    res.json({ success: false, message: 'Internal server error.' });
  });
};

//Function to handle dashboard route
exports.dashboard = function(req, res) {
  res.json(req.user._id);
};