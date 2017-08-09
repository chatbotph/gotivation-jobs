const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var categorySchema = new Schema({
    name: String,
    content: [String],
    vidcontent: [String],
    image: String,
});

module.exports = mongoose.model('Category', categorySchema);
