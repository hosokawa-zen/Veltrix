const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    name: String,
    description: String,
    created_by: String,
    is_locked: Boolean
}, { collection: 'projects' });

module.exports = mongoose.model('Project', projectSchema);
