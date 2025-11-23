/**
 * CONTROLLER PROBLEMS
 * Gerencia sistema de problemas da comunidade
 */

import { db } from '../config/firebase.js';

const problemsCollection = db.collection('problems');
const usersCollection = db.collection('users');

// ===============================
// COMMUNITY FUNCTIONS
// ===============================

/**
 * POST /admin/problems/submit
 * Submete problema pela comunidade
 */
export const submitProblem = async (req, res) => {
  try {
    const { title, description, country, state, city, knowledgeField, urgency } = req.body;
    const userId = req.session.user.id;

    // Validation
    if (!title || title.trim().length < 5) {
      return res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('Title must be at least 5 characters long'));
    }

    if (!description || description.trim().length < 20) {
      return res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('Description must be at least 20 characters long'));
    }

    if (!country || country.trim().length < 2) {
      return res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('Country is required'));
    }

    if (!city || city.trim().length < 2) {
      return res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('City is required'));
    }

    if (!knowledgeField || knowledgeField.trim().length < 2) {
      return res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('Knowledge field is required'));
    }

    // Get user info for submission
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      return res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('User not found'));
    }

    const userData = userDoc.data();

    // Create location object
    const location = {
      country: country.trim(),
      state: state ? state.trim() : '',
      city: city.trim()
    };

    // Create problem object
    const problemData = {
      title: title.trim(),
      description: description.trim(),
      location: location,
      knowledgeField: knowledgeField.trim(),
      urgency: urgency || 'medium',
      status: 'pending',
      submittedBy: userId,
      submittedByName: userData.name,
      submittedByEmail: userData.email,
      submittedAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    const docRef = await problemsCollection.add(problemData);

    console.log('✅ Problem submitted:', {
      id: docRef.id,
      title: problemData.title,
      submittedBy: userData.name
    });

    res.redirect('/admin/community-dashboard?success=' + encodeURIComponent('Problem submitted successfully! It will be reviewed by our team.'));
  } catch (error) {
    console.error('Error submitting problem:', error);
    res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('An error occurred while submitting your problem'));
  }
};

/**
 * GET /admin/problems/my
 * Lista problemas do usuário logado
 */
export const getMyProblems = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Get all problems and filter user's problems in JavaScript to avoid composite index
    const snapshot = await problemsCollection.get();

    const problems = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      }))
      .filter(problem => problem.submittedBy === userId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.render('admin/my-problems', {
      user: req.session.user,
      problems,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Error fetching user problems:', error);
    res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('An error occurred while loading your problems'));
  }
};

/**
 * GET /admin/problems/community
 * Página principal de problemas para community users (approved + own problems)
 */
export const getCommunityProblems = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const filter = req.query.filter || 'approved'; // approved, my, all
    const page = parseInt(req.query.page) || 1;
    const limit = 12;

    let problems = [];
    let totalCount = 0;

    if (filter === 'approved') {
      // Get all problems and filter in JavaScript to avoid composite index
      const snapshot = await problemsCollection.get();

      problems = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }))
        .filter(problem => problem.status === 'approved')
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    } else if (filter === 'my') {
      // Get all problems and filter in JavaScript to avoid composite index
      const snapshot = await problemsCollection.get();

      problems = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          reviewedAt: doc.data().reviewedAt?.toDate()
        }))
        .filter(problem => problem.submittedBy === userId)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    } else if (filter === 'all') {
      // Get all problems and filter in JavaScript to avoid composite index
      const snapshot = await problemsCollection.get();

      const allProblems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      }));

      // Filter for approved OR user's own problems
      problems = allProblems
        .filter(problem => problem.status === 'approved' || problem.submittedBy === userId)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    }

    // Count by filter type (calculate from already fetched data to avoid extra queries)
    let approvedCount = 0;
    let myCount = 0;

    // If we already have the data, use it; otherwise get minimal data
    if (filter === 'all' && typeof snapshot !== 'undefined') {
      const allProblems = snapshot.docs.map(doc => doc.data());
      approvedCount = allProblems.filter(p => p.status === 'approved').length;
      myCount = allProblems.filter(p => p.submittedBy === userId).length;
    } else {
      // Get all problems just for counting
      const countSnapshot = await problemsCollection.get();
      const allProblems = countSnapshot.docs.map(doc => doc.data());
      approvedCount = allProblems.filter(p => p.status === 'approved').length;
      myCount = allProblems.filter(p => p.submittedBy === userId).length;
    }

    const filterCounts = {
      approved: approvedCount,
      my: myCount,
      all: approvedCount + myCount
    };

    // Paginate
    totalCount = problems.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProblems = problems.slice(startIndex, endIndex);

    res.render('admin/community-problems', {
      user: req.session.user,
      currentPage: 'community-problems',
      problems: paginatedProblems,
      currentFilter: filter,
      filterCounts,
      page,
      totalPages,
      totalCount,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Error fetching community problems:', error);
    res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('An error occurred while loading problems'));
  }
};

// ===============================
// ADMIN MODERATION FUNCTIONS
// ===============================

/**
 * GET /admin/problems
 * Lista problemas para moderação (admin only)
 */
export const getProblemsForModeration = async (req, res) => {
  try {
    const status = req.query.status || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    // Always get ALL problems first to count them properly
    const allSnapshot = await problemsCollection.get();

    // Count by status using all problems
    const statusCounts = {
      all: allSnapshot.size,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    let allProblems = [];
    allSnapshot.forEach(doc => {
      const problemData = doc.data();
      const problemStatus = problemData.status || 'pending';

      // Count all statuses
      statusCounts[problemStatus]++;

      allProblems.push({
        id: doc.id,
        ...problemData,
        submittedAt: problemData.submittedAt?.toDate(),
        updatedAt: problemData.updatedAt?.toDate(),
        reviewedAt: problemData.reviewedAt?.toDate()
      });
    });

    // Sort manually
    allProblems.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Filter by status if needed
    let filteredProblems = allProblems;
    if (status !== 'all') {
      filteredProblems = allProblems.filter(p => p.status === status);
    }

    // Paginate
    const totalProblems = filteredProblems.length;
    const totalPages = Math.ceil(totalProblems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const problems = filteredProblems.slice(startIndex, endIndex);

    res.render('admin/problems', {
      user: req.session.user,
      problems,
      statusCounts,
      currentStatus: status,
      currentPage: page,
      totalPages,
      totalProblems,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Error fetching problems for moderation:', error);
    res.redirect('/admin/dashboard?error=' + encodeURIComponent('An error occurred while loading problems'));
  }
};

/**
 * POST /admin/problems/moderate/:id
 * Modera problema (approve/reject/edit)
 */
export const moderateProblem = async (req, res) => {
  try {
    const problemId = req.params.id;
    const { action, title, description, country, state, city, knowledgeField, urgency, adminNotes } = req.body;
    const adminId = req.session.user.id;

    // Get problem
    const problemDoc = await problemsCollection.doc(problemId).get();
    if (!problemDoc.exists) {
      return res.redirect('/admin/problems?error=' + encodeURIComponent('Problem not found'));
    }

    const updateData = {
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date()
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      if (adminNotes) updateData.adminNotes = adminNotes.trim();

      // Update editable fields if provided
      if (title) updateData.title = title.trim();
      if (description) updateData.description = description.trim();
      if (country || state || city) {
        updateData.location = {
          country: country ? country.trim() : '',
          state: state ? state.trim() : '',
          city: city ? city.trim() : ''
        };
      }
      if (knowledgeField) updateData.knowledgeField = knowledgeField.trim();
      if (urgency) updateData.urgency = urgency;

    } else if (action === 'reject') {
      updateData.status = 'rejected';
      if (adminNotes) updateData.adminNotes = adminNotes.trim();

    } else if (action === 'edit') {
      // Update editable fields
      if (title) updateData.title = title.trim();
      if (description) updateData.description = description.trim();
      if (country || state || city) {
        updateData.location = {
          country: country ? country.trim() : '',
          state: state ? state.trim() : '',
          city: city ? city.trim() : ''
        };
      }
      if (knowledgeField) updateData.knowledgeField = knowledgeField.trim();
      if (urgency) updateData.urgency = urgency;
      if (adminNotes) updateData.adminNotes = adminNotes.trim();
    }

    await problemsCollection.doc(problemId).update(updateData);

    const successMessage = action === 'approve' ? 'Problem approved successfully' :
                          action === 'reject' ? 'Problem rejected successfully' :
                          'Problem updated successfully';

    res.redirect('/admin/problems?success=' + encodeURIComponent(successMessage));
  } catch (error) {
    console.error('Error moderating problem:', error);
    res.redirect('/admin/problems?error=' + encodeURIComponent('An error occurred while moderating the problem'));
  }
};

/**
 * POST /admin/problems/delete/:id
 * Deleta problema (admin only)
 */
export const deleteProblem = async (req, res) => {
  try {
    const problemId = req.params.id;

    // Check if problem exists
    const problemDoc = await problemsCollection.doc(problemId).get();
    if (!problemDoc.exists) {
      return res.redirect('/admin/problems?error=' + encodeURIComponent('Problem not found'));
    }

    await problemsCollection.doc(problemId).delete();

    res.redirect('/admin/problems?success=' + encodeURIComponent('Problem deleted successfully'));
  } catch (error) {
    console.error('Error deleting problem:', error);
    res.redirect('/admin/problems?error=' + encodeURIComponent('An error occurred while deleting the problem'));
  }
};

// ===============================
// PUBLIC FUNCTIONS
// ===============================

/**
 * GET /problems
 * Lista problemas aprovados publicamente
 */
export const getPublicProblems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const field = req.query.field;
    const limit = 12;

    // Get all problems and filter in JavaScript to avoid composite index
    const snapshot = await problemsCollection.get();

    // Process and filter approved problems
    let allProblems = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      .filter(problem => problem.status === 'approved');

    // Filter by knowledge field if specified
    if (field) {
      allProblems = allProblems.filter(problem =>
        problem.knowledgeField && problem.knowledgeField.toLowerCase().includes(field.toLowerCase())
      );
    }

    // Sort by submission date
    allProblems.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Get unique knowledge fields from all approved problems for filter options
    const allApprovedProblems = snapshot.docs
      .map(doc => doc.data())
      .filter(problem => problem.status === 'approved');

    const availableFields = [...new Set(allApprovedProblems
      .map(problem => problem.knowledgeField)
      .filter(field => field && field.trim() !== '')
    )].sort();

    // Paginate
    const totalProblems = allProblems.length;
    const totalPages = Math.ceil(totalProblems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const problems = allProblems.slice(startIndex, endIndex);

    res.render('public/problems', {
      problems,
      currentPage: page,
      totalPages,
      totalProblems,
      currentField: field,
      availableFields,
      error: null
    });
  } catch (error) {
    console.error('Error fetching public problems:', error);
    res.render('public/problems', {
      problems: [],
      currentPage: 1,
      totalPages: 1,
      totalProblems: 0,
      currentField: req.query.field,
      availableFields: [],
      error: 'An error occurred while loading problems'
    });
  }
};

/**
 * GET /problems/:id
 * Exibe detalhes de problema aprovado
 */
export const getPublicProblemDetail = async (req, res) => {
  try {
    const problemId = req.params.id;

    // Get problem
    const problemDoc = await problemsCollection.doc(problemId).get();

    if (!problemDoc.exists) {
      return res.status(404).render('public/404', {
        title: 'Problem Not Found'
      });
    }

    const problemData = problemDoc.data();

    // Check if problem is approved
    if (problemData.status !== 'approved') {
      return res.status(404).render('public/404', {
        title: 'Problem Not Found'
      });
    }

    const problem = {
      id: problemDoc.id,
      ...problemData,
      submittedAt: problemData.submittedAt?.toDate(),
      updatedAt: problemData.updatedAt?.toDate()
    };

    res.render('public/problem-detail', {
      problem
    });
  } catch (error) {
    console.error('Error fetching problem detail:', error);
    res.status(500).render('public/500', {
      title: 'Server Error'
    });
  }
};