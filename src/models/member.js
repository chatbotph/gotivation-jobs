const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var memberSchema = new Schema({
    memberid: String,
    name: {
        first_name: String,
        last_name: String
    },
    facebook_page_access_token: { type: [String] },
    gender: String,
    channel: { type: String, required: true, default: 'console' },
    categories: [{
        category: { type: Schema.Types.ObjectId, ref: 'Category' }
    }],
    onboardeddate: { type: Date, default: Date.now },
    onboarded: {type: Boolean, default: false},
    construals: { type: String, default: 'No construals' },
    coach   : { type: Schema.Types.ObjectId, ref: 'User' },
    profiletype: String,
    currentsequence: {type: Number, default: 1},
    email: String,
    classes: [
        {
             type: Schema.Types.ObjectId, ref: 'Class' 
        }]

});

module.exports = mongoose.model('Member', memberSchema);
