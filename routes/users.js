/*jshint esversion: 6 */

var config = require('../config');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Verify = require('./verify');
const querystring = require('querystring');
const https = require('https');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;

router.use(bodyParser.json());


router.route('/captcha')
  .post(function (xreq, res, next) {

    var postData = querystring.stringify({
      'response': xreq.body.captchaResponse,
      'secret': config.captchaSecretKey
    });


    var options = {
      host: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    var respData;

    var req = https.request(options, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:', res.headers);

      res.on('data', (d) => {
        process.stdout.write(d);
        respData = d;
      });
    });

    req.on('error', (e) => {
      console.error(e);
    });

    req.write(postData);
    req.end();

    //send response to client
    res.end(respData);

  });


router.route('/')
  .get(Verify.verifyOrdinaryUser, function (req, res, next) {
    var userId = req.decoded.data._id;

    //		console.log(req.decoded.data);

    User.findById(userId)
      //  .populate('userVideos.postedBy')
      .exec(function (err, user) {
        if (err) return next(err);
        res.json(user);
      });
  });
//////////////////////////////////////////////////////////////////////////////

//for create list
router.route('/')
  .put(Verify.verifyOrdinaryUser, function (req, res, next) {

    console.log("--put body =  " + JSON.stringify(req.body));

    var query = {
      "_id": new ObjectId(req.decoded.data._id)
    };

    var bod = req.body;

    User.findByIdAndUpdate(query, {
    	$push: {
    		listOfLists: bod
    	}
    }, {
    	new: true,
    	upsert: true
    }, function(err, user) {
    	if (err) {

    		console.log("error = " + err);
    		return next(err);
    	}
    	res.json(user);
    });
  });
///////////////////////////////////////////////////////////////////////////////

//edit an existing list of vids -- first remove original list, then add new edited list)
router.route('/edit/:listId')
  .put(Verify.verifyOrdinaryUser, function (req, res, next) {

    var retVal;

    console.log("--body =  " + JSON.stringify(req.body));
    console.log("--listId =  " + JSON.stringify(req.params.listId));

    var query = {
      _id: new ObjectId(req.decoded.data._id) //id of user, not something else

    };

    //first delete list to be changed
    User.update(query, {
      $pull: {
        listOfLists: {
          _id: new ObjectId(req.params.listId) //mongodb obj id of list to remove
        }
      },

    },
      function (err, user) {
        if (err) {

          console.log("error = " + err);
          return next(err);
        }
        //		res.json(user);
        retVal = user;

      });


    //see if list received is empty -- if not then add updated list 

    // 		if (Object.keys(req.body.listOfVids.length)) { //if list is NOT edited to empty
    if (req.body.listOfVids.length != 0) { //if list is NOT edited to empty

      console.log(req.body);
      User.findByIdAndUpdate(query, { //push vid list and name into user's listOfLists
        $push: {
          listOfLists: req.body
        }
      }, {
          new: true,
          upsert: true

        }, function (err, user) {
          if (err) {

            console.log("error = " + err);
            return next(err);
          }
          //		res.json(user);
          retVal = user;

        });

    }
    res.json(retVal);
  });


///////////////////////////////////////////////////////////////////////////////

router.post('/register', function (req, res) {
  User.register(new User({
    username: req.body.username
  }),
    req.body.password,
    function (err, user) {
      if (err) {
        return res.status(500).json({
          err: err
        });
      }
      if (req.body.firstname) {
        user.firstname = req.body.firstname;
      }
      if (req.body.lastname) {
        user.lastname = req.body.lastname;
      }

      if (req.body.email) {
        user.emailAddress1 = req.body.email;
      }

      //  req.body.password = req.body.password.generateHash(req.body.password);

      user.save(function (err, user) {
        passport.authenticate('local')(req, res, function () {
          return res.status(200).json({
            status: 'Registration Successful!'
          });
        });

      });
    });
});



router.post('/login', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function (err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }

      var token = Verify.getToken({
        "username": user.username,
        "_id": user._id,
        "admin": user.admin
      });
      res.status(200).json({
        status: 'Login successful!',
        success: true,
        token: token
      });
    });
  })(req, res, next);
});

router.get('/logout', function (req, res) {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});



///////////////////////////////////////////////////////////


router.route('/:userId')
  .get(function (req, res, next) {
    User.findById(req.params.userId)
      //    .populate('listOfLists')
      .exec(function (err, user) {
        if (err) return next(err);
        res.json(user);
      });
  });


router.route('/:userId/userVideos')
  //   .all(Verify.verifyOrdinaryUser)
  .get(Verify.verifyOrdinaryUser, function (req, res, next) {
    User.findById(req.params.userId)
      .populate('userVideos.postedBy')
      .exec(function (err, user) {
        if (err) return next(err);
        res.json(user.userVideos);
      });
  })

  ///////////////////////////////////////////////////////////////////////////////////

  .post(Verify.verifyOrdinaryUser, function (req, res, next) {
    User.findById(req.params.userId, function (err, user) {
      if (err) return next(err);
      //req.body.postedBy = req.decoded._doc._id;  -- original but not working
      //		req.body.postedBy = req.decoded.data._id;
      user.userVideos.push(req.body);
      user.save(function (err, user) {
        if (err) return next(err);
        console.log('Updated Videos!');
        res.json(user);
      });
    });
  });


module.exports = router;

