var appointmentService = require("../../config/appointmentService");
var express = require("express");

module.exports = function(app,passport){


app.get('/', function(req,res){
    res.send("The Server is Up for India!");
});
        
    
// API for Online Appointment
var oa = express.Router();
app.use('/oa', oa);

// Signup
oa.post('/signup', appointmentService.signup );

// Authenticate the user and get a JSON Web Token to include in the header of future requests.
oa.post('/login', appointmentService.login);

// Protect dashboard route with JWT
oa.get('/dashboard', passport.authenticate('jwt', { session: false }), appointmentService.dashboard);



};