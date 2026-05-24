"use client";

import { useState, useEffect, useCallback } from "react";

export default function AssignmentCalendar() {
  // ==================== STATE ====================
  const [role, setRole] = useState(null); // "teacher" | "student" | null
  const [studentGrade, setStudentGrade] = useState(null); // "9th" | "10th" | "11th" | "12th"
  const [studentSchedule, setStudentSchedule] = useState([]); // Array of {subject, teacher} objects
  const [assignments, setAssignments] = useState([]);
  const [currentView, setCurrentView] = useState("calendar"); // "calendar" | "list" | "conflicts"
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterGradeLevel, setFilterGradeLevel] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Setup modal state
  const [tempGrade, setTempGrade] = useState("");
  const [tempSchedule, setTempSchedule] = useState([]);
  const [manualTeacherInputs, setManualTeacherInputs] = useState({});
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  
  // A/B Day schedule state
  const [currentDayType, setCurrentDayType] = useState("A"); // "A" | "B"
  const [useAutoDayType, setUseAutoDayType] = useState(false); // Auto-detect day type
  
  // Form state
  const [formData, setFormData] = useState({
    teacherName: "",
    subject: "",
    gradeLevel: "All",
    type: "Test",
    date: "",
    title: "",
    description: "",
    dayType: "Both" // "A" | "B" | "Both"
  });
  const [formErrors, setFormErrors] = useState({});

  // Constants
  const GRADE_LEVELS = ["9th", "10th", "11th", "12th"];
  const ASSIGNMENT_TYPES = ["Test", "Quiz", "Project", "Essay", "Homework", "Lab", "Presentation"];
  const MAJOR_TYPES = ["Test", "Project", "Essay", "Presentation"];
  
  const AB_DAY_SCHEDULE = {
    "2026-05-04": "A",
    "2026-05-05": "B",
    "2026-05-06": "A",
    "2026-05-07": "B",
    "2026-05-08": "A",
    "2026-05-11": "B",
    "2026-05-12": "A",
    "2026-05-13": "B",
    "2026-05-14": "A",
    "2026-05-15": "B",
    "2026-05-18": "A",
    "2026-05-19": "B",
    "2026-05-20": "A",
    "2026-05-21": "B",
    "2026-05-22": "A",
    "2026-05-25": "B",
    "2026-05-26": "A",
    "2026-05-27": "B",
    "2026-05-28": "A",
    "2026-05-29": "B",
    "2026-06-01": "A",
    "2026-06-02": "B",
    "2026-06-03": "A",
    "2026-06-04": "B",
    "2026-06-05": "A",
    "2026-06-08": "B",
    "2026-06-09": "A",
    "2026-06-10": "B",
    "2026-06-11": "A",
    "2026-06-12": "B",
  };

  // ==================== EFFECTS ====================
  // Load data from API and localStorage
  useEffect(() => {
    const loadData = async () => {
      // Load role from localStorage
      const storedRole = localStorage.getItem("c4c-cal-role");
      const storedStudentGrade = localStorage.getItem("c4c-cal-student-grade");
      const storedStudentSchedule = localStorage.getItem("c4c-cal-student-schedule");
      
      if (storedRole) setRole(storedRole);
      if (storedStudentGrade) {
        setStudentGrade(storedStudentGrade);
        setFilterGradeLevel(storedStudentGrade);
      }
      if (storedStudentSchedule) {
        setStudentSchedule(JSON.parse(storedStudentSchedule));
      }
      
      // Load assignments from API
      try {
        const response = await fetch('/api/assignments');
        const assignmentsData = await response.json();
        setAssignments(assignmentsData);
      } catch (error) {
        console.error("Error loading assignments from API:", error);
        setAssignments([]);
      }
    };
    
    loadData();
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (role) localStorage.setItem("c4c-cal-role", role);
    if (studentGrade) localStorage.setItem("c4c-cal-student-grade", studentGrade);
    if (studentSchedule) localStorage.setItem("c4c-cal-student-schedule", JSON.stringify(studentSchedule));
  }, [role, studentGrade, studentSchedule]);

  // Auto-detect day type
  useEffect(() => {
    if (useAutoDayType) {
      const today = new Date().toISOString().split('T')[0];
      const dayType = AB_DAY_SCHEDULE[today] || "A";
      setCurrentDayType(dayType);
    }
  }, [useAutoDayType]);

  // Setup modal initialization
  useEffect(() => {
    if (showSetupModal) {
      setTempGrade(studentGrade || "");
      setTempSchedule(studentSchedule || []);
      setManualTeacherInputs({});
    }
  }, [showSetupModal, studentGrade, studentSchedule]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setShowDayModal(false);
        setShowSetupModal(false);
        setShowImportModal(false);
        setDeleteConfirm(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // ==================== HELPERS ====================
  // --- FILTER: student-only visibility
  const getStudentAssignments = (allAssignments, studentSchedule, studentGrade) => {
    if (!studentSchedule || studentSchedule.length === 0) {
      return allAssignments; // setup not complete, show everything
    }
    return allAssignments.filter(assignment => {
      const gradeMatch =
        assignment.gradeLevel === "All" ||
        assignment.gradeLevel?.trim().toLowerCase() === studentGrade?.trim().toLowerCase();
      const scheduleMatch = studentSchedule.some(entry =>
        entry.subject.trim().toLowerCase() === assignment.subject.trim().toLowerCase() &&
        entry.teacher.trim().toLowerCase() === assignment.teacherName.trim().toLowerCase()
      );
      return gradeMatch && scheduleMatch;
    });
  };

  // --- STUDENT SETUP: SYNERGY IMPORT PARSER
  const parseSynergySchedule = (rawText) => {
    if (!rawText || rawText.trim().length < 20) {
      return { classes: [], gradeLevel: null };
    }

    const lines = rawText.split(/\r?\n/);
    const classes = [];
    const seenPairs = new Set(); // For deduplication

    // Try to extract grade level from the text
    let extractedGradeLevel = null;
    const gradePatterns = [
      /Grade:\s*(\d+)/i,
      /(\d+)th\s*Grade/i,
      /Grade\s*(\d+)/i
    ];
    for (const pattern of gradePatterns) {
      const match = rawText.match(pattern);
      if (match) {
        extractedGradeLevel = `${match[1]}th`;
        break;
      }
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 10) continue;

      // Skip headers, navigation, and UI text
      const skipPatterns = [
        /class schedule/i,
        /period/i,
        /day/i,
        /room/i,
        /teacher/i,
        /course/i,
        /send message/i,
        /synergy/i,
        /student vue/i,
        /home/i,
        /grades/i,
        /attendance/i,
        /assignments/i,
        /schedule/i,
        /report card/i,
        /transcript/i,
        /test history/i,
        /course history/i,
        /graduation/i,
        /college/i,
        /career/i,
        /---/,
        /^\s*$/,
      ];
      if (skipPatterns.some(pattern => pattern.test(trimmed))) continue;

      // Try to parse as a schedule line
      // Format: Period | Day | Course Name | Room | Teacher
      const parts = trimmed.split(/\t+|\s{2,}|\|/);
      if (parts.length >= 3) {
        let course = "";
        let teacher = "";
        let room = "";

        // Try to identify which part is the course name, teacher, and room
        for (const part of parts) {
          const p = part.trim();
          if (!p) continue;

          // Check if it's a room number (typically 3-4 digits, may have letter)
          if (/^\d{3,4}[A-Za-z]?$/.test(p)) {
            room = p;
          }
          // Check if it looks like a teacher name (has at least 2 words, no numbers)
          else if (/^[A-Za-z\s\.]+$/.test(p) && p.split(/\s+/).length >= 2) {
            teacher = p;
          }
          // Otherwise, assume it's the course name
          else {
            course = p;
          }
        }

        // Clean up teacher name (remove "Send Message" text)
        teacher = teacher.replace(/Send Message/i, "").trim();

        // Skip if we don't have both course and teacher
        if (!course || !teacher) continue;

        // Skip Study Hall
        if (/study hall/i.test(course)) continue;

        // Create unique key for deduplication
        const pairKey = `${course.toLowerCase()}-${teacher.toLowerCase()}`;
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);

        classes.push({
          subject: course,
          teacher: teacher
        });
      }
    }

    return { classes, gradeLevel: extractedGradeLevel };
  };

  // --- FILTER: student-only visibility - get assignments visible to current user
  const getFilteredAssignments = useCallback(() => {
    // FILTER: student-only visibility
    const visibleAssignments = role === "student"
      ? getStudentAssignments(assignments, studentSchedule, studentGrade)
      : assignments;
    
    // Apply grade level and subject filters (for both teachers and students)
    const filtered = visibleAssignments.filter(a => {
      const gradeMatch = filterGradeLevel === "All" || a.gradeLevel === filterGradeLevel || a.gradeLevel === "All";
      const subjectMatch = filterSubject === "All" || a.subject === filterSubject;
      return gradeMatch && subjectMatch;
    });
    
    return filtered;
  }, [assignments, filterGradeLevel, filterSubject, role, studentSchedule, studentGrade]);

  // --- CALENDAR HELPERS
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const getAssignmentsForDate = useCallback((dateStr) => {
    return getFilteredAssignments().filter(a => a.date === dateStr);
  }, [getFilteredAssignments]);

  const getMajorAssignmentsForDate = useCallback((dateStr, gradeLevel = "All") => {
    return getFilteredAssignments().filter(a => 
      a.date === dateStr &&
      MAJOR_TYPES.includes(a.type) &&
      (gradeLevel === "All" || a.gradeLevel === gradeLevel || a.gradeLevel === "All")
    );
  }, [getFilteredAssignments]);

  const getLoadScore = useCallback((dateStr, gradeLevel = "All") => {
    const majorAssignments = getMajorAssignmentsForDate(dateStr, gradeLevel);
    return majorAssignments.length;
  }, [getMajorAssignmentsForDate]);

  const isToday = useCallback((dateStr) => {
    const today = new Date();
    return dateStr === today.toISOString().split('T')[0];
  }, []);

  const formatDateDisplay = useCallback((dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  const getUniqueSubjects = useCallback(() => {
    const subjects = [...new Set(assignments.map(a => a.subject))];
    return subjects.sort();
  }, [assignments]);

  // --- CONFLICT DETECTION
  const detectConflicts = useCallback(() => {
    const filtered = getFilteredAssignments();
    const majorAssignments = filtered.filter(a => MAJOR_TYPES.includes(a.type));
    
    // Group by date
    const byDate = {};
    majorAssignments.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = [];
      byDate[a.date].push(a);
    });
    
    // Find days with 2+ major assessments
    const conflictDays = Object.entries(byDate)
      .filter(([date, assignments]) => assignments.length >= 2)
      .map(([date, assignments]) => ({
        date,
        type: "daily",
        count: assignments.length,
        assignments
      }));
    
    return conflictDays;
  }, [getFilteredAssignments]);

  // ==================== HANDLERS ====================
  const handleAddAssignment = () => {
    setFormData({
      teacherName: "",
      subject: "",
      gradeLevel: filterGradeLevel === "All" ? "All" : filterGradeLevel,
      type: "Test",
      date: "",
      title: "",
      description: "",
      dayType: "Both"
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditAssignment = (assignment) => {
    setFormData({
      teacherName: assignment.teacherName || "",
      subject: assignment.subject || "",
      gradeLevel: assignment.gradeLevel || "All",
      type: assignment.type || "Test",
      date: assignment.date || "",
      title: assignment.title || "",
      description: assignment.description || "",
      dayType: assignment.dayType || "Both"
    });
    setFormErrors({});
    setEditingAssignment(assignment);
    setShowAddModal(true);
  };

  const handleDeleteAssignment = (assignment) => {
    setDeleteConfirm(assignment);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        const response = await fetch(`/api/assignments?id=${deleteConfirm.id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setAssignments(assignments.filter(a => a.id !== deleteConfirm.id));
          setDeleteConfirm(null);
        }
      } catch (error) {
        console.error("Error deleting assignment:", error);
      }
    }
  };

  const handleSaveAssignment = async () => {
    const errors = {};
    if (!formData.teacherName.trim()) errors.teacherName = "Teacher name is required";
    if (!formData.subject.trim()) errors.subject = "Subject is required";
    if (!formData.gradeLevel) errors.gradeLevel = "Grade level is required";
    if (!formData.type) errors.type = "Type is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.title.trim()) errors.title = "Title is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingAssignment) {
        // Update existing assignment
        const updatedAssignment = { ...editingAssignment, ...formData };
        const response = await fetch('/api/assignments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedAssignment)
        });
        if (response.ok) {
          setAssignments(assignments.map(a => a.id === editingAssignment.id ? updatedAssignment : a));
          setShowAddModal(false);
        }
      } else {
        // Create new assignment
        const newAssignment = {
          ...formData,
          id: Date.now().toString()
        };
        const response = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAssignment)
        });
        if (response.ok) {
          setAssignments([...assignments, newAssignment]);
          setShowAddModal(false);
        }
      }
    } catch (error) {
      console.error("Error saving assignment:", error);
    }
  };

  const handleSetupSave = () => {
    if (!tempGrade) {
      alert("Please select your grade level");
      return;
    }
    setStudentGrade(tempGrade);
    setStudentSchedule(tempSchedule);
    setFilterGradeLevel(tempGrade);
    setShowSetupModal(false);
  };

  const handleManualTeacherInput = (subject, teacher) => {
    setManualTeacherInputs(prev => ({
      ...prev,
      [subject]: teacher
    }));
  };

  const confirmManualTeacher = (subject) => {
    const teacher = manualTeacherInputs[subject];
    if (teacher && teacher.trim()) {
      const updatedSchedule = tempSchedule.map(s => 
        s.subject === subject ? { ...s, teacher: teacher.trim() } : s
      );
      setTempSchedule(updatedSchedule);
      setManualTeacherInputs(prev => {
        const updated = { ...prev };
        delete updated[subject];
        return updated;
      });
    }
  };

  // ==================== RENDER FUNCTIONS ====================
  const renderWelcomeScreen = () => (
    <div style={styles.welcomeContainer}>
      <h1 style={styles.welcomeTitle}>Welcome to the Assignment Calendar</h1>
      <p style={styles.welcomeText}>Select your role to get started</p>
      <div style={styles.roleButtons}>
        <button onClick={() => setRole("student")} style={styles.roleButton}>
          👨‍🎓 Student
        </button>
        <button onClick={() => setRole("teacher")} style={styles.roleButton}>
          👨‍🏫 Teacher
        </button>
      </div>
    </div>
  );

  const renderRoleBadge = () => (
    <div style={styles.roleBadge}>
      <span style={styles.roleText}>
        {role === "student" ? "👨‍🎓 Student" : "👨‍🏫 Teacher"}
      </span>
      <button onClick={() => setRole(null)} style={styles.roleSwitch}>
        Switch
      </button>
    </div>
  );

  const renderTabBar = () => (
    <div style={styles.tabBar}>
      <button
        onClick={() => setCurrentView("calendar")}
        style={{
          ...styles.tabButton,
          backgroundColor: currentView === "calendar" ? "#3B82F6" : "#F1F5F9",
          color: currentView === "calendar" ? "#FFFFFF" : "#1E293B"
        }}
      >
        Calendar
      </button>
      <button
        onClick={() => setCurrentView("list")}
        style={{
          ...styles.tabButton,
          backgroundColor: currentView === "list" ? "#3B82F6" : "#F1F5F9",
          color: currentView === "list" ? "#FFFFFF" : "#1E293B"
        }}
      >
        List
      </button>
      <button
        onClick={() => setCurrentView("conflicts")}
        style={{
          ...styles.tabButton,
          backgroundColor: currentView === "conflicts" ? "#3B82F6" : "#F1F5F9",
          color: currentView === "conflicts" ? "#FFFFFF" : "#1E293B"
        }}
      >
        Conflicts
      </button>
    </div>
  );

  const renderFilterBar = () => (
    <div style={styles.filterBar}>
      <div style={styles.filterGroup}>
        <label style={styles.filterLabel}>Grade Level:</label>
        <select
          value={filterGradeLevel}
          onChange={(e) => setFilterGradeLevel(e.target.value)}
          style={styles.filterSelect}
          disabled={role === "student"}
        >
          {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}</option>)}
        </select>
      </div>
      <div style={styles.filterGroup}>
        <label style={styles.filterLabel}>Subject:</label>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="All">All</option>
          {getUniqueSubjects().map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderCalendarView = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={styles.calendarDayEmpty} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAssignments = getAssignmentsForDate(dateStr);
      const loadScore = getLoadScore(dateStr, filterGradeLevel);
      const isTodayDate = isToday(dateStr);
      const dayType = AB_DAY_SCHEDULE[dateStr];

      days.push(
        <div
          key={day}
          style={{
            ...styles.calendarDay,
            backgroundColor: isTodayDate ? "#EFF6FF" : "#FFFFFF",
            borderColor: isTodayDate ? "#3B82F6" : "#E2E8F0"
          }}
          onClick={() => {
            setSelectedDay(dateStr);
            setShowDayModal(true);
          }}
        >
          <div style={styles.calendarDayHeader}>
            <span style={{
              ...styles.calendarDayNumber,
              color: isTodayDate ? "#3B82F6" : "#1E293B"
            }}>{day}</span>
            {dayType && (
              <span style={{
                ...styles.dayTypeIndicator,
                backgroundColor: dayType === "A" ? "#3B82F6" : "#F59E0B"
              }}>{dayType}</span>
            )}
          </div>
          {loadScore > 0 && (
            <div style={{
              ...styles.loadBadge,
              backgroundColor: loadScore >= 3 ? "#FEE2E2" : loadScore === 2 ? "#FEF3C7" : "#F0FDF4",
              color: loadScore >= 3 ? "#DC2626" : loadScore === 2 ? "#D97706" : "#16A34A"
            }}>
              {loadScore}
            </div>
          )}
          <div style={styles.calendarAssignments}>
            {dayAssignments.slice(0, 3).map((assignment, idx) => (
              <div key={idx} style={{
                ...styles.assignmentPill,
                backgroundColor: MAJOR_TYPES.includes(assignment.type) ? "#DBEAFE" : "#F1F5F9",
                color: MAJOR_TYPES.includes(assignment.type) ? "#1E40AF" : "#475569"
              }}>
                {assignment.title}
              </div>
            ))}
            {dayAssignments.length > 3 && (
              <div style={styles.moreAssignments}>+{dayAssignments.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={styles.calendarContainer}>
        <div style={styles.calendarHeader}>
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1))}
            style={styles.calendarNavButton}
          >
            ←
          </button>
          <h2 style={styles.calendarTitle}>{monthName}</h2>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            style={styles.calendarNavButton}
          >
            →
          </button>
        </div>
        <div style={styles.calendarGrid}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} style={styles.calendarDayHeader}>{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const filtered = getFilteredAssignments();
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <div style={styles.listContainer}>
        {sorted.length === 0 ? (
          <div style={styles.emptyState}>No assignments to display</div>
        ) : (
          sorted.map(assignment => (
            <div key={assignment.id} style={styles.listItem}>
              <div style={styles.listItemMain}>
                <div style={styles.listItemTitle}>{assignment.title}</div>
                <div style={styles.listItemMeta}>
                  {assignment.subject} • {assignment.teacherName} • {new Date(assignment.date).toLocaleDateString()}
                </div>
                {assignment.description && (
                  <div style={styles.listItemDescription}>{assignment.description}</div>
                )}
              </div>
              <div style={styles.listItemActions}>
                <button onClick={() => handleEditAssignment(assignment)} style={styles.editButton}>
                  Edit
                </button>
                <button onClick={() => handleDeleteAssignment(assignment)} style={styles.deleteButton}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderConflictReport = () => {
    const conflicts = detectConflicts();
    const filtered = getFilteredAssignments();
    const majorAssignments = filtered.filter(a => MAJOR_TYPES.includes(a.type));
    const conflictDays = conflicts.filter(c => c.type === "daily");

    return (
      <div style={styles.conflictContainer}>
        <div style={styles.summaryStats}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>{filtered.length}</div>
            <div style={styles.summaryLabel}>Total assignments this month</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>{majorAssignments.length}</div>
            <div style={styles.summaryLabel}>Major assessments this month</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>{conflictDays.length}</div>
            <div style={styles.summaryLabel}>Conflict days flagged</div>
          </div>
        </div>

        {conflictDays.length === 0 ? (
          <div style={styles.emptyState}>No conflicts detected this month</div>
        ) : (
          <div style={styles.conflictList}>
            {conflictDays.map((conflict, idx) => (
              <div key={idx} style={styles.conflictItem}>
                <div style={styles.conflictDate}>{formatDateDisplay(conflict.date)}</div>
                <div style={styles.conflictCount}>{conflict.count} major assessments</div>
                <div style={styles.conflictAssignments}>
                  {conflict.assignments.map((a, aIdx) => (
                    <div key={aIdx} style={styles.conflictAssignment}>
                      {a.title} ({a.subject})
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSetupModal = () => {
    if (!showSetupModal) return null;

    const isComplete = () => {
      if (!tempGrade) return false;
      const incomplete = tempSchedule.filter(s => !s.teacher || s.teacher.trim() === "");
      return incomplete.length === 0;
    };

    return (
      <div style={styles.modalOverlay} onClick={() => setShowSetupModal(false)}>
        <div style={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Setup Your Profile</h2>
            <button onClick={() => setShowSetupModal(false)} style={styles.modalClose}>×</button>
          </div>
          {importSuccess && (
            <div style={styles.importSuccessBanner}>
              ✅ Found {tempSchedule.length} classes from your Synergy schedule — review below and hit Save.
            </div>
          )}
          <div style={styles.modalBody}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Step 1: Select Your Grade Level</label>
              <div style={styles.gradeButtons}>
                {["9th", "10th", "11th", "12th"].map(grade => (
                  <button
                    key={grade}
                    onClick={() => setTempGrade(grade)}
                    style={{
                      ...styles.gradeButton,
                      backgroundColor: tempGrade === grade ? "#3B82F6" : "#FFFFFF",
                      color: tempGrade === grade ? "#FFFFFF" : "#1E293B"
                    }}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Step 2: Select Your Classes</label>
              <button onClick={() => setShowImportModal(true)} style={styles.importButton}>
                📋 Import from Synergy
              </button>
              <div style={styles.subjectTeacherList}>
                {tempSchedule.map((item, idx) => (
                  <div key={idx} style={styles.subjectTeacherRow}>
                    <div style={styles.subjectTeacherLeft}>
                      <span style={styles.subjectName}>{item.subject}</span>
                    </div>
                    <div style={styles.subjectTeacherRight}>
                      {manualTeacherInputs[item.subject] !== undefined ? (
                        <div style={styles.manualInputRow}>
                          <input
                            type="text"
                            value={manualTeacherInputs[item.subject]}
                            onChange={(e) => handleManualTeacherInput(item.subject, e.target.value)}
                            style={styles.manualInput}
                            placeholder="Teacher name"
                          />
                          <button onClick={() => confirmManualTeacher(item.subject)} style={styles.confirmButton}>
                            ✓
                          </button>
                        </div>
                      ) : (
                        <span style={styles.teacherName}>{item.teacher || "No teacher"}</span>
                      )}
                      <button onClick={() => {
                        setManualTeacherInputs(prev => ({ ...prev, [item.subject]: "" }));
                      }} style={styles.addManuallyButton}>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={styles.manualNote}>Or paste your Synergy schedule above to fill this in automatically.</div>
            </div>
          </div>
          <div style={styles.modalFooter}>
            <button onClick={() => setShowSetupModal(false)} style={styles.buttonSecondary}>Cancel</button>
            <button onClick={handleSetupSave} style={styles.buttonPrimary} disabled={!isComplete()}>
              Save Setup
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderImportModal = () => {
    if (!showImportModal) return null;

    const handleParse = () => {
      const result = parseSynergySchedule(importText);
      if (result.classes.length === 0) {
        setImportError("We couldn't read your schedule. Make sure you copied the full Class Schedule page from Synergy and try again.");
        setImportResult(null);
      } else {
        setImportError("");
        setImportResult(result);
        
        // Auto-populate tempSchedule with parsed classes
        const newSchedule = result.classes.map(c => ({
          subject: c.subject,
          teacher: c.teacher
        }));
        setTempSchedule(newSchedule);
        
        // If grade level was extracted, auto-select it
        if (result.gradeLevel) {
          setTempGrade(result.gradeLevel);
        }
        
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 5000);
        setShowImportModal(false);
      }
    };

    return (
      <div style={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
        <div style={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Import Your Schedule from Synergy</h2>
            <button onClick={() => setShowImportModal(false)} style={styles.modalClose}>×</button>
          </div>
          <div style={styles.modalBody}>
            <div style={styles.importInstructions}>
              <h3 style={styles.importSubtitle}>How to import your schedule:</h3>
              <ol style={styles.importList}>
                <li>Log in to StudentVUE</li>
                <li>Go to Class Schedule</li>
                <li>Select your current schedule</li>
                <li>Select all text on the page (Ctrl+A or Cmd+A)</li>
                <li>Copy the text (Ctrl+C or Cmd+C)</li>
                <li>Paste it below</li>
              </ol>
            </div>
            <div style={styles.importPrivacy}>
              <strong>🔒 Privacy Note:</strong> Your schedule is processed entirely in your browser. No data is sent to any server.
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              style={styles.importTextarea}
              placeholder="Paste your Synergy schedule here..."
            />
            {importError && (
              <div style={styles.importError}>{importError}</div>
            )}
            <div style={styles.importHelp}>
              <h4 style={styles.importHelpTitle}>Need help?</h4>
              <ul style={styles.helpList}>
                <li>Make sure you copy the entire Class Schedule page, not just a portion</li>
                <li>The parser looks for lines with period, day, course name, room, and teacher</li>
                <li>Study Hall classes are automatically skipped</li>
                <li>If the parser doesn't work, you can manually add teachers below</li>
              </ul>
            </div>
          </div>
          <div style={styles.modalFooter}>
            <button onClick={() => setShowImportModal(false)} style={styles.buttonSecondary}>Cancel</button>
            <button 
              onClick={handleParse} 
              style={styles.buttonPrimary}
              disabled={importText.trim().length < 20}
            >
              Parse My Schedule
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddModal = () => {
    if (!showAddModal) return null;

    let loadPreview = null;
    if (formData.date && formData.gradeLevel) {
      if (!MAJOR_TYPES.includes(formData.type)) {
        loadPreview = (
          <div style={styles.loadPreviewNeutral}>
            Homework/minor assignments don't count toward load score.
          </div>
        );
      } else {
        const loadScore = getLoadScore(formData.date, formData.gradeLevel);
        if (loadScore === 0) {
          loadPreview = (
            <div style={styles.loadPreviewGood}>
              No major assessments scheduled for {formData.gradeLevel} on this day
            </div>
          );
        } else if (loadScore === 1) {
          loadPreview = (
            <div style={styles.loadPreviewNeutral}>
              1 major assessment already scheduled for {formData.gradeLevel} on this day
            </div>
          );
        } else if (loadScore === 2) {
          loadPreview = (
            <div style={styles.loadPreviewWarning}>
              2 major assessments already on this day for {formData.gradeLevel} — students may feel pressure
            </div>
          );
        } else {
          loadPreview = (
            <div style={styles.loadPreviewDanger}>
              High load day — {formData.gradeLevel} already has {loadScore}+ major assessments on this date. Strongly consider a different day.
            </div>
          );
        }
      }
    }

    return (
      <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>{editingAssignment ? "Edit Assignment" : "Add Assignment"}</h2>
            <button onClick={() => setShowAddModal(false)} style={styles.modalClose}>×</button>
          </div>
          <div style={styles.modalBody}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Teacher Name *</label>
              <input
                type="text"
                value={formData.teacherName}
                onChange={(e) => setFormData({...formData, teacherName: e.target.value})}
                style={styles.formInput}
                placeholder="Teacher name"
              />
              {formErrors.teacherName && <div style={styles.formError}>{formErrors.teacherName}</div>}
              <div style={styles.formNote}>Enter your name exactly as it appears in Synergy (e.g. Ruth Swartzbaugh)</div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Subject *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                style={styles.formInput}
                placeholder="Subject"
                list="subjects"
              />
              <datalist id="subjects">
                {getUniqueSubjects().map(s => <option key={s} value={s} />)}
              </datalist>
              {formErrors.subject && <div style={styles.formError}>{formErrors.subject}</div>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Grade Level *</label>
              <select
                value={formData.gradeLevel}
                onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
                style={styles.formSelect}
              >
                {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}</option>)}
              </select>
              {formErrors.gradeLevel && <div style={styles.formError}>{formErrors.gradeLevel}</div>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                style={styles.formSelect}
              >
                {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {formErrors.type && <div style={styles.formError}>{formErrors.type}</div>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                style={styles.formInput}
              />
              {formErrors.date && <div style={styles.formError}>{formErrors.date}</div>}
              {loadPreview}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                style={styles.formInput}
                placeholder="Assignment title"
              />
              {formErrors.title && <div style={styles.formError}>{formErrors.title}</div>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={styles.formTextarea}
                placeholder="Any notes for students..."
              />
            </div>
          </div>
          <div style={styles.modalFooter}>
            <button onClick={() => setShowAddModal(false)} style={styles.buttonSecondary}>Cancel</button>
            <button onClick={handleSaveAssignment} style={styles.buttonPrimary}>
              {editingAssignment ? "Update Assignment" : "Add Assignment"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDayModal = () => {
    if (!showDayModal || !selectedDay) return null;
    const dayAssignments = getAssignmentsForDate(selectedDay);
    const loadScore = getLoadScore(selectedDay, filterGradeLevel);

    return (
      <div style={styles.modalOverlay} onClick={() => setShowDayModal(false)}>
        <div style={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>{formatDateDisplay(selectedDay)}</h2>
            <button onClick={() => setShowDayModal(false)} style={styles.modalClose}>×</button>
          </div>
          <div style={styles.modalBody}>
            <div style={styles.loadSummary}>
              Load Score: {loadScore} major assessment{loadScore !== 1 ? 's' : ''}
            </div>
            {dayAssignments.length === 0 ? (
              <div style={styles.emptyState}>No assignments on this day</div>
            ) : (
              <div>
                {dayAssignments.map((assignment, idx) => (
                  <div key={idx} style={styles.dayModalCard}>
                    <div style={styles.dayModalCardMain}>
                      <div style={styles.dayModalCardTitle}>{assignment.title}</div>
                      <div style={styles.dayModalCardMeta}>
                        {assignment.subject} • {assignment.teacherName} • {assignment.type}
                      </div>
                      {assignment.description && (
                        <div style={styles.dayModalCardDescription}>{assignment.description}</div>
                      )}
                    </div>
                    <div style={styles.dayModalCardActions}>
                      <button onClick={() => handleEditAssignment(assignment)} style={styles.editButton}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteAssignment(assignment)} style={styles.deleteButton}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirm = () => {
    if (!deleteConfirm) return null;

    return (
      <div style={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
        <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.confirmModalContent}>
            <h3 style={styles.confirmModalText}>Are you sure you want to delete this assignment?</h3>
            <div style={styles.confirmModalButtons}>
              <button onClick={() => setDeleteConfirm(null)} style={styles.buttonSecondary}>Cancel</button>
              <button onClick={confirmDelete} style={styles.buttonDelete}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDebugPanel = () => {
    return (
      <div style={styles.debugPanel}>
        <div style={styles.debugSection}>Role: {role}</div>
        <div style={styles.debugSection}>Student Grade: {studentGrade}</div>
        <div style={styles.debugSection}>Student Schedule: {studentSchedule?.length || 0} classes</div>
        <div style={styles.debugSection}>Total Assignments: {assignments?.length || 0}</div>
        <div style={styles.debugSection}>Filtered Assignments: {getFilteredAssignments()?.length || 0}</div>
        <div style={styles.debugSection}>Filter Grade Level: {filterGradeLevel}</div>
        <div style={styles.debugSection}>Filter Subject: {filterSubject}</div>
        <div style={styles.debugSection}>Current Day Type: {currentDayType}</div>
        <div style={styles.debugSection}>Auto Mode: {useAutoDayType ? "On" : "Off"}</div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  if (!role) {
    return renderWelcomeScreen();
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Assignment & Assessment Calendar</h1>
        <p style={styles.subtitle}>See what's due across all classes — no more surprise pile-ups.</p>
        {renderRoleBadge()}
      </div>
      {role === "student" && (!studentSchedule || studentSchedule.length === 0) && (
        <div style={styles.setupWarningBanner}>
          <span>⚠️ Your schedule isn't set up yet — you're seeing all assignments. </span>
          <button onClick={() => setShowSetupModal(true)} style={styles.setupWarningLink}>
            Set Up My Schedule
          </button>
        </div>
      )}
      {renderDebugPanel()}
      {renderTabBar()}
      {renderFilterBar()}
      
      {currentView === "calendar" && renderCalendarView()}
      {currentView === "list" && renderListView()}
      {currentView === "conflicts" && renderConflictReport()}

      {role === "teacher" && (
        <button onClick={handleAddAssignment} style={styles.fab}>
          + Add Assignment
        </button>
      )}

      {renderAddModal()}
      {renderDayModal()}
      {renderDeleteConfirm()}
      {renderSetupModal()}
      {renderImportModal()}
    </div>
  );
}

// ==================== STYLES ====================
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#64748B",
    marginBottom: "16px",
  },
  roleBadge: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 16px",
    backgroundColor: "#F1F5F9",
    borderRadius: "8px",
  },
  roleText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1E293B",
  },
  roleSwitch: {
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#3B82F6",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  welcomeContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "24px",
  },
  welcomeTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1E293B",
  },
  welcomeText: {
    fontSize: "16px",
    color: "#64748B",
  },
  roleButtons: {
    display: "flex",
    gap: "16px",
  },
  roleButton: {
    padding: "16px 32px",
    fontSize: "18px",
    fontWeight: "500",
    color: "#FFFFFF",
    backgroundColor: "#3B82F6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  tabBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
  },
  tabButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  filterBar: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filterLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1E293B",
  },
  filterSelect: {
    padding: "6px 12px",
    fontSize: "14px",
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "6px",
    cursor: "pointer",
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  calendarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  calendarTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1E293B",
  },
  calendarNavButton: {
    padding: "8px 16px",
    fontSize: "16px",
    color: "#3B82F6",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
  },
  calendarDay: {
    minHeight: "100px",
    padding: "8px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  calendarDayEmpty: {
    minHeight: "100px",
  },
  calendarDayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  calendarDayNumber: {
    fontSize: "14px",
    fontWeight: "bold",
  },
  dayTypeIndicator: {
    padding: "2px 6px",
    fontSize: "10px",
    fontWeight: "bold",
    color: "#FFFFFF",
    borderRadius: "4px",
  },
  loadBadge: {
    display: "inline-block",
    padding: "2px 6px",
    fontSize: "10px",
    fontWeight: "bold",
    borderRadius: "4px",
    marginBottom: "4px",
  },
  calendarAssignments: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  assignmentPill: {
    padding: "2px 6px",
    fontSize: "10px",
    borderRadius: "4px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  moreAssignments: {
    fontSize: "10px",
    color: "#64748B",
  },
  listContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    backgroundColor: "#F8FAFC",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  listItemMain: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: "4px",
  },
  listItemMeta: {
    fontSize: "14px",
    color: "#64748B",
    marginBottom: "4px",
  },
  listItemDescription: {
    fontSize: "14px",
    color: "#64748B",
  },
  listItemActions: {
    display: "flex",
    gap: "8px",
  },
  editButton: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#3B82F6",
    backgroundColor: "transparent",
    border: "1px solid #3B82F6",
    borderRadius: "4px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#EF4444",
    backgroundColor: "transparent",
    border: "1px solid #EF4444",
    borderRadius: "4px",
    cursor: "pointer",
  },
  conflictContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  summaryStats: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryCard: {
    flex: 1,
    padding: "16px",
    backgroundColor: "#F8FAFC",
    borderRadius: "8px",
    textAlign: "center",
  },
  summaryNumber: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#3B82F6",
    marginBottom: "4px",
  },
  summaryLabel: {
    fontSize: "14px",
    color: "#64748B",
  },
  conflictList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  conflictItem: {
    padding: "16px",
    backgroundColor: "#FEF2F2",
    borderRadius: "8px",
    border: "1px solid #FCA5A5",
  },
  conflictDate: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#DC2626",
    marginBottom: "4px",
  },
  conflictCount: {
    fontSize: "14px",
    color: "#991B1B",
    marginBottom: "8px",
  },
  conflictAssignments: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  conflictAssignment: {
    fontSize: "14px",
    color: "#7F1D1D",
  },
  emptyState: {
    padding: "32px",
    textAlign: "center",
    color: "#64748B",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalLarge: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    maxWidth: "700px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #E2E8F0",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1E293B",
  },
  modalClose: {
    padding: "4px 8px",
    fontSize: "24px",
    color: "#64748B",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  modalBody: {
    padding: "24px",
  },
  modalFooter: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    padding: "20px 24px",
    borderTop: "1px solid #E2E8F0",
  },
  buttonPrimary: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#FFFFFF",
    backgroundColor: "#3B82F6",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  buttonSecondary: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  buttonDelete: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#FFFFFF",
    backgroundColor: "#EF4444",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: "6px",
  },
  formInput: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  formSelect: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "6px",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  formTextarea: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "6px",
    boxSizing: "border-box",
    resize: "vertical",
  },
  formError: {
    fontSize: "12px",
    color: "#EF4444",
    marginTop: "4px",
  },
  formNote: {
    fontSize: "11px",
    color: "#64748B",
    marginTop: "4px",
    fontStyle: "italic",
  },
  gradeButtons: {
    display: "flex",
    gap: "12px",
  },
  gradeButton: {
    flex: 1,
    padding: "16px",
    fontSize: "16px",
    fontWeight: "500",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    cursor: "pointer",
  },
  importButton: {
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#FFFFFF",
    backgroundColor: "#3B82F6",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "12px",
  },
  subjectTeacherList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  subjectTeacherRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderRadius: "8px",
    minHeight: "48px",
  },
  subjectTeacherLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  subjectName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1E293B",
  },
  subjectTeacherRight: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    alignItems: "flex-end",
  },
  teacherName: {
    fontSize: "14px",
    color: "#1E293B",
  },
  addManuallyButton: {
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#3B82F6",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
  },
  manualInputRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  manualInput: {
    padding: "6px 12px",
    fontSize: "14px",
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
    border: "1px solid #3B82F6",
    borderRadius: "6px",
  },
  confirmButton: {
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#FFFFFF",
    backgroundColor: "#3B82F6",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  manualNote: {
    fontSize: "12px",
    color: "#64748B",
    marginTop: "8px",
    fontStyle: "italic",
  },
  importSuccessBanner: {
    padding: "12px 16px",
    backgroundColor: "#F0FDF4",
    border: "1px solid #22C55E",
    borderRadius: "8px",
    color: "#166534",
    fontSize: "14px",
    marginBottom: "16px",
  },
  setupWarningBanner: {
    padding: "12px 16px",
    backgroundColor: "#FEF3C7",
    border: "1px solid #FBBF24",
    borderRadius: "8px",
    color: "#92400E",
    fontSize: "14px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  setupWarningLink: {
    padding: "4px 12px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#FFFFFF",
    backgroundColor: "#3B82F6",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  importInstructions: {
    marginBottom: "16px",
  },
  importSubtitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: "8px",
  },
  importList: {
    margin: "8px 0 0 0",
    paddingLeft: "20px",
    fontSize: "14px",
    color: "#64748B",
    lineHeight: "1.6",
  },
  importPrivacy: {
    padding: "12px",
    backgroundColor: "#F0FDF4",
    border: "1px solid #22C55E",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#166534",
    marginBottom: "16px",
  },
  importTextarea: {
    width: "100%",
    minHeight: "150px",
    padding: "12px",
    fontSize: "14px",
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    boxSizing: "border-box",
    resize: "vertical",
    marginBottom: "12px",
  },
  importError: {
    padding: "12px",
    backgroundColor: "#FEE2E2",
    border: "1px solid #EF4444",
    borderRadius: "8px",
    color: "#DC2626",
    fontSize: "14px",
    marginBottom: "12px",
  },
  importHelp: {
    padding: "12px",
    backgroundColor: "#F8FAFC",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#64748B",
  },
  importHelpTitle: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: "8px",
  },
  helpList: {
    margin: "8px 0 0 0",
    paddingLeft: "20px",
    fontSize: "12px",
    color: "#64748B",
    lineHeight: "1.6",
  },
  dayModalCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#F8FAFC",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  dayModalCardMain: {
    flex: 1,
  },
  dayModalCardTitle: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: "4px",
  },
  dayModalCardMeta: {
    fontSize: "14px",
    color: "#64748B",
    marginBottom: "4px",
  },
  dayModalCardDescription: {
    fontSize: "14px",
    color: "#64748B",
  },
  dayModalCardActions: {
    display: "flex",
    gap: "8px",
  },
  loadSummary: {
    padding: "12px",
    backgroundColor: "#F8FAFC",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1E293B",
    marginBottom: "12px",
  },
  confirmModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    maxWidth: "400px",
    width: "90%",
    padding: "24px",
  },
  confirmModalContent: {
    textAlign: "center",
  },
  confirmModalText: {
    fontSize: "16px",
    color: "#1E293B",
    marginBottom: "16px",
  },
  confirmModalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  fab: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    padding: "16px 24px",
    fontSize: "16px",
    fontWeight: "500",
    color: "#FFFFFF",
    backgroundColor: "#3B82F6",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  debugPanel: {
    padding: "12px 16px",
    backgroundColor: "#FEF3C7",
    border: "1px solid #FBBF24",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "12px",
  },
  debugSection: {
    marginBottom: "4px",
  },
};
