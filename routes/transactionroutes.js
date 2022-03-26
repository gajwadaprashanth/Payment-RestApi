const express = require('express');
const {
       addtransaction, testing,gettransaction,maketransaction,getuser
      } = require('../controllers/transactioncontroller');

const router = express.Router();

router.post('/transaction/:id', addtransaction);
router.get('/',testing)
router.get('/gettransaction/:id',gettransaction)
router.get('/maketransaction/:id',maketransaction)
router.get('/getuser/:id',getuser)


module.exports = {
    routes: router
}
