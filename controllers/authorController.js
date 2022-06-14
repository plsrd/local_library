const async = require('async');

const Author = require('../models/author');
const Book = require('../models/book');

exports.author_list = function (req, res, next) {
  Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
      if (err) return next(err);
      res.render('author_list', {
        title: 'Author List',
        author_list: list_authors,
      });
    });
};

exports.author_detail = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.params.id }, 'title summary').exec(callback);
      },
    },
    function (err, results) {
      if (err) return next(err);

      if (results.author == null) {
        let err = new Error('Author not found');
        err.status = 404;
        return next(err);
      }

      res.render('author_detail', {
        title: 'Author detail',
        author: results.author,
        authors_books: results.authors_books,
      });
    }
  );
};

exports.author_create_get = function (req, res) {
  res.send('NOT IMPLEMENTED: Author create GET');
};

exports.author_create_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Author create POST');
};

// Display Author delete form on GET.
exports.author_delete_get = function (req, res) {
  res.send('NOT IMPLEMENTED: Author delete GET');
};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Author delete POST');
};

// Display Author update form on GET.
exports.author_update_get = function (req, res) {
  res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST.
exports.author_update_post = function (req, res) {
  res.send('NOT IMPLEMENTED: Author update POST');
};
