const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email : {
        type : String,
        required : true,
    },
    // username and password passport-local-mongoose apne aap define kr deta h hame krne ki need nhi h 
});

// You're free to define your User how you like. Passport-Local Mongoose will add a username, 
// hash and salt field to store the username, the hashed password and the salt value.
// issi liye user.plugin use kiya gya h 
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);