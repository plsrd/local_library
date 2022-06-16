const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

const async = require('async');
const { body, validationResult } = require('express-validator');

exports.index = function (req, res) {
  async.parallel(
    {
      book_count: function (callback) {
        Book.countDocuments({}, callback);
      },
      book_instance_count: function (callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count: function (callback) {
        BookInstance.countDocuments({ status: 'Available' }, callback);
      },
      author_count: function (callback) {
        Author.countDocuments({}, callback);
      },
      genre_count: function (callback) {
        Genre.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render('index', {
        title: 'Local Library Home',
        error: err,
        data: results,
      });
    }
  );
};

// Display list of all books.
exports.book_list = function (req, res, next) {
  Book.find({}, 'title author')
    .sort({ title: 1 })
    .populate('author')
    .exec(function (err, list_books) {
      if (err) return next(err);
      res.render('book_list', { title: 'Book List', book_list: list_books });
    });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(callback);
      },
      book_instance: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) return next(err);

      if (results.book == null) {
        let err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }

      res.render('book_detail', {
        title: 'Book Detail',
        book: results.book,
        book_instances: results.book_instance,
      });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
  async.parallel(
    {
      authors: callback => Author.find(callback),
      genres: callback => Genre.find(callback),
    },
    (err, { authors, genres }) => {
      if (err) return next(err);

      res.render('book_form', { title: 'Create Book', authors, genres });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },
  body('title', 'A title is required').trim().isLength({ min: 1 }).escape(),
  body('author', 'An author is required').trim().isLength({ min: 1 }).escape(),
  body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    let book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors: callback => Author.find(callback),
          genres: callback => Genre.find(callback),
        },
        (err, { genres, authors }) => {
          if (err) return next(err);

          genres = genres.map(genre =>
            book.genre.indexOf(genre._id) > -1
              ? Object.assign(genre, { checked: true })
              : genre
          );

          res.render('book_form', {
            title: 'Create Book',
            genres,
            authors,
            book,
            errors: errors.array(),
          });

          return;
        }
      );
    } else {
      book.save(err => {
        if (err) return next(err);

        res.redirect(book.url);
      });
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res, next) {
  async.parallel(
    {
      book: callback => Book.findById(req.params.id).exec(callback),
      bookinstances: callback =>
        BookInstance.find({ book: req.params.id }).exec(callback),
    },
    (err, { book, bookinstances }) => {
      if (err) return next(err);

      if (!book) res.redirect('/catalog/books');

      res.render('book_delete', { title: 'Delete Book', book, bookinstances });
    }
  );
};

// Handle book delete on POST.
exports.book_delete_post = function (req, res, next) {
  async.parallel(
    {
      book: callback => Book.findById(req.body.bookid).exec(callback),
      bookinstances: callback =>
        BookInstance.find({ book: req.body.bookid }).exec(callback),
    },
    (err, { book, bookinstances }) => {
      if (err) return next(err);

      if (bookinstances.length > 0) {
        res.render('book_delete', {
          title: 'Delete Author',
          book,
          bookinstances,
        });
        return;
      } else {
        Book.findByIdAndRemove(req.body.bookid, err => {
          if (err) return next(err);
          res.redirect('/catalog/books');
        });
      }
    }
  );
};

// Display book update form on GET.
exports.book_update_get = function (req, res, next) {
  async.parallel(
    {
      book: callback => Book.findById(req.params.id).exec(callback),
      authors: callback => Author.find(callback),
      genres: callback => Genre.find(callback),
    },
    (err, { book, authors, genres }) => {
      if (err) return next(err);

      if (!book) {
        let err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }

      genres = genres.map(genre =>
        book.genre.indexOf(genre._id) !== -1
          ? Object.assign(genre, { checked: true })
          : genre
      );

      res.render('book_form', { title: 'Update Book', authors, genres, book });
    }
  );
};

// Handle book update on POST.
exports.book_update_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      !typeof req.body.genre
        ? (req.body.genre = [])
        : (req.body.genre = new Array(req.body.genre));
    }
    next();
  },
  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    let book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors: callback => Author.find(callback),
          genres: callback => Genre.find(callback),
        },
        (err, { authors, genres }) => {
          if (err) return next(err);
          genres = genres.map(genre =>
            book.genre.indexOf(genre._id) !== -1
              ? Object.assign(genre, { checked: true })
              : genre
          );
          res.render('book_form', {
            title: 'Update Book',
            authors,
            genres,
            book,
            errors: errors.array(),
          });

          return;
        }
      );
    } else {
      Book.findByIdAndUpdate(req.params.id, book, {}, (err, updatedBook) => {
        if (err) return next(err);

        res.redirect(updatedBook.url);
      });
    }
  },
];
