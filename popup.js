const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const counter = document.getElementById("taskCounter");
const emptyState = document.getElementById("emptyState");
const clearBtn = document.getElementById("clearCompleted");
const filterBtns = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("searchInput");

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
const notesPanel = document.getElementById("notesPanel");

// Notes Elements
const notesArea = document.getElementById("notesArea");
const charCount = document.getElementById("charCount");
const saveStatus = document.getElementById("saveStatus");

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
let currentFilter = "all";
let searchQuery = "";
let editingIndex = null;
let isAiLoading = false;
let noteSaveTimeout = null;
let secretNoteSaveTimeout = null;
let decryptedSecretNotes = "";
let isSecretUnlocked = false;
let autoLockTimeout = null;
const AUTO_LOCK_TIME = 5 * 60 * 1000; // 5 minutes

// Use chrome.storage for sync across devices, fallback to localStorage
const storage = typeof chrome !== "undefined" && chrome.storage ? chrome.storage.sync : null;

function loadTasks() {
  if (storage) {
    storage.get(["tasks", "notes"], (result) => {
      tasks = result.tasks || [];
      notes = result.notes || "";
      renderTasks();
      loadNotes();
    });
  } else {
    tasks = JSON.parse(localStorage.getItem("tasks")) || [];
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
}

function renderTasks() {
  list.innerHTML = "";

  const filteredTasks = tasks.filter((task) => {
    // Apply status filter
    if (currentFilter === "active" && task.completed) return false;
    if (currentFilter === "completed" && !task.completed) return false;

    // Apply search filter
    if (searchQuery && !task.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
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
      li.innerHTML = `
        <div class="checkbox ${task.completed ? 'checked' : ''}">
          ${task.completed ? '\u2713' : ''}
        </div>
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

    tasks.unshift({ text: correctedText, completed: false, createdAt: Date.now() });
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

clearBtn.addEventListener("click", clearCompleted);

// Search Event Listener
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.trim();
  renderTasks();
});

// Close menus when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.menu-dropdown').forEach(menu => {
    menu.classList.add('hidden');
  });
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
        div.addEventListener('click', () => addAiTask(cleanLine));
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
    aiContent.innerHTML = lines.map(line => `<p>${line}</p>`).join('');
  }
}

function addAiTask(taskText) {
  const cleanText = taskText.replace(/\*\*/g, '').trim();
  if (cleanText) {
    tasks.unshift({ text: cleanText, completed: false, createdAt: Date.now() });
    saveTasks();
    aiContent.innerHTML = `<p>Added: "${cleanText}"</p>`;
  }
}

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
    alert('Please enter a password');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  unlockBtn.disabled = true;
  unlockBtn.textContent = 'Unlocking...';

  // Load encrypted data
  if (storage) {
    storage.get(['secretNotes'], async (result) => {
      await processUnlock(result.secretNotes, password);
    });
  } else {
    const encryptedData = localStorage.getItem('secretNotes');
    await processUnlock(encryptedData ? JSON.parse(encryptedData) : null, password);
  }
}

async function processUnlock(encryptedData, password) {
  if (!encryptedData) {
    // First time - create new encrypted vault
    decryptedSecretNotes = '';
    isSecretUnlocked = true;
    showSecretContent();
    await saveSecretNotes(password);
    passwordInput.value = '';
  } else {
    // Decrypt existing data
    const decrypted = await decryptText(encryptedData, password);

    if (decrypted === null) {
      alert('Incorrect password');
      unlockBtn.disabled = false;
      unlockBtn.textContent = 'Unlock';
      return;
    }

    decryptedSecretNotes = decrypted;
    isSecretUnlocked = true;
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
  isSecretUnlocked = false;
  decryptedSecretNotes = '';
  secretNotesArea.value = '';
  passwordScreen.classList.remove('hidden');
  secretContent.classList.add('hidden');
  passwordInput.value = '';
  clearTimeout(autoLockTimeout);
}

async function saveSecretNotes(password = null) {
  if (!isSecretUnlocked) return;

  const textToSave = secretNotesArea.value;
  secretSaveStatus.textContent = 'Encrypting...';
  secretSaveStatus.classList.add('saving');

  // If no password provided, we need to prompt for it
  if (!password) {
    password = prompt('Enter your password to save:');
    if (!password) {
      secretSaveStatus.textContent = 'Save cancelled';
      secretSaveStatus.classList.remove('saving');
      return;
    }
  }

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
}

async function changePassword() {
  const oldPassword = prompt('Enter current password:');
  if (!oldPassword) return;

  const newPassword = prompt('Enter new password (min 6 characters):');
  if (!newPassword || newPassword.length < 6) {
    alert('New password must be at least 6 characters');
    return;
  }

  const confirmPassword = prompt('Confirm new password:');
  if (newPassword !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  // Verify old password by trying to decrypt
  if (storage) {
    storage.get(['secretNotes'], async (result) => {
      if (result.secretNotes) {
        const decrypted = await decryptText(result.secretNotes, oldPassword);
        if (decrypted === null) {
          alert('Incorrect current password');
          return;
        }
        // Re-encrypt with new password
        await saveSecretNotes(newPassword);
        alert('Password changed successfully!');
      }
    });
  } else {
    const encryptedData = localStorage.getItem('secretNotes');
    if (encryptedData) {
      const decrypted = await decryptText(JSON.parse(encryptedData), oldPassword);
      if (decrypted === null) {
        alert('Incorrect current password');
        return;
      }
      await saveSecretNotes(newPassword);
      alert('Password changed successfully!');
    }
  }
}

function setupAutoLock() {
  clearTimeout(autoLockTimeout);
  autoLockTimeout = setTimeout(() => {
    if (isSecretUnlocked) {
      lockSecretNotes();
      alert('Secret notes locked due to inactivity');
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

  // Debounce save
  clearTimeout(secretNoteSaveTimeout);
  secretNoteSaveTimeout = setTimeout(() => {
    const password = prompt('Enter password to save changes:');
    if (password) {
      saveSecretNotes(password);
    } else {
      secretSaveStatus.textContent = 'Not saved';
      secretSaveStatus.classList.remove('saving');
    }
  }, 2000);
});

// Update tab switching to include secret panel
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (tab === 'tasks') {
      tasksPanel.classList.remove('hidden');
      notesPanel.classList.add('hidden');
      secretPanel.classList.add('hidden');
    } else if (tab === 'notes') {
      tasksPanel.classList.add('hidden');
      notesPanel.classList.remove('hidden');
      secretPanel.classList.add('hidden');
    } else if (tab === 'secret') {
      tasksPanel.classList.add('hidden');
      notesPanel.classList.add('hidden');
      secretPanel.classList.remove('hidden');
    }
  });
});

// Initialize
loadTasks();