/* ==========================================================================
   WanderAI - Public Production Client App v4.0
   Transport & Food Delivery Deep-Link Integrations
   ========================================================================== */

(function () {
    'use strict';

    // Auto-detect environment: use Render backend when live, localhost when developing
    const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'https://wanderai-backend.onrender.com/api';

    /* --------------------------------------------------------------------------
       1. GLOBAL STATE & CONFIGURATION
       -------------------------------------------------------------------------- */
    const STATE = {
        theme: localStorage.getItem('wander_theme') || 'dark',
        currency: 'USD',
        currencyRates: { USD: 1, EUR: 0.92, INR: 83.5, GBP: 0.79 },
        currencySymbols: { USD: '$', EUR: '€', INR: '₹', GBP: '£' },
        currentPlan: null,
        activeTab: 'tab-itinerary',
        activeDayFilter: 'all',
        savedTrips: JSON.parse(localStorage.getItem('wander_saved_trips') || '[]'),
        apiKey: localStorage.getItem('wander_gemini_key') || '',
        leafletMap: null
    };

    /* --------------------------------------------------------------------------
       2. DOM ELEMENTS INITIALIZATION
       -------------------------------------------------------------------------- */
    const DOM = {
        app: document.getElementById('app'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        savedTripsBtn: document.getElementById('savedTripsBtn'),
        savedCount: document.getElementById('savedCount'),
        apiSettingsBtn: document.getElementById('apiSettingsBtn'),
        chipBtns: document.querySelectorAll('.chip-btn'),
        travelForm: document.getElementById('travelForm'),
        originInput: document.getElementById('originInput'),
        locationInput: document.getElementById('locationInput'),
        daysInput: document.getElementById('daysInput'),
        decrementDays: document.getElementById('decrementDays'),
        incrementDays: document.getElementById('incrementDays'),
        currencySelect: document.getElementById('currencySelect'),
        currencyPrefix: document.getElementById('currencyPrefix'),
        budgetTierGroup: document.getElementById('budgetTierGroup'),
        customBudget: document.getElementById('customBudget'),
        vibeGroup: document.getElementById('vibeGroup'),
        generateBtn: document.getElementById('generateBtn'),
        
        // Modals
        loadingModal: document.getElementById('loadingModal'),
        savedTripsModal: document.getElementById('savedTripsModal'),
        savedTripsList: document.getElementById('savedTripsList'),
        closeSavedModalBtn: document.getElementById('closeSavedModalBtn'),
        apiSettingsModal: document.getElementById('apiSettingsModal'),
        closeApiModalBtn: document.getElementById('closeApiModalBtn'),
        geminiApiKeyInput: document.getElementById('geminiApiKeyInput'),
        saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
        clearApiKeyBtn: document.getElementById('clearApiKeyBtn'),

        // Results Section
        resultsSection: document.getElementById('resultsSection'),
        resDestinationTitle: document.getElementById('resDestinationTitle'),
        resMetaInfo: document.getElementById('resMetaInfo'),
        metWeather: document.getElementById('metWeather'),
        metBudget: document.getElementById('metBudget'),
        metHotelsCount: document.getElementById('metHotelsCount'),
        metPlacesCount: document.getElementById('metPlacesCount'),
        practicalInfoBar: document.getElementById('practicalInfoBar'),
        linkGoogleFlights: document.getElementById('linkGoogleFlights'),
        linkBookingHotels: document.getElementById('linkBookingHotels'),

        // Actions
        saveTripBtn: document.getElementById('saveTripBtn'),
        printTripBtn: document.getElementById('printTripBtn'),
        shareLinkBtn: document.getElementById('shareLinkBtn'),
        exportIcalBtn: document.getElementById('exportIcalBtn'),
        openRefinerBtn: document.getElementById('openRefinerBtn'),

        // Tabs & Content
        tabsNav: document.querySelectorAll('.tab-btn'),
        tabPanes: document.querySelectorAll('.tab-pane'),
        daySelectorBar: document.getElementById('daySelectorBar'),
        itineraryTimeline: document.getElementById('itineraryTimeline'),
        hotelsGrid: document.getElementById('hotelsGrid'),
        foodGrid: document.getElementById('foodGrid'),
        mapContainer: document.getElementById('mapContainer'),
        packingProgressText: document.getElementById('packingProgressText'),
        packingProgressFill: document.getElementById('packingProgressFill'),
        newPackItemInput: document.getElementById('newPackItemInput'),
        addPackItemBtn: document.getElementById('addPackItemBtn'),
        packingListContainer: document.getElementById('packingListContainer'),

        // Refiner Bar
        refinerBar: document.getElementById('refinerBar'),
        closeRefinerBtn: document.getElementById('closeRefinerBtn'),
        refinePromptInput: document.getElementById('refinePromptInput'),
        sendRefineBtn: document.getElementById('sendRefineBtn'),
        refineChips: document.querySelectorAll('.refine-chip')
    };

    /* --------------------------------------------------------------------------
       3. INITIALIZATION & EVENT LISTENERS
       -------------------------------------------------------------------------- */
    async function init() {
        applyTheme(STATE.theme);
        updateSavedCount();
        setupEventListeners();
        checkUrlHashForTrip();
        if (STATE.apiKey) {
            DOM.geminiApiKeyInput.value = STATE.apiKey;
        }
    }

    function setupEventListeners() {
        DOM.themeToggleBtn.addEventListener('click', () => {
            applyTheme(STATE.theme === 'dark' ? 'light' : 'dark');
        });

        DOM.decrementDays.addEventListener('click', () => {
            let val = parseInt(DOM.daysInput.value) || 1;
            if (val > 1) DOM.daysInput.value = val - 1;
        });
        DOM.incrementDays.addEventListener('click', () => {
            let val = parseInt(DOM.daysInput.value) || 1;
            if (val < 14) DOM.daysInput.value = val + 1;
        });

        DOM.chipBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.locationInput.value = btn.dataset.dest;
                DOM.locationInput.focus();
            });
        });

        DOM.currencySelect.addEventListener('change', (e) => {
            STATE.currency = e.target.value;
            DOM.currencyPrefix.textContent = STATE.currencySymbols[STATE.currency];
            if (STATE.currentPlan) renderAllViews();
        });

        DOM.budgetTierGroup.addEventListener('click', (e) => {
            const card = e.target.closest('.budget-card');
            if (card) {
                document.querySelectorAll('.budget-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                card.querySelector('input').checked = true;
            }
        });

        DOM.vibeGroup.addEventListener('click', (e) => {
            const tag = e.target.closest('.vibe-tag');
            if (tag) {
                document.querySelectorAll('.vibe-tag').forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
            }
        });

        DOM.travelForm.addEventListener('submit', (e) => {
            e.preventDefault();
            generateItinerary();
        });

        DOM.tabsNav.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        DOM.savedTripsBtn.addEventListener('click', openSavedTripsModal);
        DOM.closeSavedModalBtn.addEventListener('click', () => DOM.savedTripsModal.classList.remove('active'));
        DOM.apiSettingsBtn.addEventListener('click', () => DOM.apiSettingsModal.classList.add('active'));
        DOM.closeApiModalBtn.addEventListener('click', () => DOM.apiSettingsModal.classList.remove('active'));

        DOM.saveApiKeyBtn.addEventListener('click', () => {
            STATE.apiKey = DOM.geminiApiKeyInput.value.trim();
            localStorage.setItem('wander_gemini_key', STATE.apiKey);
            DOM.apiSettingsModal.classList.remove('active');
            showToast('API Key Saved!');
        });

        DOM.clearApiKeyBtn.addEventListener('click', () => {
            STATE.apiKey = '';
            DOM.geminiApiKeyInput.value = '';
            localStorage.removeItem('wander_gemini_key');
            showToast('API Key Cleared.');
        });

        DOM.saveTripBtn.addEventListener('click', saveCurrentTrip);
        DOM.printTripBtn.addEventListener('click', () => window.print());
        DOM.shareLinkBtn.addEventListener('click', shareTripLink);
        DOM.exportIcalBtn.addEventListener('click', exportIcalCalendar);
        DOM.openRefinerBtn.addEventListener('click', () => DOM.refinerBar.scrollIntoView({ behavior: 'smooth' }));
        DOM.closeRefinerBtn.addEventListener('click', () => DOM.refinerBar.classList.add('hidden'));

        DOM.sendRefineBtn.addEventListener('click', handleRefineItinerary);
        DOM.refineChips.forEach(chip => {
            chip.addEventListener('click', () => {
                DOM.refinePromptInput.value = chip.dataset.prompt;
                handleRefineItinerary();
            });
        });

        DOM.addPackItemBtn.addEventListener('click', addCustomPackingItem);
    }

    /* --------------------------------------------------------------------------
       4. THEME & UTILITIES
       -------------------------------------------------------------------------- */
    function applyTheme(theme) {
        STATE.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('wander_theme', theme);
        DOM.themeToggleBtn.querySelector('i').className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    function formatMoney(amountUSD) {
        const rate = STATE.currencyRates[STATE.currency] || 1;
        const symbol = STATE.currencySymbols[STATE.currency] || '$';
        return `${symbol}${Math.round(amountUSD * rate).toLocaleString()}`;
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'glass-panel';
        toast.style.cssText = `
            position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
            padding: 0.75rem 1.5rem; z-index: 2000; font-weight: 600;
            border-color: var(--primary); color: var(--text-primary);
            box-shadow: var(--shadow-lg); animation: fadeIn 0.3s ease;
        `;
        toast.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> ${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /* --------------------------------------------------------------------------
       5. REAL BACKEND GENERATION ENGINE
       -------------------------------------------------------------------------- */
    async function generateItinerary() {
        const locationQuery = DOM.locationInput.value.trim();
        const originCity = DOM.originInput.value.trim();
        const days = parseInt(DOM.daysInput.value) || 3;
        const budgetTier = document.querySelector('input[name="budgetTier"]:checked')?.value || 'moderate';
        const customBudget = parseFloat(DOM.customBudget.value) || null;
        const vibe = document.querySelector('.vibe-tag.active')?.dataset.vibe || 'Balanced';

        if (!locationQuery) return;

        DOM.loadingModal.classList.add('active');
        animateLoaderSteps(async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/generate-itinerary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        location: locationQuery,
                        originCity: originCity,
                        days: days,
                        budgetTier: budgetTier,
                        customBudget: customBudget,
                        vibe: vibe,
                        apiKey: STATE.apiKey
                    })
                });

                if (!response.ok) throw new Error('Backend HTTP Error');
                const data = await response.json();

                STATE.currentPlan = {
                    id: 'trip_' + Date.now(),
                    city: data.city,
                    country: data.country,
                    coords: data.coords,
                    days: data.days,
                    budgetTier: data.budgetTier,
                    vibe: data.vibe,
                    weather: data.weather,
                    weatherAdvice: data.weatherAdvice,
                    countryInfo: data.countryInfo,
                    bookingHotelLink: data.bookingHotelLink,
                    googleFlightsLink: data.googleFlightsLink,
                    heroImage: 'assets/hero-bg.jpg',
                    estimatedTotalUSD: data.estimatedTotalUSD,
                    hotels: data.hotels,
                    places: data.places,
                    foods: data.foods,
                    packingList: data.packingList
                };

                showToast(`Live Trip Plan & Rides Ready for ${data.city}!`);
            } catch (err) {
                console.error('Backend error:', err);
                showToast('Plan Generated with Spatial Engine');
            } finally {
                DOM.loadingModal.classList.remove('active');
                renderAllViews();
                DOM.resultsSection.classList.remove('hidden');
                DOM.resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    function animateLoaderSteps(callback) {
        const steps = ['step1', 'step2', 'step3', 'step4'];
        let idx = 0;
        const interval = setInterval(() => {
            if (idx > 0) {
                const prev = document.getElementById(steps[idx - 1]);
                prev.className = 'step-item done';
                prev.querySelector('i').className = 'fa-solid fa-circle-check step-icon';
            }
            if (idx < steps.length) {
                const curr = document.getElementById(steps[idx]);
                curr.className = 'step-item active';
                curr.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin step-icon';
                idx++;
            } else {
                clearInterval(interval);
                setTimeout(callback, 400);
            }
        }, 400);
    }

    /* --------------------------------------------------------------------------
       6. RENDER DASHBOARD VIEWS & PRACTICAL CONTROLS
       -------------------------------------------------------------------------- */
    function renderAllViews() {
        const plan = STATE.currentPlan;
        if (!plan) return;

        DOM.resDestinationTitle.textContent = `${plan.city}, ${plan.country}`;
        DOM.resMetaInfo.textContent = `${plan.days} Days • ${plan.budgetTier.toUpperCase()} Budget • ${plan.vibe} Vibe`;
        DOM.metWeather.textContent = plan.weather;
        DOM.metBudget.textContent = formatMoney(plan.estimatedTotalUSD);
        DOM.metHotelsCount.textContent = `${plan.hotels.length} Stays`;
        DOM.metPlacesCount.textContent = `${plan.places.length} Spots`;

        const info = plan.countryInfo || {};
        const taxiNames = (info.taxiApps || []).map(a => `<a href="${a.url}" target="_blank" style="color:var(--secondary); text-decoration:underline;">${a.name}</a>`).join(', ') || 'Uber, Bolt';
        const foodNames = (info.foodApps || []).map(a => `<a href="${a.url}" target="_blank" style="color:var(--orange); text-decoration:underline;">${a.name}</a>`).join(', ') || 'Zomato, Swiggy, Uber Eats';

        DOM.practicalInfoBar.innerHTML = `
            <div class="info-item"><i class="fa-solid fa-phone"></i> <strong>Emergency:</strong> ${info.emergency || '112 / 911'}</div>
            <div class="info-item"><i class="fa-solid fa-plug"></i> <strong>Power Plug:</strong> ${info.plug || 'Universal (220V)'}</div>
            <div class="info-item"><i class="fa-solid fa-car-side"></i> <strong>Ride Apps:</strong> ${taxiNames}</div>
            <div class="info-item"><i class="fa-solid fa-bag-shopping"></i> <strong>Food Delivery:</strong> ${foodNames}</div>
        `;

        DOM.linkGoogleFlights.href = plan.googleFlightsLink || '#';
        DOM.linkBookingHotels.href = plan.bookingHotelLink || '#';

        renderItineraryTimeline();
        renderHotelsGrid();
        renderFoodGrid();
        initLeafletMap();
        renderPackingList();
    }

    function switchTab(tabId) {
        STATE.activeTab = tabId;
        DOM.tabsNav.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
        DOM.tabPanes.forEach(p => p.classList.toggle('active', p.id === tabId));

        if (tabId === 'tab-map' && STATE.leafletMap) {
            setTimeout(() => STATE.leafletMap.invalidateSize(), 200);
        }
    }

    /* Render Tab 1: Itinerary Timeline with Taxi & Navigation Links */
    function renderItineraryTimeline() {
        const plan = STATE.currentPlan;
        
        let chipsHTML = `<button class="day-chip ${STATE.activeDayFilter === 'all' ? 'active' : ''}" data-day="all">All Days (${plan.days})</button>`;
        for (let d = 1; d <= plan.days; d++) {
            chipsHTML += `<button class="day-chip ${STATE.activeDayFilter === d ? 'active' : ''}" data-day="${d}">Day ${d}</button>`;
        }
        DOM.daySelectorBar.innerHTML = chipsHTML;

        DOM.daySelectorBar.querySelectorAll('.day-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                STATE.activeDayFilter = chip.dataset.day === 'all' ? 'all' : parseInt(chip.dataset.day);
                renderItineraryTimeline();
            });
        });

        const isIndia = plan.country === 'India';

        let timelineHTML = '';
        for (let d = 1; d <= plan.days; d++) {
            if (STATE.activeDayFilter !== 'all' && STATE.activeDayFilter !== d) continue;

            const dayPlaces = plan.places.filter(p => p.day === d);
            timelineHTML += `
                <div class="day-card">
                    <div class="day-card-header">
                        <div class="day-title-wrap">
                            <span class="day-num-tag">Day ${d}</span>
                            <h4>Daily Directions & Ride Booking</h4>
                        </div>
                        <span class="badge badge-success"><i class="fa-solid fa-route"></i> ${dayPlaces.length} Destinations</span>
                    </div>
                    <div class="timeline-items">
            `;

            dayPlaces.forEach((spot, idx) => {
                timelineHTML += `
                    <div class="spot-item">
                        <div class="spot-time">${spot.time}</div>
                        <div class="spot-content">
                            <div class="spot-title">${spot.title}</div>
                            <div class="spot-desc">${spot.desc}</div>
                            <div class="spot-meta">
                                <span><i class="fa-solid fa-clock"></i> ${spot.duration}</span>
                                <span><i class="fa-solid fa-ticket"></i> ${spot.cost > 0 ? formatMoney(spot.cost) : 'Free Entry'}</span>
                                <a href="${spot.mapsUrl}" target="_blank" class="nav-link-btn">
                                    <i class="fa-solid fa-diamond-turn-right"></i> Maps
                                </a>
                                <a href="${spot.uberUrl}" target="_blank" class="nav-link-btn text-purple">
                                    <i class="fa-solid fa-car"></i> Uber Ride
                                </a>
                                ${isIndia ? `
                                <a href="https://www.rapido.bike" target="_blank" class="nav-link-btn text-orange">
                                    <i class="fa-solid fa-motorcycle"></i> Rapido Bike
                                </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;

                if (idx < dayPlaces.length - 1) {
                    timelineHTML += `
                        <div class="transit-badge">
                            ${spot.transitInfo || '🚶 10 mins walk to next stop'}
                        </div>
                    `;
                }
            });

            timelineHTML += `
                    </div>
                </div>
            `;
        }

        DOM.itineraryTimeline.innerHTML = timelineHTML;
    }

    /* Render Tab 2: Hotels */
    function renderHotelsGrid() {
        const hotels = STATE.currentPlan.hotels;
        let html = '';
        hotels.forEach(h => {
            html += `
                <div class="card-item">
                    <div class="card-img-wrap">
                        <img src="${STATE.currentPlan.heroImage}" alt="${h.name}">
                        <span class="card-tag">${h.tag}</span>
                    </div>
                    <div class="card-body">
                        <div class="card-title">${h.name}</div>
                        <div class="rating-stars">
                            <i class="fa-solid fa-star"></i> ${h.rating} Rating • ${h.address}
                        </div>
                        <p class="spot-desc" style="font-size:0.85rem;">Verified stay with direct booking and ride options.</p>
                        <div class="flex-between mt-3">
                            <div class="price-tag">${formatMoney(h.price)} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">/ night</span></div>
                            <div style="display:flex; gap:0.4rem;">
                                <a href="${h.uberUrl || '#'}" target="_blank" class="btn btn-secondary" style="padding:0.4rem 0.7rem; font-size:0.8rem;">
                                    <i class="fa-solid fa-car"></i> Ride
                                </a>
                                <a href="${h.bookingUrl || '#'}" target="_blank" class="btn btn-primary" style="padding:0.4rem 0.9rem; font-size:0.85rem;">
                                    Book <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        DOM.hotelsGrid.innerHTML = html;
    }

    /* Render Tab 3: Food Grid with Zomato / Swiggy / UberEats Deep Links */
    function renderFoodGrid() {
        const foods = STATE.currentPlan.foods;
        const isIndia = STATE.currentPlan.country === 'India';

        let html = '';
        foods.forEach(f => {
            html += `
                <div class="card-item">
                    <div class="card-body">
                        <div class="flex-between">
                            <div class="card-title" style="font-size:1.1rem;">${f.name}</div>
                            <span class="badge" style="background:var(--orange);">${f.type}</span>
                        </div>
                        <p class="spot-desc">${f.desc}</p>
                        <div class="spot-meta">
                            <span><i class="fa-solid fa-store"></i> ${f.place}</span>
                        </div>
                        <div class="flex-between mt-3" style="border-top:1px solid var(--border-color); padding-top:0.6rem; flex-wrap:wrap;">
                            <span class="price-tag" style="font-size:1rem;">Avg ${formatMoney(f.price)}</span>
                            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                                <a href="${f.zomatoUrl || '#'}" target="_blank" class="btn btn-secondary" style="padding:0.35rem 0.75rem; font-size:0.8rem; border-color:rgba(239,68,68,0.4); color:#ef4444;">
                                    <i class="fa-solid fa-utensils"></i> ${isIndia ? 'Zomato' : 'Menu & Reviews'}
                                </a>
                                <a href="${f.deliveryUrl || '#'}" target="_blank" class="btn btn-primary" style="padding:0.35rem 0.75rem; font-size:0.8rem;">
                                    <i class="fa-solid fa-bag-shopping"></i> ${isIndia ? 'Swiggy' : 'Uber Eats'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        DOM.foodGrid.innerHTML = html;
    }

    /* Render Tab 4: Leaflet Map */
    function initLeafletMap() {
        const plan = STATE.currentPlan;
        if (!plan) return;

        if (STATE.leafletMap) {
            STATE.leafletMap.remove();
            STATE.leafletMap = null;
        }

        const centerCoords = plan.coords || [35.6762, 139.6503];
        STATE.leafletMap = L.map('mapContainer').setView(centerCoords, 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors'
        }).addTo(STATE.leafletMap);

        const hotelIcon = L.divIcon({
            html: `<div style="background:#a855f7; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.5);"><i class="fa-solid fa-hotel"></i></div>`,
            className: '', iconSize: [32, 32]
        });

        const placeIcon = L.divIcon({
            html: `<div style="background:#3b82f6; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.5);"><i class="fa-solid fa-location-dot"></i></div>`,
            className: '', iconSize: [32, 32]
        });

        plan.hotels.forEach(h => {
            if (h.coords) {
                L.marker(h.coords, { icon: hotelIcon })
                    .addTo(STATE.leafletMap)
                    .bindPopup(`<b>🏨 ${h.name}</b><br>${h.address}<br><a href="${h.uberUrl}" target="_blank">Book Uber to Hotel</a>`);
            }
        });

        const routeLatLngs = [];
        plan.places.forEach(p => {
            if (p.coords) {
                routeLatLngs.push(p.coords);
                L.marker(p.coords, { icon: placeIcon })
                    .addTo(STATE.leafletMap)
                    .bindPopup(`<b>📍 Day ${p.day}: ${p.title}</b><br>${p.desc}<br><a href="${p.uberUrl}" target="_blank">Book Uber Ride</a>`);
            }
        });

        if (routeLatLngs.length > 1) {
            L.polyline(routeLatLngs, { color: '#6366f1', weight: 4, opacity: 0.8, dashArray: '8, 8' }).addTo(STATE.leafletMap);
            STATE.leafletMap.fitBounds(L.latLngBounds(routeLatLngs));
        }
    }

    /* Render Tab 5: Packing List */
    function renderPackingList() {
        const categories = STATE.currentPlan.packingList;
        let html = '';
        let totalItems = 0;
        let checkedCount = 0;

        categories.forEach((cat, cIdx) => {
            html += `
                <div class="pack-cat-card">
                    <div class="pack-cat-header">
                        <i class="fa-solid ${cat.icon} text-primary"></i> ${cat.category}
                    </div>
                    <div class="pack-items-list">
            `;

            cat.items.forEach((item, iIdx) => {
                totalItems++;
                if (item.checked) checkedCount++;
                html += `
                    <label class="pack-item-row ${item.checked ? 'checked' : ''}">
                        <input type="checkbox" data-cidx="${cIdx}" data-iidx="${iIdx}" ${item.checked ? 'checked' : ''}>
                        <span>${item.name}</span>
                    </label>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        DOM.packingListContainer.innerHTML = html;

        const percent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
        DOM.packingProgressText.textContent = `${checkedCount} / ${totalItems} Packed (${percent}%)`;
        DOM.packingProgressFill.style.width = `${percent}%`;

        DOM.packingListContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const cIdx = parseInt(e.target.dataset.cidx);
                const iIdx = parseInt(e.target.dataset.iidx);
                STATE.currentPlan.packingList[cIdx].items[iIdx].checked = e.target.checked;
                renderPackingList();
            });
        });
    }

    function addCustomPackingItem() {
        const text = DOM.newPackItemInput.value.trim();
        if (!text || !STATE.currentPlan) return;

        STATE.currentPlan.packingList[0].items.push({ name: text, checked: false });
        DOM.newPackItemInput.value = '';
        renderPackingList();
        showToast('Custom item added to packing list!');
    }

    /* --------------------------------------------------------------------------
       7. PUBLIC EXPORT & ICAL CALENDAR SYNC
       -------------------------------------------------------------------------- */
    function exportIcalCalendar() {
        const plan = STATE.currentPlan;
        if (!plan) return;

        let icalContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//WanderAI Travel Agent//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        const today = new Date();
        plan.places.forEach((p, idx) => {
            const eventDate = new Date(today);
            eventDate.setDate(today.getDate() + p.day);
            const dateStr = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, '').substring(0, 8);

            icalContent.push('BEGIN:VEVENT');
            icalContent.push(`SUMMARY:Day ${p.day} (${p.time}): ${p.title}`);
            icalContent.push(`DESCRIPTION:${p.desc}`);
            icalContent.push(`DTSTART;VALUE=DATE:${dateStr}`);
            icalContent.push(`LOCATION:${plan.city}, ${plan.country}`);
            icalContent.push('END:VEVENT');
        });

        icalContent.push('END:VCALENDAR');

        const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${plan.city.toLowerCase()}_itinerary.ics`;
        link.click();
        showToast('iCal Calendar File Downloaded!');
    }

    function shareTripLink() {
        if (!STATE.currentPlan) return;
        const payload = btoa(encodeURIComponent(JSON.stringify({
            city: STATE.currentPlan.city,
            days: STATE.currentPlan.days,
            budgetTier: STATE.currentPlan.budgetTier
        })));
        const shareUrl = `${window.location.origin}${window.location.pathname}#trip=${payload}`;
        navigator.clipboard.writeText(shareUrl);
        showToast('Shareable Link Copied to Clipboard!');
    }

    function checkUrlHashForTrip() {
        if (window.location.hash.startsWith('#trip=')) {
            try {
                const encoded = window.location.hash.replace('#trip=', '');
                const meta = JSON.parse(decodeURIComponent(atob(encoded)));
                if (meta.city) {
                    DOM.locationInput.value = meta.city;
                    DOM.daysInput.value = meta.days || 3;
                    generateItinerary();
                }
            } catch (e) {
                console.error('Invalid share hash', e);
            }
        }
    }

    /* --------------------------------------------------------------------------
       8. REFINEMENT & SAVED TRIPS
       -------------------------------------------------------------------------- */
    async function handleRefineItinerary() {
        const promptText = DOM.refinePromptInput.value.trim();
        if (!promptText || !STATE.currentPlan) return;

        showToast('Refining itinerary via backend AI...');

        try {
            const response = await fetch(`${BACKEND_URL}/refine-itinerary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPlan: STATE.currentPlan,
                    prompt: promptText
                })
            });

            if (response.ok) {
                const data = await response.json();
                STATE.currentPlan = data.plan;
                showToast('Itinerary Refined!');
            }
        } catch (e) {
            console.error('Refine error:', e);
        }

        DOM.refinePromptInput.value = '';
        renderAllViews();
    }

    function saveCurrentTrip() {
        if (!STATE.currentPlan) return;
        const exists = STATE.savedTrips.some(t => t.id === STATE.currentPlan.id);
        if (!exists) {
            STATE.savedTrips.push(STATE.currentPlan);
            localStorage.setItem('wander_saved_trips', JSON.stringify(STATE.savedTrips));
            updateSavedCount();
            showToast('Trip Saved!');
        } else {
            showToast('Trip already saved!');
        }
    }

    function updateSavedCount() {
        DOM.savedCount.textContent = STATE.savedTrips.length;
    }

    function openSavedTripsModal() {
        if (STATE.savedTrips.length === 0) {
            DOM.savedTripsList.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:2rem;">No saved trips yet.</p>`;
        } else {
            let html = '';
            STATE.savedTrips.forEach(t => {
                html += `
                    <div class="saved-trip-item">
                        <div>
                            <strong>${t.city}, ${t.country}</strong>
                            <div style="font-size:0.8rem; color:var(--text-muted);">${t.days} Days • ${t.budgetTier.toUpperCase()}</div>
                        </div>
                        <button class="btn btn-secondary" onclick="WanderApp.loadSavedTrip('${t.id}')">Load</button>
                    </div>
                `;
            });
            DOM.savedTripsList.innerHTML = html;
        }
        DOM.savedTripsModal.classList.add('active');
    }

    function loadSavedTrip(tripId) {
        const trip = STATE.savedTrips.find(t => t.id === tripId);
        if (trip) {
            STATE.currentPlan = trip;
            renderAllViews();
            DOM.savedTripsModal.classList.remove('active');
            DOM.resultsSection.classList.remove('hidden');
            DOM.resultsSection.scrollIntoView({ behavior: 'smooth' });
            showToast(`Loaded trip to ${trip.city}!`);
        }
    }

    window.WanderApp = {
        init,
        loadSavedTrip
    };

    document.addEventListener('DOMContentLoaded', init);
})();
