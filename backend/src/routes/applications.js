/**
 * ROTAS DE APPLICATIONS (CANDIDATURAS)
 * Gerenciamento de candidaturas para Problem Solvers
 */

import { Router } from 'express';
const router = Router();
import { db } from '../config/firebase.js';

const applicationsCollection = db.collection('applications');

/**
 * POST /api/applications/submit
 * Submete uma nova candidatura
 */
router.post('/submit', async (req, res) => {
  try {
    const applicationData = {
      ...req.body,
      submittedAt: new Date(),
      status: 'pending', // pending, reviewing, approved, rejected
      reviewNotes: '',
      reviewedBy: null,
      reviewedAt: null
    };

    const docRef = await applicationsCollection.add(applicationData);

    console.log(`✅ New application submitted: ${docRef.id}`);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: docRef.id
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    });
  }
});

/**
 * GET /api/applications
 * Lista todas as candidaturas (requer autenticação - será adicionado depois)
 */
router.get('/', async (req, res) => {
  try {
    const snapshot = await applicationsCollection.orderBy('submittedAt', 'desc').get();
    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate()
    }));

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

/**
 * GET /api/applications/:id
 * Busca uma candidatura específica
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await applicationsCollection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      application: {
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate()
      }
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application'
    });
  }
});

export default router;
