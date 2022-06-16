const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

const { body, validationResult } = require('express-validator');
const async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) return next(err);
      res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) return next(err);
      if (bookinstance == null) {
        let err = new Error('Instance not found');
        err.status = 404;
        return next(err);
      }

      res.render('bookinstance_detail', {
        title: 'Copy of ' + bookinstance.book.title,
        bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, 'title').exec((err, book_list) => {
    if (err) return next(err);

    res.render('bookinstance_form', {
      title: 'Create Book Instance',
      book_list,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    let bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      Book.find({}, 'title').exec((err, book_list) => {
        if (err) return next(err);

        res.render('bookinstance_form', {
          title: 'Create Book Instance',
          book_list,
          selected_book: bookinstance.book._id,
          bookinstance,
          errors: errors.array(),
        });

        return;
      });
    } else {
      bookinstance.save(err => {
        if (err) return next(err);

        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) return next(err);

      if (!bookinstance) res.redirect('/catalog/bookinstances');

      res.render('bookinstance_delete', {
        title: 'Delete Book Instance',
        bookinstance,
      });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
  BookInstance.findByIdAndRemove(req.body.bookinstanceid, err => {
    if (err) return next(err);
    res.redirect('/catalog/bookinstances');
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
  async.parallel(
    {
      bookinstance: callback =>
        BookInstance.findById(req.params.id).exec(callback),
      book_list: callback => Book.find(callback),
    },
    (err, { bookinstance, book_list }) => {
      if (err) return next(err);
      if (!bookinstance) {
        let err = new Error('Book Instance not found.');
        err.status = 404;
        return next(err);
      }

      res.render('bookinstance_form', {
        title: 'Update Book Instance',
        bookinstance,
        book_list,
        selected_book: bookinstance.book._id,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);

    let bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      Book.find().exec((err, book_list) => {
        if (err) return next(err);

        res.render('bookinstance_form', {
          title: 'Update Book Instance',
          bookinstance,
          book_list,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
        });

        return;
      });
    } else {
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        (err, updatedBookinstance) => {
          if (err) return next(err);
          res.redirect(updatedBookinstance.url);
        }
      );
    }
  },
];
