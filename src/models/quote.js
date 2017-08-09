
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

var quoteSchema = new Schema({
    quote: String
});

module.exports = mongoose.model('Quote', quoteSchema);
