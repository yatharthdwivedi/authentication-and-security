//jshint esversion:6
require('dotenv').config();
const express = require('express');

const ejs = require('ejs');
const port = 3000;
 
const app = express();
const md5 = require("md5")
 
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const mongoose = require('mongoose');


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB');
}


const userSchema = new mongoose.Schema({
    email : String,
    password: String
})
console.log(process.env.secret);


const Users = mongoose.model("User", userSchema);

app.get("/", function(req,res) {
    res.render("home");
})
 
app.get("/login", function(req,res) {
    res.render("login");
})

app.get("/register", function(req,res) {
    res.render("register");
})

app.post("/register", function(req,res) {
    const newUser = new Users({
        email : req.body.username,
        password : md5(req.body.password)
    })
    newUser.save(function(err) {
        if(err) {
            console.log(err);
        }
        else {
            res.render("secrets")
        }
    })
})

app.post("/login", function(req,res) {
    const username = req.body.username;
    const password = md5(req.body.password);

    Users.findOne({email: username}, function(err, foundUser) {
        if(err) {
            console.log(err);
        }
        else{
            if(foundUser){
                if(foundUser.password === password) {
                    res.render("secrets")
                }
            }
        }

    })
})
 
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});