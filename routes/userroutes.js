const express = require('express');
const router = express.Router();
const User = require("../model/usermodel")
const 
{
    login, 
    register, 
    getUserData,
    requestPasswordReset,
    resetPassword,
    generateReferralIdToken,
    getUserProfile,
    signupWithReferralToken,
    getReferredUsers,
    createProfile,
    getUserPayment
   
} = require("../controller/usercontroller")




const authenticate = (req, res, next) => {
    if (req.session.user) {
        // User is authenticated
        return next();
    }
    // User is not authenticated
    res.redirect('/login'); // Redirect to login page or send an appropriate response
};


router.post('/register', register)
router.post('/login', login)
router.post('/signupreferall', signupWithReferralToken)
// router.get('/payments/:userId', getUserPayment)
router.get('/payments/:userId',  (req, res)=>{
    if(!req.session.user){
        res.render('/login')
    }else{
        res.render('dashboard/user/html/payments', {user: req.session.user})
    }
})
router.get('/referred/:userId', async(req, res)=>{
    try {
        const userId = req.params.userId;
        const network = await getReferredUsers(userId);
        res.render('dashboard/user/html/refered', { network, user: req.session.user })
    } catch (error) {
        console.error('Error fetching referral network:', error);
        res.status(500).send( error.message );
    }
});
router.get('/plans/:userId',  (req, res)=>{
    if(!req.session.user){
        res.render('/login')
    }else{
        res.render('dashboard/user/html/plans', {user: req.session.user})
    }
})
router.get('/dashboard/:userId',  getUserData);
router.post('/getreferraltoken', generateReferralIdToken);
router.get('/profile/:userId', getUserProfile)
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/createProfile", createProfile);

module.exports = router