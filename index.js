const express=require('express');
const mongoose=require('mongoose');
const path=require('path');
const bodyParser = require('body-parser');
var nodemailer = require("nodemailer");
const multer  = require('multer');
var storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'uploads');
    },
    filename:function(req,file,cb){
        //console.log(file.filename);
        cb(null, Date.now()+ '-'+ file.originalname);
    }
});
var upload=multer({storage:storage});
const db='mongodb+srv://vaibhav54:agent47@cluster0.7afd5.mongodb.net/acadedata?retryWrites=true&w=majority'

mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex:true,useFindAndModify:false}).then(()=>{

    console.log('coneection succesful');
}).catch((err)=>console.log('no connection'));
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

//quiz variable start
var quizfile=[];var answers=[];var index=0;var score=0;var notAttempt=0,timelimit="";
var items=[];
var quiz={
    quizTitle:" ",
    timeLimit:" ",
    code:" "
}
 var item={
    
     q:" ",
     opt1:" ",
    opt2:" ",
    opt3:" ",
    opt4:" ",
     ans :" ",
}
var title=" ";
//quiz variable end

const app=express();
var choice,headin,desc;
var  transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    secure: true,
    port: 465,
    auth: {
      user: 'vaibhav7985@zohomail.com',
      pass: 'agent@47',
    },
  });

app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname,'/public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

//mongoose start
const assignmentSchema=new mongoose.Schema({
    assignmentTitle:String,
    path:String
});
const uploadSchema=new mongoose.Schema({
    id:{type:mongoose.Schema.Types.ObjectId, ref:'assignmentSchema'},
    details:{type:Array,default:[]},

});
const quizquestionSchema=new mongoose.Schema({
    quizTitle:String,
    code:Number,
    timeLimit:String,
    questions:{type:Array , default:[]}
});
const marksSchema=new mongoose.Schema({
    id:{type:mongoose.Schema.Types.ObjectId, ref:'quizquestionSchema'},
    details:{type:Array, default:[]}
});
var userSchema = new mongoose.Schema({
    fname:String,
    lname:String,
    email: { type: String, unique: true },
    password:String,
    quizzes:[{quizid:{type: mongoose.Schema.Types.ObjectId, ref:'quizquestionSchema'},title:String}],
    assignments:[{assignmentid:{type: mongoose.Schema.Types.ObjectId, ref:'assignmentSchema'},title:String}]
});
const tokenSchema=new mongoose.Schema({
    randomId:Number,
    fname:String,
    lname:String,
    email:String,
    password:String,
    createdAt: { type: Date, required: true, default: Date.now, expires: 600 }
});
const User=new mongoose.model('User',userSchema);
var Token=new mongoose.model("Token",tokenSchema);
var quizcreate=mongoose.model("quizcreate",quizquestionSchema);
var markscreate=mongoose.model("markscreate",marksSchema);
var assignmentcreate=mongoose.model('assignmentcreate',assignmentSchema);
var uploadcreate=mongoose.model('uploadcreate',uploadSchema);
//mongoose end
app.get('/',(req,res)=>{
    res.render("homepage");
});

app.get('/signup',(req,res)=>{
    res.render("signup");
});
app.get('/login',(req,res)=>{
    res.render("login");
});

app.post('/signup/auth',(req,res,next)=>{
    var redaddress="3;";
    
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    if(!validateEmail(req.body.email)){
        choice="Error";
        headin="Error";
        desc='Invalid email address entered. Redirecting you to the signup page';
        redaddress+="url=/signup";
        res.render("error",{Choice:choice,err:headin,description:desc,redlink:redaddress});
    /*var isEmail=emailExistence.check(JSON.stringify(req.body.email),(res,err)=>{
        console.log(res);
    });*/
    //console.log(isEmail);

    }else{
        User.findOne({ email: req.body.email }, function (err, user) {
                if(user){
                    console.log('usr database');
                    choice="Error";
                    headin="Error";
                    desc="User with this email id already registered in database.Redirecting you to the login page";
                    redaddress+="url=/login";
                    res.render("error",{Choice:choice,err:headin,description:desc,redlink:redaddress});
                    next([err]);
                }else{
                    var rand=Math.floor((Math.random() * 100) + 54);
                   var Token=new mongoose.model("Token",tokenSchema);
                    const temptoken=new Token({
                        randomId:rand,
                        fname:req.body.fname,
                        lname:req.body.lname,
                        email:req.body.email,
                        password:req.body.password,
                })
                    temptoken.save();
                    var host=req.get('host');
                    var link="http://"+host+"/verify?id="+rand;//change "host"to host
                     // var rand=Math.floor((Math.random()*1000000)+1);
                      

                    
                    mailOptions={
                            from:'vaibhav7985@zohomail.com',
                            to : req.body.email,
                            subject : "Please confirm your Email account",
                            html : "Hello,<br> Please Click on the link to verify your email.You have 10 minutes.<br><a href="+link+">Click here to verify</a>"
                          //  html:`hello your digit verification code is ${rand}`
                    }
                    console.log(mailOptions);
                    transporter.sendMail(mailOptions, function(error, response){
                           
                            if(error){
                                console.log(error);
                                choice="Error";
                                headin="Error";
                                desc="Error sending the mail. Redirecting you to signup page";
                                redaddress+="url=/signup"
                                res.render("error",{Choice:choice,err:headin,description:desc,redlink:redaddress});
                            }else{
                                console.log('mail sent');
                                choice="Success";
                                headin="Success";
                                desc="Just verify your email by the link sent to your inbox and you are ready to go. Till then have at look at our homepage ";
                                redaddress+="url=/"
                                res.render("error",{Choice:choice,err:headin,description:desc,redlink:redaddress});
                            }
                    });
                    
            
            
                console.log(req.body);
                }
        });
}
});        
app.get('/verify',(req,res)=>{
    var rand=parseInt(req.query.id,10);
    console.log(req.query.id);
    console.log(rand);
    var redaddress="5;";
    Token.findOne({randomId:rand},(err,toku)=>{
        if(!toku){
            choice="Error";
            headin="Error";
            desc="Sorry either verification link has expired or you haven't registered. We are redirecting you to the homepage";
            redaddress+="url=/";
            res.render("error",{Choice:choice,err:headin,description:desc,redlink:redaddress});
        }else{

            var obj=new User({
                fname:toku.fname,
                lname:toku.lname,
                email:toku.email,
                password:toku.password
            });
            obj.save();
            Token.deleteMany({email:toku.email},(err)=>{
                console.log(err);
            });
            choice="Success";
            headin="Success";
            desc="You account has been registered. you will be redirected to the login page";
            redaddress+="url=/login"
            res.render("error",{Choice:choice,err:headin,description:desc,redlink:redaddress});
        }
    });
});
app.post('/login/auth',(req,res)=>{
    console.log(req.body);
    var redaddress="3;";
    User.findOne({email:req.body.email},(err,user)=>{
        if(!user){
            choice="Error";
            headin="Error";
            desc="You aren't registered with us.We are redirecting you to the login page";
            redaddress+="url=/login"
            res.render("error",{Choice:choice,err:headin,description:desc,redlink:redaddress});
        }
        else{
            if(user.password===req.body.password){
                choice="Success";
                headin="Success";
                desc="login success. Redirecting you to your dashboard";
                redaddress+="url=/user?id="+user.id;
                res.render("error",{Choice:choice,err:headin,description:desc,redlink:redaddress});
            }
            else{
                choice="Error";
                headin="Error";
                redaddress+="url=/login"
                desc="Password didn't match. Redirecting you to login page";
                res.render("error",{Choice:choice,err:headin,description:desc,redlink:redaddress});
            }
        }

    });
});

app.get('/createquiz',(req,res)=>{
    User.findOne({_id:req.query.id},(err,user)=>{
        var link="?id="+req.query.id;
        res.render('createquiz',{link: link});
    });
});
app.post('/createquiz',(req,res)=>
{
    var time=req.body.tl;
    title=req.body.qtitle;
    quiz.quizTitle=title;
    quiz.timeLimit=time;
    quiz.code=Math.floor(100000 + Math.random()*900000);
    console.log(title);
    var link="?id="+req.query.id;
    res.render("list",{link:link,aitems:items,
        t:title
    });
})
app.post('/list',(req,res)=>{
    item={
    
        q:req.body.question,
        opt1:req.body.op1,
       opt2:req.body.op2,
       opt3:req.body.op3,
       opt4:req.body.op4,
        ans :req.body.correctans,
   }
    //item.q=req.body.question;
    //item.opt1=req.body.op1;
    //item.opt2=req.body.op2;
    //item.opt3=req.body.op3;
    //item.opt4=req.body.op4;
    //item.ans=req.body.correctans;
    items.push(item);
    items.push(quiz);
    console.log(items);
    console.log(quiz);
    //res.redirect('list');
    var link="?id="+req.query.id;
    res.render('list',{link:link, aitems:items,t:title});    
});
app.get('/list',(req,res)=>{
    item=
    {
    
        q:" ",
        opt1:" ",
       opt2:" ",
       opt3:" ",
       opt4:" ",
        ans :" ",
   }
    var link="?id="+req.query.id;
    res.render('list',{link:link, aitems:items,t:title});
});

app.post('/aftercreate',(req,res)=>{
    var obj=new quizcreate({
       
        quizTitle: quiz.quizTitle,
        code: quiz.code,
        timeLimit:quiz.timeLimit,
        questions:items
    });
    obj.save();
    console.log(obj.id);
    var link="?id="+req.query.id;
    items.length=0;
    User.findOne({_id:req.query.id},(err,user)=>{
        if(user){
            User.findByIdAndUpdate(req.query.id,
                {"$push":{"quizzes":{quizid:obj.id,title:quiz.quizTitle}}},
                (err,managerparent)=>{
                    console.log(managerparent);
                });
        }
        //{"$push":{"quizzes":obj.id}}
    });
    res.render("aftercreate",{link:link, code:obj.id});
});

app.get('/takequiz',(req,res)=>{
    var link="?id="+req.query.id;
    res.render('takequiz',{link:link, message:""});
});
app.post('/takequiz',(req,res)=>{
   

    console.log(quiz.code);
    console.log(req.body.qcode);
    /*
    if(req.body.qcode==quiz.code)
    res.redirect("/views/quizApp.ejs");
    else{
        res.render('takequiz',{message:"code is incorrect.Try again !"});
    }*/
    quizcreate.findOne({_id:req.body.qcode},(err,quizexist)=>{
        var link="?id="+req.query.id;
        if(quizexist){
            index=0;
            score=0;
            notAttempt=0;
            quizfile=quizexist.questions;
            timelimit=quizexist.timeLimit;
            res.render('quizdisplay',{link:link, questions:quizfile[index], btname:"next", t:timelimit,quizid:quizexist._id});
        }else{
            res.render('takequiz',{link: link,message:"code is incorrect.Try again !"});
        }
    });

});
/*app.get('/quizdisplay',(req,res)=>
{
   // fs.readFile(`${title}.JSON`, (err, data) => {
       // if (err) throw err;
         //quizfile = JSON.parse(data);
        console.log(quizfile);
    //});
    var link="?id="+req.query.id;

    //console.log(quizfile[quizfile.length-1].timeLimit);
    res.render('quizdisplay',{link: link ,questions:quizfile[index],btname:buttonName,t:timelimit});
   
});*/
app.post('/quizdisplay',(req,res)=>{
    var link="?id="+req.query.id;
    var ans=req.body.answer;
    if(ans==quizfile[index].ans)
    {
        score=score+1;
    }
    else if(ans==undefined)
    notAttempt=notAttempt+1;
    index=index+1;
    var buttonName=" ";
    if(index==quizfile.length-1)
    buttonName="submit";
    else
    buttonName="next";
    console.log(quizfile.length);
    if(index<quizfile.length)
    { 
        res.render('quizdisplay',{link: link ,questions:quizfile[index],btname:buttonName,t:timelimit,quizid:req.query.quizid});
    }else{
        console.log('yes');
        console.log(req.query.quizid);
        markscreate.findOne({id:req.query.quizid},(err,marks)=>{
            if(marks){
                /*User.findByIdAndUpdate(req.query.id,
                    {"$push":{"quizzes":obj.id}},
                    (err,managerparent)=>{
                        console.log(managerparent);
                    });*/
                User.findOne({_id:req.query.id},(err,user)=>{
                    if(user){
                        markscreate.updateOne({id:req.query.quizid},
                            {"$push":{"details":{fname:user.fname,lname:user.lname,score:score,total:index}}},(err,raw)=>{});
                        //marks.$push();
                    }
                });
            }
            else{
                User.findOne({_id:req.query.id},(err,user)=>{
                    if(user){
                        const markobj=new markscreate({
                            id:req.query.quizid,
                            details:[{fname:user.fname,lname:user.lname,score:score,total:index}]
                        });
                        markobj.save();
                    }
                });
            }
        });
        res.render('quizscore',{link: link, sco:score,total:index,notdone:notAttempt,attp:index-notAttempt,inc:index-score});
    }

});

app.get('/createquizhistory',(req,res)=>{
    User.findOne({_id:req.query.id},(err,user)=>{
        if(user){
            var link="?id="+req.query.id;
            res.render('quizcreatehistory',{link:link, aitems:user.quizzes});
        }
    });
});

app.get('/resources',(req,res)=>{
    var link="?id="+req.query.id;
    res.render('resources',{link:link});
});

app.get('/displaymarks',(req,res)=>{
    markscreate.findOne({id:req.query.marksid},(err,marks)=>{
        if(marks){
            var link="?id="+req.query.id;
            res.render('displaymarks',{link:link, aitems:marks.details});
        }
    });
});

app.get('/createassignment',(req,res)=>{
    var link="?id="+req.query.id;
    res.render('createassignment',{link:link});
});
app.post('/uploadfile',upload.single('myFile'),(req,res,next)=>{
    const file=req.file;
    req.body.toString;
    const title=req.body.title;
    console.log(title);
    console.log(req.body);
    var link="?id="+req.query.id;
    if(!file){
        const error=new Error('Please upload a file');
        error.httpStatusCode=400;
        return next(error);
    }
    var obj=new assignmentcreate({
        assignmentTitle: title,
        path:'./uploads/'+file.filename
    });
    console.log(file);
    obj.save();
    console.log(obj.path);
    User.findOne({_id:req.query.id},(err,user)=>{
        if(user){
            User.findByIdAndUpdate(req.query.id,
                {"$push":{"assignments":{assignmentid:obj.id,title:title}}},
                (err,managerparent)=>{
                    console.log(managerparent);
                });
        }
    });
    res.render('uploadfile',{link:link,fn:obj.path,code:obj.id});
});

app.get('/takeassignment',(req,res)=>{
    var link="?id="+req.query.id;
    res.render('takeassignment',{link:link, message:""});
});
app.post('/takeassignment',(req,res)=>{
   

    console.log(quiz.code);
    console.log(req.body.qcode);
    /*
    if(req.body.qcode==quiz.code)
    res.redirect("/views/quizApp.ejs");
    else{
        res.render('takequiz',{message:"code is incorrect.Try again !"});
    }*/
    assignmentcreate.findOne({_id:req.body.qcode},(err,assignmentexist)=>{
        var link="?id="+req.query.id;
        if(assignmentexist){
            res.render('assignmentdisplay',{link:link, fn:assignmentexist.path, assignmentid:assignmentexist._id});
        }else{
            res.render('takeassignment',{link: link,message:"code is incorrect.Try again !"});
        }
    });

});
app.post('/assignmentdisplay',upload.single('myFile'),(req,res,next)=>{
    const file=req.file;
    var link="?id="+req.query.id;
    var assignmentid=req.query.assignmentid;
    if(!file){
        const error=new Error('Please upload a file');
        error.httpStatusCode=400;
        return next(error);
    }
    uploadcreate.findOne({id:assignmentid},(err,uploads)=>{
        if(uploads){
            /*User.findByIdAndUpdate(req.query.id,
                {"$push":{"quizzes":obj.id}},
                (err,managerparent)=>{
                    console.log(managerparent);
                });*/
            User.findOne({_id:req.query.id},(err,user)=>{
                if(user){
                    uploadcreate.updateOne({id:assignmentid},
                        {"$push":{"details":{fname:user.fname,lname:user.lname,path:'./uploads/'+file.filename}}},(err,raw)=>{});
                    //marks.$push();
                }
            });
        }
        else{
            User.findOne({_id:req.query.id},(err,user)=>{
                if(user){
                    const uploadobj=new uploadcreate({
                        id:assignmentid,
                        details:[{fname:user.fname,lname:user.lname,path:'./uploads/'+file.filename}]
                    });
                    uploadobj.save();
                }
            });
        }
    });
    res.render('displayupload',{link:link, fn:'./uploads/'+file.filename});
});
app.get('/createassignmenthistory',(req,res)=>{
    User.findOne({_id:req.query.id},(err,user)=>{
        if(user){
            var link="?id="+req.query.id;
            res.render('createassignmenthistory',{link:link, aitems:user.assignments});
        }
    });
});
app.get('/displaysubmissions',(req,res)=>{
    uploadcreate.findOne({id:req.query.uploadid},(err,uploads)=>{
        if(uploads){
            var link="?id="+req.query.id;
            res.render('displaysubmissions',{link:link, aitems:uploads.details});
        }
    });
});
app.get('/user',(req,res)=>{
    User.findOne({_id:req.query.id},(err,user)=>{
        var link="?id="+req.query.id;
        res.render('user',{link: link,firstname : user.fname, lastname: user.lname, email: user.email});
    });
});

app.listen(5000,()=>{
    console.log("server is running on port 5000");
});