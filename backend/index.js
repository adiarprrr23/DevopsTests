const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Replace the connection details with the provided PostgreSQL URL
const sequelize = new Sequelize('postgresql://nondb_owner:MZbuTFw2N5HX@ep-still-tooth-a5s3trxn.us-east-2.aws.neon.tech/nondb?sslmode=require', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // This is needed for SSL connections
    }
  }
});

// Define the BlogPost model
const BlogPost = sequelize.define('BlogPost', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
});

// Initialize the database
async function initDB() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await BlogPost.sync(); // Create table if it doesn't exist
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Routes
app.get('/posts', async (req, res) => {
  try {
    const posts = await BlogPost.findAll();
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/posts', async (req, res) => {
  try {
    const post = await BlogPost.create(req.body);
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: 'Invalid input' });
  }
});

app.put('/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    await post.update(req.body);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

app.delete('/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    await post.destroy();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Serve the frontend
app.use(express.static('static'));
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'static' });
});

initDB().then(() => {
  app.listen(8080, () => {
    console.log('Server started on http://localhost:8080');
  });
});
