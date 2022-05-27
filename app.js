//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const port = 3000;
const app = express();
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
const localStrategy = require('passport-local')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
 
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }))

app.use(passport.initialize())
app.use(passport.session())  


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB');
}


const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String,
    secret : String
})
// console.log(process.env.secret);

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)


const Users = mongoose.model("User", userSchema);

passport.use(Users.createStrategy());

passport.use(new localStrategy(Users.authenticate()))
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    Users.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res) {
    res.render("home");
})

app.get('/auth/google', 
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

 
app.get("/login", function(req,res) {
    res.render("login");
})

app.get("/register", function(req,res) {
    res.render("register");
})

app.get("/secrets", function(req,res) {
    Users.find({"secret": {$ne: null}}, function(err, foundUser) {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          res.render("secrets", {usersWithSecrets: foundUser})
        }
      }
    })
})

app.get("/logout", function(req,res) {
    req.logout(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/")
        }
    });
    
})

app.get("/submit", function(req,res) {
  if(req.isAuthenticated()) {
    res.render("submit")
  }
  else {
    res.render("login")
  }
})

app.post("/submit", function(req,res) {
  const submittedSecret  = req.body.secret;

  console.log(req.user.id);

  Users.findById(req.user.id, function(err, foundUser) {
    if(err) {
      console.log(err);
    }
    else {
      if (foundUser) {
        foundUser.secret = submittedSecret
        foundUser.save(function() {
          res.redirect("/secrets")
        })
      }
    }
  })
})

app.post("/register", function(req,res) {

    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    //     const newUser = new Users({
    //         email : req.body.username,
    //         password : hash
    //     })
    //     newUser.save(function(err) {
    //         if(err) {
    //             console.log(err);
    //         }
    //         else {
    //             res.render("secrets")
    //         }
    //     })
    // });

    Users.register({username: req.body.username}, req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            res.redirect("/register")
        }
        else {
            passport.authenticate("local")(req,res, function() {
                res.redirect("/secrets")
            })
        }
    })
   
})

app.post("/login", function(req,res) {
    // const username = req.body.username;
    // const password = req.body.password;

    // Users.findOne({email: username}, function(err, foundUser) {
    //     if(err) {
    //         console.log(err);
    //     }
    //     else{
    //         if(foundUser){
    //             bcrypt.compare(password, foundUser.password, function(err, result) {
    //                 // result == true
    //                 if(result == true) {
    //                     res.render("secrets");
    //                 }
    //             });
    //         }
    //     }

    // })

    const user = new Users({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err) {
        if(err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets")
            })
        }
    })
})
 
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});