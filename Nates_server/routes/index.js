var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // Forward user to landing-page.html
  //res.render('index', { title: 'Express' });
  res.redirect('/landing-page.html');
});

module.exports = router;
