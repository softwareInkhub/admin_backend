const express = require('express');
const { apiTest, testPinterestApi } = require('../controllers/apiControllers');

const router = express.Router();

router.post('/testapi', apiTest);
router.post('/testPinterestApi', testPinterestApi);
router.post('/test', (req,res)=>{
    res.send("hello inkhub")
});

module.exports = router;
