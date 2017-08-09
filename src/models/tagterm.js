const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var tagtermsSchema = new Schema({
    tag: String,
    terms: [String]
});

module.exports = mongoose.model('Tagterms', tagtermsSchema);
