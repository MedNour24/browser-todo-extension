const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const counter = document.getElementById("taskCounter");
const emptyState = document.getElementById("emptyState");
const clearBtn = document.getElementById("clearCompleted");
const filterBtns = document.querySelectorAll(".filter-btn");
const priorityFilterBtns = document.querySelectorAll(".priority-filter-btn");
const searchInput = document.getElementById("searchInput");

// Custom Notification Function (Non-HTML5)
function showNotification(message, isError = true) {
  // Remove existing notification if present
  const existing = document.querySelector(".custom-notification");
  if (existing) {
    document.body.removeChild(existing);
  }

  const notification = document.createElement("div");
  notification.className = "custom-notification";
  notification.textContent = message;
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.left = "50%";
  notification.style.transform = "translateX(-50%)";
  notification.style.backgroundColor = isError ? "#E3311D" : "#4caf50";
  notification.style.color = "#ffffff";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "8px";
  notification.style.fontSize = "12px";
  notification.style.fontWeight = "600";
  notification.style.zIndex = "10000";
  notification.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
  notification.style.transition = "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  notification.style.opacity = "0";
  notification.style.textAlign = "center";
  notification.style.minWidth = "200px";

  document.body.appendChild(notification);

  // Trigger reflow for animation
  notification.offsetHeight;
  notification.style.opacity = "1";
  notification.style.bottom = "30px";

  setTimeout(() => {
    if (document.contains(notification)) {
      notification.style.opacity = "0";
      notification.style.bottom = "20px";
      setTimeout(() => {
        if (document.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 400);
    }
  }, 3000);
}

// AI Elements
const aiBtn = document.getElementById("aiBtn");
const aiPanel = document.getElementById("aiPanel");
const aiContent = document.getElementById("aiContent");
const aiInput = document.getElementById("aiInput");
const askAiBtn = document.getElementById("askAiBtn");
const closeAiBtn = document.getElementById("closeAi");
const aiActions = document.querySelectorAll(".ai-action");

// Tab Elements
const tabBtns = document.querySelectorAll(".tab-btn");
const tasksPanel = document.getElementById("tasksPanel");
const calendarPanel = document.getElementById("calendarPanel");
const notesPanel = document.getElementById("notesPanel");

// Calendar Elements
const currentMonthYearDisplay = document.getElementById("currentMonthYear");
const calendarGrid = document.getElementById("calendarGrid");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const selectedDateTasks = document.getElementById("selectedDateTasks");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const dayTaskList = document.getElementById("dayTaskList");

// Notes Elements
const notesArea = document.getElementById("notesArea");
const charCount = document.getElementById("charCount");
const saveStatus = document.getElementById("saveStatus");

// Bookmarks Elements
const bookmarksPanel = document.getElementById("bookmarksPanel");
const saveCurrentPageBtn = document.getElementById("saveCurrentPageBtn");
const bookmarkUrlInput = document.getElementById("bookmarkUrlInput");
const bookmarkTitleInput = document.getElementById("bookmarkTitleInput");
const addBookmarkBtn = document.getElementById("addBookmarkBtn");
const bookmarkSearchInput = document.getElementById("bookmarkSearchInput");
const bookmarkList = document.getElementById("bookmarkList");
const bookmarkCounter = document.getElementById("bookmarkCounter");
const bookmarkEmptyState = document.getElementById("bookmarkEmptyState");
const clearAllBookmarksBtn = document.getElementById("clearAllBookmarks");


// Secret Notes Elements
const secretPanel = document.getElementById("secretPanel");
const passwordScreen = document.getElementById("passwordScreen");
const secretContent = document.getElementById("secretContent");
const passwordInput = document.getElementById("passwordInput");
const unlockBtn = document.getElementById("unlockBtn");
const lockBtn = document.getElementById("lockBtn");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const secretNotesArea = document.getElementById("secretNotesArea");
const secretCharCount = document.getElementById("secretCharCount");
const secretSaveStatus = document.getElementById("secretSaveStatus");

let tasks = [];
let notes = "";
let bookmarks = [];
let bookmarkSearchQuery = "";
let currentFilter = "all";
let currentPriorityFilter = "all";
let searchQuery = "";
let editingIndex = null;
let isAiLoading = false;
let noteSaveTimeout = null;
let secretNoteSaveTimeout = null;
let decryptedSecretNotes = "";
let isSecretUnlocked = false;
let autoLockTimeout = null;
let currentPassword = null; // Store password for session
const AUTO_LOCK_TIME = 5 * 60 * 1000; // 5 minutes

// Calendar State
let calendarDate = new Date();
let selectedDate = new Date();

// Use chrome.storage for sync across devices, fallback to localStorage
const storage = typeof chrome !== "undefined" && chrome.storage ? chrome.storage.sync : null;

function loadTasks() {
  if (storage) {
    storage.get(["tasks", "notes"], (result) => {
      tasks = result.tasks || [];
      notes = result.notes || "";
      renderTasks();
      loadNotes();
      // Refresh calendar dots if calendar is active
      if (document.querySelector('.tab-btn[data-tab="calendar"]').classList.contains('active')) {
        renderCalendar();
      }
    });
  } else {
    try {
      tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    } catch (e) {
      console.error('Failed to parse tasks from localStorage:', e);
      tasks = [];
    }
    notes = localStorage.getItem("notes") || "";
    renderTasks();
    loadNotes();
  }
}

function saveTasks() {
  if (storage) {
    storage.set({ tasks });
  } else {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }
  renderTasks();
  // Refresh calendar dots if calendar is active
  if (document.querySelector('.tab-btn[data-tab="calendar"]').classList.contains('active')) {
    renderCalendar();
  }
}

function renderTasks() {
  list.innerHTML = "";

  const filteredTasks = tasks.filter((task) => {
    // Apply status filter
    if (currentFilter === "active" && task.completed) return false;
    if (currentFilter === "completed" && !task.completed) return false;

    // Apply priority filter
    if (currentPriorityFilter !== "all") {
      const taskPriority = task.priority || "none";
      if (taskPriority !== currentPriorityFilter) return false;
    }

    // Apply search filter
    if (searchQuery && !task.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sort by priority: high > medium > low > none
  const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
  filteredTasks.sort((a, b) => {
    const aPriority = priorityOrder[a.priority || "none"];
    const bPriority = priorityOrder[b.priority || "none"];
    if (aPriority !== bPriority) return aPriority - bPriority;
    // If same priority, sort by creation time (newest first)
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  filteredTasks.forEach((task, filteredIndex) => {
    const actualIndex = tasks.indexOf(task);
    const li = document.createElement("li");
    li.className = task.completed ? "completed" : "";

    if (editingIndex === actualIndex) {
      li.innerHTML = `
        <input type="text" class="edit-input" value="${escapeHtml(task.text)}" />
      `;
      const editInput = li.querySelector(".edit-input");
      setTimeout(() => editInput.focus(), 0);
      let saved = false;
      const doSave = () => {
        if (!saved) {
          saved = true;
          saveEdit(actualIndex, editInput.value);
        }
      };
      editInput.addEventListener("blur", doSave);
      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doSave();
        if (e.key === "Escape") cancelEdit();
      });
    } else {
      const priority = task.priority || 'none';
      li.innerHTML = `
        <div class="checkbox ${task.completed ? 'checked' : ''}">
          ${task.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        </div>
        <button class="priority-badge ${priority}" title="Priority: ${priority}">
          <span class="priority-indicator"></span>
        </button>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-menu">
          <button class="menu-btn" title="Options"><span class="dots"></span></button>
          <div class="menu-dropdown hidden">
            <button class="menu-item edit-item">Edit</button>
            <button class="menu-item delete-item">Delete</button>
          </div>
        </div>
      `;

      // Add event listeners (no inline handlers)
      li.querySelector('.checkbox').addEventListener('click', () => toggleTask(actualIndex));
      li.querySelector('.priority-badge').addEventListener('click', (e) => {
        e.stopPropagation();
        cyclePriority(actualIndex);
      });
      li.querySelector('.task-text').addEventListener('click', () => startEdit(actualIndex));

      const menuBtn = li.querySelector('.menu-btn');
      const menuDropdown = li.querySelector('.menu-dropdown');

      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close all other menus
        document.querySelectorAll('.menu-dropdown').forEach(menu => {
          if (menu !== menuDropdown) menu.classList.add('hidden');
        });
        menuDropdown.classList.toggle('hidden');
      });

      li.querySelector('.edit-item').addEventListener('click', () => {
        menuDropdown.classList.add('hidden');
        startEdit(actualIndex);
      });

      li.querySelector('.delete-item').addEventListener('click', () => {
        menuDropdown.classList.add('hidden');
        deleteTask(actualIndex);
      });
    }

    list.appendChild(li);
  });

  updateCounter();
  updateEmptyState(filteredTasks.length);
  updateClearButton();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function addTask() {
  const text = input.value.trim();
  if (text) {
    input.value = "";
    input.disabled = true;
    addBtn.disabled = true;
    addBtn.textContent = "...";

    // Auto-correct the task text using AI
    const correctedText = await correctText(text);

    tasks.unshift({ text: correctedText, completed: false, createdAt: Date.now(), priority: 'none' });
    saveTasks();

    input.disabled = false;
    addBtn.disabled = false;
    addBtn.textContent = "+";
    input.focus();
  }
}

async function correctText(text) {
  try {
    if (!chrome.runtime?.sendMessage) {
      return text; // Return original if runtime not available
    }
    const response = await chrome.runtime.sendMessage({
      action: 'correctText',
      text: text
    });

    if (response && response.success && response.data) {
      return response.data;
    }
    return text; // Return original if correction fails
  } catch (error) {
    console.error('Correction error:', error);
    return text; // Return original on error
  }
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
}

function startEdit(index) {
  editingIndex = index;
  renderTasks();
}

function saveEdit(index, newText) {
  const trimmed = newText.trim();
  if (trimmed) {
    tasks[index].text = trimmed;
  }
  editingIndex = null;
  saveTasks();
}

function cancelEdit() {
  editingIndex = null;
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
}

function setFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  renderTasks();
}

// ===== TAB SYSTEM =====
function switchTab(tabName) {
  const panels = {
    tasks: tasksPanel,
    calendar: calendarPanel,
    notes: notesPanel,
    bookmarks: bookmarksPanel,
    secret: secretPanel
  };

  Object.keys(panels).forEach(key => {
    if (panels[key]) {
      panels[key].classList.toggle("hidden", key !== tabName);
    }
  });

  tabBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  if (tabName === 'calendar') {
    renderCalendar();
    showTasksForDate(selectedDate);
  }
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function setPriorityFilter(priority) {
  currentPriorityFilter = priority;
  priorityFilterBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.priority === priority);
  });
  renderTasks();
}

function cyclePriority(index) {
  const priorities = ['none', 'low', 'medium', 'high'];
  const currentPriority = tasks[index].priority || 'none';
  const currentIndex = priorities.indexOf(currentPriority);
  const nextIndex = (currentIndex + 1) % priorities.length;
  tasks[index].priority = priorities[nextIndex];
  saveTasks();
}

function updateCounter() {
  const active = tasks.filter((t) => !t.completed).length;
  const total = tasks.length;
  counter.textContent = `${active}/${total} tasks`;
}

function updateEmptyState(count) {
  emptyState.classList.toggle("hidden", count > 0);
}

function updateClearButton() {
  const hasCompleted = tasks.some((t) => t.completed);
  clearBtn.classList.toggle("hidden", !hasCompleted);
}

// Event Listeners
addBtn.addEventListener("click", addTask);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

priorityFilterBtns.forEach((btn) => {
  btn.addEventListener("click", () => setPriorityFilter(btn.dataset.priority));
});

clearBtn.addEventListener("click", clearCompleted);

// Search Event Listener
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.trim();
  renderTasks();
});

// Close menus when clicking outside and reset auto-lock
document.addEventListener('click', () => {
  document.querySelectorAll('.menu-dropdown').forEach(menu => {
    menu.classList.add('hidden');
  });
  resetAutoLock();
});

// AI Event Listeners
aiBtn.addEventListener("click", () => aiPanel.classList.toggle("hidden"));
closeAiBtn.addEventListener("click", () => aiPanel.classList.add("hidden"));
askAiBtn.addEventListener("click", () => askAi(aiInput.value));
aiInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") askAi(aiInput.value);
});

aiActions.forEach((btn) => {
  btn.addEventListener("click", () => handleAiAction(btn.dataset.action));
});

// AI Functions
async function callPerplexityAI(prompt) {
  if (isAiLoading) return null;

  isAiLoading = true;
  aiBtn.classList.add("loading");
  aiContent.innerHTML = '<p class="ai-loading">Thinking...</p>';

  try {
    if (!chrome.runtime?.sendMessage) {
      return 'Extension context not available. Please refresh the page.';
    }
    const response = await chrome.runtime.sendMessage({
      action: 'callAI',
      prompt: prompt
    });

    if (response && response.success) {
      return response.data;
    } else {
      throw new Error(response?.error || 'Unknown error');
    }
  } catch (error) {
    console.error('AI Error:', error);
    return `Could not connect to AI. Error: ${error.message}`;
  } finally {
    isAiLoading = false;
    aiBtn.classList.remove("loading");
  }
}

async function askAi(question) {
  if (!question.trim()) return;

  const taskContext = tasks.length > 0
    ? `My current tasks: ${tasks.map(t => `${t.text}${t.completed ? ' (done)' : ''}`).join(', ')}. `
    : '';

  const response = await callPerplexityAI(taskContext + question);
  displayAiResponse(response, false);
  aiInput.value = '';
}

async function handleAiAction(action) {
  const activeTasks = tasks.filter(t => !t.completed).map(t => t.text);
  const taskList = activeTasks.join(', ');
  let prompt = '';

  switch (action) {
    case 'suggest':
      prompt = taskList
        ? `Based on these tasks: ${taskList}. Suggest 3 additional related tasks I might need. Format each suggestion on a new line starting with a dash.`
        : 'Suggest 5 productive tasks for a student today. Format each on a new line starting with a dash.';
      break;
    case 'prioritize':
      if (!taskList) {
        aiContent.innerHTML = '<p>Add some tasks first, then I can help prioritize them.</p>';
        return;
      }
      prompt = `Prioritize these tasks from most to least important and briefly explain why: ${taskList}`;
      break;
    case 'breakdown':
      if (!taskList) {
        aiContent.innerHTML = '<p>Add a task first, then I can break it down into steps.</p>';
        return;
      }
      // Use all active tasks if multiple, or just the first one
      const taskToBreakdown = activeTasks.length === 1
        ? activeTasks[0]
        : activeTasks.join('; ');
      prompt = `Break down ${activeTasks.length === 1 ? 'this task' : 'these tasks'} into smaller actionable steps: "${taskToBreakdown}". Format each step on a new line starting with a dash.`;
      break;
  }

  const response = await callPerplexityAI(prompt);
  displayAiResponse(response, action === 'suggest' || action === 'breakdown');
}

function displayAiResponse(response, showAddButtons = false) {
  if (!response) return;

  const lines = response.split('\n').filter(line => line.trim());

  if (showAddButtons) {
    aiContent.innerHTML = '';
    lines.forEach(line => {
      const cleanLine = line.replace(/^[-*]\s*/, '').trim();
      if (cleanLine && (line.startsWith('-') || line.startsWith('*'))) {
        const div = document.createElement('div');
        div.className = 'ai-suggestion';
        div.textContent = '+ ' + cleanLine;
        div.addEventListener('click', () => {
          if (!div.classList.contains('added')) {
            addAiTask(cleanLine, div);
          }
        });
        aiContent.appendChild(div);
      } else if (line.trim()) {
        const p = document.createElement('p');
        p.textContent = line;
        aiContent.appendChild(p);
      }
    });
    if (aiContent.children.length === 0) {
      aiContent.innerHTML = '<p>No suggestions available.</p>';
    }
  } else {
    // Safely add each line to prevent XSS
    aiContent.innerHTML = '';
    lines.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line;
      aiContent.appendChild(p);
    });
  }
}

function addAiTask(taskText, element) {
  const cleanText = taskText.replace(/\*\*/g, '').trim();
  if (cleanText) {
    tasks.unshift({ text: cleanText, completed: false, createdAt: Date.now(), priority: 'none' });
    saveTasks();

    if (element) {
      element.textContent = '\u2713 Added to list';
      element.classList.add('added');
      element.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
      element.style.color = '#4caf50';
      element.style.borderColor = '#4caf50';
    }
  }
}

// ===== BOOKMARKS FUNCTIONS =====

function loadBookmarks() {
  if (storage) {
    storage.get(["bookmarks"], (result) => {
      bookmarks = result.bookmarks || [];
      renderBookmarks();
    });
  } else {
    try {
      bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
    } catch (e) {
      console.error('Failed to parse bookmarks from localStorage:', e);
      bookmarks = [];
    }
    renderBookmarks();
  }
}

function saveBookmarks() {
  if (storage) {
    storage.set({ bookmarks });
  } else {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }
  renderBookmarks();
}

function renderBookmarks() {
  bookmarkList.innerHTML = "";

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (bookmarkSearchQuery &&
      !bookmark.title.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) &&
      !bookmark.url.toLowerCase().includes(bookmarkSearchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  filteredBookmarks.forEach((bookmark, index) => {
    const actualIndex = bookmarks.indexOf(bookmark);
    const li = document.createElement("li");
    li.className = "bookmark-item";

    // Extract domain for display
    let domain = "";
    try {
      const url = new URL(bookmark.url);
      domain = url.hostname.replace('www.', '');
    } catch (e) {
      domain = bookmark.url;
    }

    li.innerHTML = `
      <div class="bookmark-content">
        <div class="bookmark-favicon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
          <div class="bookmark-url">${escapeHtml(domain)}</div>
        </div>
        <div class="bookmark-actions">
          <button class="bookmark-open-btn" title="Open in new tab">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <button class="bookmark-delete-btn" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    li.querySelector('.bookmark-content').addEventListener('click', (e) => {
      if (!e.target.closest('.bookmark-actions')) {
        openBookmark(bookmark.url);
      }
    });

    li.querySelector('.bookmark-open-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openBookmark(bookmark.url);
    });

    li.querySelector('.bookmark-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBookmark(actualIndex);
    });

    bookmarkList.appendChild(li);
  });

  updateBookmarkCounter();
  updateBookmarkEmptyState(filteredBookmarks.length);
  updateClearAllButton();
}

async function saveCurrentPage() {
  try {
    // Check if chrome.tabs is available
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      showNotification('Feature only available in extension', true);
      return;
    }

    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url) {
      // Don't save chrome:// or extension pages
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        showNotification('Cannot save browser internal pages', true);
        return;
      }

      const title = tab.title || 'Untitled Page';
      const url = tab.url;

      // Check if already bookmarked
      const exists = bookmarks.some(b => b.url === url);
      if (exists) {
        showNotification('Page already bookmarked!', true);
        return;
      }

      bookmarks.unshift({
        title: title,
        url: url,
        createdAt: Date.now()
      });

      saveBookmarks();

      // Visual feedback
      saveCurrentPageBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Saved!';
      saveCurrentPageBtn.style.background = '#4caf50';
      setTimeout(() => {
        saveCurrentPageBtn.innerHTML = '<span class="bookmark-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg></span> Save Current Page';
        saveCurrentPageBtn.style.background = '';
      }, 2000);
    }
  } catch (error) {
    console.error('Error saving current page:', error);
    showNotification('Could not save current page', true);
  }
}

function addBookmarkManually() {
  const url = bookmarkUrlInput.value.trim();
  const title = bookmarkTitleInput.value.trim();

  if (!url) {
    showNotification('Please enter a URL', true);
    return;
  }

  // Add https:// if no protocol
  let fullUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    fullUrl = 'https://' + url;
  }

  // Validate URL
  try {
    new URL(fullUrl);
  } catch (e) {
    showNotification('Please enter a valid URL', true);
    return;
  }

  // Check if already exists
  const exists = bookmarks.some(b => b.url === fullUrl);
  if (exists) {
    showNotification('Already bookmarked!', true);
    return;
  }

  // Extract title from URL if not provided
  let finalTitle = title;
  if (!finalTitle) {
    try {
      const urlObj = new URL(fullUrl);
      finalTitle = urlObj.hostname.replace('www.', '');
    } catch (e) {
      finalTitle = fullUrl;
    }
  }

  bookmarks.unshift({
    title: finalTitle,
    url: fullUrl,
    createdAt: Date.now()
  });

  saveBookmarks();
  bookmarkUrlInput.value = '';
  bookmarkTitleInput.value = '';
}

function openBookmark(url) {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: url });
  } else {
    // Fallback for non-extension context
    window.open(url, '_blank');
  }
}

function deleteBookmark(index) {
  bookmarks.splice(index, 1);
  saveBookmarks();
}

let clearBookmarksConfirming = false;
function clearAllBookmarks() {
  if (!clearBookmarksConfirming) {
    clearBookmarksConfirming = true;
    clearAllBookmarksBtn.textContent = 'Are you sure? Click again';
    clearAllBookmarksBtn.style.backgroundColor = '#E3311D';
    clearAllBookmarksBtn.style.color = 'white';

    // Reset after 3 seconds if not clicked again
    setTimeout(() => {
      if (clearBookmarksConfirming) {
        clearBookmarksConfirming = false;
        clearAllBookmarksBtn.textContent = 'Clear All Bookmarks';
        clearAllBookmarksBtn.style.backgroundColor = '';
        clearAllBookmarksBtn.style.color = '';
      }
    }, 3000);
    return;
  }

  // Confirmed
  bookmarks = [];
  saveBookmarks();
  clearBookmarksConfirming = false;
  clearAllBookmarksBtn.textContent = 'Clear All Bookmarks';
  clearAllBookmarksBtn.style.backgroundColor = '';
  clearAllBookmarksBtn.style.color = '';
  showNotification('All bookmarks cleared', false);
}

function updateBookmarkCounter() {
  bookmarkCounter.textContent = `${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''}`;
}

function updateBookmarkEmptyState(count) {
  bookmarkEmptyState.classList.toggle("hidden", count > 0);
}

function updateClearAllButton() {
  clearAllBookmarksBtn.classList.toggle("hidden", bookmarks.length === 0);
}

// Bookmarks Event Listeners
saveCurrentPageBtn.addEventListener('click', saveCurrentPage);
addBookmarkBtn.addEventListener('click', addBookmarkManually);
bookmarkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBookmarkManually();
});
bookmarkTitleInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBookmarkManually();
});
bookmarkSearchInput.addEventListener('input', (e) => {
  bookmarkSearchQuery = e.target.value.trim();
  renderBookmarks();
});
clearAllBookmarksBtn.addEventListener('click', clearAllBookmarks);


// Notes Functions
function loadNotes() {
  notesArea.value = notes;
  updateCharCount();
}

function saveNotes() {
  notes = notesArea.value;
  saveStatus.textContent = 'Saving...';
  saveStatus.classList.add('saving');

  if (storage) {
    storage.set({ notes }, () => {
      saveStatus.textContent = 'Saved';
      saveStatus.classList.remove('saving');
    });
  } else {
    localStorage.setItem("notes", notes);
    saveStatus.textContent = 'Saved';
    saveStatus.classList.remove('saving');
  }
}

function updateCharCount() {
  charCount.textContent = `${notesArea.value.length} characters`;
}

notesArea.addEventListener('input', () => {
  updateCharCount();
  saveStatus.textContent = 'Saving...';
  saveStatus.classList.add('saving');

  // Debounce save
  clearTimeout(noteSaveTimeout);
  noteSaveTimeout = setTimeout(saveNotes, 500);
});

// ===== ENCRYPTION FUNCTIONS =====

// Convert string to ArrayBuffer
function str2ab(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Convert ArrayBuffer to string
function ab2str(buffer) {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

// Convert ArrayBuffer to base64
function ab2base64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Convert base64 to ArrayBuffer
function base642ab(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive encryption key from password
async function deriveKey(password, salt) {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    str2ab(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt text
async function encryptText(text, password) {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      str2ab(text)
    );

    return {
      encrypted: ab2base64(encrypted),
      salt: ab2base64(salt),
      iv: ab2base64(iv)
    };
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

// Decrypt text
async function decryptText(encryptedData, password) {
  try {
    const salt = base642ab(encryptedData.salt);
    const iv = base642ab(encryptedData.iv);
    const encrypted = base642ab(encryptedData.encrypted);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    return ab2str(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// ===== SECRET NOTES FUNCTIONS =====

async function unlockSecretNotes() {
  const password = passwordInput.value.trim();

  if (!password) {
    showNotification('Please enter a password', true);
    return;
  }

  if (password.length < 6) {
    showNotification('Minimum 6 characters', true);
    return;
  }

  unlockBtn.disabled = true;
  unlockBtn.textContent = 'Unlocking...';

  try {
    // Load encrypted data
    if (storage) {
      storage.get(['secretNotes'], async (result) => {
        await processUnlock(result.secretNotes, password);
      });
    } else {
      const encryptedDataStr = localStorage.getItem('secretNotes');
      let encryptedData = null;
      if (encryptedDataStr) {
        try {
          encryptedData = JSON.parse(encryptedDataStr);
        } catch (parseError) {
          console.error('Failed to parse encrypted data:', parseError);
          showNotification('Vault corrupted, reset forced', true);
        }
      }
      await processUnlock(encryptedData, password);
    }
  } catch (error) {
    console.error('Unlock error:', error);
    showNotification('Failed to unlock vault', true);
    unlockBtn.disabled = false;
    unlockBtn.textContent = 'Unlock';
  }
}

async function processUnlock(encryptedData, password) {
  if (!encryptedData) {
    // First time - create new encrypted vault
    decryptedSecretNotes = '';
    isSecretUnlocked = true;
    currentPassword = password; // Store password for session
    showSecretContent();
    // Save empty vault to establish the password
    await saveSecretNotes(password);
    passwordInput.value = '';
  } else {
    // Decrypt existing data
    const decrypted = await decryptText(encryptedData, password);

    if (decrypted === null) {
      showNotification('Incorrect password', true);
      unlockBtn.disabled = false;
      unlockBtn.textContent = 'Unlock';
      return;
    }

    decryptedSecretNotes = decrypted;
    isSecretUnlocked = true;
    currentPassword = password; // Store password for session
    secretNotesArea.value = decryptedSecretNotes;
    updateSecretCharCount();
    showSecretContent();
    passwordInput.value = '';
    setupAutoLock();
  }

  unlockBtn.disabled = false;
  unlockBtn.textContent = 'Unlock';
}

function showSecretContent() {
  passwordScreen.classList.add('hidden');
  secretContent.classList.remove('hidden');
  secretNotesArea.value = decryptedSecretNotes;
  updateSecretCharCount();
  setupAutoLock();
}

function lockSecretNotes() {
  // If there is a pending save, save it now before locking
  if (secretNoteSaveTimeout) {
    clearTimeout(secretNoteSaveTimeout);
    saveSecretNotes();
  }

  clearTimeout(autoLockTimeout);

  isSecretUnlocked = false;
  decryptedSecretNotes = '';
  currentPassword = null; // Clear password from memory
  secretNotesArea.value = '';
  passwordScreen.classList.remove('hidden');
  secretContent.classList.add('hidden');
  passwordInput.value = '';
}

async function saveSecretNotes(password = null) {
  if (!isSecretUnlocked) {
    console.log('Save aborted: vault is locked');
    return;
  }

  const textToSave = secretNotesArea.value;

  // Double-check vault is still unlocked before UI update
  if (!isSecretUnlocked) return;

  secretSaveStatus.textContent = 'Encrypting...';
  secretSaveStatus.classList.add('saving');

  // Use stored password if available
  if (!password) {
    password = currentPassword;
  }

  if (!password) {
    secretSaveStatus.textContent = 'Error: No password';
    secretSaveStatus.classList.remove('saving');
    return;
  }

  try {
    const encrypted = await encryptText(textToSave, password);

    if (!encrypted) {
      alert('Failed to encrypt notes');
      secretSaveStatus.textContent = 'Save failed';
      secretSaveStatus.classList.remove('saving');
      return;
    }

    if (storage) {
      storage.set({ secretNotes: encrypted }, () => {
        secretSaveStatus.textContent = 'Encrypted & Saved';
        secretSaveStatus.classList.remove('saving');
      });
    } else {
      localStorage.setItem('secretNotes', JSON.stringify(encrypted));
      secretSaveStatus.textContent = 'Encrypted & Saved';
      secretSaveStatus.classList.remove('saving');
    }

    decryptedSecretNotes = textToSave;
    resetAutoLock();
  } catch (error) {
    console.error('Save error:', error);
    secretSaveStatus.textContent = 'Save failed';
    secretSaveStatus.classList.remove('saving');
  }
}

const changePasswordForm = document.getElementById("changePasswordForm");
const oldPasswordInput = document.getElementById("oldPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const saveNewPasswordBtn = document.getElementById("saveNewPasswordBtn");
const cancelPasswordChangeBtn = document.getElementById("cancelPasswordChangeBtn");

function changePassword() {
  if (!isSecretUnlocked) {
    showNotification('Unlock vault first', true);
    return;
  }

  // Toggle form
  changePasswordForm.classList.remove('hidden');
  oldPasswordInput.focus();
}

saveNewPasswordBtn.addEventListener('click', async () => {
  const oldPassword = oldPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (oldPassword !== currentPassword) {
    showNotification('Incorrect current password', true);
    return;
  }

  if (newPassword.length < 6) {
    showNotification('Minimum 6 characters', true);
    return;
  }

  if (newPassword !== confirmPassword) {
    showNotification('Passwords do not match', true);
    return;
  }

  try {
    currentPassword = newPassword;
    await saveSecretNotes(newPassword);
    showNotification('Password updated', false);

    // Clear and hide form
    oldPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';
    changePasswordForm.classList.add('hidden');
  } catch (error) {
    showNotification('Failed to update password', true);
  }
});

cancelPasswordChangeBtn.addEventListener('click', () => {
  oldPasswordInput.value = '';
  newPasswordInput.value = '';
  confirmPasswordInput.value = '';
  changePasswordForm.classList.add('hidden');
});

function setupAutoLock() {
  clearTimeout(autoLockTimeout);
  autoLockTimeout = setTimeout(() => {
    if (isSecretUnlocked) {
      lockSecretNotes();
      // Only show notification if user is on the vault tab
      if (!secretPanel.classList.contains('hidden')) {
        showNotification('Vault locked for safety', true);
      }
    }
  }, AUTO_LOCK_TIME);
}

function resetAutoLock() {
  if (isSecretUnlocked) {
    setupAutoLock();
  }
}

function updateSecretCharCount() {
  secretCharCount.textContent = `${secretNotesArea.value.length} characters`;
}

// Secret Notes Event Listeners
unlockBtn.addEventListener('click', unlockSecretNotes);
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') unlockSecretNotes();
});

lockBtn.addEventListener('click', lockSecretNotes);
changePasswordBtn.addEventListener('click', changePassword);

secretNotesArea.addEventListener('input', () => {
  updateSecretCharCount();
  secretSaveStatus.textContent = 'Encrypting...';
  secretSaveStatus.classList.add('saving');
  resetAutoLock();

  // Debounce save - use stored password, no prompts
  clearTimeout(secretNoteSaveTimeout);
  secretNoteSaveTimeout = setTimeout(() => {
    saveSecretNotes(); // Will use currentPassword automatically
  }, 1500);
});


// Initialize
loadTasks();
loadBookmarks();

// ===== CALENDAR FUNCTIONS =====

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  currentMonthYearDisplay.textContent = `${monthNames[month]} ${year}`;
  calendarGrid.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day not-current-month";
    dayDiv.textContent = daysInPrevMonth - i;
    calendarGrid.appendChild(dayDiv);
  }

  // Current month days
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = i;

    if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayDiv.classList.add("today");
    }

    if (i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
      dayDiv.classList.add("selected");
    }

    // Check if any tasks were created on this exact day
    const hasTasksOnDay = tasks.some(task => {
      if (!task.createdAt) return false;
      const tDate = new Date(task.createdAt);
      return tDate.getDate() === i &&
        tDate.getMonth() === month &&
        tDate.getFullYear() === year;
    });

    if (hasTasksOnDay) {
      dayDiv.classList.add("has-tasks");
    }

    dayDiv.addEventListener("click", () => {
      selectedDate = new Date(year, month, i);
      renderCalendar();
      showTasksForDate(selectedDate);
    });

    calendarGrid.appendChild(dayDiv);
  }

  // Next month padding
  const totalSlots = 42; // 6 rows of 7 days
  const remainingSlots = totalSlots - calendarGrid.children.length;
  for (let i = 1; i <= remainingSlots; i++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day not-current-month";
    dayDiv.textContent = i;
    calendarGrid.appendChild(dayDiv);
  }
}

function showTasksForDate(date) {
  selectedDateTasks.classList.remove("hidden");
  const options = { month: 'short', day: 'numeric' };
  selectedDateLabel.textContent = `Tasks for ${date.toLocaleDateString(undefined, options)}`;

  dayTaskList.innerHTML = "";
  const tasksForDay = tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    return taskDate.getDate() === date.getDate() &&
      taskDate.getMonth() === date.getMonth() &&
      taskDate.getFullYear() === date.getFullYear();
  });

  if (tasksForDay.length === 0) {
    const li = document.createElement("li");
    li.style.background = "transparent";
    li.style.color = "#aaa";
    li.style.textAlign = "center";
    li.textContent = "No tasks for this day";
    dayTaskList.appendChild(li);
  } else {
    tasksForDay.forEach(task => {
      const li = document.createElement("li");
      li.textContent = task.text;
      if (task.completed) li.style.textDecoration = "line-through";
      dayTaskList.appendChild(li);
    });
  }
}

prevMonthBtn.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});