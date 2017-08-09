const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');
const bcrypt = require('bcrypt-nodejs');

SALT_WORK_FACTOR = 10;

// plugins
mongoose.plugin(slug);

// schema
var userSchema = new Schema({
    image: String,
    name: {
        first: String,
        last: { type: String, trim: true }
    },
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
    login_attempts: { type: Number, default: 0 },
    permissions: { type: String, default: "coach" },
    subscription: { type: String, default: "trial" },
    business: String,
    email: String,
    offset: { type: Number, default: function(){return new Date().getTimezoneOffset()/60}},
    locale: String,
    subscriptiontype: String,
    daysleft: { type: Number, default: 15 },
    coach_code: String,
    status: { type: String, default: "Active" },
    quote: String,
    slug: { type: String, slug: 'username', slug_padding_size: 3, unique: true },
    noofmembers: {type: Number, default: 0},
    noofclass: {type: Number, default: 0},
    sentmotivation: {type: Number, default: 0},
    is_removed: { type: Boolean, default: false }
});

userSchema.pre('save', function (next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function () { }, function (err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            console.log(hash);
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', userSchema);