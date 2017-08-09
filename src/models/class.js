const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var classSchema = new Schema({
    name: String,
    coach: { type: Schema.Types.ObjectId, ref: 'User' },
    schedule: { type: Schema.Types.ObjectId, ref: 'Scheduled' },
    classtime: String,
    classdate: String,
    classrecurrence: String,
    memberscount: { type: Number, default: 0 },
    is_removed: { type: Boolean, default: false },
});

module.exports = mongoose.model('Class', classSchema);
