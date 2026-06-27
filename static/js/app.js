// Global App State
let state = {
    feedTitle: 'BigQuery Release Notes',
    entries: [],          // Raw feed entries
    parsedUpdates: [],    // Structured individual updates
    filteredUpdates: [],  // Stored filtered list for export
    filters: {
        search: '',
        type: 'all'       // all, feature, change, announcement, deprecation, other
    },
    activeTweet: {
        update: null,
        entry: null,
        header: '',
        footer: '',
        body: ''
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initLucide();
    bindEvents();
    fetchReleaseNotes();
});

// Setup Icons
function initLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Bind DOM Events
function bindEvents() {
    // Refresh Button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchReleaseNotes(true);
        });
    }

    // Search Box Inputs
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.search = e.target.value.trim().toLowerCase();
            applyFilters();
        });
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            state.filters.search = '';
            applyFilters();
            searchInput.focus();
        });
    }

    // Filter Pills
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            const button = e.currentTarget;
            filterPills.forEach(p => p.classList.remove('active'));
            button.classList.add('active');
            state.filters.type = button.getAttribute('data-type');
            applyFilters();
        });
    });

    // Reset Filters in Empty State
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            state.filters.search = '';
            
            filterPills.forEach(p => p.classList.remove('active'));
            const allPill = document.querySelector('.filter-pill[data-type="all"]');
            if (allPill) allPill.classList.add('active');
            state.filters.type = 'all';
            
            applyFilters();
        });
    }

    // Mobile Sidebar Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.app-sidebar');
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar if clicking main content when sidebar is open on mobile
        document.querySelector('.app-main').addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Dialog Control Events
    const tweetDialog = document.getElementById('tweet-dialog');
    const closeDialogBtn = document.getElementById('close-dialog-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const submitTweetBtn = document.getElementById('submit-tweet-btn');
    const smartShortenBtn = document.getElementById('smart-shorten-btn');
    const tweetTextarea = document.getElementById('tweet-textarea');

    if (closeDialogBtn) closeDialogBtn.addEventListener('click', () => tweetDialog.close());
    if (cancelTweetBtn) cancelTweetBtn.addEventListener('click', () => tweetDialog.close());
    
    if (tweetTextarea) {
        tweetTextarea.addEventListener('input', (e) => {
            updateTweetPreview(e.target.value);
        });
    }

    if (smartShortenBtn) {
        smartShortenBtn.addEventListener('click', () => {
            const shortenedBody = calculateSmartShorten(
                state.activeTweet.header,
                state.activeTweet.body,
                state.activeTweet.footer
            );
            tweetTextarea.value = shortenedBody;
            updateTweetPreview(shortenedBody);
        });
    }

    if (submitTweetBtn) {
        submitTweetBtn.addEventListener('click', () => {
            const text = tweetTextarea.value;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(twitterUrl, '_blank', 'noopener,noreferrer');
            tweetDialog.close();
        });
    }

    // Export CSV Button
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            exportToCsv();
        });
    }
}

// Fetch from API
async function fetchReleaseNotes(isRefresh = false) {
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = refreshBtn ? refreshBtn.querySelector('.icon-refresh') : null;
    const skeletonLoader = document.getElementById('skeleton-loader');
    const notesContent = document.getElementById('notes-content');
    const emptyState = document.getElementById('empty-state');
    
    // Update Loading UI State
    if (refreshIcon) refreshIcon.classList.add('spinning');
    if (refreshBtn) refreshBtn.disabled = true;
    
    if (!isRefresh) {
        if (skeletonLoader) skeletonLoader.classList.remove('hidden');
        if (notesContent) notesContent.classList.add('hidden');
    }
    if (emptyState) emptyState.classList.add('hidden');

    try {
        const response = await fetch('/api/release-notes');
        if (!response.ok) {
            throw new Error(`Failed to fetch release notes: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.status === 'success') {
            state.feedTitle = data.feed_title;
            state.entries = data.entries;
            
            // Parse individual HTML content entries
            processEntries();
            
            // Update last fetch timestamp
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById('last-fetch-time').textContent = `Today at ${timeStr}`;
            document.getElementById('feed-subtitle').textContent = `Explore updates from the official Google Cloud Feed`;
            
            // Apply current filters and render
            applyFilters();
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        document.getElementById('feed-subtitle').textContent = `Error loading notes: ${error.message}`;
        document.getElementById('last-fetch-time').textContent = 'Failed to fetch';
        
        // Show empty state if there is no data loaded
        if (state.parsedUpdates.length === 0) {
            if (notesContent) notesContent.classList.add('hidden');
            if (emptyState) {
                emptyState.classList.remove('hidden');
                emptyState.querySelector('p').textContent = `We encountered an error connecting to the feed: ${error.message}`;
            }
        }
    } finally {
        if (refreshIcon) refreshIcon.classList.remove('spinning');
        if (refreshBtn) refreshBtn.disabled = false;
        if (skeletonLoader) skeletonLoader.classList.add('hidden');
    }
}

// Process entries into discrete structured updates
function processEntries() {
    const updates = [];
    
    state.entries.forEach(entry => {
        const entryId = entry.id;
        const entryTitle = entry.title; // e.g. "June 25, 2026"
        const entryUpdated = entry.updated;
        const entryLink = entry.link;
        
        // Parse the HTML content
        const parsedItems = parseReleaseHtml(entry.content);
        
        parsedItems.forEach((item, index) => {
            updates.push({
                uniqueId: `${entryId}-${index}`,
                entryId: entryId,
                date: entryTitle,
                updatedRaw: entryUpdated,
                link: entryLink,
                category: item.category, // e.g., "Feature", "Change"
                type: normalizeType(item.category), // e.g. "feature", "change"
                htmlContent: item.html,
                textContent: item.text,
                parentEntry: entry
            });
        });
    });
    
    state.parsedUpdates = updates;
}

// Parsing logic for BQ release notes HTML
function parseReleaseHtml(htmlStr) {
    if (!htmlStr) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlStr, 'text/html');
    const items = [];
    
    let currentCategory = 'Update';
    let currentNodes = [];
    
    // Traverse the parsed document body elements
    Array.from(doc.body.children).forEach(el => {
        if (el.tagName === 'H3') {
            // Push active group if elements exist
            if (currentNodes.length > 0) {
                items.push({
                    category: currentCategory,
                    html: currentNodes.map(n => n.outerHTML).join(''),
                    text: currentNodes.map(n => n.textContent).join('\n').trim()
                });
                currentNodes = [];
            }
            currentCategory = el.textContent.trim();
        } else {
            currentNodes.push(el);
        }
    });
    
    // Save final element group
    if (currentNodes.length > 0) {
        items.push({
            category: currentCategory,
            html: currentNodes.map(n => n.outerHTML).join(''),
            text: currentNodes.map(n => n.textContent).join('\n').trim()
        });
    }
    
    return items;
}

// Normalize update category headers to lowercase types
function normalizeType(category) {
    const cat = category.toLowerCase().trim();
    if (cat.includes('feature')) return 'feature';
    if (cat.includes('change')) return 'change';
    if (cat.includes('deprecation')) return 'deprecation';
    if (cat.includes('announcement') || cat.includes('notice')) return 'announcement';
    return 'other';
}

// Apply Search & Type Filters and Render
function applyFilters() {
    const searchVal = state.filters.search;
    const typeVal = state.filters.type;
    
    // Filter updates
    const filteredUpdates = state.parsedUpdates.filter(update => {
        // Category type filter
        if (typeVal !== 'all' && update.type !== typeVal) {
            return false;
        }
        
        // Search text filter
        if (searchVal) {
            const inDate = update.date.toLowerCase().includes(searchVal);
            const inCategory = update.category.toLowerCase().includes(searchVal);
            const inText = update.textContent.toLowerCase().includes(searchVal);
            return inDate || inCategory || inText;
        }
        
        return true;
    });
    
    // Save filtered list to state for CSV export
    state.filteredUpdates = filteredUpdates;

    // Update count display
    document.getElementById('total-updates-count').textContent = filteredUpdates.length;
    
    // Render using View Transitions if available for butter-smooth visuals
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            renderUpdates(filteredUpdates);
        });
    } else {
        renderUpdates(filteredUpdates);
    }
}

// Group filtered updates by Date and Render
function renderUpdates(filteredUpdates) {
    const notesContent = document.getElementById('notes-content');
    const emptyState = document.getElementById('empty-state');
    
    if (filteredUpdates.length === 0) {
        notesContent.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    notesContent.classList.remove('hidden');
    
    // Group updates by date
    const groups = {};
    filteredUpdates.forEach(update => {
        if (!groups[update.date]) {
            groups[update.date] = {
                date: update.date,
                link: update.link,
                updates: []
            };
        }
        groups[update.date].updates.push(update);
    });
    
    // Convert groups to array and sort by date descending (already sorted from feed)
    const sortedGroups = Object.values(groups);
    
    // Build HTML string
    let html = '';
    sortedGroups.forEach(group => {
        html += `
            <article class="release-group-card" style="view-transition-name: group-${group.date.replace(/[^a-zA-Z0-9]/g, '')}">
                <header class="release-group-header">
                    <div class="release-date">
                        <i data-lucide="calendar" class="release-date-icon"></i>
                        <span>${group.date}</span>
                    </div>
                    <a href="${group.link}" target="_blank" rel="noopener noreferrer" class="release-feed-link" title="Open official release notes page">
                        <i data-lucide="external-link"></i>
                    </a>
                </header>
                <div class="release-group-body">
                    ${group.updates.map(update => renderUpdateItem(update)).join('')}
                </div>
            </article>
        `;
    });
    
    notesContent.innerHTML = html;
    
    // Re-initialize icons inside rendered HTML
    initLucide();
    
    // Bind button actions
    bindTweetButtons(filteredUpdates);
    bindCopyButtons(filteredUpdates);
}

// Render HTML for a single update item
function renderUpdateItem(update) {
    return `
        <section class="release-update-item ${update.type}-item" id="update-item-${update.uniqueId}">
            <div class="update-meta-row">
                <span class="update-badge ${update.type}">${update.category}</span>
                <div class="update-actions">
                    <button class="btn-copy-action" data-id="${update.uniqueId}" title="Copy raw update text to clipboard">
                        <i data-lucide="copy"></i>
                        <span>Copy</span>
                    </button>
                    <button class="btn-tweet-action" data-id="${update.uniqueId}" title="Share this update on X/Twitter">
                        <i data-lucide="twitter"></i>
                        <span>Tweet update</span>
                    </button>
                </div>
            </div>
            <div class="update-text">
                ${update.htmlContent}
            </div>
        </section>
    `;
}

// Bind event listeners for dynamic Tweet buttons
function bindTweetButtons(filteredUpdates) {
    const buttons = document.querySelectorAll('.btn-tweet-action');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const updateId = e.currentTarget.getAttribute('data-id');
            const targetUpdate = filteredUpdates.find(u => u.uniqueId === updateId);
            
            if (targetUpdate) {
                openTweetComposer(targetUpdate);
            }
        });
    });
}

// Open and populate the Tweet composer dialog
function openTweetComposer(update) {
    const tweetDialog = document.getElementById('tweet-dialog');
    const tweetTextarea = document.getElementById('tweet-textarea');
    
    // Compose tweet pieces
    const emojiMap = {
        'feature': '🚀',
        'change': '🔄',
        'deprecation': '⚠️',
        'announcement': '📢',
        'other': '📝'
    };
    
    const emoji = emojiMap[update.type] || '📝';
    const cleanText = cleanHtmlText(update.textContent);
    
    const header = `BigQuery ${update.category} (${update.date}):\n${emoji} `;
    const footer = `\n\nRead more: ${update.link}\n#BigQuery #GCP`;
    
    // Save to active state
    state.activeTweet = {
        update: update,
        entry: update.parentEntry,
        header: header,
        footer: footer,
        body: cleanText
    };
    
    // Calculate final draft (truncating if it exceeds 280 immediately is helpful, but we let user see)
    const initialText = `${header}${cleanText}${footer}`;
    
    // Populate form
    tweetTextarea.value = initialText;
    updateTweetPreview(initialText);
    
    // Show Modal
    tweetDialog.showModal();
}

// Strips unnecessary whitespace or double newlines from raw parsed text
function cleanHtmlText(text) {
    if (!text) return '';
    return text
        .replace(/\n\s*\n/g, '\n') // strip double blank lines
        .trim();
}

// Live update of preview and character limit warnings
function updateTweetPreview(fullText) {
    const charCount = document.getElementById('char-count');
    const warningBanner = document.getElementById('char-limit-warning');
    const submitBtn = document.getElementById('submit-tweet-btn');
    const previewText = document.getElementById('tweet-preview-text');
    
    const count = fullText.length;
    charCount.textContent = count;
    
    // Update counter color
    if (count > 280) {
        charCount.className = 'char-count-container error';
        warningBanner.classList.remove('hidden');
    } else if (count > 250) {
        charCount.className = 'char-count-container warning';
        warningBanner.classList.add('hidden');
    } else {
        charCount.className = 'char-count-container';
        warningBanner.classList.add('hidden');
    }
    
    // Mock tweet text parsing links for nice styling in preview
    let styledPreview = escapeHTML(fullText)
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
        .replace(/(#[a-zA-Z0-9_]+)/g, '<span style="color: #1d9bf0;">$1</span>');
        
    previewText.innerHTML = styledPreview;
}

// Calculate the Smart Shorten body to fit 280 chars
function calculateSmartShorten(header, body, footer) {
    const maxLen = 280;
    const staticLen = header.length + footer.length;
    const allowedBodyLen = maxLen - staticLen - 4; // 4 extra characters for " ..."
    
    if (allowedBodyLen <= 0) {
        // Links are too long, return original or minimal body
        return `${header}${body.substring(0, 10)}...${footer}`;
    }
    
    if ((header + body + footer).length <= maxLen) {
        return `${header}${body}${footer}`; // fits perfectly, no shortening
    }
    
    let truncated = body.substring(0, allowedBodyLen);
    
    // Try to cut nicely at a word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > allowedBodyLen * 0.7) {
        truncated = truncated.substring(0, lastSpace);
    }
    
    return `${header}${truncated.trim()}...${footer}`;
}

// Small helper to escape html characters for safety
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Bind event listeners for copy buttons
function bindCopyButtons(filteredUpdates) {
    const buttons = document.querySelectorAll('.btn-copy-action');
    buttons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const button = e.currentTarget;
            const updateId = button.getAttribute('data-id');
            const targetUpdate = filteredUpdates.find(u => u.uniqueId === updateId);
            
            if (targetUpdate) {
                try {
                    // Extract text content and copy to clipboard
                    await navigator.clipboard.writeText(targetUpdate.textContent);
                    
                    // Show success feedback
                    button.classList.add('copied');
                    button.innerHTML = '<i data-lucide="check"></i><span>Copied!</span>';
                    initLucide();
                    
                    // Reset after 1.5s
                    setTimeout(() => {
                        button.classList.remove('copied');
                        button.innerHTML = '<i data-lucide="copy"></i><span>Copy</span>';
                        initLucide();
                    }, 1500);
                } catch (err) {
                    console.error('Clipboard copy failed:', err);
                }
            }
        });
    });
}

// Export filtered updates to CSV file
function exportToCsv() {
    const updates = state.filteredUpdates || [];
    if (updates.length === 0) {
        alert("No updates matching the current filters to export.");
        return;
    }
    
    // Helper to sanitize text for CSV format
    const escapeCsv = (text) => {
        if (text === null || text === undefined) return '';
        let stringValue = text.toString();
        // Replace quotes with double quotes
        stringValue = stringValue.replace(/"/g, '""');
        // Wrap in quotes if it contains commas, newlines, or quotes
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue}"`;
        }
        return stringValue;
    };
    
    const headers = ['Date', 'Category', 'Normalized Type', 'Content Text', 'Release Link'];
    const rows = updates.map(u => [
        u.date,
        u.category,
        u.type,
        u.textContent,
        u.link
    ]);
    
    const csvContent = [
        headers.map(escapeCsv).join(','),
        ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');
    
    // Trigger browser file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_release_notes_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
