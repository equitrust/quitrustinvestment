const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    country: {
        type: String,
        required: true
    },
   
    img: {
        type: String,
    },
    package: {
        type: String,
        default:0
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,

    },
    referralToken: {
        type: String,
        default: null,
    },
    referralTokenExpiry: {
        type: Date,
        default: null,
    },
    notificationsCount: {
        type: Number,
        default: 0
    },
    password: {
        type: String,
        required: true
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    },
    referralCount: { 
        type: Number, 
        default: 0 
    },
    referredUsers: [{
        _id: mongoose.Schema.Types.ObjectId,
        fullname: String,
        email: String,
        image: String,
        referredUsers: [{
            _id: mongoose.Schema.Types.ObjectId,
            fullname: String,
            email: String,
            image: String
        }]
    }],
    referredBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    referralTier: {
        type: Number,
        default: 1,
        set: (value) => {
            // Convert non-numeric values to a default number
            if (isNaN(value)) return 1; // or any default value
            return Number(value);
        }
    },
    commissions: {
        type: Number,
        default: 0
    },
    points: [{
        packageAmount: Number,
        points: Number
    }],
    
  
    payments: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Payment' 
    }],
}, {
    timestamps: true
});

// Hash password before saving user
userSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to compare hashed passwords
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT
// userSchema.methods.generateAuthToken = function() {
//     return jwt.sign({ id: this._id, email: this.email }, "Adain", { expiresIn: '1h' });
// };

module.exports = mongoose.model('User', userSchema);
