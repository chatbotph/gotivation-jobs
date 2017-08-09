const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var LogsSchema = new Schema({
    memberid:{ type: Schema.Types.ObjectId, ref: 'Member' },
    profiletype: String,
    url: String,
    searchquery: String,
    tag: String,
    variable : String,
    tagterm : String,
    contenttype: String,
    pretext: String,
    isdefault: { type: Boolean, default:true},
    senddate : {type: Date, default: Date.now}
});

module.exports = mongoose.model('Log', LogsSchema);
