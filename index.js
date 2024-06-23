const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Require jsonwebtoken
const dotenv = require('dotenv'); // Require dotenv
const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors()); 
dotenv.config(); 

mongoose.connect(process.env.CONNECTION_URL)
  .then(() => { console.log('Connected to DB'); })
  .catch((err) => { console.error('DB Connection Error:', err); });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const eventSchema = new mongoose.Schema({
  username: { type: String, required: true },
  events: { type: Array, required: true }
});

const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const user = new User({ username, password });
  try {
    await user.save();
    res.send('User registered successfully');
  } catch (err) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Username already exists' });
    } else {
      console.error('Signup Error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && user.password === password) {
      const token = jwt.sign({ username: user.username }, 'secret');
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/events', async (req, res) => {
  const { username, events } = req.body;
  try {
    const event = new Event({ username, events });
    await event.save();
    res.send('Events saved successfully');
  } catch (err) {
    console.error('Events Save Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
app.get('/events/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const events = await Event.findOne({ username });
    if (events) {
      res.json(events);
    } else {
      res.status(404).json({ message: 'Events not found' });
    }
  } catch (err) {
    console.error('Get Events Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Middleware for handling errors
app.use((err, req, res, next) => {
  console.error('Unexpected Error:', err);
  res.status(500).json({ message: 'An unexpected error occurred' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
