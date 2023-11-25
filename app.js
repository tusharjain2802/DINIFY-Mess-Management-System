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
// mongodb://localhost:27017
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');


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


var countSchema = new mongoose.Schema({
    lpc: Number,
    opc: Number
});
const PeopleCount = mongoose.model("PeopleCount", countSchema);

var imageSchema = new mongoose.Schema({
    id : Number,
    url : String,
    validFrom : String,
    validTill : String,
    item:[[[String]]],
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

app.post('/getCount',  async (req, res) => {
    try {
        const user = await PeopleCount.findOne()
        console.log(user);
        res.send(user)
    } catch (error) {
        console.error(error.message)
        res.send("Server Error")

    }
})

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
    // if(req.isAuthenticated()){
        async function displayMenu() {
            const image = await Image.findOne({ id:1 });
            //foundList.save();
            res.render("incharge/uploadmenu",{imgs:image});
            console.log(image.validFrom);
            }
            displayMenu();
    // }
    // else{
    //     res.redirect("/login");
    // }
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

app.get('/home/person',function(req,res,next)
{
    
        personData =PeopleCount.find({}, function(err, personData){
            personData.forEach(element => {
                res.send({status:true,opc:element.opc,lpc:element.lpc})
            });
        });
    
})

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

    result =Image.find({}, function(err, personData){

        async function print3DArray() {
            try {
                // Find the document with the 3D array (you can use any criteria to find the specific document)
                const image = await Image.findOne({ id:1 });
        
                if (image) {
                    for (const i of image.item) {
                        for (const j of i) {
                            for(const k of j){
                                console.log(k);
                            }
                        }
                    }
                } else {
                    console.log('Image not found');
                }

                res.render("menu",{imgs:image});
            } catch (error) {
                console.error('Error:', error);
            }
        }
        
        print3DArray();

    });
   
    // if(req.isAuthenticated()){
        // Image.findOne({id:1}, function(err, imgs){
        //     var items = [imgs.item];
        //     res.render("menu",{imgs:imgs, items:items});
        // });
    // }     
    // else{
    //     res.redirect("/login");
    // }
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
    Image.findOne({id:1}, function(err, foundMenu){
        foundMenu.validFrom = req.body.startdate;
        foundMenu.validTill = req.body.enddate;
        foundMenu.item = [
            [
              [
                req.body.bm0, 
                req.body.bm1,
                req.body.bm2,
                req.body.bm3
              ],
              [
                req.body.lm0,
                req.body.lm1,
                req.body.lm2,
                req.body.lm3
              ],
              [
                req.body.dm0,
                req.body.dm1,
                req.body.dm2,
                req.body.dm3
              ]
            ],
            [
                [
                    req.body.bt0, 
                    req.body.bt1,
                    req.body.bt2,
                    req.body.bt3
                  ],
                  [
                    req.body.lt0,
                    req.body.lt1,
                    req.body.lt2,
                    req.body.lt3
                  ],
                  [
                    req.body.dt0,
                    req.body.dt1,
                    req.body.dt2,
                    req.body.dt3
                  ]
            ],
            [
                [
                    req.body.bw0, 
                    req.body.bw1,
                    req.body.bw2,
                    req.body.bw3
                  ],
                  [
                    req.body.lw0,
                    req.body.lw1,
                    req.body.lw2,
                    req.body.lw3
                  ],
                  [
                    req.body.dw0,
                    req.body.dw1,
                    req.body.dw2,
                    req.body.dw3
                  ]
            ],
            [
                [
                    req.body.bth0, 
                    req.body.bth1,
                    req.body.bth2,
                    req.body.bth3
                  ],
                  [
                    req.body.lth0,
                    req.body.lth1,
                    req.body.lth2,
                    req.body.lth3
                  ],
                  [
                    req.body.dth0,
                    req.body.dth1,
                    req.body.dth2,
                    req.body.dth3
                  ]
            ],
            [
                [
                    req.body.bf0, 
                    req.body.bf1,
                    req.body.bf2,
                    req.body.bf3
                  ],
                  [
                    req.body.lf0,
                    req.body.lf1,
                    req.body.lf2,
                    req.body.lf3
                  ],
                  [
                    req.body.df0,
                    req.body.df1,
                    req.body.df2,
                    req.body.df3
                  ]
            ],
            [
                [
                    req.body.bs0, 
                    req.body.bs1,
                    req.body.bs2,
                    req.body.bs3
                  ],
                  [
                    req.body.ls0,
                    req.body.ls1,
                    req.body.ls2,
                    req.body.ls3
                  ],
                  [
                    req.body.ds0,
                    req.body.ds1,
                    req.body.ds2,
                    req.body.ds3
                  ]
            ],
            [
                [
                    req.body.bsu0, 
                    req.body.bsu1,
                    req.body.bsu2,
                    req.body.bsu3
                  ],
                  [
                    req.body.lsu0,
                    req.body.lsu1,
                    req.body.lsu2,
                    req.body.lsu3
                  ],
                  [
                    req.body.dsu0,
                    req.body.dsu1,
                    req.body.dsu2, 
                    req.body.dsu3
                  ]
            ]
          ];
        foundMenu.save();
        
    });
    res.redirect("uploadmenu");
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