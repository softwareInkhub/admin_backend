const express = require('express');

const router = express.Router();

router.get('/', (req,res)=>{
    res.send("route working!")
});
router.get('/test2', (req,res)=>{
    res.send("route working2222!")
});

module.exports = router;
