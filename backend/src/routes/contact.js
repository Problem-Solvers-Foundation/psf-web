/**
 * CONTACT ROUTES
 * Handles contact form submissions with validation and security
 */

import express from 'express';
import { db } from '../config/firebase.js';
import { validateContactForm, rateLimitContact } from '../middleware/contactValidation.js';

const router = express.Router();

/**
 * POST /api/contact/submit
 * Submit a contact form message
 */
router.post('/submit', rateLimitContact, validateContactForm, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Create contact document
    const contactData = {
      name,
      email,
      message,
      status: 'new', // new, read, archived
      submittedAt: new Date().toISOString(),
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore
    const contactRef = await db.collection('contacts').add(contactData);

    console.log(`✅ New contact message received [${contactRef.id}] from ${email}`);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      contactId: contactRef.id
    });

  } catch (error) {
    console.error('❌ Error saving contact message:', error);

    res.status(500).json({
      success: false,
      message: 'An error occurred while sending your message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/contact/test
 * Test endpoint to verify route is working
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Contact API is working',
    timestamp: new Date().toISOString()
  });
});

export default router;
