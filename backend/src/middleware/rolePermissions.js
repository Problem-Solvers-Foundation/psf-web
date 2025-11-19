/**
 * MIDDLEWARE DE PERMISSÕES POR ROLE
 * Sistema de hierarquia de usuários
 */

/**
 * Hierarchy:
 * - superuser: Can manage all users (including other admins)
 * - admin: Can manage normal users and create other admins (but not edit/delete other admins)
 * - user: Community access only (no admin panel)
 */

/**
 * Check if user can access admin panel
 */
export const requireAdminAccess = (req, res, next) => {
  if (!req.session?.user) {
    return res.redirect('/admin/login');
  }

  const userRole = req.session.user.role;

  if (userRole === 'superuser' || userRole === 'admin') {
    return next();
  }

  // User role cannot access admin panel
  return res.status(403).render('admin/login', {
    error: 'Access denied. Admin privileges required.'
  });
};

/**
 * Check if user can create users
 */
export const canCreateUser = (req, res, next) => {
  const userRole = req.session?.user?.role;

  if (userRole === 'superuser' || userRole === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Permission denied. Cannot create users.'
  });
};

/**
 * Check if user can edit/delete another user
 */
export const canManageUser = async (targetUserId, currentUserRole, currentUserId, usersCollection) => {
  // Superuser can manage anyone
  if (currentUserRole === 'superuser') {
    return { canManage: true, reason: 'Superuser has full permissions' };
  }

  // Users cannot manage anyone
  if (currentUserRole === 'user') {
    return { canManage: false, reason: 'Regular users cannot manage other users' };
  }

  // Admin role checks
  if (currentUserRole === 'admin') {
    // Cannot edit/delete themselves through this system (use profile page)
    if (targetUserId === currentUserId) {
      return { canManage: false, reason: 'Use profile page to edit your own account' };
    }

    // Get target user data
    const targetUserDoc = await usersCollection.doc(targetUserId).get();

    if (!targetUserDoc.exists) {
      return { canManage: false, reason: 'Target user not found' };
    }

    const targetUserRole = targetUserDoc.data().role;

    // Admin cannot manage other admins or superusers
    if (targetUserRole === 'admin' || targetUserRole === 'superuser') {
      return { canManage: false, reason: 'Admins cannot manage other admins or superusers' };
    }

    // Admin can manage regular users
    if (targetUserRole === 'user') {
      return { canManage: true, reason: 'Admin can manage regular users' };
    }
  }

  return { canManage: false, reason: 'Permission denied' };
};

/**
 * Check if user can create a specific role
 */
export const canCreateRole = (currentUserRole, targetRole) => {
  // Superuser can create any role
  if (currentUserRole === 'superuser') {
    return { canCreate: true, reason: 'Superuser can create any role' };
  }

  // Admin can create users and other admins, but not superusers
  if (currentUserRole === 'admin') {
    if (targetRole === 'superuser') {
      return { canCreate: false, reason: 'Admins cannot create superusers' };
    }
    if (targetRole === 'admin' || targetRole === 'user') {
      return { canCreate: true, reason: 'Admin can create users and admins' };
    }
  }

  // User cannot create anyone
  if (currentUserRole === 'user') {
    return { canCreate: false, reason: 'Regular users cannot create accounts' };
  }

  return { canCreate: false, reason: 'Permission denied' };
};

/**
 * Get role display information
 */
export const getRoleInfo = () => {
  return {
    superuser: {
      name: 'Super User',
      description: 'Full system access - can manage all users including admins',
      permissions: ['Create/edit/delete any user', 'Full admin panel access', 'System configuration'],
      color: 'red'
    },
    admin: {
      name: 'Administrator',
      description: 'Can manage regular users and create other admins',
      permissions: ['Create users and admins', 'Manage regular users only', 'Full admin panel access'],
      color: 'blue'
    },
    user: {
      name: 'Community User',
      description: 'Community access - no admin privileges',
      permissions: ['Community features', 'Public content access'],
      color: 'green'
    }
  };
};