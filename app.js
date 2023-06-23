//jshint esversion:6
require('dotenv').config();

const date = require(__dirname+"/views/date.js")
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose  = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
mongoose.connect("mongodb+srv://admin-tushar:pswd6920@cluster0.lngsx.mongodb.net/MessManagement",{UseNewUrlParser:true});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

var messagebird = require('messagebird')()

app.use(session({
    secret: "Our little Secret.",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());

var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password : String,
    googleId: String,
    number: Number,
    roomnum: Number,
    hostel: String
});

var postSchema = {
    postName:String,
    postTitle: String,
    postBody: String,
    dayToday:String,
    rated:Number
};
const Post = mongoose.model("Post", postSchema);

var imageSchema = new mongoose.Schema({
    id : Number,
    url : String,
    validFrom : String,
    validTill : String
});
const Image = mongoose.model("Image", imageSchema);

var issueSchema = new mongoose.Schema({
    name : String,
    email : String,
    subject : String,
    message: String
});
const Issue = mongoose.model("Issue", issueSchema);

var optionSchema = new mongoose.Schema({
    id : Number,
    Dish : String,
    Vote : Number,
    names:{
        type:[String]
    }
});
const Option = mongoose.model("Option", optionSchema);

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});



app.get("/",function(req,res){
    res.render("index");
});

app.get("/mess",function(req,res){
    if(req.isAuthenticated()){
        res.render("incharge/mess");
    }
    else{
        res.redirect("/login");
    }
});
app.get("/uploadmenu",function(req,res){
    if(req.isAuthenticated()){
        res.render("incharge/uploadmenu");
    }
    else{
        res.redirect("/login");
    }
});
app.get("/feedbacks",function(req,res){
    if(req.isAuthenticated()){
    Post.find({}, function(err, posts){
        Issue.find({}, function(err, issues){
        res.render("incharge/feedbacks",{allPosts:posts, issues:issues});
    });
    });
}
    else{
        res.redirect("/login");
    }
});

app.get("/options",function(req,res){
    if(req.isAuthenticated()){
    Option.find({}, function(err, options){
        res.render("incharge/options",{options:options});
    });
}
    else{
        res.redirect("/login");
    }
});
app.get("/login",function(req,res){
    res.render("login");
});

app.get("/home/:user", function(req,res){
    if(req.isAuthenticated()){
        const user = JSON.parse(req.params.user);
        res.render("home",{user});
    } 
    else{
        res.redirect("/login");
    }

});

app.get("/already_voted", function(req,res){
    res.render("already_voted");

});

app.get("/login",function(req,res){
    res.render("login");
  });

app.get("/menu",function(req,res){
    if(req.isAuthenticated()){
        Image.find({}, function(err, imgs){
            res.render("menu",{imgs:imgs});
        });
    }     
    else{
        res.redirect("/login");
    }
});
app.get("/review",function(req,res){
    if(req.isAuthenticated()){
        res.render("review");
    }     
    else{
        res.redirect("/login");
    }
    
});

app.get("/change",function(req,res){
    if(req.isAuthenticated()){
        Option.find({}, function(err, options){
            res.render("change",{options:options});
        });
    }
    else{
        res.redirect("/login");
    }
});

app.post("/change", function(req,res){
    let vote=-1;
    if(req.body.dish0==="on"){
        vote=0;
    }
    else if(req.body.dish1==="on"){
        vote=1;
    }
    else if(req.body.dish2==="on"){
        vote=2;
    }
    else if(req.body.dish3==="on"){
        vote=3;
    }
    else if(req.body.dish4==="on"){
        vote=4;
    }
    else {
        vote = -1; 
    }
    if(vote != -1){
        Option.findOne({id:vote}, function(err, foundList){
            var flag=0;
            var found = foundList.names.find(function (element) {
                if(element === req.body.name){
                    flag=1;
                    return element;
                }
            });
            if(flag===1){
                res.redirect("already_voted");
            }
            else{
                foundList.Vote+=1;
                foundList.names.push(req.body.name);
                foundList.save();
                res.redirect("/change");
            } 
        });
}
    else{
        res.redirect("/change");
    }
});

app.post("/", function(req,res){ 
    User.register({username :req.body.username, number:req.body.number, name: req.body.name,roomnum: req.body.roomnum, hostel:req.body.hostel },req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/");
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/login");
            });
        }
    });
});

app.post("/issue", function(req,res){ 
    const issue = new Issue({
        name : req.body.name,
        email : req.body.email,
        subject : req.body.subject,
        message: req.body.message
    });
 
    issue.save(function(err){
      if (!err){
        res.redirect("/review");
      }
    });
});

app.post("/login", function(req,res){
    const position  = req.body.position;
    if(position === "Student"){
    const user = new User({
        username : req.body.username,
        password: req.body.password
    });
    
    var hostel;
    User.findOne({username:user.username},(err,result)=>{
        if(err)
        {
            console.log(err);
        }
        else{
            hostel = result;
        }
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res, function(){
                res.redirect(`home/${JSON.stringify({name:hostel.name,hostel:hostel.hostel})}`);   
            });
        }
    });
}
else{
    const useremail  = req.body.username;
    const user = new User({
        username : req.body.username,
        password: req.body.password
    });
    if(useremail === "warden.o@thapar.edu"){
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/mess");   
            });
        }
    });
}
else{
    res.render("unauth");
}
}
});

app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});


app.post("/review", function(req,res){
    let day = date.getDate();
    let rating;
    if(req.body.rate5==="on"){
        rating=5;
    }
    else if(req.body.rate4==="on"){
        rating=4;
    }
    else if(req.body.rate3==="on"){
        rating=3;
    }
    else if(req.body.rate2==="on"){
        rating=2;
    }
    else {
        rating=1;
    }
    const post = new Post({
        postName : req.body.postName,
        postTitle : req.body.meal,
        postBody : req.body.postBody,
        dayToday:day,
        rated:rating
    });
 
    post.save(function(err){
      if (!err){
        res.redirect("/review");
      }
    });
});
app.post("/uploadmenu", function(req,res){
    // const image = new Image({
    //     validFrom:req.body.startdate,
    //     validTill:req.body.enddate,
    //     id : 1,
    //     url : req.body.link
    // });
    // image.save();
    Image.findOne({id:1}, function(err, foundList){
        foundList.validFrom=req.body.startdate;
        foundList.validTill = req.body.enddate;
        foundList.url = req.body.link;
        foundList.save();
        res.redirect("/uploadmenu");
    });
});

app.post("/options", function(req,res){
    // const option = new Option({
    //     id : 5,
    //     Dish : 'Palak corn',
    //     Vote : 0
    // });
    // option.save();
    var arr  = [req.body.op1, req.body.op2, req.body.op3, req.body.op4, req.body.op5];
    for(let i=0;i<5;i++){
        Option.findOne({id:i}, function(err, foundList){
            foundList.Dish=arr[i];
            foundList.Vote = 0;
            foundList.names = [];
            foundList.save();
            
        });
    }
res.redirect("/options");
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Server started");
});
