var User = require("../models/user");
var jwt = require("jsonwebtoken");
var config = require("../../config/main");

exports.signup = function(req,res){
if(!req.body.email || !req.body.password || !req.body.firstname) {
    res.json({ success: false, message: 'Please enter all the details.' });
  } else {
    var newUser = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      gender: req.body.gender,
      dob: req.body.dob,
      email: req.body.email,
      password: req.body.password,
      aadharNo: req.body.aadharNo,
      resedentialAddress: { address: req.body.address, city: req.body.city, state: req.body.state, pincode: req.body.pincode },
      mobileNo: req.body.mobileNo
    });

    // Attempt to save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({ success: false, message: 'That email address already exists.'});
      }
      res.json({ success: true, message: 'Successfully created new user.' });
    });
  }

};


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
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          
          var token = jwt.sign(user, config.secret, {
            expiresIn: 10080 //in seconds
          });
          
          res.json({ success: true, token: 'JWT ' + token });
        } else {
          res.send({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
};

exports.dashboard = function(req, res) {
  res.json(req.user._id);
};