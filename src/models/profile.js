const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var profileSchema = new Schema({
    profile: String,
    variable: String,
    tag: String,
    delivery: String 
});

module.exports = mongoose.model('Profile', profileSchema);
