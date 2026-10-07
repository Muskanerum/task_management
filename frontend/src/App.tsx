import { useEffect, useMemo, useState } from "react";
import "./App.css";

interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  project: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

type Page =
  | "dashboard"
  | "tasks"
  | "projects"
  | "calendar"
  | "reports"
  | "settings";

type NoticeType = "success" | "error";

interface Notice {
  type: NoticeType;
  message: string;
}

function App() {
  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api/tasks/";

  const [page, setPage] = useState<Page>("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] =
    useState<Task["priority"]>("medium");
  const [project, setProject] = useState("General");
  const [dueDate, setDueDate] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [search, setSearch] = useState("");
  const [showAllTasks, setShowAllTasks] = useState(false);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [calendarDate, setCalendarDate] = useState(new Date());

  // =========================
  // NOTICE
  // =========================

  const showNotice = (
    type: NoticeType,
    message: string
  ) => {
    setNotice({ type, message });

    window.setTimeout(() => {
      setNotice(null);
    }, 3500);
  };

  // =========================
  // FETCH TASKS
  // =========================

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to fetch tasks");
      }

      const data = await response.json();

      const taskList = Array.isArray(data)
        ? data
        : data.results;

      setTasks(
        Array.isArray(taskList)
          ? taskList
          : []
      );
    } catch (error) {
      console.error("Fetch error:", error);

      showNotice(
        "error",
        "Unable to load tasks. Please check the API connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setProject("General");
    setDueDate("");
    setEditingId(null);
  };

  // =========================
  // CREATE FORM
  // =========================

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  // =========================
  // EDIT
  // =========================

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setProject(task.project || "General");
    setDueDate(task.due_date || "");

    setViewingTask(null);
    setShowForm(true);
  };

  // =========================
  // CREATE / UPDATE
  // =========================

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!title.trim()) {
      showNotice(
        "error",
        "Please enter a task title."
      );
      return;
    }

    const currentEditingId = editingId;
    const isEditing =
      currentEditingId !== null;

    try {
      setSaving(true);

      const url = isEditing
        ? `${API_URL}${currentEditingId}/`
        : API_URL;

      const method = isEditing
        ? "PATCH"
        : "POST";

      const body = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        project:
          project.trim() || "General",
        due_date: dueDate || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "API ERROR:",
          data
        );

        throw new Error(
          "Request failed"
        );
      }

      showNotice(
        "success",
        isEditing
          ? "Task updated successfully."
          : "Task created successfully."
      );

      resetForm();
      setShowForm(false);

      await fetchTasks();

      setPage("tasks");
      setShowAllTasks(true);
    } catch (error) {
      console.error(
        "Save error:",
        error
      );

      showNotice(
        "error",
        isEditing
          ? "Unable to update task."
          : "Unable to create task."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this task?"
      );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}${id}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Delete failed"
        );
      }

      setViewingTask(null);

      showNotice(
        "success",
        "Task deleted successfully."
      );

      await fetchTasks();
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      showNotice(
        "error",
        "Unable to delete task."
      );
    }
  };

  // =========================
  // STATUS CHANGE
  // =========================

  const handleStatusChange = async (
    task: Task,
    newStatus: Task["status"]
  ) => {
    try {
      const response = await fetch(
        `${API_URL}${task.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Status update failed"
        );
      }

      await fetchTasks();

      showNotice(
        "success",
        "Task status updated."
      );
    } catch (error) {
      console.error(
        "Status error:",
        error
      );

      showNotice(
        "error",
        "Unable to update task status."
      );
    }
  };

  // =========================
  // NAVIGATION
  // =========================

  const handleNavigation = (
    newPage: Page
  ) => {
    setPage(newPage);
    setViewingTask(null);
    setShowForm(false);
    setShowAllTasks(false);

    if (newPage !== "tasks") {
      setSearch("");
    }
  };

  // =========================
  // SEARCH
  // =========================

  const filteredTasks = useMemo(() => {
    const query =
      search.toLowerCase().trim();

    if (!query) return tasks;

    return tasks.filter((task) => {
      return (
        task.title
          .toLowerCase()
          .includes(query) ||
        task.description
          .toLowerCase()
          .includes(query) ||
        task.project
          .toLowerCase()
          .includes(query) ||
        task.priority
          .toLowerCase()
          .includes(query) ||
        task.status
          .toLowerCase()
          .includes(query)
      );
    });
  }, [tasks, search]);

  // =========================
  // STATISTICS
  // =========================

  const totalTasks = tasks.length;

  const completedTasks =
    tasks.filter(
      (task) =>
        task.status === "completed"
    ).length;

  const inProgressTasks =
    tasks.filter(
      (task) =>
        task.status === "in_progress"
    ).length;

  const todoTasks =
    tasks.filter(
      (task) =>
        task.status === "todo"
    ).length;

  const highPriorityTasks =
    tasks.filter(
      (task) =>
        task.priority === "high"
    ).length;

  const mediumPriorityTasks =
    tasks.filter(
      (task) =>
        task.priority === "medium"
    ).length;

  const lowPriorityTasks =
    tasks.filter(
      (task) =>
        task.priority === "low"
    ).length;

  const progress =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks /
            totalTasks) *
            100
        );

  // =========================
  // TODAY / OVERDUE
  // =========================

  const today = new Date();

  const todayStart = new Date();
  todayStart.setHours(
    0,
    0,
    0,
    0
  );

  const overdueTasks =
    tasks.filter((task) => {
      if (!task.due_date)
        return false;

      const due = new Date(
        `${task.due_date}T00:00:00`
      );

      return (
        due < todayStart &&
        task.status !==
          "completed"
      );
    });

  // =========================
  // PROJECTS
  // =========================

  const projects = useMemo(() => {
    const projectMap: Record<
      string,
      Task[]
    > = {};

    tasks.forEach((task) => {
      const name =
        task.project?.trim() ||
        "General";

      if (!projectMap[name]) {
        projectMap[name] = [];
      }

      projectMap[name].push(task);
    });

    return Object.entries(
      projectMap
    ).map(
      ([name, projectTasks]) => {
        const completed =
          projectTasks.filter(
            (task) =>
              task.status ===
              "completed"
          ).length;

        const percentage =
          projectTasks.length === 0
            ? 0
            : Math.round(
                (completed /
                  projectTasks.length) *
                  100
              );

        return {
          name,
          tasks: projectTasks,
          total:
            projectTasks.length,
          completed,
          percentage,
        };
      }
    );
  }, [tasks]);

  // =========================
  // CALENDAR
  // =========================

  const calendarYear =
    calendarDate.getFullYear();

  const calendarMonth =
    calendarDate.getMonth();

  const monthName =
    calendarDate.toLocaleString(
      "default",
      {
        month: "long",
      }
    );

  const firstDay = new Date(
    calendarYear,
    calendarMonth,
    1
  ).getDay();

  const daysInMonth = new Date(
    calendarYear,
    calendarMonth + 1,
    0
  ).getDate();

  const calendarDays = Array.from(
    {
      length:
        firstDay +
        daysInMonth,
    },
    (_, index) => {
      if (index < firstDay)
        return null;

      return (
        index -
        firstDay +
        1
      );
    }
  );

  const getTasksForDay = (
    day: number
  ) => {
    const dateString =
      `${calendarYear}-${String(
        calendarMonth + 1
      ).padStart(
        2,
        "0"
      )}-${String(day).padStart(
        2,
        "0"
      )}`;

    return tasks.filter(
      (task) =>
        task.due_date ===
        dateString
    );
  };

  const changeMonth = (
    direction: number
  ) => {
    setCalendarDate(
      new Date(
        calendarYear,
        calendarMonth +
          direction,
        1
      )
    );
  };

  // =========================
  // SORT TASKS
  // =========================

  const sortedTasks = useMemo(() => {
    return [
      ...filteredTasks,
    ].sort(
      (a, b) =>
        new Date(
          b.created_at
        ).getTime() -
        new Date(
          a.created_at
        ).getTime()
    );
  }, [filteredTasks]);

  const displayedTasks =
    showAllTasks || search
      ? sortedTasks
      : sortedTasks.slice(0, 5);

  // =========================
  // DATE
  // =========================

  const formatDate = (
    date: string | null
  ) => {
    if (!date)
      return "No due date";

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (
    date: string
  ) => {
    if (!date) return "—";

    return new Date(
      date
    ).toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // =========================
  // STATUS LABEL
  // =========================

  const statusLabel = (
    value: Task["status"]
  ) => {
    if (
      value ===
      "in_progress"
    ) {
      return "In Progress";
    }

    if (
      value ===
      "completed"
    ) {
      return "Completed";
    }

    return "To Do";
  };

  // =========================
  // TASK CARD
  // =========================

  const renderTaskCard = (
    task: Task
  ) => {
    return (
      <article
        className={`task-card ${
          task.status ===
          "completed"
            ? "task-completed"
            : ""
        }`}
        key={task.id}
      >
        <div className="task-check-area">
          <button
            className={`task-check ${
              task.status ===
              "completed"
                ? "checked"
                : ""
            }`}
            onClick={() =>
              handleStatusChange(
                task,
                task.status ===
                  "completed"
                  ? "in_progress"
                  : "completed"
              )
            }
            title="Change task status"
          >
            {task.status ===
            "completed"
              ? "✓"
              : ""}
          </button>
        </div>

        <div className="task-main">
          <div className="task-title-row">
            <h3>
              {task.title}
            </h3>

            <span
              className={`status-badge status-${task.status}`}
            >
              {statusLabel(
                task.status
              )}
            </span>
          </div>

          <p className="task-description">
            {task.description ||
              "No description provided."}
          </p>

          <div className="task-meta">
            <span>
              <strong>
                Project:
              </strong>{" "}
              {task.project ||
                "General"}
            </span>

            <span
              className={`priority priority-${task.priority}`}
            >
              {task.priority}
            </span>

            {task.due_date && (
              <span>
                Due{" "}
                {formatDate(
                  task.due_date
                )}
              </span>
            )}
          </div>
        </div>

        <div className="task-actions">
          <button
            onClick={() =>
              setViewingTask(
                task
              )
            }
          >
            View
          </button>

          <button
            onClick={() =>
              handleEdit(task)
            }
          >
            Edit
          </button>

          <button
            className="delete-action"
            onClick={() =>
              handleDelete(
                task.id
              )
            }
          >
            Delete
          </button>
        </div>
      </article>
    );
  };

  // =========================
  // PAGE INFO
  // =========================

  const pageTitles: Record<
    Page,
    string
  > = {
    dashboard: "Dashboard",
    tasks: "My Tasks",
    projects: "Projects",
    calendar: "Calendar",
    reports: "Reports",
    settings: "Settings",
  };

  const pageDescriptions: Record<
    Page,
    string
  > = {
    dashboard:
      "Overview of your workspace and task progress.",
    tasks:
      "Create, organize and manage your tasks.",
    projects:
      "Track work across your different projects.",
    calendar:
      "Manage tasks according to their due dates.",
    reports:
      "Understand your productivity and task performance.",
    settings:
      "Manage your workspace and application preferences.",
  };

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-logo">
            T
          </div>

          <div>
            <h2>TaskFlow</h2>
            <span>
              Workspace
            </span>
          </div>
        </div>

        <div className="workspace-box">
          <div className="workspace-avatar">
            W
          </div>

          <div className="workspace-details">
            <span>
              WORKSPACE
            </span>

            <strong>
              My Workspace
            </strong>

            <small>
              Personal
            </small>
          </div>

          <span className="workspace-arrow">
            ›
          </span>
        </div>

        <nav className="sidebar-nav">

          <span className="nav-heading">
            MAIN
          </span>

          <button
            className={`nav-item ${
              page === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation(
                "dashboard"
              )
            }
          >
            <span className="nav-icon">
              ▦
            </span>

            <span>
              Dashboard
            </span>
          </button>

          <button
            className={`nav-item ${
              page === "tasks"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation(
                "tasks"
              )
            }
          >
            <span className="nav-icon">
              ✓
            </span>

            <span>
              My Tasks
            </span>

            <span className="nav-count">
              {totalTasks}
            </span>
          </button>

          <button
            className={`nav-item ${
              page === "projects"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation(
                "projects"
              )
            }
          >
            <span className="nav-icon">
              ◫
            </span>

            <span>
              Projects
            </span>

            <span className="nav-count">
              {projects.length}
            </span>
          </button>

          <span className="nav-heading workspace-heading">
            WORKSPACE
          </span>

          <button
            className={`nav-item ${
              page === "calendar"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation(
                "calendar"
              )
            }
          >
            <span className="nav-icon">
              □
            </span>

            <span>
              Calendar
            </span>
          </button>

          <button
            className={`nav-item ${
              page === "reports"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation(
                "reports"
              )
            }
          >
            <span className="nav-icon">
              ▥
            </span>

            <span>
              Reports
            </span>
          </button>

          <button
            className={`nav-item ${
              page === "settings"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation(
                "settings"
              )
            }
          >
            <span className="nav-icon">
              ⚙
            </span>

            <span>
              Settings
            </span>
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-tip">

            <div className="tip-symbol">
              ✦
            </div>

            <div>
              <strong>
                Stay productive
              </strong>

              <p>
                Keep your tasks organized
                and up to date.
              </p>
            </div>

          </div>

          <div className="sidebar-user">

            <div className="user-avatar">
              U
            </div>

            <div className="user-details">
              <strong>
                Workspace User
              </strong>

              <span>
                Personal workspace
              </span>
            </div>

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main-content">

        {/* TOPBAR */}

        <header className="topbar">

          <div className="topbar-title">

            <span className="breadcrumb">
              TASKFLOW /{" "}
              {pageTitles[
                page
              ].toUpperCase()}
            </span>

            <h1>
              {pageTitles[page]}
            </h1>

            <p>
              {pageDescriptions[page]}
            </p>

          </div>

          <div className="topbar-right">

            <div className="search-box">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  setSearch(value);

                  if (
                    value.trim()
                  ) {
                    setPage(
                      "tasks"
                    );

                    setShowAllTasks(
                      true
                    );
                  }
                }}
              />

              {search && (
                <button
                  className="search-clear"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}

            </div>

            <button
              className="notification-button"
              title="Notifications"
            >
              ♢
            </button>

            <button
              className="primary-button"
              onClick={
                openCreateForm
              }
            >
              + Create Task
            </button>

          </div>

        </header>

        {/* DASHBOARD */}

        {page ===
          "dashboard" && (
          <section className="dashboard">

            <section className="hero">

              <div className="hero-left">

                <span className="hero-label">
                  YOUR WORKSPACE
                </span>

                <h2>
                  Stay organized.
                  <br />
                  Get things done.
                </h2>

                <p>
                  Manage your tasks,
                  monitor your progress
                  and keep your work
                  moving forward.
                </p>

                <div className="hero-actions">

                  <button
                    className="primary-hero-button"
                    onClick={
                      openCreateForm
                    }
                  >
                    + Create New Task
                  </button>

                  <button
                    className="hero-task-count"
                    onClick={() =>
                      handleNavigation(
                        "tasks"
                      )
                    }
                  >
                    View {totalTasks}{" "}
                    tasks →
                  </button>

                </div>

              </div>

              <div className="hero-right">

                <div className="hero-progress-card">

                  <div className="hero-progress-top">
                    <span>
                      Overall Progress
                    </span>

                    <span className="progress-dot">
                      ●
                    </span>
                  </div>

                  <strong className="hero-progress-number">
                    {progress}%
                  </strong>

                  <div className="hero-progress-track">
                    <span
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="hero-progress-bottom">
                    <span>
                      {completedTasks}{" "}
                      completed
                    </span>

                    <span>
                      {totalTasks} total
                    </span>
                  </div>

                </div>

              </div>

            </section>

            {/* STATS */}

            <section className="stats-grid">

              <div className="stat-card">

                <div className="stat-card-top">

                  <span className="stat-icon navy-icon">
                    ▣
                  </span>

                  <span className="neutral-indicator">
                    All
                  </span>

                </div>

                <span className="stat-number">
                  {totalTasks}
                </span>

                <div className="stat-footer">
                  Total Tasks
                </div>

              </div>

              <div className="stat-card">

                <div className="stat-card-top">

                  <span className="stat-icon green-icon">
                    ✓
                  </span>

                  <span className="green-indicator">
                    {progress}%
                  </span>

                </div>

                <span className="stat-number">
                  {completedTasks}
                </span>

                <div className="stat-footer">
                  Completed
                </div>

              </div>

              <div className="stat-card">

                <div className="stat-card-top">

                  <span className="stat-icon amber-icon">
                    ◷
                  </span>

                  <span className="amber-indicator">
                    Active
                  </span>

                </div>

                <span className="stat-number">
                  {inProgressTasks}
                </span>

                <div className="stat-footer">
                  In Progress
                </div>

              </div>

              <div className="stat-card">

                <div className="stat-card-top">

                  <span className="stat-icon purple-icon">
                    !
                  </span>

                  <span className="purple-indicator">
                    Priority
                  </span>

                </div>

                <span className="stat-number">
                  {highPriorityTasks}
                </span>

                <div className="stat-footer">
                  High Priority
                </div>

              </div>

            </section>

            {/* MAIN GRID */}

            <section className="main-grid">

              <div className="tasks-card">

                <div className="card-header">

                  <div>

                    <span className="card-overline">
                      WORKSPACE
                    </span>

                    <h2>
                      Recent Tasks
                    </h2>

                    <p>
                      Your latest work
                      and current progress.
                    </p>

                  </div>

                  <button
                    className="view-all-button"
                    onClick={() => {
                      setPage(
                        "tasks"
                      );

                      setShowAllTasks(
                        true
                      );
                    }}
                  >
                    View all →
                  </button>

                </div>

                {loading ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <p>
                      Loading your
                      tasks...
                    </p>
                  </div>
                ) : tasks.length ===
                  0 ? (
                  <div className="empty-state">

                    <div className="empty-symbol">
                      ✓
                    </div>

                    <h3>
                      No tasks yet
                    </h3>

                    <p>
                      Create your first
                      task to get started.
                    </p>

                    <button
                      className="primary-button"
                      onClick={
                        openCreateForm
                      }
                    >
                      + Create Task
                    </button>

                  </div>
                ) : (
                  <div className="task-list">
                    {sortedTasks
                      .slice(0, 5)
                      .map(
                        renderTaskCard
                      )}
                  </div>
                )}

              </div>

              <div className="right-column">

                <div className="progress-card">

                  <div className="card-header compact">

                    <div>

                      <span className="card-overline">
                        PROGRESS
                      </span>

                      <h2>
                        Completion
                      </h2>

                    </div>

                  </div>

                  <div
                    className="large-progress-circle"
                    style={{
                      background: `conic-gradient(#2f80ed ${progress * 3.6}deg, #e7edf2 0deg)`,
                    }}
                  >
                    <div className="circle-inner">

                      <strong>
                        {progress}%
                      </strong>

                      <span>
                        Complete
                      </span>

                    </div>
                  </div>

                  <div className="progress-details">

                    <div>
                      <span className="green-dot" />
                      <span>
                        Completed
                      </span>
                      <strong>
                        {completedTasks}
                      </strong>
                    </div>

                    <div>
                      <span className="amber-dot" />
                      <span>
                        In Progress
                      </span>
                      <strong>
                        {inProgressTasks}
                      </strong>
                    </div>

                    <div>
                      <span className="neutral-dot" />
                      <span>
                        To Do
                      </span>
                      <strong>
                        {todoTasks}
                      </strong>
                    </div>

                  </div>

                </div>

              </div>

            </section>

          </section>
        )}

        {/* TASKS */}

        {page === "tasks" && (
          <section className="page-section">

            <div className="page-section-header">

              <div>

                <span className="card-overline">
                  TASK MANAGEMENT
                </span>

                <h2>
                  {showAllTasks
                    ? "All Tasks"
                    : "Recent Tasks"}
                </h2>

                <p>
                  {filteredTasks.length}{" "}
                  task
                  {filteredTasks.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  found.
                </p>

              </div>

              <div className="header-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowAllTasks(
                      !showAllTasks
                    )
                  }
                >
                  {showAllTasks
                    ? "Show Recent"
                    : "View All"}
                </button>

                <button
                  className="primary-button"
                  onClick={
                    openCreateForm
                  }
                >
                  + Create Task
                </button>

              </div>

            </div>

            {search && (
              <div className="search-result">
                Search results for{" "}
                <strong>
                  "{search}"
                </strong>
              </div>
            )}

            {loading ? (
              <div className="loading-state large">
                <div className="spinner" />
                <p>
                  Loading tasks...
                </p>
              </div>
            ) : displayedTasks.length ===
              0 ? (
              <div className="empty-state large">

                <div className="empty-symbol">
                  ✓
                </div>

                <h3>
                  {search
                    ? "No tasks found"
                    : "No tasks available"}
                </h3>

                <p>
                  {search
                    ? "Try another search term."
                    : "Create a task to get started."}
                </p>

                {!search && (
                  <button
                    className="primary-button"
                    onClick={
                      openCreateForm
                    }
                  >
                    + Create Task
                  </button>
                )}

              </div>
            ) : (
              <div className="tasks-page-list">
                {displayedTasks.map(
                  renderTaskCard
                )}
              </div>
            )}

          </section>
        )}

        {/* PROJECTS */}

        {page ===
          "projects" && (
          <section className="page-section">

            <div className="page-section-header">

              <div>

                <span className="card-overline">
                  WORKSPACE
                </span>

                <h2>
                  Projects
                </h2>

                <p>
                  Projects are grouped
                  automatically from
                  your tasks.
                </p>

              </div>

              <button
                className="primary-button"
                onClick={
                  openCreateForm
                }
              >
                + Add Task
              </button>

            </div>

            {projects.length ===
            0 ? (
              <div className="empty-state large">

                <div className="empty-symbol">
                  ◫
                </div>

                <h3>
                  No projects yet
                </h3>

                <p>
                  Add a task and assign
                  it to a project.
                </p>

                <button
                  className="primary-button"
                  onClick={
                    openCreateForm
                  }
                >
                  + Create Task
                </button>

              </div>
            ) : (
              <div className="projects-grid">

                {projects.map(
                  (item) => (
                    <div
                      className="project-card"
                      key={
                        item.name
                      }
                    >

                      <div className="project-card-top">

                        <div className="project-icon">
                          ◫
                        </div>

                        <span>
                          {
                            item.percentage
                          }%
                        </span>

                      </div>

                      <h3>
                        {item.name}
                      </h3>

                      <p>
                        {item.total}{" "}
                        task
                        {item.total !==
                        1
                          ? "s"
                          : ""}{" "}
                        ·{" "}
                        {
                          item.completed
                        }{" "}
                        completed
                      </p>

                      <div className="project-progress">
                        <span
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        />
                      </div>

                      <button
                        className="project-link"
                        onClick={() => {
                          setSearch(
                            item.name
                          );
                          setPage(
                            "tasks"
                          );
                          setShowAllTasks(
                            true
                          );
                        }}
                      >
                        View project
                        tasks →
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* CALENDAR */}

        {page ===
          "calendar" && (
          <section className="page-section">

            <div className="page-section-header">

              <div>

                <span className="card-overline">
                  SCHEDULE
                </span>

                <h2>
                  Calendar
                </h2>

                <p>
                  Tasks are displayed
                  according to their
                  database due dates.
                </p>

              </div>

              <button
                className="primary-button"
                onClick={
                  openCreateForm
                }
              >
                + Schedule Task
              </button>

            </div>

            <div className="calendar-card">

              <div className="calendar-header">

                <div>

                  <h3>
                    {monthName}{" "}
                    {calendarYear}
                  </h3>

                  <span>
                    {
                      tasks.filter(
                        (task) =>
                          task.due_date
                      ).length
                    }{" "}
                    scheduled task
                    {tasks.filter(
                      (task) =>
                        task.due_date
                    ).length !==
                    1
                      ? "s"
                      : ""}
                  </span>

                </div>

                <div className="calendar-controls">

                  <button
                    onClick={() =>
                      changeMonth(
                        -1
                      )
                    }
                  >
                    ‹
                  </button>

                  <button
                    onClick={() =>
                      setCalendarDate(
                        new Date()
                      )
                    }
                  >
                    Today
                  </button>

                  <button
                    onClick={() =>
                      changeMonth(
                        1
                      )
                    }
                  >
                    ›
                  </button>

                </div>

              </div>

              <div className="calendar-weekdays">

                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map(
                  (day) => (
                    <span
                      key={day}
                    >
                      {day}
                    </span>
                  )
                )}

              </div>

              <div className="calendar-grid">

                {calendarDays.map(
                  (
                    day,
                    index
                  ) => {

                    if (!day) {
                      return (
                        <div
                          className="calendar-day empty"
                          key={`empty-${index}`}
                        />
                      );
                    }

                    const dayTasks =
                      getTasksForDay(
                        day
                      );

                    const isToday =
                      day ===
                        today.getDate() &&
                      calendarMonth ===
                        today.getMonth() &&
                      calendarYear ===
                        today.getFullYear();

                    return (
                      <div
                        className={`calendar-day ${
                          isToday
                            ? "today"
                            : ""
                        }`}
                        key={day}
                      >

                        <span className="calendar-date">
                          {day}
                        </span>

                        <div className="calendar-tasks">

                          {dayTasks
                            .slice(
                              0,
                              3
                            )
                            .map(
                              (
                                task
                              ) => (
                                <button
                                  key={
                                    task.id
                                  }
                                  className={`calendar-task ${task.priority}`}
                                  onClick={() =>
                                    setViewingTask(
                                      task
                                    )
                                  }
                                >
                                  {
                                    task.title
                                  }
                                </button>
                              )
                            )}

                          {dayTasks.length >
                            3 && (
                            <span className="more-tasks">
                              +
                              {dayTasks.length -
                                3}{" "}
                              more
                            </span>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              {tasks.filter(
                (task) =>
                  task.due_date
              ).length ===
                0 && (
                <div className="calendar-empty">

                  <div>□</div>

                  <h3>
                    No scheduled
                    tasks
                  </h3>

                  <p>
                    Add a due date
                    when creating a
                    task and it will
                    appear here.
                  </p>

                  <button
                    className="primary-button"
                    onClick={
                      openCreateForm
                    }
                  >
                    Schedule a Task
                  </button>

                </div>
              )}

            </div>

          </section>
        )}

        {/* REPORTS */}

        {page ===
          "reports" && (
          <section className="page-section">

            <div className="page-section-header">

              <div>

                <span className="card-overline">
                  ANALYTICS
                </span>

                <h2>
                  Reports
                </h2>

                <p>
                  Live statistics
                  calculated from your
                  task database.
                </p>

              </div>

            </div>

            <div className="report-stats">

              <div className="report-stat">
                <span>
                  Total Tasks
                </span>

                <strong>
                  {totalTasks}
                </strong>
              </div>

              <div className="report-stat">
                <span>
                  Completed
                </span>

                <strong>
                  {completedTasks}
                </strong>
              </div>

              <div className="report-stat">
                <span>
                  In Progress
                </span>

                <strong>
                  {inProgressTasks}
                </strong>
              </div>

              <div className="report-stat">
                <span>
                  Overdue
                </span>

                <strong>
                  {
                    overdueTasks.length
                  }
                </strong>
              </div>

            </div>

            <div className="reports-grid">

              <div className="report-card">

                <div className="card-header compact">

                  <div>

                    <span className="card-overline">
                      STATUS
                    </span>

                    <h2>
                      Task Breakdown
                    </h2>

                  </div>

                </div>

                <div className="report-list">

                  <div className="report-row">

                    <div>
                      <span className="report-dot todo-dot" />
                      To Do
                    </div>

                    <strong>
                      {todoTasks}
                    </strong>

                  </div>

                  <div className="report-row">

                    <div>
                      <span className="report-dot progress-dot-report" />
                      In Progress
                    </div>

                    <strong>
                      {
                        inProgressTasks
                      }
                    </strong>

                  </div>

                  <div className="report-row">

                    <div>
                      <span className="report-dot completed-dot" />
                      Completed
                    </div>

                    <strong>
                      {
                        completedTasks
                      }
                    </strong>

                  </div>

                </div>

              </div>

              <div className="report-card">

                <div className="card-header compact">

                  <div>

                    <span className="card-overline">
                      PRIORITY
                    </span>

                    <h2>
                      Priority Breakdown
                    </h2>

                  </div>

                </div>

                <div className="priority-bars">

                  {[
                    {
                      name: "High",
                      value:
                        highPriorityTasks,
                    },
                    {
                      name: "Medium",
                      value:
                        mediumPriorityTasks,
                    },
                    {
                      name: "Low",
                      value:
                        lowPriorityTasks,
                    },
                  ].map(
                    (item) => {

                      const percentage =
                        totalTasks ===
                        0
                          ? 0
                          : Math.round(
                              (item.value /
                                totalTasks) *
                                100
                            );

                      return (
                        <div
                          className="priority-bar-row"
                          key={
                            item.name
                          }
                        >

                          <div>

                            <span>
                              {
                                item.name
                              }
                            </span>

                            <strong>
                              {
                                item.value
                              }
                            </strong>

                          </div>

                          <div className="priority-track">

                            <span
                              style={{
                                width: `${percentage}%`,
                              }}
                            />

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </div>

            <div className="report-highlight">

              <div className="highlight-icon">
                %
              </div>

              <div>

                <span>
                  COMPLETION RATE
                </span>

                <strong>
                  {progress}%
                </strong>

                <p>
                  {completedTasks}{" "}
                  out of{" "}
                  {totalTasks}{" "}
                  tasks have been
                  completed.
                </p>

              </div>

            </div>

          </section>
        )}

        {/* SETTINGS */}

        {page ===
          "settings" && (
          <section className="page-section">

            <div className="page-section-header">

              <div>

                <span className="card-overline">
                  PREFERENCES
                </span>

                <h2>
                  Settings
                </h2>

                <p>
                  Workspace and
                  application information.
                </p>

              </div>

            </div>

            <div className="settings-layout">

              <div className="settings-card">

                <div className="settings-card-header">

                  <div className="settings-icon">
                    W
                  </div>

                  <div>

                    <span>
                      WORKSPACE
                    </span>

                    <h3>
                      Workspace Settings
                    </h3>

                  </div>

                </div>

                <div className="setting-row">

                  <div>

                    <strong>
                      Workspace Name
                    </strong>

                    <span>
                      My Workspace
                    </span>

                  </div>

                  <span className="setting-value">
                    Personal
                  </span>

                </div>

                <div className="setting-row">

                  <div>

                    <strong>
                      Total Tasks
                    </strong>

                    <span>
                      Tasks currently
                      stored in your
                      workspace
                    </span>

                  </div>

                  <span className="setting-value">
                    {totalTasks}
                  </span>

                </div>

                <div className="setting-row">

                  <div>

                    <strong>
                      Projects
                    </strong>

                    <span>
                      Projects created
                      from your task
                      data
                    </span>

                  </div>

                  <span className="setting-value">
                    {
                      projects.length
                    }
                  </span>

                </div>

              </div>

              <div className="settings-card">

                <div className="settings-card-header">

                  <div className="settings-icon">
                    ◉
                  </div>

                  <div>

                    <span>
                      SYSTEM
                    </span>

                    <h3>
                      Application Status
                    </h3>

                  </div>

                </div>

                <div className="setting-row">

                  <div>

                    <strong>
                      API Connection
                    </strong>

                    <span>
                      Django REST
                      Framework
                    </span>

                  </div>

                  <span className="connection-status">
                    ● Connected
                  </span>

                </div>

                <div className="setting-row">

                  <div>

                    <strong>
                      Database
                    </strong>

                    <span>
                      PostgreSQL
                    </span>

                  </div>

                  <span className="connection-status">
                    ● Active
                  </span>

                </div>

                <div className="setting-row">

                  <div>

                    <strong>
                      Frontend
                    </strong>

                    <span>
                      React +
                      TypeScript
                    </span>

                  </div>

                  <span className="setting-value">
                    TaskFlow
                  </span>

                </div>

              </div>

            </div>

            <div className="settings-note">

              <span>✦</span>

              <div>

                <strong>
                  TaskFlow Workspace
                </strong>

                <p>
                  Your tasks and
                  workspace data are
                  managed through the
                  connected Django REST
                  API and PostgreSQL
                  database.
                </p>

              </div>

            </div>

          </section>
        )}

        {/* CREATE / EDIT MODAL */}

        {showForm && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowForm(
                false
              );
              resetForm();
            }}
          >

            <div
              className="task-form-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <span className="card-overline">
                    {editingId !==
                    null
                      ? "UPDATE TASK"
                      : "NEW TASK"}
                  </span>

                  <h2>
                    {editingId !==
                    null
                      ? "Edit Task"
                      : "Create a New Task"}
                  </h2>

                </div>

                <button
                  className="modal-close"
                  onClick={() => {
                    setShowForm(
                      false
                    );
                    resetForm();
                  }}
                >
                  ×
                </button>

              </div>

              <form
                className="task-form"
                onSubmit={
                  handleSubmit
                }
              >

                <div className="form-group">

                  <label>
                    Task Title
                  </label>

                  <input
                    type="text"
                    placeholder="Enter task title..."
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    rows={4}
                    placeholder="Describe what needs to be done..."
                    value={
                      description
                    }
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Status
                    </label>

                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(
                          e.target
                            .value as Task["status"]
                        )
                      }
                    >

                      <option value="todo">
                        To Do
                      </option>

                      <option value="in_progress">
                        In Progress
                      </option>

                      <option value="completed">
                        Completed
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Priority
                    </label>

                    <select
                      value={
                        priority
                      }
                      onChange={(e) =>
                        setPriority(
                          e.target
                            .value as Task["priority"]
                        )
                      }
                    >

                      <option value="low">
                        Low
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="high">
                        High
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Project
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. Website Redesign"
                      value={
                        project
                      }
                      onChange={(e) =>
                        setProject(
                          e.target.value
                        )
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Due Date
                    </label>

                    <input
                      type="date"
                      value={
                        dueDate
                      }
                      onChange={(e) =>
                        setDueDate(
                          e.target.value
                        )
                      }
                    />

                    <small className="date-help">
                      Select a deadline
                      for this task.
                    </small>

                  </div>

                </div>

                <div className="form-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowForm(
                        false
                      );
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Saving..."
                      : editingId !==
                        null
                      ? "Update Task"
                      : "Create Task"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* VIEW TASK */}

        {viewingTask && (
          <div
            className="modal-overlay"
            onClick={() =>
              setViewingTask(
                null
              )
            }
          >

            <div
              className="task-detail-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <span className="card-overline">
                    TASK DETAILS
                  </span>

                  <h2>
                    {
                      viewingTask.title
                    }
                  </h2>

                </div>

                <button
                  className="modal-close"
                  onClick={() =>
                    setViewingTask(
                      null
                    )
                  }
                >
                  ×
                </button>

              </div>

              <div className="task-detail-body">

                <div className="detail-status-row">

                  <span
                    className={`status-badge status-${viewingTask.status}`}
                  >
                    {statusLabel(
                      viewingTask.status
                    )}
                  </span>

                  <span
                    className={`priority priority-${viewingTask.priority}`}
                  >
                    {
                      viewingTask.priority
                    }
                  </span>

                </div>

                <div className="detail-grid">

                  <div>

                    <span>
                      Project
                    </span>

                    <strong>
                      {
                        viewingTask.project ||
                        "General"
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Due Date
                    </span>

                    <strong>
                      {formatDate(
                        viewingTask.due_date
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Task ID
                    </span>

                    <strong>
                      #
                      {
                        viewingTask.id
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Created
                    </span>

                    <strong>
                      {formatDateTime(
                        viewingTask.created_at
                      )}
                    </strong>

                  </div>

                </div>

                <div className="detail-description">

                  <span>
                    Description
                  </span>

                  <p>
                    {
                      viewingTask.description ||
                      "No description provided."
                    }
                  </p>

                </div>

              </div>

              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setViewingTask(
                      null
                    )
                  }
                >
                  Close
                </button>

                <button
                  className="primary-button"
                  onClick={() =>
                    handleEdit(
                      viewingTask
                    )
                  }
                >
                  Edit Task
                </button>

              </div>

            </div>

          </div>
        )}

        {/* NOTICE */}

        {notice && (
          <div
            className={`notification ${
              notice.type ===
              "success"
                ? "notification-success"
                : "notification-error"
            }`}
          >

            <span>
              {notice.type ===
              "success"
                ? "✓"
                : "!"}
            </span>

            <div>

              <strong>
                {notice.type ===
                "success"
                  ? "Success"
                  : "Something went wrong"}
              </strong>

              <p>
                {notice.message}
              </p>

            </div>

            <button
              onClick={() =>
                setNotice(
                  null
                )
              }
            >
              ×
            </button>

          </div>
        )}

        <footer className="footer">

          <span>
            TaskFlow · Task Management
          </span>

          <span>
            React + Django REST Framework
            + PostgreSQL
          </span>

        </footer>

      </main>
    </div>
  );
}

export default App;

