import os
import requests
import feedparser
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/release-notes")
def get_release_notes():
    try:
        # Fetch the feed with a timeout
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        # Parse XML feed content
        feed = feedparser.parse(response.content)
        
        if feed.bozo:
            # Bozo is set to 1 if the feed is not well-formed XML
            print(f"Feed parsing warning: {feed.bozo_exception}")
            
        entries = []
        for entry in feed.entries:
            # Content can be under content or summary
            content_value = ""
            if "content" in entry and len(entry.content) > 0:
                content_value = entry.content[0].value
            elif "summary" in entry:
                content_value = entry.summary
                
            entries.append({
                "id": entry.get("id", ""),
                "title": entry.get("title", ""), # e.g. "June 25, 2026"
                "updated": entry.get("updated", ""), # e.g. "2026-06-25T00:00:00-07:00"
                "link": entry.get("link", ""),
                "content": content_value
            })
            
        return jsonify({
            "status": "success",
            "feed_title": feed.feed.get("title", "BigQuery Release Notes"),
            "feed_updated": feed.feed.get("updated", ""),
            "entries": entries
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    # Standard Flask app execution
    app.run(debug=True, host="127.0.0.1", port=5000)
