process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'production';


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');

//var LocalStrategy = require('passport-local').Strategy;
var authenticate = require('./authenticate');

var config = require('./config');

/* to avoid:
"DeprecationWarning: Mongoose: mpromise (mongoose's default promise library) is deprecated" */
mongoose.Promise = global.Promise;

//for localhost
mongoose.connect(config.mongoUrl);


//for HEROKU
// mongoose.connect(process.env.MONGOLAB_URI, function (error) {
//     if (error) console.error(error);
//     else console.log('mongo connected');
// });

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // connected!
  //  console.log("Connected correctly to server");
  console.log("Connected correctly to database");
});

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.disable('x-powered-by');//remove powered by express message for security

//app.use(passport.initialize());
///////////////////////////////////////////////////////////////////////
// Secure traffic only
/* app.all('*', function (req, res, next) {
  console.log('req start: ', req.secure, req.hostname, req.url, app.get('port'));
  if (req.secure) {
    return next();
  }

  res.redirect('https://' + req.hostname + ':' + app.get('secPort') + req.url);
  //res.redirect(307,'https://'+req.hostname+':'+app.get('secPort')+req.url);
}); */
/////////////////////////////////////////////////////////////////////////////

//redirect to secure on heroku
// Force https 
app.use(function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// view engine setup to serve html
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());

// passport config
var User = require('./models/user');
app.use(passport.initialize());
/* passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); */

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

//this allows refresh, bookmark, etc.
//with angularjs #! removed
//If nothing matches
//We will send index file to client side
//So angular will take care of that route
//If we call url without hash control will go here
app.use('*', function (req, res, next) {
  var indexFile = path.resolve(__dirname, './public/index.html');
  res.sendFile(indexFile);
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});

module.exports = app;