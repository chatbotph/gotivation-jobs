const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var notificationSchema = new Schema({
    message: String,
    destination: { type: Schema.Types.ObjectId, ref: 'User' },
    toadmin: { type: Boolean, default: true },
    type: { type:String, default: "notification"},
    datesent: { type: Date, default: Date.now },
    status: { type: String, default: "unseen" }
});

module.exports = mongoose.model('Notification', notificationSchema);
