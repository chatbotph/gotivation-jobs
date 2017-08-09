const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var textSchema = new Schema({
    text: String,
    variable: String,
    tag: String
});

module.exports = mongoose.model('Text', textSchema);
