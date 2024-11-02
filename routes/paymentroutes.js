const express = require('express');
const router = express.Router();
const Admin = require("../model/admin")
const 
{
createInvoice,
createPayment
} = require("../controller/payment")




const authenticate = (req, res, next) => {
    if (req.session.user) {
        // User is authenticated
        return next();
    }
    // User is not authenticated
    res.redirect('/login'); // Redirect to login page or send an appropriate response
};

router.post('/createInvoice', createInvoice)

module.exports = router