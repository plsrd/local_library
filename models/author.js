const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxlength: 100 },
  family_name: { type: String, required: true, maxlength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

AuthorSchema.virtual('name').get(function () {
  return this.first_name && this.family_name
    ? `${this.first_name} ${this.family_name}`
    : '';
});

AuthorSchema.virtual('lifespan').get(function () {
  if (!this.date_of_birth) return '';
  return this.date_of_birth && this.date_of_death
    ? this.date_of_birth.getYear() - this.date_of_death.getYear()
    : this.date_of_birth.getYear().toString();
});

AuthorSchema.virtual('url').get(function () {
  return '/catalog/author/' + this._id;
});

module.exports = mongoose.model('Author', AuthorSchema);
