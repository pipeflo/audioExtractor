var express = require('express')
  , router = express.Router()
  , Controller = require('../../../controllers/extractor')
  ;

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('entró a respuesta API extractor');
});

router.get('/request', function (req, res, next) {
  res.send('entró a respuesta API extractor request');
});

module.exports = router;
