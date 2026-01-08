const express = require("express");
// jbb bhi koi aisa model ho usme parent route ki need pdd skti h jse yha review ka parent listing kineed to vha mergeParams ko true kr dena 
const router = express.Router({ mergeParams : true });

// yha hum double dot use krna pdega kyounki hum parent directory k pss ja rhe h 
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
// const Review = require("../models/review.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const {validateReview, isLoggedIn, isReviewAuthor} = require("../middleware.js");

const reviewController = require("../controllers/review.js");

// Post Review Route
router.post(
    "/", 
    isLoggedIn,
    validateReview, 
    wrapAsync(reviewController.createReview)
);

// Delete Review Route
router.delete(
    "/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.destroyReview)
);

module.exports = router;