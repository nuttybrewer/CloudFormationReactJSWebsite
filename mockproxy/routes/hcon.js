var express = require('express');
var router = express.Router();


const singlelog = {
  extracted:
  [
    {
      log: "World,Bar",
      matches:
      {
        HEADER_vendor: "SomeVendor",
        foo:"Bar",
        HEADER_devicetype:"Router",
        hello:"World",
        HEADER_devicemodel:"A Series"
      }
    }
  ],
  "statusCode":200
};

router.post('/hcon', function(req, res, next) {
  if(req.body.morphline) {
    const decodedMorphline = new Buffer(req.body.morphline, 'base64').toString('ascii');
    if (decodedMorphline.includes("## INVALID MORPHLINE")) {
      return res.status(400).json({message: "Invalid Morphline at line 2", statusCode: 400});
    }
    res.json(singlelog);
  }
  else {
    res.status.status(400).json({message: "No morphline provided", statusCode: 400});
  }
});

module.exports = router;
