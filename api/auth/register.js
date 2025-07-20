import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let client;

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create new client for each request (serverless best practice)
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db('vyapaal');
    const users = db.collection('users');

    // Check if user exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await users.insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date()
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: result.insertedId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertedId,
        name,
        email,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}