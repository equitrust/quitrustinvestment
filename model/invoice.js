// models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true, default: 0 },
  currency: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'pending' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User model
  payment_link: { type: String }, // To store the payment link
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Middleware to update the updated_at field before saving
invoiceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});


const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
