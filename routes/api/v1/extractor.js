var express = require('express')
  , router = express.Router()
  , Controller = require('../../../controllers/extractor')
  ;

/* GET users listing. */
router.get('/', function (req, res, next) {

  res.send('entró a respuesta API extractor');
});

router.get('/request', function (req, res, next) {
  res.status(200).json(req.body);
});

router.post('/request', function (req, res, next) {
  console.log(req.body);
  Controller.insertRequest(req, res);
  //res.status(200).json(req.body);
});

module.exports = router;
