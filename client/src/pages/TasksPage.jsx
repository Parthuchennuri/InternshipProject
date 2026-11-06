import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Filter,
  X,
} from 'lucide-react';

const COLUMNS = [
  { id: 'pending', title: 'Pending', colorClass: 'pending', icon: Clock },
  { id: 'in-progress', title: 'In Progress', colorClass: 'in-progress', icon: PlayCircle },
  { id: 'completed', title: 'Completed', colorClass: 'completed', icon: CheckCircle2 },
];

const TasksPage = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('pending');
  const [editingTask, setEditingTask] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenModal = (columnId = 'pending') => {
    setEditingTask(null);
    setModalStatus(columnId);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCreateOrUpdateTask = async (taskData) => {
    if (editingTask) {
      // Edit task
      const res = await api.put(`/tasks/${editingTask._id}`, taskData);
      setTasks((prev) =>
        prev.map((t) => (t._id === editingTask._id ? res.data : t))
      );
      toast.success(`Task "${res.data.title}" updated successfully!`);
      setEditingTask(null);
    } else {
      // Create task
      const res = await api.post('/tasks', taskData);
      setTasks((prev) => [res.data, ...prev]);
      toast.success(`Task "${res.data.title}" added to ${res.data.status}!`);
    }
  };

  const handleDeleteTask = async (taskId, title) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.info(`Task "${title || 'item'}" deleted.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside or no movement
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    // Save previous state for potential rollback
    const previousTasks = [...tasks];

    // Optimistically update the status of the dragged task
    setTasks((prev) =>
      prev.map((task) =>
        task._id === draggableId ? { ...task, status: newStatus } : task
      )
    );

    // Call backend API if status changed
    if (newStatus !== oldStatus) {
      const destinationColumn = COLUMNS.find((c) => c.id === newStatus);
      const colTitle = destinationColumn ? destinationColumn.title : newStatus;

      try {
        setUpdatingTaskId(draggableId);
        await api.put(`/tasks/${draggableId}`, { status: newStatus });
        toast.success(`Task moved to ${colTitle}`);
      } catch (err) {
        console.error('Failed to update status in DB:', err);
        toast.error('Failed to update task status in database. Reverting...');
        setTasks(previousTasks); // Rollback
      } finally {
        setUpdatingTaskId(null);
      }
    }
  };

  // Check if a task is overdue
  const isTaskOverdue = (task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const dueTime = new Date(task.dueDate).setHours(23, 59, 59, 999);
    return dueTime < Date.now();
  };

  // Filter tasks by search query and priority
  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query);

    const matchesPriority =
      priorityFilter === 'all' ||
      (task.priority || 'medium').toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {/* Header & Controls */}
        <div className="page-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h1 className="page-title">Tasks Board</h1>
            <p className="page-subtitle">
              Drag and drop cards across columns to update workflow states in real-time.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => handleOpenModal('pending')}
              className="btn btn-primary"
            >
              <Plus size={18} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar: Search & Priority Filter */}
        <div className="kanban-toolbar">
          <div className="toolbar-left-group">
            {/* Search Bar */}
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks by title or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Priority Filter */}
            <div className="priority-filter-wrapper">
              <Filter size={15} className="filter-icon" />
              <select
                className="form-select filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🟢 Low Priority</option>
              </select>
            </div>
          </div>

          {/* Counts Info */}
          <div className="toolbar-right-group">
            <span className="tasks-summary-pill">
              Showing <strong>{filteredTasks.length}</strong> of{' '}
              <strong>{tasks.length}</strong> tasks
            </span>
          </div>
        </div>

        {/* Kanban Board with Drag and Drop */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board">
              {COLUMNS.map((column) => {
                const columnTasks = filteredTasks.filter(
                  (t) => t.status === column.id
                );
                const rawColumnTotal = tasks.filter((t) => t.status === column.id).length;
                const IconComponent = column.icon;

                return (
                  <div key={column.id} className="kanban-column">
                    {/* Column Header showing task count */}
                    <div className="column-header">
                      <div className="column-title-wrap">
                        <span className={`column-dot ${column.colorClass}`} />
                        <IconComponent size={16} />
                        <span className="column-title">{column.title}</span>
                        {/* Prominent Column Header Count */}
                        <span
                          className="column-count-badge"
                          title={`${columnTasks.length} tasks in ${column.title}`}
                        >
                          {columnTasks.length}
                          {priorityFilter !== 'all' || searchQuery ? ` / ${rawColumnTotal}` : ''}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenModal(column.id)}
                        className="btn-close"
                        title={`Add task to ${column.title}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Droppable Area */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`column-task-list ${
                            snapshot.isDraggingOver ? 'dragging-over' : ''
                          }`}
                        >
                          {columnTasks.length === 0 ? (
                            <div className="empty-column-placeholder">
                              <p>No {column.title.toLowerCase()} tasks</p>
                              <button
                                onClick={() => handleOpenModal(column.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ marginTop: '0.5rem' }}
                              >
                                <Plus size={14} />
                                <span>Add Task</span>
                              </button>
                            </div>
                          ) : (
                            columnTasks.map((task, index) => {
                              const overdue = isTaskOverdue(task);
                              return (
                                <Draggable
                                  key={task._id}
                                  draggableId={task._id}
                                  index={index}
                                >
                                  {(dragProvided, dragSnapshot) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      className={`task-card ${
                                        dragSnapshot.isDragging ? 'is-dragging' : ''
                                      } ${overdue ? 'card-overdue' : ''}`}
                                    >
                                      {/* Top Row: Priority Badge + Actions (Edit & Delete) */}
                                      <div className="task-card-top-row">
                                        <span
                                          className={`priority-badge priority-${
                                            task.priority || 'medium'
                                          }`}
                                        >
                                          {task.priority
                                            ? task.priority.charAt(0).toUpperCase() +
                                              task.priority.slice(1)
                                            : 'Medium'}
                                        </span>

                                        <div className="card-actions-group">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditTask(task);
                                            }}
                                            className="btn-icon-action"
                                            title="Edit task"
                                          >
                                            <Edit3 size={14} />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteTask(task._id, task.title);
                                            }}
                                            className="btn-icon-danger"
                                            title="Delete task"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Title */}
                                      <h4 className="task-card-title">
                                        {task.title}
                                      </h4>

                                      {/* Description */}
                                      {task.description && (
                                        <p className="task-card-desc">
                                          {task.description}
                                        </p>
                                      )}

                                      {/* Card Footer: Due Date & Overdue Highlight */}
                                      <div className="task-card-footer">
                                        {task.dueDate ? (
                                          <div
                                            className={`due-date-pill ${
                                              overdue ? 'overdue' : ''
                                            }`}
                                          >
                                            {overdue ? (
                                              <AlertTriangle size={12} />
                                            ) : (
                                              <Calendar size={12} />
                                            )}
                                            <span>
                                              {new Date(
                                                task.dueDate
                                              ).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                              })}
                                            </span>
                                            {overdue && (
                                              <span className="overdue-tag">
                                                Overdue
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                            No due date
                                          </span>
                                        )}

                                        <span
                                          className={`task-status-badge ${task.status}`}
                                          style={{ fontSize: '0.7rem' }}
                                        >
                                          {column.title}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </main>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        initialTask={editingTask}
        defaultStatus={modalStatus}
      />
    </div>
  );
};

export default TasksPage;
