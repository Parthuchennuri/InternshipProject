# TaskFlow - Full-Stack MERN Task Management App

A modern, full-stack Task Management application built with the MERN stack (MongoDB, Express, React, Node.js) featuring JWT authentication, a progress dashboard with a Recharts donut chart, dark/light mode toggle, and an interactive Kanban board with drag-and-drop powered by `@hello-pangea/dnd`.

---

## 🚀 Features

- **Authentication & Security**:
  - Secure registration and login with JWT (JSON Web Tokens).
  - Passwords hashed using `bcryptjs`.
  - **Show/Hide password toggle** using Lucide `Eye` and `EyeOff` icons inside password fields.
  - Protected API routes and client route guards (`ProtectedRoute`).
  - Persistent login via `localStorage` with Axios Bearer token interceptor.

- **Dark & Light Mode**:
  - One-click toggle in the navigation bar (Sun / Moon icons).
  - Persists preference in `localStorage` and respects system preferences.
  - Full theme coverage: backgrounds, cards, modals, tables, badges, and scrollbars.

- **Dashboard / Home Page**:
  - **"Welcome, \<name\>"** personalized greeting.
  - **Overall Completion Progress Bar** with animated gradient and progress percentage.
  - **Recharts Donut Chart** showing interactive task breakdown (Pending, In Progress, Completed).
  - Metric stat cards: Total, Completed, In-Progress, and Pending counts.
  - Recent tasks overview with priority badges, overdue highlights, edit, and delete actions.

- **Interactive Kanban Board**:
  - 3 workflow columns: **Pending**, **In Progress**, and **Completed**.
  - **Task count on every column header** (e.g. `Pending (3)`).
  - Drag-and-drop cards between columns using `@hello-pangea/dnd`.
  - Moving a card between columns automatically updates status in MongoDB Atlas.
  - **Search Bar & Priority Filter**: real-time keyword search combined with priority filtering (`All`, `High`, `Medium`, `Low`).

- **Task Details & Deadlines**:
  - **Priority Levels**: Colored badges for `🔴 High`, `🟡 Medium`, and `🟢 Low`.
  - **Due Dates & Overdue Alert**: Tasks past their due date are highlighted with red alerts and glowing red borders.
  - **Edit Task Option**: Click the pencil icon on any task card or table row to edit title, description, status, priority, or due date.

- **Toast Notifications**:
  - Automatic toast feedback for **Add**, **Edit**, **Delete**, and **Move** actions.

---

## 📁 Project Structure

```
task manager/
├── client/                     # Frontend (React + Vite + Recharts + @hello-pangea/dnd)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Top navigation with Dark/Light toggle & user info
│   │   │   ├── ProtectedRoute.jsx # Route guard for authenticated users
│   │   │   └── TaskModal.jsx   # Create & edit task modal (title, desc, status, priority, dueDate)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx # Global auth session & JWT management
│   │   │   ├── ThemeContext.jsx# Dark/light theme switcher & persistence
│   │   │   └── ToastContext.jsx# Toast notification system
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx    # Tabbed Login / Register with show/hide password toggle
│   │   │   ├── HomePage.jsx    # "Welcome, <name>", % progress bar, Recharts Donut chart
│   │   │   └── TasksPage.jsx   # Kanban board, column counts, priority filter, drag-and-drop
│   │   ├── services/
│   │   │   └── api.js          # Axios instance with JWT interceptors
│   │   ├── App.jsx             # React Router route definitions
│   │   ├── index.css           # Modern design system, gradients, dark/light styles
│   │   └── main.jsx            # React root mount wrapped with Theme, Auth, & Toast providers
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend (Node.js + Express + MongoDB Mongoose + JWT)
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── models/
│   │   ├── Task.js             # Mongoose Task schema (title, desc, status, priority, dueDate, user, createdAt)
│   │   └── User.js             # Mongoose User schema (name, email, password, bcrypt)
│   ├── routes/
│   │   ├── authRoutes.js       # Register, Login, & Me endpoints
│   │   └── taskRoutes.js       # Protected CRUD endpoints
│   ├── .env                    # Environment variables (PORT, MONGO_URI, JWT_SECRET)
│   ├── package.json
│   └── server.js               # Express application entrypoint
│
├── package.json                # Root package scripts
├── test-enhanced.js            # Automated full-stack verification script
└── README.md
```

---

## 🏃 Running the Application

### 1. Start the Backend Server
```bash
cd server
npm start
# Or npm run dev for nodemon hot reload
```
Backend runs on **http://localhost:5000**.

### 2. Start the Frontend Client
```bash
cd client
npm run dev
```
Client dev server runs on **http://localhost:5173**.

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer Token) |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Protected |
|---|---|---|---|
| `GET` | `/api/tasks` | Get all tasks belonging to the logged-in user | Yes (Bearer Token) |
| `POST` | `/api/tasks` | Create task (`title`, `description`, `status`, `priority`, `dueDate`) | Yes (Bearer Token) |
| `PUT` | `/api/tasks/:id` | Update task fields or status (`pending`, `in-progress`, `completed`) | Yes (Bearer Token) |
| `DELETE` | `/api/tasks/:id` | Delete task by ID | Yes (Bearer Token) |

---

## 🧪 Testing

To run the automated end-to-end verification test suite:
```bash
node test-enhanced.js
```
This tests registration, login, task creation with priorities & due dates, overdue detection, editing tasks, drag-and-drop status moves, deletion, and client serving.
