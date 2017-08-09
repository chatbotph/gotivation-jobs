const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var userprofileSchema = new Schema({
    memberid:{ type: Schema.Types.ObjectId, ref: 'Member'},
    text: String,
    variable: String,
    tag: String,
    delivery: Number
});

module.exports = mongoose.model('UserProfile', userprofileSchema);
