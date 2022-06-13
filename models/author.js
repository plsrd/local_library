const mongoose = require('mongoose');
const { DateTime } = require('luxon');

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
    ? this.date_of_death.getYear() - this.date_of_birth.getYear()
    : new Date().getYear() - this.date_of_birth.getYear();
});

AuthorSchema.virtual('url').get(function () {
  return '/catalog/author/' + this._id;
});

AuthorSchema.virtual('formatted_date_of_birth').get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : '';
});

AuthorSchema.virtual('formatted_date_of_death').get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : '';
});

module.exports = mongoose.model('Author', AuthorSchema);
