const User = require('../model/usermodel');
const Admin = require("../model/admin");

require("dotenv").config()


const login = async (req, res) => {
  try {
      const { email, password } = req.body;

      // Find the admin
      const admin = await Admin.findOne({ email });
      if (!admin) {
          return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Compare passwords
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
          return res.status(400).json({ message: 'Invalid email or password' });
      }


      req.session.user = {
        id: admin._id,
        email: admin.email
       
      };
      // Generate a token

      // Send success response with token
      res.status(200).json({
        status: "Success",
        message: "Login successful",
        user: {
            id: admin._id,
            email: admin.email
            // Add other admin fields as needed
        }
    });
  } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
  }
};



const register = async (req, res) => {
  try {
      const { fullname, email, password, isAdmin } = req.body;

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
          return res.status(400).json({ message: 'Admin already exists' });
      }

      // Create a new admin
      const newAdmin = new Admin({ fullname, email, password, isAdmin });
      await newAdmin.save();

      // Generate a token

      res.status(201).json({ admin: newAdmin });
  } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// const getAllUser = async(req, res)=>{
  
//   try {
//     let sql = 'SELECT * FROM users'
//      conn.query(sql, (error, result)=>{
//       if (error) {
//         //console.log(error)
//         res.status(404).json({status:"failed", message: error})
//       }else{
//         res.render('admin/html/dashboard', {result})
//         console.log(result)
//       }
//      })
//   } catch (error) {
//     console.log(error)
//   }
// }


const getAllUser = async (req, res) => {
  try {


    

            // Check if session exists
      if (!req.session.user) {
              // Session does not exist, redirect to login or show an error
              return res.redirect('/adminlogin'); 
      }

      const result = await User.find();
     

   
  
// console.log(subscribe)
    res.render('admin/html/dashboard', { result }); // Rendering a view with the users data
  } catch (err) {
    res.status(500).send('Error retrieving users');
  }
};


const search = async (req, res) => {
  const criteria = req.query;
  const query = {};

  if (criteria.email) {
      query.email = { $regex: new RegExp(criteria.email, 'i') }; // Correct regex usage
  }

  try {
      const user = await User.find(query);
      console.log(user)
      
      res.render("user/html/search",{result: user});
  } catch (error) {
      res.status(500).json({ error: 'An error occurred while searching for jobs.' });
  }
};


const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id; // Get user ID from request parameters
    await User.findByIdAndDelete(userId); // Delete user by ID
    res.redirect('/adminlogin'); // Redirect to users list after deletion
  } catch (err) {
    res.status(500).send('Error deleting user');
  }
};

module.exports = {login, register, getAllUser, search, deleteUser};