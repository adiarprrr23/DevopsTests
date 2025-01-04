const request = require('supertest');
const { Sequelize, DataTypes } = require('sequelize');
const express = require('express');
const cors = require('cors');
jest.setTimeout(30000);
// Your Express app setup from before
const app = express();
app.use(express.json());
app.use(cors());

const sequelize = new Sequelize('postgresql://nondb_owner:MZbuTFw2N5HX@ep-still-tooth-a5s3trxn.us-east-2.aws.neon.tech/nondb?sslmode=require', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, 
    }
  }
});

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

// Test suite
describe('Blog API', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await BlogPost.sync({ force: true }); // Clear the database
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a new post', async () => {
    const post = {
      title: 'Test Post',
      content: 'This is a test post content',
    };
    
    const response = await request(app)
      .post('/posts')
      .send(post);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('title', post.title);
    expect(response.body).toHaveProperty('content', post.content);
  });

  it('should fetch all posts', async () => {
    const response = await request(app).get('/posts');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should update an existing post', async () => {
    // Create a post first
    const post = await BlogPost.create({
      title: 'Old Title',
      content: 'Old content',
    });

    const updatedPost = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    const response = await request(app)
      .put(`/posts/${post.id}`)
      .send(updatedPost);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('title', updatedPost.title);
    expect(response.body).toHaveProperty('content', updatedPost.content);
  });

  it('should delete a post', async () => {
    // Create a post first
    const post = await BlogPost.create({
      title: 'Post to Delete',
      content: 'Content to delete',
    });

    const response = await request(app)
      .delete(`/posts/${post.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Post deleted successfully');
  });

  it('should return 404 if post not found for update', async () => {
    const response = await request(app)
      .put('/posts/999999')
      .send({ title: 'Nonexistent Post' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Post not found');
  });

  it('should return 404 if post not found for delete', async () => {
    const response = await request(app).delete('/posts/999999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Post not found');
  });
});
