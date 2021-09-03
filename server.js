require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const path = require('path');
const jwt = require('jsonwebtoken');
const auth = require('./auth')
const GoogleMeet = require('./google-meet');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Values
let email = process.env.EMAIL;
let password = process.env.PASSWORD;

let head = true;
let strict = true;

let meet = new GoogleMeet(email, password, head, strict);

//Cache Store
let url = {};
let ind = 0;
let loginNum = 0;

app.get('/', (req, res) => {
    res.render('verify')
});

app.get('/dashboard',auth, (req, res) => {
    res.render('index', { url, email, password })
});

app.post('/verify',async(req,res)=> {
    if(req.body.passcode.length>10) return {"message":"Invalid Passcode"};

    if(req.body.passcode!=process.env.PASSCODE) return {"message":"Invalid Passcode"};

    let token = await jwt.sign({ userID:loginNum },process.env.JWT_SECRET,{
        expiresIn: '72h'
    });

    loginNum+=1;
    res.cookie('jwt',token, { maxAge: 900000, httpOnly: true });
    res.redirect('/dashboard')
})

app.post('/postlink',auth, (req, res) => {
    ind++;
    url[ind] = {};
    url[ind].id = ind;
    url[ind].url = req.body.url;
    url[ind].startTime = Date.parse(req.body.startDate);
    url[ind].endTime = Date.parse(req.body.endDate);
    res.redirect("/");
});

app.get('/signin',auth,async(req,res)=>{
    meet.getSignInScreenshot();
    res.send({"message":"Sign In Screenshot Request Initiated"});
});

app.get('/screenshot',auth,async(req,res)=>{
    meet.getScreenshot();
    res.send({"message":"Screenshot Request Initiated"});
});

app.get('/kill-browser',auth,async(req,res)=>{
    meet.killChrome();
    res.send({ 'message':'Requested to kill chrome' });
});

app.get('/delete/:id',auth,async(req,res)=>{
    let x = req.query.id;
    if(!url[x]) return {"message":"No Meeting ID Found"};
    if(url[x].startTime>Date.now() && url[x].endTime<Date.now()) {
        meet.notify(`Request For Leaving Meet ${url[x].url}`);
        meet.closeTab(url[x].id);
    }
    delete url[x];
    return {"message":"Meeting Deleted Successfully"}
})

app.get('/reset-meet',auth,async(req,res)=>{
    url = {};
    meet.closeBrowser();
    return {"message":"Complete meet reset done"};
})

app.get('/exit',auth,async(req,res)=>{
    meet.closeBrowser();
    res.send({"message":"Browser Exited Successfully"});
});

const listener = app.listen(8888 || process.env.PORT, () => {
    setInterval(() => {
        for (x in url) {
            if (url[x].startTime < Date.now() && url[x].endTime>Date.now()) {
                meet.notify(`Request For Joining Meet ${url[x].url}`);
                meet.schedule(url[x].url,url[x].id);
                url[x].startTime = url[x].endTime + 2000;
            }
            if (url[x].endTime < Date.now()) {
                meet.notify(`Request For Leaving Meet ${url[x].url}`);
                meet.closeTab(url[x].id);
                delete url[x];
            }
        }
    }, 10000);
    console.log(`App Listening On Port ${listener.address().port}`);
})
