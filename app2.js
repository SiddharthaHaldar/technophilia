var express=require("express");
var mongoose=require("mongoose")
var morgan=require("morgan")
var session=require("express-session")
var bodyparser=require("body-parser");
var cookieParser=require("cookie-parser")
var passport=require("passport")
var LocalStrategy=require("passport-local").Strategy
var CustomStrategy=require("passport-custom")
var passportLocalMongoose=require("passport-local-mongoose")
var nodemailer=require("nodemailer")

const app=express();

app.set('view engine',"ejs")
app.use(express.static('./public'))
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use(session({
	secret:'poiuytrewq',
	resave:false,
	saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session());
app.use(express.static(__dirname + "/public"));
console.log(__dirname)

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});

app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
        next();
    });

var transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
        user: 'sidhaldar98@gmail.com',
        pass: '*******'
    }
});

mongoose.connect("mongodb://sidhaldar:sidtechnophilia@ds139446.mlab.com:39446/technophilia")

var db=mongoose.connection

db.once('open',function(){
    console.log("connected to database")
}).on('error',function(error){
    console.log(error)
})

var Schema=mongoose.Schema

var userSchema=new Schema({
    firstname:String,
    lastname:String,
    phoneno:Number,
    emailid:String,
    college:String,
    year:Number
})
var user=mongoose.model("user",userSchema)

var tempuserSchema=new Schema({
    firstname:String,
    lastname:String,
    phoneno:Number,
    emailid:String,
    college:String,
    year:Number
})
var tempuser=mongoose.model("tempuser",tempuserSchema)

passport.serializeUser(function(user,done){
	console.log("inside serializeUser")
	done(null,user._id)
})
passport.deserializeUser(function(uID,done){
	console.log("inside deserializeUser")
	user.findById(uID,function(err,user){
		done(err,user);
	})
	
})

passport.use('mysignup',new CustomStrategy(function(req,done){
	    console.log(req.params.tempuid)
	    tempuser.find({_id:mongoose.Types.ObjectId(req.params.tempuid)},function(err,u){
	        if(err)
	            return done(err)
            else{
                //console.log(u)
                tempuser.deleteOne({_id:mongoose.Types.ObjectId(req.params.tempuid)},function(e,udel){
                    var temp=u[0]
                    if(!err)
                        {
                            user.create({
                                firstname:temp.firstname,
                                lastname:temp.lastname,
                                phoneno:temp.phoneno,
                                emailid:temp.emailid,
                                college:temp.college,
                                year:temp.year
                            },function(err,ufinal){
                                if(err)
                                    return done(err)
                                else{
                                    console.log(ufinal)
                                    return done(null,ufinal)
                                    
                                }
                            })
                        }
                    
                })
                //return done(null,u)        
            }
	    })
        
}))

app.get("/welcome",function(req,res){
    console.log(req.session)
    res.send("welcome")
})

app.get("/failure",function(req,res){
    res.send("failure")
    console.log(req.session)
})

app.get("/confirm/:tempuid",passport.authenticate('mysignup',{
	successRedirect:'/welcome',
	failureRedirect:'/failure'
}))

app.post('/register',function(req,res){
    tempuser.create({
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            phoneno:req.body.phoneno,
            emailid:req.body.emailid,
            college:req.body.college,
            year:req.body.year
    },function(err,u){
        if(err)
            res.send("something went wrong")
        else{
            console.log("temporary user added")
            res.send("Check your mail")
        }
    })
})

app.get("/:id",function(req,res){
     tempuser.find({_id:mongoose.Types.ObjectId(req.params.id)},function(err,u){
	        if(err)
	            res.send(err)
            else{
                res.send(u)
            }
     })
})

app.listen(process.env.PORT,function()
{
    console.log("Server running on:"+process.env.PORT)
})
