var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var passport = require("passport");
var morgan = require("morgan");
var cors = require("cors");
var routes = require("./app/routes/routes");
var config = require("./config/main");


//Load Env variables
require('dotenv').load({path:'.env'});

app.use(cors());

var port = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ extended : false }));
app.use(bodyParser.json());


app.use(morgan('combined'));

app.use(passport.initialize());

mongoose.connect(config.database);
var dbConnection = mongoose.connection;
// If the connection throws an error
dbConnection.on('error',function (err) {
    console.log('Mongoose default connection error: ' + err);
    process.exit(1);
});

// When the connection is disconnected
dbConnection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
    process.exit(1);
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
    dbConnection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

dbConnection.on('connected', function() {
    console.log('Database up for India');
    
require("./config/passport")(passport);

routes(app,passport);

app.listen(port, function(){
console.log("Server is up on port " + port);
})

});