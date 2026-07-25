# WanderAI — AI Travel Agent & Itinerary Planner

> **A fully functional, real-time AI-powered travel planning web application with live geocoding, weather forecasts, interactive maps, ride-hailing, and food delivery integrations.**

---

## ✨ Features

- 🗺️ **Real-Time Geocoding** — Powered by OpenStreetMap Nominatim API
- 🌤️ **Live Weather Forecast** — Powered by Open-Meteo API
- 📍 **Real Points of Interest** — Pulled live from Overpass/OpenStreetMap spatial API
- 📏 **Haversine Distance Calculator** — Accurate transit times between stops
- 🏨 **Hotel Booking** — Direct Booking.com deep-links
- ✈️ **Flight Search** — Google Flights direct integration
- 🚕 **Ride-Hailing** — Uber, Rapido, Grab, Bolt deep-links per destination
- 🍱 **Food Delivery** — Zomato, Swiggy, Uber Eats, DoorDash, Deliveroo deep-links
- 📅 **iCal Calendar Export** — Sync itinerary directly to Google/Apple Calendar
- 🔗 **Shareable Trip Links** — Base64 encoded URL sharing
- 🖨️ **Print/PDF Export** — Clean print stylesheets
- 🌙 **Dark/Light Theme Toggle**
- 💾 **Save Trips** — Local browser storage persistence

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | HTML5, Vanilla CSS (Glassmorphism), Vanilla JavaScript |
| **Backend** | Python 3.x, Flask, Flask-CORS |
| **Maps** | Leaflet.js + OpenStreetMap |
| **Geocoding** | OpenStreetMap Nominatim API |
| **Weather** | Open-Meteo Free API |
| **Attractions** | OpenStreetMap Overpass API |

---

## 📁 Project Structure

```
ai-travel-agent/
├── index.html          # Full frontend UI layout & modals
├── styles.css          # Glassmorphism dark/light design system
├── app.js              # Frontend logic, maps, iCal, ride & food links
├── start_app.bat       # 1-click launcher (Windows)
├── backend/
│   └── app.py          # Python Flask REST API backend
├── assets/
│   ├── hero-bg.jpg     # Hero banner background
│   └── tokyo.jpg       # Destination preview image
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.x installed
- pip (Python package manager)

### 1. Install Backend Dependencies
```bash
pip install flask flask-cors requests
```

### 2. Start the Application (Windows)
Simply double-click `start_app.bat` — it starts both servers and opens the app automatically.

**OR manually:**

```bash
# Terminal 1: Start Backend (port 5000)
python backend/app.py

# Terminal 2: Start Frontend (port 8080)
python -m http.server 8080
```

### 3. Open in Browser
```
http://localhost:8080
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/health` | `GET` | Backend health check |
| `/api/generate-itinerary` | `POST` | Generate full travel plan |
| `/api/refine-itinerary` | `POST` | Refine existing plan with prompt |

### Example Request — Generate Itinerary
```json
POST /api/generate-itinerary
{
  "location": "Paris, France",
  "originCity": "New Delhi",
  "days": 5,
  "budgetTier": "moderate",
  "vibe": "Cultural"
}
```

---

## 🌍 Supported Ride & Food Apps by Region

| Region | Ride-Hailing | Food Delivery |
|:---|:---|:---|
| 🇮🇳 India | Uber, Rapido, Ola | Zomato, Swiggy |
| 🇯🇵 Japan | Uber Japan, GO Taxi | Uber Eats, Tabelog |
| 🇫🇷 France | Uber, Bolt | Uber Eats, Deliveroo |
| 🇺🇸 USA | Uber, Lyft | DoorDash, Uber Eats |
| 🇬🇧 UK | Uber, Bolt | Deliveroo, Just Eat |
| 🇮🇩 Indonesia | Grab, Gojek | GrabFood, GoFood |

---

## 🗓️ iCal Calendar Export

Click **"Sync iCal"** to download a `.ics` file compatible with:
- Google Calendar
- Apple iCal
- Microsoft Outlook

---

## 📜 License

MIT License — Free to use, modify, and distribute.

---

## 🙌 Credits

Built with ❤️ using:
- [OpenStreetMap](https://www.openstreetmap.org/) — Map data & geocoding
- [Open-Meteo](https://open-meteo.com/) — Free weather API
- [Leaflet.js](https://leafletjs.com/) — Interactive maps
- [Flask](https://flask.palletsprojects.com/) — Python backend framework
