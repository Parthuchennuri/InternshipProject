const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// Protect all task routes
router.use(protect);

// @route   GET /api/tasks
// @desc    Get all tasks for logged-in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const validStatuses = ['pending', 'in-progress', 'completed'];
    const taskStatus = status && validStatuses.includes(status) ? status : 'pending';

    const validPriorities = ['low', 'medium', 'high'];
    const taskPriority = priority && validPriorities.includes(priority.toLowerCase())
      ? priority.toLowerCase()
      : 'medium';

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: taskStatus,
      priority: taskPriority,
      dueDate: dueDate ? new Date(dueDate) : null,
      user: req.user._id,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: error.message || 'Server error creating task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task status or other fields
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate } = req.body;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) {
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Invalid status. Must be pending, in-progress, or completed',
        });
      }
      task.status = status;
    }
    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority.toLowerCase())) {
        return res.status(400).json({
          message: 'Invalid priority. Must be low, medium, or high',
        });
      }
      task.priority = priority.toLowerCase();
    }
    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: error.message || 'Server error updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(id);

    res.json({ message: 'Task deleted successfully', id });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

module.exports = router;
