var userController = require("../controllers/userController");
var express = require("express");

module.exports = function(app,passport){


app.get('/', function(req,res){
    res.send("The Server is Up for India!");
});
        
    
// API for Users
var user = express.Router();
app.use('/user', user);

// Signup
user.post('/signup', userController.signup );

// Authenticate the user and get a JSON Web Token to include in the header of future requests.
user.post('/login', userController.login);

// Verify registered users
user.get('/verify/:token', userController.verify);

// Forgot password
user.post('/forgot', userController.forgot);

// Reset password - render page
user.get('/reset/:token', userController.getReset);

// Reset password
user.post('/reset/:token', userController.postReset);


// Protect dashboard route with JWT
user.get('/dashboard', passport.authenticate('jwt', { session: false }), userController.dashboard);

};