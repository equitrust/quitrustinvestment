const Payment = require('../model/payment');
const User = require("../model/usermodel");
const Invoice = require('../model/invoice');
const axios = require("axios");
require("dotenv").config()


const createInvoice = async (req, res) => {
  try {
    const {user_id, amount, currency, order_id, description } = req.body;

    // Create an invoice in the database
    const newInvoice = new Invoice({
      order_id,
      amount,
      currency,
      description,
      user:user_id,
      status: 'pending', // Set initial status
    });
    await newInvoice.save();

    // Prepare payment request to NowPayments API
    const paymentRequest = {
      price_amount: amount,
      price_currency: currency,
      order_id: order_id,
      ipn_callback_url: process.env.IPN_URL, // Your IPN URL here
    };

    const paymentResponse = await axios.post('https://api.nowpayments.io/v1/invoice', paymentRequest, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CRYPTO_API,
      },
    });

    // Update the invoice with details from the payment response
    newInvoice.payment_link = paymentResponse.data.invoice_url; // Store the invoice URL
    newInvoice.status = 'pending'; // Set status as pending
    newInvoice.order_id = paymentResponse.data.id
    newInvoice.created_at = paymentResponse.data.created_at; // Optionally update created_at
    newInvoice.updated_at = paymentResponse.data.updated_at; // Optionally update updated_at

    // Save the updated invoice
    await newInvoice.save();

    res.redirect(paymentResponse.data.invoice_url)
    // Send response to the client
    // res.status(201).json({
    //   id: paymentResponse.data.id,
    //   order_id: paymentResponse.data.order_id,
    //   invoice_url: paymentResponse.data.invoice_url,
    //   success_url: paymentResponse.data.success_url,
    //   cancel_url: paymentResponse.data.cancel_url,
    // });
  } catch (error) {
    console.error('Error creating invoice or payment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const minimumpayment = async (req, res) => {
  try {
    const { currency_from, currency_to } = req.body;

    const response = await axios.post(`https://api.nowpayments.io/v1/min-amount`, null, {
      params: {
        currency_from,
        currency_to,
        fiat_equivalent: 'usd',
        is_fixed_rate: false,
        is_fee_paid_by_user: false,
      },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CRYPTO_API, // Replace with your API key
      },
    });

    // Send the response back to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching minimum payment amount:', error);

    // Handle the error response
    if (error.response) {
      res.status(error.response.status).json({
        message: error.response.data.message || 'Error fetching minimum payment amount',
      });
    } else {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
};





const createPayment = async (req, res) => {
  try {
    const { price_amount, price_currency, order_id, ipn_url } = req.body;

    // Construct the request body for the payment
    const requestBody = {
      price_amount,
      price_currency,
      order_id,
      ipn_url, // Optional: URL for Instant Payment Notification
      // Add any other required parameters based on your needs
    };

    const response = await axios.post('https://api.nowpayments.io/v1/payment', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CRYPTO_API, // Your API key here
      },
    });

    // Send the response back to the client
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating payment:', error);

    // Handle error response
    if (error.response) {
      res.status(error.response.status).json({
        message: error.response.data.message || 'Error creating payment',
      });
    } else {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    }
  }
};


module.exports = 
{
minimumpayment,
createInvoice,
createPayment
}
