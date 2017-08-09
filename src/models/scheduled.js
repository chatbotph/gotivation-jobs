const mongoose = require('mongoose');
const Schema = mongoose.Schema;

scheduledSchema = new Schema({
    memberid :  { type: Schema.Types.ObjectId, ref: 'Member' },
    classid: { type: Schema.Types.ObjectId, ref: 'Class' },
    coach: { type: Schema.Types.ObjectId, ref: 'User' },
    scheduledate: String,
    scheduletime: String,
    localscheduletime: String,
    url: String,
    message: String,
    contenttype: String,
    status: {type:String, default: "Active"},
    isdefault: {type: Boolean, default: false} 
});

module.exports = mongoose.model('Scheduled', scheduledSchema);