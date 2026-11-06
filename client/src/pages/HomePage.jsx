import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  ListTodo,
  Plus,
  ArrowRight,
  Trash2,
  Edit3,
  KanbanSquare,
  Sparkles,
  AlertTriangle,
  Calendar,
  PieChart as PieIcon,
} from 'lucide-react';

const STATUS_COLORS = {
  completed: '#10b981',
  'in-progress': '#3b82f6',
  pending: '#f59e0b',
};

const HomePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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
      // Create new task
      const res = await api.post('/tasks', taskData);
      setTasks((prev) => [res.data, ...prev]);
      toast.success(`Task "${res.data.title}" created successfully!`);
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id, title) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast.info(`Task "${title || 'item'}" deleted.`);
    } catch (err) {
      toast.error('Failed to delete task.');
    }
  };

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;

  const percentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const getProgressMessage = () => {
    if (totalTasks === 0) return 'No tasks yet. Create your first task to get started!';
    if (percentage === 100) return '🎉 Outstanding! All your tasks are completed!';
    if (percentage >= 70) return '⚡ Almost there! Great momentum today.';
    if (percentage >= 30) return '🚀 Keep going! Steady progress underway.';
    return '🌱 Let’s get cracking on your pending tasks.';
  };

  // Recharts Donut data
  const chartData = [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
    { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  const hasChartData = chartData.length > 0;
  const displayChartData = hasChartData
    ? chartData
    : [{ name: 'No Tasks', value: 1, color: '#cbd5e1' }];

  const isTaskOverdue = (task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const dueTime = new Date(task.dueDate).setHours(23, 59, 59, 999);
    return dueTime < Date.now();
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {/* Welcome Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              Welcome, {user?.name || 'User'}! 👋
            </h1>
            <p className="page-subtitle">
              Here is an overview of your productivity, metrics, and progress.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={18} />
              <span>New Task</span>
            </button>
            <Link to="/tasks" className="btn btn-secondary">
              <KanbanSquare size={18} />
              <span>Kanban Board</span>
            </Link>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Top Analytics Row: Progress Card + Recharts Donut Chart */}
        <div className="overview-grid">
          {/* Progress Card */}
          <div className="progress-card">
            <div className="progress-header">
              <div className="progress-title-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={20} color="#a5b4fc" />
                  <h2>Overall Completion</h2>
                </div>
                <p>{getProgressMessage()}</p>
              </div>
              <div className="progress-percent-badge">{percentage}%</div>
            </div>

            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="progress-footer">
              <div className="progress-stat-pill">
                <CheckCircle2 size={16} color="#34d399" />
                <span>
                  <strong>{completedTasks}</strong> Completed
                </span>
              </div>
              <div className="progress-stat-pill">
                <Clock size={16} color="#fbbf24" />
                <span>
                  <strong>{pendingTasks}</strong> Pending
                </span>
              </div>
              <div className="progress-stat-pill">
                <PlayCircle size={16} color="#60a5fa" />
                <span>
                  <strong>{inProgressTasks}</strong> In Progress
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Donut Chart Card */}
          <div className="donut-chart-card">
            <div className="chart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieIcon size={18} className="chart-icon" />
                <h3>Task Distribution</h3>
              </div>
              <span className="chart-subtitle">
                {totalTasks} total {totalTasks === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            <div className="donut-chart-container">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="custom-chart-tooltip">
                            <span
                              className="tooltip-dot"
                              style={{ backgroundColor: data.payload.color }}
                            />
                            <span className="tooltip-name">{data.name}:</span>
                            <span className="tooltip-value">
                              {hasChartData ? data.value : 0}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={displayChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={hasChartData ? 4 : 0}
                    dataKey="value"
                    stroke="none"
                  >
                    {displayChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="chart-legend-label">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="stats-grid">
          <div className="stat-card completed">
            <div className="stat-icon-wrapper">
              <CheckCircle2 size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{completedTasks}</span>
              <span className="stat-label">Completed Tasks</span>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon-wrapper">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{pendingTasks}</span>
              <span className="stat-label">Pending Tasks</span>
            </div>
          </div>

          <div className="stat-card in-progress">
            <div className="stat-icon-wrapper">
              <PlayCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{inProgressTasks}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>

          <div className="stat-card total">
            <div className="stat-icon-wrapper">
              <ListTodo size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{totalTasks}</span>
              <span className="stat-label">Total Assigned</span>
            </div>
          </div>
        </div>

        {/* Recent Tasks List */}
        <div className="recent-tasks-card">
          <div className="recent-tasks-header">
            <h3>Recent Tasks</h3>
            <Link to="/tasks" className="btn btn-secondary btn-sm">
              <span>View Full Board</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-column-placeholder" style={{ padding: '3rem 1rem' }}>
              <ListTodo size={36} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                No tasks found
              </p>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Get started by creating your very first task.
              </p>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                <span>Create Task</span>
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="task-list-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 6).map((task) => {
                    const overdue = isTaskOverdue(task);
                    return (
                      <tr
                        key={task._id}
                        className={overdue ? 'table-row-overdue' : ''}
                      >
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {overdue && (
                              <span
                                title="Overdue task!"
                                style={{ display: 'inline-flex', color: 'var(--danger-color)' }}
                              >
                                <AlertTriangle size={15} />
                              </span>
                            )}
                            <span>{task.title}</span>
                          </div>
                          {task.description && (
                            <div
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 400,
                                color: 'var(--text-muted)',
                                marginTop: '0.2rem',
                              }}
                            >
                              {task.description.length > 70
                                ? task.description.slice(0, 70) + '...'
                                : task.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`task-status-badge ${task.status}`}>
                            {task.status === 'completed'
                              ? 'Completed'
                              : task.status === 'in-progress'
                              ? 'In Progress'
                              : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`priority-badge priority-${task.priority || 'medium'}`}>
                            {task.priority
                              ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
                              : 'Medium'}
                          </span>
                        </td>
                        <td>
                          {task.dueDate ? (
                            <span
                              className={`due-date-pill ${overdue ? 'overdue' : ''}`}
                            >
                              <Calendar size={13} />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              {overdue && <span className="overdue-tag">Overdue</span>}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                              No due date
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <button
                              onClick={() => handleEditClick(task)}
                              className="btn-icon-action"
                              title="Edit task"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task._id, task.title)}
                              className="btn-icon-danger"
                              title="Delete task"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
        defaultStatus="pending"
      />
    </div>
  );
};

export default HomePage;
