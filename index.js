var express = require('express');
var bcrypt = require('bcrypt');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var randtoken = require('rand-token');

var app = express();

// connect to the database
mongoose.connect('mongodb://localhost/coffee');

// mongodb model for users
var User = mongoose.model('User', {
  _id: { type: String, required: true },
  password: { type: String, required: true },
  authenticationTokens: [{ token: String, expiration: Date }],
  orders: [{
    "options": {
      "grind": { type: String, required: true },
      "quantity": { type: Number, required: true }
    },
    "address": {
      "name": { type: String, required: true },
      "address": { type: String, required: true },
      "address2": String,
      "city": { type: String, required: true },
      "state": { type: String, required: true },
      "zipCode": { type: String, required: true },
      "deliveryDate": { type: Date, required: true }
    }
  }]
});

// use body parser with JSON
app.use(bodyParser.json());

// list all available grind options
app.get('/options', function(req, res) {
  res.json([
    "Extra coarse",
  	"Coarse",
  	"Medium-coarse",
  	"Medium",
  	"Medium-fine",
  	"Fine",
  	"Extra fine"
  ]);
});

// handle signups
app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  bcrypt.hash(password, 10, function(err, encryptedPassword) {
    if (err) {
      res.status(400).json({ "status": "fail", "message": err.message });
      return;
    }
    User.findOne({ _id: username }, function(err, user) {
      if (err) {
        res.status(400).json({ "status": "fail", "message": err.message });
        return;
      }
      if (!user) {
        // create user
        User.create({
          _id: username,
          password: encryptedPassword
        }, function(err) {
          if (err) {
            res.status(400).json({ "status": "fail", "message": err.message });
            return;
          }
          res.status(200).json({ "status": "ok" });
        });
      } else {
        // user already exists, json 409
        res.status(409).json({ "status": "fail", "message": "Username is taken" });
      }
    });
  });
});

// handle login
app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  // find user in database
  User.findOne({ _id: username }, function(err, user) {
    if (err) {
      res.status(400).json({ "status": "fail", "message": "Error finding user " + err.message });
      return;
    }
    // if user isn't found
    if (!user) {
      res.status(400).json({ "status": "fail", "message": "User not found" });
      return;
    } else {
      // compare submitted password with encrypted password in databse
      bcrypt.compare(password, user.password, function(err, matched) {
        if (err) {
          res.status(400).json({ "status": "fail", "message": "Error in bcrypt: " + err.message });
          return;
        }
        // if passwords match, generate token and push to users token array
        if (matched) {
          var token = randtoken.generate(64);
          // set token to expire in 10 days and push to authenticationTokens array
          user.authenticationTokens.push({ token: token, expiration:  Date.now() + 1000 * 60 * 60 * 24 * 10 });
          // save user's new token
          user.save(function(err) {
            if (err) {
              res.status(400).json({ "status": "fail", "message": "Error saving token: " + err.message });
              return;
            }
            // return token in response body
            res.status(200).json({ "status": "ok", "token": token });
          });
        } else {
          // incorrect password
          res.status(400).json({ "status": "fail", "message": "Password doesn't match" });
        }
      });
    }
  });
});

// allows users to order coffee, charges purchases with stripe
app.post('/orders', authRequired, function(req, res) {
  // user is authenticated
  // push the order from the request to orders property on the user object
  var user = req.user;
  user.orders.push(req.body.order);
  //save the user to the database
  user.save(function(err) {
    if (err) {
      // construct a more readable error message
      var errorMessage = "";
      for (var key in err.errors) {
        errorMessage += err.errors[key].message + " ";
      }
      res.status(400).json({ "status": "fail", "message": errorMessage });
      return;
    }
    res.status(200).json({ "status": "ok" });
  });
});

// returns all orders the user has previously submitted
app.get('/orders', authRequired, function(req, res) {
  // user is authenticated
  // respond with an object of all their order history
  var orders = [];
  var user = req.user;
  user.orders.forEach(function(order) {
    orders.push({ "options": order.options, "address": order.address });
  });
  res.status(200).json({ "status": "ok", "message": orders});
});

// function to handle authentication
function authRequired(req, res, next) {
  // assign token variable depending on if it's a GET or POST
  var token = req.query.token ? req.query.token : req.body.token;
  User.findOne(
    //check if token exists and hasn't expired
    { authenticationTokens: { $elemMatch: { token: token, expiration: { $gt: Date.now() } } } },
    function(err, user) {
      //if there was an error finding the user by authenticationToken
      if (err) {
        res.status(400).json({ "status": "fail", "message": err.errors });
        return;
      }
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(400).json({ "status": "fail", "message": "Session expired. Please sign in again." });
        return;
      }
    });
}

app.listen(3000, function() {
  console.log('Listening on 3000...');
});
