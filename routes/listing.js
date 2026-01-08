const express = require("express");
const router = express.Router();

// yha hum double dot use krna pdega kyounki hum parent directory k pss ja rhe h 
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn} = require("../middleware.js");
const {isOwner, validateListing } = require("../middleware.js"); 

const listingController = require("../controllers/listing.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });  
// Router.route
router 
    .route("/")
    .get(wrapAsync (listingController.index))
    .post( 
        isLoggedIn, 
        upload.single("Listing[image]"), 
        validateListing,
        wrapAsync (listingController.createListing),
    );
    // .post(upload.single('listing[image'), (req, res) => {
    //     res.send(req.file);
    // });
    

// New Route   -> "/new" vle ko id vle route se upr rakhna pdega 
router.get("/new", isLoggedIn, listingController.renderNewForm );

router.
    route("/:id") 
    .get(wrapAsync (listingController.showListing))
    .put(    // -> Update
        isLoggedIn, 
        isOwner,
        upload.single("Listing[image]"),
        validateListing,
        wrapAsync (listingController.updateListing)
    )
    .delete(
        isLoggedIn, 
        isOwner,
        wrapAsync (listingController.destroyListing)
    );

// Index Route
// router.get("/", wrapAsync (listingController.index));

// Show Route
// router.get("/:id", wrapAsync (listingController.showListing));

// Create Route
// router.post(
//     "/", 
//     isLoggedIn, 
//     validateListing, 
//     wrapAsync (listingController.createListing)
// );

// Edit Route
router.get(
    "/:id/edit", 
    isLoggedIn, 
    isOwner, 
    wrapAsync (listingController.renderEditForm)
);

// Update Route
// router.put(
//     "/:id",
//     isLoggedIn, 
//     isOwner,
//     validateListing,
//     wrapAsync (listingController.updateListing)
// );

// Delete Route
// router.delete(
//     "/:id", 
//     isLoggedIn, 
//     isOwner,
//     wrapAsync (listingController.destroyListing)
// );

// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "Page Not Found!"));
// });

module.exports = router;