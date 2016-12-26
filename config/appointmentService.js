var User = require("../app/models/oa-user");
var jwt = require("jsonwebtoken");
var config = require("../config/main");

exports.signup = function(req,res){
if(!req.body.email || !req.body.password || !req.body.name) {
    res.json({ success: false, message: 'Please enter all the details.' });
  } else {
    var newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
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

    if (!user) {
      res.send({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          
          var token = jwt.sign(user, config.secret, {
            expiresIn: 10080 // in seconds
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