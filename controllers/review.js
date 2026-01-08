const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created!");
    console.log("New review saved");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) =>{
    let {id, reviewId} = req.params;
    await Review.findByIdAndDelete(reviewId);
    // review ko listing object m ja kr bhi delete krna pdega 
    await Listing.findByIdAndUpdate(id, {$pull : {reviews : reviewId}});
    req.flash("success", "Review Deleted ");
    res.redirect(`/listings/${id}`);
};