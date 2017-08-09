const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var messengerSchema = new Schema({
    member_id   : { type: Schema.Types.ObjectId, ref: 'Member' },
    message_body: [
        {
            message:  String,
            timestamp: {type: Date, default: Date.now},
            message_type: String,    
            image: String    
        }]
});

module.exports = mongoose.model('Messenger', messengerSchema);
