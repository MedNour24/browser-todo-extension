# 📝 Student To-Do List - Chrome Extension

> A beautiful, feature-rich task management extension designed specifically for students with AI assistance, encrypted notes, and a modern dark interface.

![Version](https://img.shields.io/badge/version-2.4-blue.svg)
![Manifest](https://img.shields.io/badge/manifest-v3-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

## ✨ Features

### 🎯 **Task Management**
- ✅ Create, edit, and delete tasks with ease
- 🔄 Auto-correct task text using AI
- ✔️ Mark tasks as complete/incomplete
- 🎨 **Priority Levels** - Color-coded badges (High/Medium/Low)
- 🔄 **One-Click Priority Cycling** - Click badge to cycle priorities
- 🎯 **Priority Filtering** - Filter tasks by priority level
- 📊 **Auto-Sort by Priority** - High priority tasks always on top
- 🔍 Search and filter tasks (All, Active, Completed)
- 📊 Real-time task counter (active/total)
- 🧹 Bulk clear completed tasks
- 💾 Automatic cloud sync across devices

### 🤖 **AI Assistant**
- 💡 Get intelligent task suggestions
- 📋 Prioritize tasks automatically
- 🔨 Break down complex tasks into steps
- 💬 Ask questions about your tasks
- ⚡ Powered by Azure AI models


### 📓 **Notes**
- 📝 Quick notes with auto-save
- 📊 Character counter
- 🔄 Real-time save status
- ☁️ Cloud synchronization

### 🔖 **Bookmarks** (Saved Links)
- 🔖 Save current page with one click
- 📋 Auto-capture page title and URL
- ✍️ Manual URL entry with optional custom titles
- 🔍 Search bookmarks by title or URL
- 🔗 Click to open in new tab
- 🗑️ Individual or bulk delete
- 💾 Cloud sync across devices
- 📊 Bookmark counter


### 🔐 **Private Vault** (Encrypted Notes)
- 🔒 AES-256-GCM encryption
- 🔑 Password-protected access
- 🛡️ PBKDF2 key derivation (100,000 iterations)
- ⏰ Auto-lock after 5 minutes of inactivity
- 🔄 Change password anytime
- 🔐 Encrypted & Unlocked status badges
- 💾 Encrypted cloud storage

### 🎨 **Modern UI/UX**
- 🌑 Beautiful dark theme
- 🎯 Clean, minimalist design
- ⚡ Smooth animations and transitions
- 📱 Responsive layout (400px width)
- 🎨 Red accent color (#E3311D)
- ✨ Premium glassmorphism effects

## 🚀 Installation

### From Source

1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/yourusername/student-todo-extension.git
   ```

2. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top right toggle)

3. **Load the Extension**:
   - Click **Load unpacked**
   - Select the extension folder
   - The extension icon will appear in your toolbar

4. **Configure AI (Optional)**:
   - Open `background.js`
   - Add your Azure AI API key:
     ```javascript
     const API_KEY = 'your-api-key-here';
     ```

## 📖 Usage

### Getting Started

1. **Click the extension icon** in your Chrome toolbar
2. **Choose a tab**:
   - **Tasks**: Manage your to-do list
   - **Notes**: Quick note-taking
   - **Links**: Save and organize bookmarks
   - **Vault**: Encrypted private notes

### Task Management

#### Adding Tasks
- Type your task in the input field
- Press **Enter** or click the **+** button
- AI will auto-correct the text for you

#### Managing Tasks
- **Check/Uncheck**: Click the checkbox to toggle completion
- **Edit**: Click the task text to edit inline
- **Delete**: Click the three-dot menu → Delete
- **Search**: Use the search bar to filter tasks
- **Filter**: Click All/Active/Done to filter by status

#### Setting Priorities
- **Click the colored badge** next to any task to cycle through priorities
- **Priority Cycle**: None (gray) → Low (blue) → Medium (orange) → High (red) → None
- **Visual Feedback**: Badges glow and rotate on hover
- **High Priority**: Red badges pulse to grab attention
- **Auto-Sort**: Tasks automatically re-sort by priority

#### Priority Filtering
- Use the **Priority Filter Bar** to show specific priorities
- **All** (rainbow): Shows all tasks
- **High** (red): Shows only urgent tasks
- **Medium** (orange): Shows important tasks
- **Low** (blue): Shows tasks you can do later
- **None** (gray): Shows tasks without priority

### AI Assistant

1. Click the **AI** button to open the assistant
2. Choose a quick action:
   - **Suggest Tasks**: Get AI-generated task ideas
   - **Prioritize**: AI ranks your tasks by importance
   - **Break Down**: Split complex tasks into steps
3. Or ask a custom question in the input field
4. Click suggestions to add them as tasks

### Bookmarks (Saved Links)

#### Saving the Current Page
1. Navigate to any website
2. Click the **Links** tab
3. Click **🔖 Save Current Page** button
4. Page title and URL are automatically captured

#### Adding URLs Manually
1. Go to the **Links** tab
2. Paste or type a URL in the input field
3. Optionally add a custom title
4. Click **+** or press **Enter**

#### Managing Bookmarks
- **Open**: Click any bookmark card or the ↗ button
- **Search**: Type in the search box to filter bookmarks
- **Delete**: Click the × button on any bookmark
- **Clear All**: Remove all bookmarks at once


### Private Vault

#### First Time Setup
1. Go to the **Vault** tab
2. Enter a password (minimum 6 characters)
3. Click **Unlock** to create your vault

#### Using the Vault
- **Unlock**: Enter your password to access notes
- **Lock**: Click the Lock button to secure your vault
- **Change Password**: Click Change Password and follow prompts
- **Auto-Lock**: Vault locks after 5 minutes of inactivity

## 🔒 Security Features

### Encryption Details
- **Algorithm**: AES-256-GCM (Advanced Encryption Standard)
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000 (industry standard)
- **Salt**: 16-byte random salt per encryption
- **IV**: 12-byte random initialization vector
- **Storage**: Only encrypted data is stored

### Privacy
- ✅ All data stored locally or in Chrome sync storage
- ✅ No data sent to external servers (except AI API)
- ✅ Encryption happens client-side
- ✅ No tracking or analytics
- ✅ Open source - verify the code yourself

## 🛠️ Technical Stack

### Technologies
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: Chrome Storage API (sync)
- **Encryption**: Web Crypto API
- **AI**: Azure AI Models API
- **Manifest**: Chrome Extension Manifest V3

### File Structure
```
browser-todo-extension/
├── manifest.json         # Extension configuration (Manifest V3)
├── popup.html            # Main UI structure
├── popup.css             # Styling and dark theme
├── popup.js              # Main application logic
├── background.js         # Service worker for AI integration
├── icon.png              # Extension icon
└── README.md             # Documentation
```

### Key Features Implementation

#### Task Storage
```javascript
// Uses Chrome Storage API for cross-device sync
chrome.storage.sync.set({ tasks: [...] });
```

#### Encryption
```javascript
// AES-256-GCM with PBKDF2 key derivation
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

#### AI Integration
```javascript
// Background service worker handles AI requests
chrome.runtime.sendMessage({
  action: 'callAI',
  prompt: userPrompt
});
```

## 🎨 Customization

### Changing Colors
Edit `popup.css` and modify the CSS variables:
```css
:root {
  --primary: #E3311D;    /* Main accent color */
  --dark: #050507;       /* Background */
  --light: #ffffff;      /* Text */
  --gray: #1a1a1c;       /* Secondary background */
  --gray-light: #2a2a2e; /* Tertiary background */
}
```

### Adjusting Extension Size
```css
body {
  width: 400px;          /* Change width */
  min-height: 420px;     /* Change height */
}
```

## 🐛 Troubleshooting

### AI Features Not Working
- Ensure you've added your API key in `background.js`
- Check that you have an active internet connection
- Verify the API endpoint is accessible

### Tasks Not Syncing
- Check Chrome sync is enabled in Chrome settings
- Ensure you're signed into Chrome
- Check storage permissions in `manifest.json`

### Vault Not Unlocking
- Verify you're entering the correct password
- Check browser console for errors (F12)
- Try clearing extension data and setting up again

### Extension Not Loading
- Ensure all files are in the same folder
- Check for JavaScript errors in console
- Verify manifest.json is valid JSON

## 📝 Changelog

### Version 2.4 (Current)
- 🔖 Added Bookmarks/Saved Links feature
- 📋 One-click save current page with auto-capture
- ✍️ Manual URL entry with optional titles
- 🔍 Search bookmarks by title or URL
- 🔗 Click to open in new tab
- 💾 Cloud sync for bookmarks

### Version 2.3
- 🎨 Added Priority System with color-coded badges
- 🔄 One-click priority cycling (None/Low/Medium/High)
- 🎯 Priority filtering with visual indicators
- 📊 Automatic sorting by priority level
- ✨ Smooth animations and pulsing effects
- 🌈 Rainbow gradient "All" filter button

### Version 2.2
- ✨ Added encrypted Private Vault feature
- 🔒 Implemented AES-256-GCM encryption
- ⏰ Added auto-lock functionality
- 🎨 Improved UI/UX with better spacing
- 🐛 Fixed button text truncation issues
- 📱 Increased extension width to 400px

### Version 2.1
- 🤖 Added AI Assistant integration
- 💡 Task suggestions and prioritization
- 🔨 Task breakdown feature
- ✨ Auto-correct for task text

### Version 2.0
- 📓 Added Notes tab
- 🔍 Search functionality
- 🎨 Complete UI redesign
- ☁️ Cloud sync support

### Version 1.0
- 🎯 Basic task management
- ✅ Add, edit, delete tasks
- 📊 Task counter
- 🎨 Dark theme

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2026 Student To-Do Extension

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Icons and design inspired by modern productivity apps
- Encryption implementation based on Web Crypto API standards
- AI features powered by Azure AI Models
- Built with ❤️ for students everywhere

## 📧 Contact

For questions, suggestions, or issues:
- Open an issue on GitHub
- Email: Mohamednour.mrad@esprit.tn

---

<div align="center">

**Made with ❤️ for productive students**

⭐ Star this repo if you find it helpful!

</div>
