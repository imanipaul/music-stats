# scrobble.stats — Last.fm Dashboard

A dark-mode React dashboard for your Last.fm listening habits.

## Features
- Top artists, tracks, and albums with play counts
- Recent listening history with "now playing" support
- Daily scrobble trend chart
- Toggle between 7 days / 1 month / 6 months / 1 year / all time
- Your API key and username are saved in localStorage

## Setup

### 1. Get a Last.fm API key (free)
Go to https://www.last.fm/api/account/create and register an application.
Copy the **API key** (not the secret).

### 2. Enable scrobbling from Qobuz
In Qobuz: Settings → Connected Apps → Last.fm → Connect

### 3. Run the app

Make sure you have Node.js installed (https://nodejs.org), then:

```bash
cd lastfm-dashboard
npm install
npm start
```

The app opens at http://localhost:3000

### 4. Enter your credentials
Paste your Last.fm API key and username into the dashboard and click **load →**

## Tech
- React 18
- Chart.js + react-chartjs-2
- Last.fm REST API (no backend needed)
