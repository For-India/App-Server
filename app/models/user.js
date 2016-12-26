var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
require('mongoose-long')(mongoose);
var SchemaTypes = mongoose.Schema.Types;

var UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  dob: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  aadharNo: {
    type: SchemaTypes.Long,
    required: true
  },
  resedentialAddress: {
    address: {
      type: String,
      required: true
    }, 
    city: {
      type: String,
      required: true
    }, 
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: Number,
      required: true
    }
  },
  mobileNo: {
    type:SchemaTypes.Long,
    required: true
  }
});

// Saves the user's password hashed (plain text password storage is not good)
UserSchema.pre('save', function (next) {
  var user = this;
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

// Create method to compare password input to password saved in database
UserSchema.methods.comparePassword = function(pw, cb) {
  bcrypt.compare(pw, this.password, function(err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', UserSchema, 'oa-user');