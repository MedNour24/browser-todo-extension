// Background Service Worker for API calls
const API_KEY = 'your-api-key-here';
const API_URL = 'https://models.inference.ai.azure.com/chat/completions';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'callAI') {
    callGitHubAI(request.prompt)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'correctText') {
    correctText(request.text)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // --- Pomodoro Timer Actions ---
  if (request.action === 'startTimer') {
    startTimer(request.mode, request.duration);
    sendResponse({ success: true });
  }

  if (request.action === 'stopTimer') {
    stopTimer();
    sendResponse({ success: true });
  }

  if (request.action === 'getTimerState') {
    getTimerState().then(state => sendResponse(state));
    return true;
  }
});

// --- Pomodoro Helper Functions ---
async function startTimer(mode, durationSeconds) {
  const endTime = Date.now() + (durationSeconds * 1000);
  await chrome.storage.local.set({
    timerState: {
      isRunning: true,
      mode: mode,
      endTime: endTime,
      duration: durationSeconds
    }
  });

  // Create an alarm to trigger when the timer ends
  chrome.alarms.create('pomodoroTimer', { when: endTime });
}

async function stopTimer() {
  await chrome.storage.local.set({
    'timerState': { isRunning: false }
  });
  chrome.alarms.clear('pomodoroTimer');
}

async function getTimerState() {
  const result = await chrome.storage.local.get(['timerState', 'timerStats']);
  const state = result.timerState || { isRunning: false };
  const stats = result.timerStats || { todaySessions: 0, totalMinutes: 0, lastDate: new Date().toDateString() };

  // Reset daily stats if it's a new day
  const today = new Date().toDateString();
  if (stats.lastDate !== today) {
    stats.todaySessions = 0;
    stats.lastDate = today;
    await chrome.storage.local.set({ timerStats: stats });
  }

  return { state, stats };
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'pomodoroTimer') {
    const { timerState, timerStats } = await chrome.storage.local.get(['timerState', 'timerStats']);

    if (timerState && timerState.isRunning) {
      // Show notification
      const isFocus = timerState.mode === 'focus';
      const title = isFocus ? 'Focus Session Complete!' : 'Break Over!';
      const message = isFocus ? 'Great job! Time for a well-deserved break.' : 'Time to get back to work!';

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: title,
        message: message,
        priority: 2
      });

      // Update stats if it was a focus session
      if (isFocus) {
        const stats = timerStats || { todaySessions: 0, totalMinutes: 0, lastDate: new Date().toDateString() };
        stats.todaySessions += 1;
        stats.totalMinutes += Math.round(timerState.duration / 60);
        await chrome.storage.local.set({ timerStats: stats });
      }

      // Mark as not running
      await chrome.storage.local.set({
        timerState: { isRunning: false }
      });

      // Notify popup if it's open
      chrome.runtime.sendMessage({ action: 'timerFinished', mode: timerState.mode });
    }
  }
});

async function correctText(text) {
  // Check if online
  if (!navigator.onLine) {
    throw new Error('OFFLINE: No internet connection. Text correction unavailable.');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a task text optimizer. Your job is to correct spelling, grammar, and typos. Return ONLY the corrected version of the user\'s input. Do not add quotes, explanations, or punctuation unless it was in the original. If the input is already correct, return it exactly as is.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 150,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('AI API Key is missing or invalid.');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.choices && data.choices[0] && data.choices[0].message) ? data.choices[0].message.content.trim() : text;
  } catch (error) {
    // Handle network errors
    if (error.message.includes('OFFLINE') || error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('OFFLINE: Unable to reach AI service. Check your connection.');
    }
    throw error;
  }
}

async function callGitHubAI(prompt) {
  // Check if online
  if (!navigator.onLine) {
    throw new Error('OFFLINE: No internet connection. AI assistant is unavailable.');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful productivity assistant. Give concise, actionable advice. When suggesting tasks, format each on a new line starting with a dash. Keep responses brief and practical. Do not use emojis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('AI API Key is missing or invalid. Please check your background.js file.');
      }
      const errorText = await response.text();
      throw new Error(`AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return (data.choices && data.choices[0] && data.choices[0].message) ? data.choices[0].message.content : 'No response from AI';
  } catch (error) {
    // Handle network errors
    if (error.message.includes('OFFLINE') || error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('OFFLINE: Unable to reach AI service. Check your internet connection.');
    }
    throw error;
  }
}
