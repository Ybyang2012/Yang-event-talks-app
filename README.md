# BigQuery Release Notes Center 🚀

A modern, highly polished single-page dashboard application built with **Python Flask** on the backend and plain vanilla **HTML5, CSS3, and JavaScript** on the frontend. The application pulls Google Cloud's official BigQuery release notes XML feed, structures the updates, and enables developers to compose, preview, and share individual release items directly on X/Twitter with built-in smart character limits.

---

## ✨ Features

- **Real-Time XML Feed Parsing**: Automatically retrieves the official Atom/RSS feed from Google Cloud, parsing and structuring HTML updates on the client side.
- **Glassmorphic Dark UI**: Curated dark theme (`#0B0F19`) utilizing glassmorphism styles, typography scales (Outfit & Inter), and animated glowing status indicators.
- **Granular Update Splitting**: Breaks down updates published on the same day into discrete elements with separate tags (e.g., *Feature*, *Change*, *Deprecation*, *Announcement*) and individual Tweet handlers.
- **Unified Filtering & Search**: Instant, debounced sidebar search and category-based pill filtering to quickly find specific updates.
- **X/Twitter Composer Dialog**: A native `<dialog>` modal showing a simulated X/Twitter dark-mode post, character count tracker, and a warning system for tweets exceeding 280 characters.
- **Smart Shorten (Auto-Truncate)**: A custom algorithm that trims the description block of a tweet to fit within 280 characters while preserving source links, hashtags, and header details.
- **Micro-Animations & Skeletons**: CSS-powered skeleton screens and loading spinners provide instant visual feedback.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask, Feedparser, Requests.
- **Frontend**: Vanilla HTML5 (semantic elements, native `<dialog>`), CSS3 (Glassmorphic filters, CSS Variables, flex/grid layouts), modern JavaScript.
- **Icons**: Lucide Icons CDN.
- **Typography**: Google Fonts (Outfit, Inter, JetBrains Mono).

---

## 📂 Project Structure

```text
├── app.py                 # Main Flask server & XML parsing proxy
├── requirements.txt       # Python project dependencies
├── .gitignore             # Git ignore file for environments and IDEs
├── README.md              # Project documentation
├── templates/
│   └── index.html         # Main dashboard markup skeleton
└── static/
    ├── css/
    │   └── style.css      # Dark mode styling & responsive grid layouts
    └── js/
        └── app.js         # DOMParser engine, filters, & Twitter intent composer
```

---

## 🚀 Getting Started

### 1. Prerequisite
Make sure Python 3.8+ is installed.

### 2. Initialize Virtual Environment & Install Dependencies
Run the following commands in your terminal:

```bash
# Set up virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On macOS/Linux
# .venv\Scripts\activate   # On Windows

# Install required packages
pip install -r requirements.txt
```

### 3. Run the Flask Server
Start the development server:

```bash
python3 app.py
```

The application will start running on [http://127.0.0.1:5000/](http://127.0.0.1:5000/).

---

## 📖 How to Use

### 🔍 Search and Filter
- Use the sidebar search bar to type keywords. The notes timeline will filter instantly.
- Toggle between the **All**, **Features**, **Changes**, **Announcements**, and **Deprecations** pills to narrow updates down by type.

### 🔄 Fetch Latest Updates
- Click **"Refresh Notes"** at the top right. The button will spin, skeleton shimmers will appear, and the backend will fetch the most up-to-date feed from Google Cloud.

### 🐦 Share on X/Twitter
1. Find any specific update on the timeline and click **"Tweet update"**.
2. The Twitter modal will slide in, presenting you with a draft copy and a **Live Preview** of the tweet.
3. If the character counter in the bottom-right corner shows a warning (exceeding 280 characters), click the **"Auto-Shorten"** button. The app will truncate the text at a word boundary and append an ellipsis (`...`) before the link.
4. Click **"Open Twitter"** to launch the official X/Twitter Web Intent. The text will be pre-filled, letting you verify and post!

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
