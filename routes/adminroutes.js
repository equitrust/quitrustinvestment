const express = require('express');
const router = express.Router();
const Admin = require("../model/admin")
const 
{
  login,
  register,
  getAllUser,
  deleteUser,
  search
} = require("../controller/admincontroller")




const authenticate = (req, res, next) => {
    if (req.session.user) {
        // User is authenticated
        return next();
    }
    // User is not authenticated
    res.redirect('/adminlogin'); // Redirect to login page or send an appropriate response
};

router.get('/getall', authenticate, getAllUser)
router.post('/remove/delete/:id', authenticate, deleteUser); 
router.post('/login', login)
router.get('/search', authenticate, search);
router.post('/register', register)

module.exports = router