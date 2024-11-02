const User = require('../model/usermodel');
const Profile = require('../model/userprofile');
const Invoive = require('../model/invoice');

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require("nodemailer");
const cloudinary = require("../cloudinary");
const streamifier  = require("streamifier");
const jwt = require('jsonwebtoken');
require("dotenv").config();

//subscription package point or PV 
const packagePoints = {
  '2500': 10,
  '5000': 20,
  '10000': 40,
  '25000': 100,
  '100000': 400,
  '500000': 200
};

const distributeCommissions = async (userId, packageAmount) => {
  const amount = parseFloat(packageAmount);
  const pointsToAdd = packagePoints[packageAmount] || 0;

  // Define the maximum number of tiers based on package points
  const tierLimits = {
    2500: 2, // Max 2 tiers for 2500 points
    5000: 3, // Max 3 tiers for 5000 points
    // Add other package points and their tier limits if needed
  };

  // Define referral percentages
  const referralPercentages = {
    1: { 2500: 0.20, 5000: 0.20 }, // 20% for the first tier
    2: { 2500: 0.05, 5000: 0.05 }, // 5% for the second tier
    // Add other tiers and percentages if needed
  };

  // Find the user who made the payment
  const user = await User.findById(userId).populate('referredBy');

  if (!user) {
    console.error(`User with ID ${userId} not found.`);
    return;
  }



  const maxTiers = 1;

  //console.log(`User ${userId} with package ${userPackagePoints} has a tier limit of ${maxTiers}.`);

  // Helper function to distribute commissions
  const distribute = async (currentUser, currentTier, remainingTiers) => {
    if (!currentUser || currentTier > maxTiers || remainingTiers <= 0) {
      console.log(`Tier ${currentTier} exceeds the maximum allowed tiers or no remaining tiers. Stopping distribution.`);
      return; // Stop recursion if the tier exceeds the allowed limit or no remaining tiers
    }

    // Calculate commission for the current tier
    const percentage = referralPercentages[currentTier]?.[packageAmount] || 0;
    const commission = amount * percentage;

    try {
      // Update the current user's commission and points
      await User.updateOne(
        { _id: currentUser._id },
        { 
          $inc: { commissions: commission }, 
          $push: { points: { packageAmount: amount, points: pointsToAdd } } 
        }
      );

      // Log successful update
      console.log(`Updated commissions and points for user ${currentUser._id} at tier ${currentTier}`);

      // Distribute commission and points to the referrer
      if (currentUser.referredBy) {
        const referrer = await User.findById(currentUser.referredBy._id).populate('referredBy');

        if (referrer) {
          // Update the referrer's tier if needed
          if (referrer.referralTier < currentTier) {
            console.log(`Updating referralTier for user ${referrer._id} to ${currentTier}`);
            await User.updateOne(
              { _id: referrer._id },
              { $set: { referralTier: currentTier } }
            );
          }

          // Distribute commission and points to the referrer
          await distribute(referrer, currentTier + 1, remainingTiers - 1); // Increment tier level and decrease remaining tiers
        } else {
          console.error(`Referrer with ID ${currentUser.referredBy._id} not found.`);
        }
      } else {
        console.log(`No referrer for user ${currentUser._id}.`);
      }
    } catch (error) {
      console.error(`Error distributing commissions for user ${currentUser._id}:`, error);
    }
  };

  await distribute(user, 1, maxTiers); // Start with Tier 1 for the direct referrer
};


const login = async(req, res)=>{
  try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
          return res.status(401).json({ status: "Failed", message: "invalid email or password" });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: user._id }, 'Adain', { expiresIn: '1h' }); // 1 hour expiration
      // const token = user.generateAuthToken();
      //res.status(200).json({ status: "Success" });
      // Store user information in the session
  
              req.session.user = {
                  id: user._id,
                  email: user.email,
                  fullname: user.fullname, 
                  phone: user.phone,
                  country: user.country,
                  referralToken: user.referralToken,
                  img:user.img,
                  notificationsCount: user.notificationsCount,
                  referralCount:user.referralCount,
                  referredUsers: user.referredUsers,
                  commissions: user.commissions,
                  points:user.points,
                  accountName:user.accountName
                 
                  
                 
                  
                  // Add other fields as needed
              };

              // Send success response
              res.status(200).json({
                  status: "Success",
                  message: "Login successful",
                  token,
                  user: {
                      id: user._id,
                      email: user.email,
                      fullname: user.fullname,
                      phone: user.phone,
                      country: user.country,
                     
                      notificationsCount: user.notificationsCount,
                      referralCount:user.referralCount,
                      referredUsers: user.referredUsers,
                      points:user.points,
                      accountName:user.accountName

                  }
              });
      
              // Redirect to the dashboard
              // res.redirect('/dashboard');
  } catch (error) {
      console.error("Error during login:", error);

      // Handle errors and ensure only one response
      if (!res.headersSent) {
          res.status(500).json({ status: "Failed", message: error.message });
      }   
  }
  
  
};

const register = async (req, res) => {
  try {
    const { fullname, phone, email, password, country,  } = req.body;

    if (!fullname || !phone || !country  || !email || !password) {
      return res.status(400).json({ status: "Failed", message: "Please fill out all fields." });
    }

    let imageURL = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    // If an image file is provided
    if (req.file) {
      // Wrap the Cloudinary upload in a promise
     
        const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) {
              return res.status(500).send('Error uploading image to Cloudinary');
          }
         imageURL = result.secure_url;

      
      
         createuser()

        });
        
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);        
    }else{
      createuser()
  
      
    }

    async function createuser(){

       // Create a new user with the provided data and the image URL if available
    const user = new User({
      fullname,
      phone,
      country,
      email,
      password,
      img: imageURL // Add imageURL to user model if applicable
    });


      try {
          await user.save();
          // Generate a JWT token
          const token = jwt.sign({ id: user._id}, 'Adain', { expiresIn: '1h' });

          req.session.user = {
              id: user._id,
              email: user.email,
              fullname: user.fullname, 
              phone: user.phone,
              country: user.country,
             
              referralToken: user.referralToken,
              img:user.img,
              points: user.points,
              notificationsCount: user.notificationsCount
             
              
              // Add other fields as needed
          };
          res.status(200).json({
              status: "Success",
              message: "Login successful",
              user: {
                  id: user._id,
                  email: user.email,
                  fullname: user.fullname,
                  phone: user.phone,
                  country: user.country,
                 
                  notificationsCount: user.notificationsCount,
                  referralCount: user.referralCount,
                  referredUsers: user.referredUsers,
                  points: user.points,
                  accountName: user.accountName
              }
          });
          
      } catch (error) {
          console.error('Error saving product:', error);
              res.status(500).json({status: "failed", message:'  Error saving User'});
      }
    }

   

    

   
  } catch (error) {
    console.error("Error during signup:", error);

    // Handle errors and ensure only one response
    if (!res.headersSent) {
      res.status(500).json({ status: "Failed", message: error.message });
    }
  }
};

const generateReferralIdToken = async(req, res)=>{
  const {userId} = req.body;
  try {
       // Validate userId
       if (!userId) {
          return res.status(400).json({ status: 'Failed', message: 'User ID is required.' });
      }
       // Generate a unique referral token
       const referralToken = userId; // 32 characters long token
       const referralTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 1 day expiry

       const user = await User.findByIdAndUpdate(
           userId,
           { referralToken: referralToken, referralTokenExpiry: referralTokenExpiry },
          
       );
       await user.save();
       //res.redirect(`/api/auth/users/wallet/${userId}`);
       return res.redirect(`/api/users/dashboard/${userId}`);
       
  } catch (error) {
      console.error('Error generating referral token:', error);
      res.status(500).json({ status: 'Failed', message: error.message });
  }
}

const verifyEmail =(req, res)=>{

}

const createProfile = async (req, res) => {
  const { userId, username, email, bank_name, bank_account, bio } = req.body;

  try {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).send("User is not defined");
    }

    // Create the profile
    const profile = new Profile({
      user:userId,
      username,
      email,
      bank_name,
      bank_account,
      bio
    });

    // Save the profile to the database
    await profile.save();

    // Send success response
    //res.status(201).send({ message: "Profile created successfully", profile });
    res.redirect(`/api/users/profile/${userId}`)
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};


const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ status: "Failed", message: "Email does not exist in our records." });
      }

      // Generate a reset token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Save the reset token and its expiry date in the user record
      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry
      await user.save();

      // Set up email transporter
      const transporter = nodemailer.createTransport({
          service: process.env.SERVICE,
          auth: {
              user: process.env.EMAIL,
              pass: process.env.EMAIL_PASS,
          },
          tls: {
              rejectUnauthorized: false
          }
      });

      // Send password reset email
      //const resetUrl = `http://localhost:3500/reset-password`;
      const resetUrl = `http://localhost:6400/reset-password?token=${resetToken}`;
      await transporter.sendMail({
          from: 'affliate@gmail.com',
          to: `${email}`,
          subject: 'Password Reset Request',
          html: `<p>You requested a password reset. Click the link below to reset your password:</p>
                 <a href="${resetUrl}">Reset Password</a>
                 <p>If you did not request this, please ignore this email.</p>`
      });

      res.status(200).json({ status: "Success", message: "Password reset email sent successfully Check Your Mail." });


  } catch (error) {
      console.error("Error sending password reset email:", error);
      res.status(500).json({ status: "Failed", message: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
      // Find the user by reset token
      const user = await User.findOne({
          resetToken: token,
          resetTokenExpiry: { $gt: Date.now() } // Check if token is expired
      });

      if (!user) {
          return res.status(400).json({ status: "Failed", message: "Invalid or expired token." });
      }

      // Hash the new password
      //const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and clear reset token
      user.password = newPassword;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();

      res.status(200).json({
          status: "Success",
          message: "Password update successfully",
        });
      // Redirect to login page after successful password update
      //res.redirect('/login'); // Adjust the path as needed for your login route

  } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ status: "Failed", message: error.message });
  }
};


const getUserProfile = async(req, res) =>{
  const user = req.params.userId;
   // Ensure userId is provided
   if (!user) {
    return res.status(400).json({ message: 'User ID is required' });
   }

    try {
      // Fetch user details
      const userProfile = await Profile.findOne({user});
      // if (!userProfile) {
      //     return res.status(404).json({ message: 'User not found' });
      // }

    const result = userProfile
    console.log("result",result)
      return res.render('dashboard/user/html/profile', { user: req.session.user , result})
      
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({ message: 'Internal server error' });
  } 


}

const getUserPayment = async(req, res)=>{
  const userId = req.params.userId;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
}

try{
         // Fetch user details
         const user = await Invoive.findById(userId);
        //  if (!user) {
        //      return res.status(404).json({ message: 'User not found' });
        //  }

         const results = user
         console.log(results)
           return res.render('dashboard/user/html/payments', {user: req.session.user , results})
           
   
}catch(error){
  console.error('Unexpected error:', error);
  return res.status(500).json({ message: 'Internal server error' });
}


}

const getUserData = async(req, res) =>{
  const userId = req.params.userId;
   // Ensure userId is provided
   if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
}

    try {

      // Fetch user details
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const results = user
    console.log(results)
      return res.render('dashboard/user/html/dashboard', {results})
      
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({ message: 'Internal server error' });
  } 


}

const signupWithReferralToken = async (req, res) => {
  const { fullname, phone, email, password, country, referralToken } = req.body;

  try {
      // Validate input
      if (!fullname || !phone || !country  || !email || !password  || !referralToken) {
          return res.status(400).json({ status: 'Failed', message: 'All fields are required.' });
      }
      let imageURL = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

    

      // Create user function
      const createUser = async (imageURL, referredBy) => {
          // Create a new user with the provided details
          const newUser = new User({
              fullname,
              phone,
              country,
              
              email,
              password,
              img: imageURL,
              referredBy: referredBy ? referredBy._id : null,
              referralTier: referredBy.referralTier + 1 // Assign tier based on referrer
          });

          // Save the new user to the database
          await newUser.save();

          // Update the original user
          await User.updateOne(
              { _id: referredBy._id },
              {
                  $inc: { referralCount: 1 },
                  $push: {
                      referredUsers: {
                          _id: newUser._id,
                          fullname: newUser.fullname,
                          email: newUser.email,
                          img: newUser.img,
                          referredUsers:[]
                      }
                  }
              }
          );

          // Recursively update the upline
          const updateUpline = async (user) => {
              if (user.referredBy) {
                  const referrer = await User.findById(user.referredBy._id);
                  if (referrer) {
                      await User.updateOne(
                          { _id: referrer._id },
                          {
                              $push: {
                                  referredUsers: {
                                      _id: newUser._id,
                                      fullname: newUser.fullname,
                                      email: newUser.email,
                                      img: newUser.img,
                                      referredUsers: []
                                  }
                              }
                          }
                      );
                      await updateUpline(referrer); // Recursively update the next referrer
                  }
              }
          };

          await updateUpline(referredBy);
            await distributeCommissions(referralToken, "2500")
          // Create a session for the new user
          req.session.user = {
              id: newUser._id,
              email: newUser.email,
              fullname: newUser.fullname,
              phone: newUser.phone,
              country: newUser.country,
              
              referralToken: newUser.referralToken,
              img: newUser.img,
          };

          // Respond with success
          res.status(201).json({ status: 'Success', message: 'User created and logged in successfully.' });
      };

      // Find user with the provided referral token
      const referredBy = await User.findOne({
          referralToken: referralToken,
      }).select('fullname email img');

      if (!referredBy) {
          return res.status(400).json({ status: 'Failed', message: 'Invalid or expired referral token.' });
      }

       // Store the referral token in the session if it's valid
       if (referredBy) {
          req.session.referralToken = referralToken; // Store in session
      }

      // Handle image upload and user creation
  
      await createUser(imageURL, referredBy);

  } catch (error) {
      console.error('Error during signup with referral token:', error);
      res.status(500).json({ status: 'Failed', message: error.message });
  }
};


const getReferredUsers = async (userId) => {
  const user = await User.findById(userId).select('fullname img email referredUsers').populate({
                  path: 'referredUsers',
                  select: 'fullname email img referredUsers',
                  populate: {
                      path: 'referredUsers',
                      select: 'fullname email img referredUsers'
                  }
              });

  if (!user) {
      throw new Error('User not found');
  }

  const getNetwork = async (userId) => {
      const user = await User.findById(userId).select('fullname img email referredUsers').populate({
          path: 'referredUsers',
          select: 'fullname email img referredUsers',
          populate: {
              path: 'referredUsers',
              select: 'fullname email img referredUsers'
          }
      });
      if (!user) return [];

      const network = [];
      for (const ref of user.referredUsers) {
          const referrals = await getNetwork(ref._id);
          network.push({
              _id: ref._id,
              fullname: ref.fullname,
              email: ref.email,
              img: ref.img,
              referredUsers: referrals
          });
      }
      return network;
  };

  return {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      image: user.img,
      referredUsers: await getNetwork(userId)
  };
};


module.exports = 
{
  verifyEmail, 
  register, 
  login, 
  requestPasswordReset,
  resetPassword,
  getUserData,
  getUserProfile,
  generateReferralIdToken,
  signupWithReferralToken,
  getReferredUsers,
  createProfile,
  getUserPayment
};