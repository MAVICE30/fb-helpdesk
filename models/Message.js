const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  created_time: Date,
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
