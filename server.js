
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const passport = require('./passport'); // Import Passport configuration
const path = require('path');
const session = require('express-session');
const axios = require('axios'); // Import Axios for making HTTP requests
const User = require('./models/User'); // Replace with your User model
const Message = require('./models/Message'); // Import the Message model

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: '123code321',
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://Anant:haha@helpdesk.depgwve.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

// const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.render('register');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email,
    password: hashedPassword
  });

  await user.save();
  return res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Incorrect password' });
  }

  return res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

app.get('/homepage', async (req, res) => {
  const pageAccessToken = 'EAAUhkngFxNsBO2yU6umvv8JzNcM2RwI4GsHca5CWjBZC7ycosC3Mt0TE1ZCPZBCReyrPRmEaLPQA44XNXz7KjdoYJfSv5jEOQNOR6vAaNpd2vS9OuZA9RcYO2Dp4xK49HXrCoKvfT4reo0FDJc7sR2VFUGbtkB8tVZBA5LnPGcg7jz2bSzHCbFtewXQ0MdjLI';
  const pageId = 'me';
  const fields = 'name';

  try {
    const response = await axios.get(`https://graph.facebook.com/v17.0/${pageId}?fields=${fields}&access_token=${pageAccessToken}`);
    const pageName = response.data.name;
    res.render('homepage', { pageName });
  } catch (error) {
    console.error('Error fetching Facebook Page information:', error);
    res.render('homepage', { pageName: 'Page Name Unavailable' });
  }
});

function formatDate(datetime) {
  const date = new Date(datetime);
  const options = { hour: 'numeric', minute: 'numeric', hour12: false };
  return date.toLocaleString('en-US', options);
}

app.get('/messages', async (req, res) => {
  const pageAccessToken = 'EAAUhkngFxNsBO2yU6umvv8JzNcM2RwI4GsHca5CWjBZC7ycosC3Mt0TE1ZCPZBCReyrPRmEaLPQA44XNXz7KjdoYJfSv5jEOQNOR6vAaNpd2vS9OuZA9RcYO2Dp4xK49HXrCoKvfT4reo0FDJc7sR2VFUGbtkB8tVZBA5LnPGcg7jz2bSzHCbFtewXQ0MdjLI';
  const pageId = 'me';
  const fields = 'conversations{participants,messages{message,from,created_time}}';

  try {
    const response = await axios.get(`https://graph.facebook.com/v17.0/${pageId}?fields=${fields}&access_token=${pageAccessToken}`);
    const conversations = response.data.conversations.data;
    const messages = [];

    // Iterate over each conversation
    for (const conversation of conversations) {
      const participants = conversation.participants.data;
      const conversationMessages = conversation.messages.data;

      // Iterate over each message in the conversation
      for (const message of conversationMessages) {
        const from = participants.find(participant => participant.id !== message.from.id);
        const to = participants.find(participant => participant.id === message.from.id);

        // Check if the message was sent within the past 24 hours
        const messageDate = new Date(message.created_time);
        const currentDate = new Date();
        const timeDiff = currentDate.getTime() - messageDate.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        if (hoursDiff <= 24) {
          messages.push({
            from: from.name,
            to: to.name,
            message: message.message,
            created_time: message.created_time,
          });

          // Save the message to the database
          const dbMessage = new Message({
            from: from.name,
            to: to.name,
            message: message.message,
            created_time: message.created_time,
          });
          await dbMessage.save();
        }
      }
    }

    // Group the messages by the user sending
    const groupedMessages = {};
    for (const message of messages) {
      if (!groupedMessages[message.from]) {
        groupedMessages[message.from] = [];
      }
      groupedMessages[message.from].push(message);
    }

    res.render('messages', {messages: groupedMessages ,formatDate});
  } catch (error) {
    console.error('Error fetching and storing Facebook Page messages:', error);
    res.render('messages', { messages: [] });
  }
});

app.post('/messages', async (req, res) => {
  const pageAccessToken = 'EAAUhkngFxNsBO2yU6umvv8JzNcM2RwI4GsHca5CWjBZC7ycosC3Mt0TE1ZCPZBCReyrPRmEaLPQA44XNXz7KjdoYJfSv5jEOQNOR6vAaNpd2vS9OuZA9RcYO2Dp4xK49HXrCoKvfT4reo0FDJc7sR2VFUGbtkB8tVZBA5LnPGcg7jz2bSzHCbFtewXQ0MdjLI';
  const recipientId = 't_782352983692035'; 
  const message = req.body.message;

  try {
    const response = await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`, {
      recipient: { id: recipientId },
      message: { text: message },
    });
    console.log('Message sent:', response.data);
    res.redirect('/messages');
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send('Error sending message');
  }
});

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
