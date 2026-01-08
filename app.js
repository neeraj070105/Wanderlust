if(process.env.NODE_ENV != "production") {
    require('dotenv').config();
}
// console.log(process.env.SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");

// NOTE : jo jo file men comment krii h iska mtln h ab vo file yha use nhi ho rhi h vo Express Router vli new files m use ho rhi h 

// const Listing = require("./models/listing.js");         
const path = require("path");  // ejs k liye 
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); 
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
// const { listingSchema, reviewSchema } = require("./schema.js");   // joi api
// const Review = require("./models/review.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const Booking = require("./models/booking");
const Listing = require("./models/listing");
const Offer = require("./models/offer.js");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({extended : true }));  // 4
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
    secret : "mysupersecretcode",
    resave : false,
    saveUninitialized : true,
    cookie: {
        expires : Date.now() + 7*24*60*60*1000,
        maxAge : 7*24*60*60*1000,
        httpOnly : true,
    },
};

app.use(session(sessionOptions));
app.use(flash());
passport.use(new LocalStrategy(User.authenticate()));

app.use(passport.initialize());
app.use(passport.session());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const MONGO_URL  = "mongodb://127.0.0.1:27017/wanderlust";

main() 
    .then(() => {
        console.log("connected to DB ");
    })
    .catch(err => {
        console.log(err)
    });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({
//         email : "student@gmail.com",
//         username : "delta-student",
//     });

//     let registeredUser = await User.register(fakeUser, "helloWorld"); // user method fakeuser ko database m store kra deta h 
//     // here helloworld is our password
//     res.send(registeredUser);
// });

// Express Router
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// app.get("/", (req, res) => {
//     res.send("Hi, I am robot");
// });

// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "Page Not Found!"));
// });

app.get("/bookings/:id/cancel", async (req, res) => {
    if (!req.user) {
        return res.redirect("/login");
    }

    const { id } = req.params;

    // sirf apni booking cancel kar sake
    await Booking.findOneAndDelete({
        _id: id,
        user: req.user._id
    });

    req.flash("success", "❌ Booking cancelled successfully.");
    res.redirect("/bookings");
});


app.get("/bookings", async (req, res) => {
    // simple safety check (optional but necessary)
    if (!req.user) {
        return res.redirect("/login");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // pure date compare ke liye

    const bookings = await Booking.find({
        user: req.user._id,
        checkOut: { $gte: today }
    })
        .populate("listing")
        .populate("user")
        .sort({ checkIn: 1 }); // nearest booking first

    res.render("bookings/index.ejs", { bookings });
});

app.get("/listings/:id/book", async(req, res) => {
    if (!req.user) {
        req.flash("error", "You must be logged in to book a listing.");
        return res.redirect("/login");
    }

    const { id } = req.params;
    const listing = await Listing.findById(id);
    const bookings = await Booking.find({ listing: listing._id });

    // res.render("bookings/new.ejs", { listingId: id, listing });
    res.render("bookings/new.ejs", {
        listing,
        listingId: listing._id,
        bookedDates: bookings
    });
});

app.post("/listings/:id/book", async (req, res) => {
    if (!req.user) {
        req.flash("error", "You must be logged in to book a listing.");
        return res.redirect("/login");
    }

    const { id } = req.params;
    const { checkIn, checkOut } = req.body;

    const listing = await Listing.findById(id);

    // 🔴 overlap check
    const overlappingBooking = await Booking.findOne({
        listing: id,
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) }
    });

    if (overlappingBooking) {
        req.flash("error", "❌ Selected dates are already booked.");
        return res.redirect(`/listings/${id}/book`);
    }

    const days =
        (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);

    if (days <= 0) {
        req.flash("error", "Invalid booking dates.");
        return res.redirect(`/listings/${id}/book`);
    }

    const totalPrice = days * listing.price;

    await Booking.create({
        listing: id,
        user: req.user._id,
        checkIn,
        checkOut,
        totalPrice
    });

    req.flash("success", "🎉 Booking confirmed!");
    res.redirect(`/listings/${id}`);
});



// Offer Systum
app.get("/listings/:id/offer", async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);

  res.render("offers/make", { listing });
});


app.post("/listings/:id/offer", async (req, res) => {
  const { id } = req.params;
  try {
    console.log("REQ BODY:", req.body);

    const { offeredPrice, message } = req.body;

    // login check simple
    if (!req.user) {
      req.flash("error", "Please login first");
      return res.redirect("/login");
    }

    if (!offeredPrice) {
      req.flash("error", "Offer price is required");
      return res.redirect(`/listings/${id}/offer`);
    }

    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/");
    }

    await Offer.create({
      listing: id,
      buyer: req.user._id,
      owner: listing.owner,
      offeredPrice,
      message
    });

    req.flash("success", "Offer sent to owner successfully");
    res.redirect(`/listings/${id}`);

  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong");
    res.redirect(`/listings/${id}`);
  }
});


// Offer Inbox
app.get("/offers/inbox", async (req, res) => {
  try {
    if (!req.user) {
      req.flash("error", "Please login first");
      return res.redirect("/login");
    }

    const offers = await Offer.find({ owner: req.user._id })
      .populate("listing")
      .populate("buyer");

    res.render("offers/inbox", { offers });

  } catch (err) {
    console.log("INBOX ERROR 👉", err);
    req.flash("error", "Cannot load inbox");
    res.redirect("/");
  }
});


// owner Acceptance Offer
app.post("/offers/:id/accept", async (req, res) => {
  const { id } = req.params;

  try {
    await Offer.findByIdAndUpdate(id, {
      status: "accepted"
    });

    req.flash("success", "Offer accepted successfully");
    res.redirect("/offers/inbox");
  } catch (err) {
    console.log("ACCEPT ERROR 👉", err);
    req.flash("error", "Could not accept offer");
    res.redirect("/offers/inbox");
  }
});

// owner Rejected Offer
app.post("/offers/:id/reject", async (req, res) => {
  const { id } = req.params;

  try {
    await Offer.findByIdAndUpdate(id, {
      status: "rejected"
    });

    req.flash("error", "Offer rejected");
    res.redirect("/offers/inbox");
  } catch (err) {
    console.log("REJECT ERROR 👉", err);
    req.flash("error", "Could not reject offer");
    res.redirect("/offers/inbox");
  }
});

// User Offers
app.get("/offers/myOffers", async (req, res) => {
  if (!req.user) {
    req.flash("error", "Please login first");
    return res.redirect("/login");
  }

  const myOffers = await Offer.find({ buyer: req.user._id })
    .populate("listing");

  res.render("offers/myOffers.ejs", { myOffers });
});


app.use((err, req, res, next) => {
    let {statusCode = 500, message = "Something went wrong"} = err;
    res.status(statusCode).render("listings/error.ejs", { err });
    // res.status(statusCode).send(message);
});

app.listen(8080, () => {
    console.log("Serving is listening to port 8080");
});