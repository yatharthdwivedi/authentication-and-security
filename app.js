//jshint esversion:6
const express = require('express');

const ejs = require('ejs');
const port = 3000;
 
const app = express();
 
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB');
}


const userSchema = new mongoose.Schema({
    email : String,
    password: String
})

const secret = "My Secret bhosdike";
userSchema.plugin(encrypt, {secret: secret, encryptedFields : ["password"]});

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
        password : req.body.password
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
    const password = req.body.password;

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