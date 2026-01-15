/**
 * TASK CONTROLLER
 * Manages task creation, assignment, and completion
 * Handles both admin operations and community user interactions
 */

import { db } from '../config/firebase.js';

const tasksCollection = db.collection('tasks');
const taskCompletionsCollection = db.collection('taskCompletions');
const usersCollection = db.collection('users');

/**
 * Sanitiza strings para remover caracteres surrogate inválidos
 * @param {any} obj - Objeto para sanitizar
 * @returns {any} - Objeto sanitizado
 */
function sanitizeUnicode(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeUnicode);
  } else if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeUnicode(key)] = sanitizeUnicode(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * GET /admin/tasks
 * Show tasks management page for admins
 */
export const showTasks = async (req, res) => {
  try {
    // Get all tasks (simplified query to avoid index requirements)
    const tasksSnapshot = await tasksCollection
      .orderBy('createdAt', 'desc')
      .get();

    // Get all users for assignment (simplified query)
    const usersSnapshot = await usersCollection
      .where('role', '==', 'user')
      .get();

    const tasks = [];
    const users = [];

    tasksSnapshot.forEach(doc => {
      const taskData = sanitizeUnicode(doc.data());
      // Filter out deleted tasks in code instead of query
      if (taskData.status !== 'deleted') {
        tasks.push({
          id: doc.id,
          ...taskData
        });
      }
    });

    usersSnapshot.forEach(doc => {
      const userData = sanitizeUnicode(doc.data());
      // Filter active users in code instead of query
      if (userData.isActive === true && userData.role === 'user') {
        users.push({
          id: doc.id,
          ...userData
        });
      }
    });

    // Sort users by name in code
    users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Get completion stats for each task
    for (const task of tasks) {
      const completionsSnapshot = await taskCompletionsCollection
        .where('taskId', '==', task.id)
        .get();

      task.completionCount = completionsSnapshot.size;
      task.assignedCount = task.assignedTo ? task.assignedTo.length : 0;
    }

    res.render('admin/tasks', {
      title: 'Task Management',
      currentPage: 'tasks',
      user: req.session.user,
      tasks: tasks,
      users: users,
      success: req.query.success,
      error: req.query.error
    });

  } catch (error) {
    console.error('Error loading tasks page:', error);
    res.status(500).render('admin/tasks', {
      title: 'Task Management',
      currentPage: 'tasks',
      user: req.session.user,
      tasks: [],
      users: [],
      error: 'Failed to load tasks'
    });
  }
};

/**
 * POST /admin/tasks/create
 * Create a new task
 */
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      instructions,
      deadline,
      priority,
      category,
      estimatedTime,
      assignedTo
    } = req.body;

    // Validate required fields
    if (!title || !description || !deadline || !assignedTo) {
      return res.redirect('/admin/tasks?error=' + encodeURIComponent('Please fill in all required fields'));
    }

    // Parse assignedTo (can be single user or multiple users)
    const assignedUsers = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    // Create task object
    const taskData = {
      title: sanitizeUnicode(title.trim()),
      description: sanitizeUnicode(description.trim()),
      instructions: instructions ? sanitizeUnicode(instructions.trim()) : '',
      deadline: new Date(deadline),
      priority: priority || 'medium',
      category: category || 'general',
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
      assignedTo: assignedUsers,
      createdBy: req.session.user.id,
      status: 'active',
      isCompleted: false,
      completedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: []
    };

    // Save to database
    const taskRef = await tasksCollection.add(taskData);

    // Log audit trail
    const auditLog = {
      action: 'task_created',
      taskId: taskRef.id,
      performedBy: req.session.user.id,
      performedAt: new Date(),
      details: {
        title: taskData.title,
        assignedTo: assignedUsers
      }
    };
    await db.collection('auditLogs').add(auditLog);

    res.redirect('/admin/tasks?success=' + encodeURIComponent('Task created successfully'));

  } catch (error) {
    console.error('Error creating task:', error);
    res.redirect('/admin/tasks?error=' + encodeURIComponent('Failed to create task'));
  }
};

/**
 * POST /admin/tasks/edit/:id
 * Update an existing task
 */
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      instructions,
      deadline,
      priority,
      category,
      estimatedTime,
      assignedTo,
      status
    } = req.body;

    // Validate required fields
    if (!title || !description || !deadline) {
      return res.redirect('/admin/tasks?error=' + encodeURIComponent('Please fill in all required fields'));
    }

    // Parse assignedTo
    const assignedUsers = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    // Update task data
    const updateData = {
      title: sanitizeUnicode(title.trim()),
      description: sanitizeUnicode(description.trim()),
      instructions: instructions ? sanitizeUnicode(instructions.trim()) : '',
      deadline: new Date(deadline),
      priority: priority || 'medium',
      category: category || 'general',
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
      assignedTo: assignedUsers,
      status: status || 'active',
      updatedAt: new Date()
    };

    // Update in database
    await tasksCollection.doc(id).update(updateData);

    // Log audit trail
    const auditLog = {
      action: 'task_updated',
      taskId: id,
      performedBy: req.session.user.id,
      performedAt: new Date(),
      details: updateData
    };
    await db.collection('auditLogs').add(auditLog);

    res.redirect('/admin/tasks?success=' + encodeURIComponent('Task updated successfully'));

  } catch (error) {
    console.error('Error updating task:', error);
    res.redirect('/admin/tasks?error=' + encodeURIComponent('Failed to update task'));
  }
};

/**
 * POST /admin/tasks/delete/:id
 * Soft delete a task
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by updating status
    await tasksCollection.doc(id).update({
      status: 'deleted',
      updatedAt: new Date()
    });

    // Log audit trail
    const auditLog = {
      action: 'task_deleted',
      taskId: id,
      performedBy: req.session.user.id,
      performedAt: new Date()
    };
    await db.collection('auditLogs').add(auditLog);

    res.redirect('/admin/tasks?success=' + encodeURIComponent('Task deleted successfully'));

  } catch (error) {
    console.error('Error deleting task:', error);
    res.redirect('/admin/tasks?error=' + encodeURIComponent('Failed to delete task'));
  }
};

/**
 * POST /admin/tasks/archive/:id
 * Archive a completed task
 */
export const archiveTask = async (req, res) => {
  try {
    const { id } = req.params;

    await tasksCollection.doc(id).update({
      status: 'archived',
      updatedAt: new Date()
    });

    // Log audit trail
    const auditLog = {
      action: 'task_archived',
      taskId: id,
      performedBy: req.session.user.id,
      performedAt: new Date()
    };
    await db.collection('auditLogs').add(auditLog);

    res.redirect('/admin/tasks?success=' + encodeURIComponent('Task archived successfully'));

  } catch (error) {
    console.error('Error archiving task:', error);
    res.redirect('/admin/tasks?error=' + encodeURIComponent('Failed to archive task'));
  }
};

/**
 * GET /admin/community-dashboard/tasks
 * Get tasks for logged-in community user
 */
export const getUserTasks = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Get tasks assigned to this user (simplified query)
    const tasksSnapshot = await tasksCollection
      .where('assignedTo', 'array-contains', userId)
      .get();

    const tasks = [];
    const now = new Date();

    for (const doc of tasksSnapshot.docs) {
      const taskData = sanitizeUnicode(doc.data());

      // Skip deleted tasks (soft delete)
      if (taskData.status === 'deleted') {
        continue;
      }

      // Check if user has completed this task
      const completionSnapshot = await taskCompletionsCollection
        .where('taskId', '==', doc.id)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      const isCompleted = !completionSnapshot.empty;

      // Handle different deadline formats
      let deadline;
      if (taskData.deadline && typeof taskData.deadline.toDate === 'function') {
        // Firestore timestamp
        deadline = taskData.deadline.toDate();
      } else if (taskData.deadline instanceof Date) {
        // Regular Date object
        deadline = taskData.deadline;
      } else if (taskData.deadline) {
        // String or other format, try to convert to Date
        deadline = new Date(taskData.deadline);
      } else {
        // No deadline set
        deadline = new Date();
      }

      const isOverdue = deadline < now && !isCompleted;

      tasks.push({
        id: doc.id,
        ...taskData,
        deadline: deadline,
        isCompleted: isCompleted,
        isOverdue: isOverdue,
        completedAt: isCompleted ? (() => {
          const completedData = completionSnapshot.docs[0].data();
          if (completedData.completedAt && typeof completedData.completedAt.toDate === 'function') {
            return completedData.completedAt.toDate();
          } else if (completedData.completedAt) {
            return new Date(completedData.completedAt);
          }
          return null;
        })() : null
      });
    }

    res.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error('Error getting user tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load tasks'
    });
  }
};

/**
 * POST /admin/community-dashboard/tasks/complete/:id
 * Mark task as completed by user
 */
export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.session.user.id;

    // Check if task exists and user is assigned
    const taskDoc = await tasksCollection.doc(id).get();
    if (!taskDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const taskData = taskDoc.data();
    if (!taskData.assignedTo.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this task'
      });
    }

    // Check if already completed
    const existingCompletion = await taskCompletionsCollection
      .where('taskId', '==', id)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingCompletion.empty) {
      return res.status(400).json({
        success: false,
        error: 'Task already completed'
      });
    }

    // Create completion record
    const completionData = {
      taskId: id,
      userId: userId,
      completedAt: new Date(),
      notes: notes ? sanitizeUnicode(notes.trim()) : '',
      attachments: []
    };

    await taskCompletionsCollection.add(completionData);

    // Update task's completedBy array
    await tasksCollection.doc(id).update({
      completedBy: [...taskData.completedBy, userId],
      updatedAt: new Date()
    });

    // Log audit trail
    const auditLog = {
      action: 'task_completed',
      taskId: id,
      performedBy: userId,
      performedAt: new Date(),
      details: { notes: completionData.notes }
    };
    await db.collection('auditLogs').add(auditLog);

    res.json({
      success: true,
      message: 'Task completed successfully'
    });

  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete task'
    });
  }
};

/**
 * GET /admin/tasks/stats
 * Get task statistics for dashboard
 */
export const getTaskStats = async (req, res) => {
  try {
    // Get all tasks (filter active tasks in code)
    const allTasksSnapshot = await tasksCollection.get();

    // Get all completions
    const completionsSnapshot = await taskCompletionsCollection.get();

    // Filter and calculate stats in code
    const now = new Date();
    let totalActiveTasks = 0;
    let overdueTasks = 0;

    allTasksSnapshot.forEach(doc => {
      const taskData = doc.data();
      if (taskData.status === 'active') {
        totalActiveTasks++;
        if (taskData.deadline && taskData.deadline.toDate() < now) {
          overdueTasks++;
        }
      }
    });

    const totalCompletions = completionsSnapshot.size;

    // Calculate completion rate
    const completionRate = totalActiveTasks > 0 ?
      Math.round((totalCompletions / totalActiveTasks) * 100) : 0;

    const stats = {
      totalActiveTasks,
      totalCompletions,
      overdueTasks,
      completionRate
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting task stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load task statistics'
    });
  }
};

export default {
  showTasks,
  createTask,
  updateTask,
  deleteTask,
  archiveTask,
  getUserTasks,
  completeTask,
  getTaskStats
};