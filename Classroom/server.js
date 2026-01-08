// const express = require("express");
// const app = express();
// // require users
// const users = require("./routes/users.js");
// // require posts
// const posts = require("./routes/posts.js");
// const cookieParser = require("cookie-parser");

// // app.use(cookieParser());
// app.use(cookieParser("secretcode"));

// app.get("/getsignedcookie", (req, res) => {
//     res.cookie("made-in", "India", {signed : true});
//     res.send("signed cookie sent");
// });

// app.get("/verify", (req, res) => {
//     res.send(req.signedcookies);
//     console.log(req.signedcookies);
// });

// app.get("/getcookies", (req, res) => {
//     res.cookie("greet", "Namaste");
//     res.cookie("madeIn", "India");
//     res.send("sent you some cookie!");
// });

// app.get("/greet", (req, res) => {
//     let {name = "anonymous"} = req.cookies;
//     res.send(`Hi, ${name}`);
// });

// app.get("/", (req, res) => {
//     console.dir(req.cookies);
//     res.send("Hi, I am root");
// });     

// app.use("/users", users); // users ko use krne k liye and yha hum common part likhte h

// app.use("/posts", posts);  // posts ko use krne k liye and yha hum common part likhte h


// EXPRESS SESSIONS
const express = require("express");
const app = express();
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const sessionOptions = {
    secret : "mysupersecretstring", 
    resave : false, 
    saveUninitialized : true,
};

app.use(session(sessionOptions));
app.use(flash());

app.get("/register", (req, res) => {
    let {name = "anonymous"} = req.query;   // http://localhost:3000/register?name=shraddha
    req.session.name = name;
    if(name === "anonymous") {
        req.flash("error", "user not registered!");
    }
    else { 
        req.flash("success", "user registered successfully!");  
    }
        
    res.redirect("/hello");
});

app.get("/hello", (req, res) => {
    res.locals.successmessages = req.flash("success");
    res.locals.errormessages = req.flash("error");
    res.render("page.ejs", {name : req.session.name });
});


// app.get("/reqcount", (req, res) => {
//     if(req.session.count) req.session.count++;
//     else req.session.count = 1;
//     res.send(`You sent a request ${req.session.count} times`);
// });

// app.get("/test", (req, res) => {
//     res.send("test successful!");
// });

app.listen(3000, () =>{
    console.log("server is listening to 3000");
});