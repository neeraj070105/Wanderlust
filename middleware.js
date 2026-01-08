const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");   // joi api

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {     // yeahi check krega ki user logged in h ya nhi 
        // redirectUrl save
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in to create listing");
        return res.redirect("/login");
    } 
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);

    // // agar listing hi na mile
    // if (!listing) {
    //     req.flash("error", "Listing not found!");
    //     return res.redirect("/listings");
    // }

    // // agar owner hi nahi hai (undefined)
    // if (!listing.owner) {
    //     req.flash("error", "This listing has no owner assigned.");
    //     return res.redirect("/listings");
    // }

    // agar logged-in user owner nahi hai
    if(!listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash("error","You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }

    next();
};


// Validation Schema in the form of Middleware
module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}; 


// Validation Schema in the form of Middleware
module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if(!review.author._id.equals(res.locals.currUser._id)) {
        req.flash("error","You are not the author of this review ");
        return res.redirect(`/listings/${id}`);
    }

    next();
};