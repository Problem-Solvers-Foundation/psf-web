/**
 * USER STATUS MIDDLEWARE
 * Authentication and authorization middleware for access control
 */

/**
 * Require user to be authenticated (have a valid session)
 */
export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/signin?error=Please sign in to access this page');
  }
  next();
};

/**
 * Require user to be authenticated and have approved status
 * Used for Community Dashboard access
 */
export const requireApproved = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/signin?error=Please sign in to access the Community Dashboard');
  }

  if (req.session.user.status !== 'approved') {
    // Determine appropriate access denied reason
    let reason = 'not-approved';

    if (req.session.user.status === 'rejected') {
      reason = 'rejected';
    } else if (req.session.user.applicationId) {
      reason = 'under-review';
    }

    return res.redirect(`/access-denied?reason=${reason}`);
  }

  next();
};

/**
 * Require user to be authenticated but NOT approved yet
 * Used for join page - only pending users should access
 */
export const requirePending = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/signin?error=Please sign in to continue with your application');
  }

  // If user is already approved, redirect to community dashboard
  if (req.session.user.status === 'approved') {
    return res.redirect('/admin/community-dashboard');
  }

  // If user is rejected, redirect to access denied
  if (req.session.user.status === 'rejected') {
    return res.redirect('/access-denied?reason=rejected');
  }

  // If user already has an application, show status page instead of join form
  if (req.session.user.applicationId && req.session.user.status === 'reviewing') {
    return res.redirect('/access-denied?reason=under-review');
  }

  next();
};

/**
 * Redirect authenticated users away from auth pages
 * Used for signup/signin pages
 */
export const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) {
    // Redirect based on user status
    if (req.session.user.status === 'approved') {
      return res.redirect('/admin/community-dashboard');
    } else if (req.session.user.status === 'rejected') {
      return res.redirect('/access-denied?reason=rejected');
    } else if (req.session.user.applicationId) {
      return res.redirect('/access-denied?reason=under-review');
    } else {
      return res.redirect('/join');
    }
  }
  next();
};

/**
 * Admin authentication middleware
 * Checks if user is an admin user (existing admin system)
 */
export const requireAdmin = (req, res, next) => {
  // Use existing admin authentication check from adminController
  if (!req.session.user || !req.session.user.role || req.session.user.role !== 'admin') {
    return res.redirect('/signin?error=Admin access required');
  }
  next();
};

/**
 * Community user middleware - requires approved status for community features
 */
export const requireCommunityAccess = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/signin?error=Please sign in to access the Community Dashboard');
  }

  // Allow admins full access
  if (req.session.user.role === 'admin' || req.session.user.role === 'superuser') {
    return next();
  }

  // For community users, check approval status
  const userStatus = req.session.user.status;

  if (userStatus === 'approved') {
    next();
  } else if (userStatus === 'rejected') {
    res.redirect('/signin?error=Your application has been rejected. Please contact support for assistance.');
  } else if (req.session.user.applicationId) {
    // Has application but still pending/reviewing
    res.redirect('/signin?error=Your application is under review. You will be notified once a decision is made.');
  } else {
    // No application submitted yet
    res.redirect('/join');
  }
};