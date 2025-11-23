/**
 * CONTROLLER PROBLEMS
 * Gerencia sistema de problemas da comunidade
 */

import { db } from '../config/firebase.js';

const problemsCollection = db.collection('problems');
const usersCollection = db.collection('users');
const projectsCollection = db.collection('projects');
const projectInterestsCollection = db.collection('projectInterests');
const solutionProposalsCollection = db.collection('solutionProposals');

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
 * GET /admin/community-dashboard/problems
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

    // Get all problems for counting (reuse snapshot if available from 'all' filter)
    let allProblems;
    if (filter === 'all' && typeof snapshot !== 'undefined') {
      allProblems = snapshot.docs.map(doc => doc.data());
    } else {
      const countSnapshot = await problemsCollection.get();
      allProblems = countSnapshot.docs.map(doc => doc.data());
    }

    // Calculate counts
    const approvedCount = allProblems.filter(p => p.status === 'approved').length;
    const myCount = allProblems.filter(p => p.submittedBy === userId).length;
    const allCount = allProblems.filter(p => p.status === 'approved' || p.submittedBy === userId).length;

    const filterCounts = {
      approved: approvedCount,
      my: myCount,
      all: allCount
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

    // Get solution proposals
    const solutionProposalsSnapshot = await solutionProposalsCollection.get();
    const solutionProposals = solutionProposalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate()
    }));

    // Sort by submission date (most recent first)
    solutionProposals.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.render('admin/problems', {
      user: req.session.user,
      problems,
      solutionProposals,
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

    console.log('✅ Problem deleted successfully:', {
      id: problemId,
      title: problemDoc.data().title,
      deletedBy: req.session.user.name
    });

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

/**
 * GET /admin/community-dashboard/solutions
 * Lista projetos existentes e problemas aprovados para community users
 */
export const getCommunitySolutions = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Get all projects
    const projectsSnapshot = await projectsCollection.get();
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Sort projects by creation date (most recent first)
    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get approved problems (excluding those that already have solutions)
    const problemsSnapshot = await problemsCollection.get();
    const approvedProblems = problemsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      .filter(problem => problem.status === 'approved')
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.render('admin/community-solutions', {
      user: req.session.user,
      currentPage: 'community-solutions',
      projects,
      approvedProblems,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Error fetching community solutions:', error);
    res.redirect('/admin/community-dashboard?error=' + encodeURIComponent('An error occurred while loading solutions'));
  }
};

/**
 * POST /admin/community-dashboard/join-project
 * Manifesta interesse em participar de um projeto
 */
export const joinProject = async (req, res) => {
  try {
    const { projectId, message } = req.body;
    const userId = req.session.user.id;

    // Validation
    if (!projectId || !message || message.trim().length < 20) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('Please provide a detailed message about why you want to join this project'));
    }

    if (message.trim().length > 500) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('Message must be less than 500 characters'));
    }

    // Check if project exists
    const projectDoc = await projectsCollection.doc(projectId).get();
    if (!projectDoc.exists) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('Project not found'));
    }

    // Check if user already expressed interest in this project
    const existingInterest = await projectInterestsCollection
      .where('projectId', '==', projectId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingInterest.empty) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('You have already expressed interest in this project'));
    }

    // Additional check: Prevent very rapid duplicate submissions (within 10 seconds)
    const recentInterest = await projectInterestsCollection
      .where('projectId', '==', projectId)
      .where('userId', '==', userId)
      .where('submittedAt', '>', new Date(Date.now() - 10000)) // Last 10 seconds
      .limit(1)
      .get();

    if (!recentInterest.empty) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('Please wait a moment before submitting again'));
    }

    // Get user info
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('User not found'));
    }

    const userData = userDoc.data();
    const projectData = projectDoc.data();

    // Create project interest record
    const interestData = {
      projectId,
      projectTitle: projectData.title,
      userId,
      userName: userData.name,
      userEmail: userData.email,
      message: message.trim(),
      status: 'pending', // pending, approved, rejected
      submittedAt: new Date()
    };

    await projectInterestsCollection.add(interestData);

    console.log('✅ Project interest submitted:', {
      projectTitle: projectData.title,
      userName: userData.name,
      message: message.substring(0, 50) + '...'
    });

    res.redirect('/admin/community-dashboard/solutions?success=' + encodeURIComponent('Your interest has been submitted! The project team will review your application.'));
  } catch (error) {
    console.error('Error submitting project interest:', error);
    res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('An error occurred while submitting your interest'));
  }
};

/**
 * POST /admin/community-dashboard/propose-solution
 * Propõe solução para um problema aprovado
 */
export const proposeSolution = async (req, res) => {
  try {
    const { problemId, title, description, timeline, requiredSkills } = req.body;
    const userId = req.session.user.id;

    // Validation
    if (!problemId || !title || !description) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('Title and description are required'));
    }

    if (title.trim().length < 5 || title.trim().length > 200) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('Title must be between 5 and 200 characters'));
    }

    if (description.trim().length < 50 || description.trim().length > 2000) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('Description must be between 50 and 2000 characters'));
    }

    // Check if problem exists and is approved
    const problemDoc = await problemsCollection.doc(problemId).get();
    if (!problemDoc.exists) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('Problem not found'));
    }

    const problemData = problemDoc.data();
    if (problemData.status !== 'approved') {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('This problem is not approved for solutions'));
    }

    // Check for duplicate solution proposals (same user, same problem)
    const existingSolution = await solutionProposalsCollection
      .where('problemId', '==', problemId)
      .where('proposedBy', '==', userId)
      .limit(1)
      .get();

    if (!existingSolution.empty) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('You have already submitted a solution proposal for this problem'));
    }

    // Additional check: Prevent very rapid duplicate submissions (within 10 seconds)
    const recentProposal = await solutionProposalsCollection
      .where('problemId', '==', problemId)
      .where('proposedBy', '==', userId)
      .where('submittedAt', '>', new Date(Date.now() - 10000)) // Last 10 seconds
      .limit(1)
      .get();

    if (!recentProposal.empty) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('Please wait a moment before submitting again'));
    }

    // Get user info
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      return res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('User not found'));
    }

    const userData = userDoc.data();

    // Create solution proposal record
    const proposalData = {
      problemId,
      problemTitle: problemData.title,
      title: title.trim(),
      description: description.trim(),
      timeline: timeline || '3-6 months',
      requiredSkills: requiredSkills ? requiredSkills.trim() : '',
      proposedBy: userId,
      proposedByName: userData.name,
      proposedByEmail: userData.email,
      status: 'pending', // pending, under_review, approved, rejected
      submittedAt: new Date()
    };

    await solutionProposalsCollection.add(proposalData);

    console.log('✅ Solution proposal submitted:', {
      problemTitle: problemData.title,
      solutionTitle: title.trim(),
      proposedBy: userData.name
    });

    res.redirect('/admin/community-dashboard/solutions?success=' + encodeURIComponent('Your solution proposal has been submitted! Admins will review it and may contact you.'));
  } catch (error) {
    console.error('Error submitting solution proposal:', error);
    res.redirect('/admin/community-dashboard/solutions?error=' + encodeURIComponent('An error occurred while submitting your solution proposal'));
  }
};

export const approveSolutionProposal = async (req, res) => {
  try {
    const { id } = req.params;

    // Get proposal details
    const proposalDoc = await solutionProposalsCollection.doc(id).get();
    if (!proposalDoc.exists) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    // Update proposal status to approved
    await solutionProposalsCollection.doc(id).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: req.session.user.id
    });

    console.log('✅ Solution proposal approved:', { proposalId: id });
    res.json({ success: true, message: 'Solution proposal approved successfully' });
  } catch (error) {
    console.error('Error approving solution proposal:', error);
    res.status(500).json({ success: false, message: 'Error approving solution proposal' });
  }
};

export const rejectSolutionProposal = async (req, res) => {
  try {
    const { id } = req.params;

    // Get proposal details
    const proposalDoc = await solutionProposalsCollection.doc(id).get();
    if (!proposalDoc.exists) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    // Update proposal status to rejected
    await solutionProposalsCollection.doc(id).update({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: req.session.user.id
    });

    console.log('✅ Solution proposal rejected:', { proposalId: id });
    res.json({ success: true, message: 'Solution proposal rejected successfully' });
  } catch (error) {
    console.error('Error rejecting solution proposal:', error);
    res.status(500).json({ success: false, message: 'Error rejecting solution proposal' });
  }
};