// iPhone Card Recognition Trainer
class RecognitionTrainer {
    constructor() {
        // Game state
        this.deck = [];
        this.currentIndex = 0;
        this.sessionActive = false;
        this.waitingForTap = false;
        this.cardStartTime = 0;
        this.sessionData = {
            id: '',
            date: null,
            cards: [],
            totalCards: 0,
            startTime: null,
            endTime: null
        };
        
        // Settings
        this.cardCount = 10;
        this.selectedSuits = ['♠', '♥', '♦', '♣'];
        this.focusMode = false;
        this.vibrationEnabled = true;
        
        // Session history
        this.sessions = [];
        
        // DOM elements
        this.views = {
            training: document.getElementById('training-view'),
            stats: document.getElementById('stats-view'),
            history: document.getElementById('history-view'),
            settings: document.getElementById('settings-view')
        };
        
        this.card = document.getElementById('card');
        this.cardValue = this.card.querySelector('.value');
        this.cardSuit = this.card.querySelector('.suit');
        this.startScreen = document.getElementById('start-screen');
        this.finishScreen = document.getElementById('finish-screen');
        this.tapZone = document.getElementById('tap-zone');
        this.tapFeedback = document.getElementById('tap-feedback');
        
        this.init();
        this.loadSettings();
        this.loadHistory();
    }
    
    init() {
        // Prevent default touch behaviors
        document.addEventListener('touchstart', e => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
        
        // Tab navigation
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('touchend', e => {
                e.preventDefault();
                this.switchView(tab.dataset.view);
                this.updateTabBar(tab);
                this.vibrate(5);
            });
        });
        
        // Start screen tap (either on overlay or TAP zone)
        this.startScreen.addEventListener('touchend', e => {
            e.preventDefault();
            if (!this.sessionActive) {
                this.startSession();
                this.vibrate(10);
            }
        });
        
        // Tap zone - start game or next card
        this.tapZone.addEventListener('touchend', e => {
            e.preventDefault();
            
            // If start screen is visible, start the game
            if (!this.startScreen.classList.contains('hidden') && !this.sessionActive) {
                this.startSession();
                this.vibrate(10);
            }
            // Otherwise, if waiting for tap, go to next card
            else if (this.waitingForTap) {
                this.showTapFeedback();
                this.nextCard();
                this.vibrate(5);
            }
        });
        
        // Finish screen buttons
        document.getElementById('new-session-btn').addEventListener('touchend', e => {
            e.preventDefault();
            this.reset();
            this.vibrate(10);
        });
        
        document.getElementById('view-details-btn').addEventListener('touchend', e => {
            e.preventDefault();
            this.switchView('stats');
            this.updateTabBar(document.querySelector('[data-view="stats"]'));
            this.vibrate(5);
        });
        
        document.getElementById('view-history-btn').addEventListener('touchend', e => {
            e.preventDefault();
            this.switchView('history');
            this.updateTabBar(document.querySelector('[data-view="history"]'));
            this.vibrate(5);
        });
        
        // Settings controls - main settings
        const slider = document.getElementById('cards-slider');
        slider.addEventListener('input', e => {
            this.cardCount = parseInt(e.target.value);
            document.getElementById('cards-count').textContent = this.cardCount;
            // Sync with start screen
            document.getElementById('start-cards-slider').value = this.cardCount;
            document.getElementById('start-cards-count').textContent = this.cardCount;
            this.saveSettings();
        });
        
        // Settings controls - start screen
        const startSlider = document.getElementById('start-cards-slider');
        startSlider.addEventListener('input', e => {
            this.cardCount = parseInt(e.target.value);
            document.getElementById('start-cards-count').textContent = this.cardCount;
            // Sync with settings
            document.getElementById('cards-slider').value = this.cardCount;
            document.getElementById('cards-count').textContent = this.cardCount;
            this.saveSettings();
        });
        
        // Suit toggles - settings
        document.querySelectorAll('.suit-toggle').forEach(btn => {
            btn.addEventListener('touchend', e => {
                e.preventDefault();
                e.stopPropagation();
                btn.classList.toggle('active');
                // Sync with start screen
                const startBtn = document.querySelector(`.suit-quick[data-suit="${btn.dataset.suit}"]`);
                if (startBtn) {
                    if (btn.classList.contains('active')) {
                        startBtn.classList.add('active');
                    } else {
                        startBtn.classList.remove('active');
                    }
                }
                this.updateSelectedSuits();
                this.vibrate(5);
            });
        });
        
        // Suit toggles - start screen
        document.querySelectorAll('.suit-quick').forEach(btn => {
            btn.addEventListener('touchend', e => {
                e.preventDefault();
                e.stopPropagation();
                btn.classList.toggle('active');
                // Sync with settings
                const settingsBtn = document.querySelector(`.suit-toggle[data-suit="${btn.dataset.suit}"]`);
                if (settingsBtn) {
                    if (btn.classList.contains('active')) {
                        settingsBtn.classList.add('active');
                    } else {
                        settingsBtn.classList.remove('active');
                    }
                }
                this.updateSelectedSuits();
                this.vibrate(5);
            });
        });
        
        // Switches
        document.getElementById('focus-mode-switch').addEventListener('change', e => {
            this.focusMode = e.target.checked;
            document.body.classList.toggle('focus-mode', this.focusMode);
            this.saveSettings();
            this.vibrate(10);
        });
        
        document.getElementById('vibration-switch').addEventListener('change', e => {
            this.vibrationEnabled = e.target.checked;
            this.saveSettings();
            if (this.vibrationEnabled) this.vibrate(10);
        });
        
        // Export button
        document.getElementById('export-btn').addEventListener('touchend', e => {
            e.preventDefault();
            this.exportData();
            this.vibrate(10);
        });
        
        // Clear data button
        document.getElementById('clear-data-btn').addEventListener('touchend', e => {
            e.preventDefault();
            if (confirm('Czy na pewno chcesz usunąć całą historię?')) {
                this.clearHistory();
                this.vibrate(20);
            }
        });
        
        // Chart button
        document.getElementById('chart-btn').addEventListener('touchend', e => {
            e.preventDefault();
            this.showChart();
            this.vibrate(5);
        });
        
        // Close chart button
        document.getElementById('close-chart').addEventListener('touchend', e => {
            e.preventDefault();
            document.getElementById('chart-modal').classList.add('hidden');
            this.vibrate(5);
        });
        
        // Swipe gestures
        this.setupSwipeGestures();
    }
    
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let currentView = 'training';
        
        document.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchStartX - touchEndX;
            const deltaY = touchStartY - touchEndY;
            
            // Horizontal swipe for tab navigation
            if (Math.abs(deltaX) > 100 && Math.abs(deltaX) > Math.abs(deltaY)) {
                const tabs = ['training', 'stats', 'history', 'settings'];
                const currentIndex = tabs.indexOf(this.getCurrentView());
                
                if (deltaX > 0 && currentIndex < tabs.length - 1) {
                    // Swipe left - next tab
                    this.switchView(tabs[currentIndex + 1]);
                    this.updateTabBar(document.querySelector(`[data-view="${tabs[currentIndex + 1]}"]`));
                    this.vibrate(5);
                } else if (deltaX < 0 && currentIndex > 0) {
                    // Swipe right - previous tab
                    this.switchView(tabs[currentIndex - 1]);
                    this.updateTabBar(document.querySelector(`[data-view="${tabs[currentIndex - 1]}"]`));
                    this.vibrate(5);
                }
            }
            
            // Swipe down to dismiss modal
            if (deltaY < -100 && !document.getElementById('chart-modal').classList.contains('hidden')) {
                document.getElementById('chart-modal').classList.add('hidden');
                this.vibrate(5);
            }
        });
    }
    
    getCurrentView() {
        for (const [key, view] of Object.entries(this.views)) {
            if (view.classList.contains('active')) return key;
        }
        return 'training';
    }
    
    switchView(viewName) {
        Object.values(this.views).forEach(v => v.classList.remove('active'));
        this.views[viewName].classList.add('active');
    }
    
    updateTabBar(activeTab) {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }
    
    showTapFeedback() {
        this.tapFeedback.classList.add('active');
        setTimeout(() => {
            this.tapFeedback.classList.remove('active');
        }, 600);
    }
    
    updateSelectedSuits() {
        this.selectedSuits = [];
        // Check from either suit-toggle or suit-quick (both should be synced)
        document.querySelectorAll('.suit-toggle.active, .suit-quick.active').forEach(btn => {
            if (!this.selectedSuits.includes(btn.dataset.suit)) {
                this.selectedSuits.push(btn.dataset.suit);
            }
        });
        
        // Update max cards for both sliders
        const maxCards = this.selectedSuits.length * 13;
        const slider = document.getElementById('cards-slider');
        const startSlider = document.getElementById('start-cards-slider');
        
        slider.max = maxCards;
        startSlider.max = maxCards;
        
        if (this.cardCount > maxCards) {
            this.cardCount = maxCards;
            slider.value = maxCards;
            startSlider.value = maxCards;
            document.getElementById('cards-count').textContent = maxCards;
            document.getElementById('start-cards-count').textContent = maxCards;
        }
        
        this.saveSettings();
    }
    
    createDeck() {
        this.deck = [];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        for (const suit of this.selectedSuits) {
            for (const value of values) {
                this.deck.push({ value, suit });
            }
        }
        
        // Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        
        // Take only needed cards
        this.deck = this.deck.slice(0, this.cardCount);
    }
    
    startSession() {
        if (this.selectedSuits.length === 0) {
            alert('Wybierz przynajmniej jeden kolor!');
            return;
        }
        
        this.createDeck();
        this.currentIndex = 0;
        this.sessionActive = true;
        this.waitingForTap = false;
        
        // Initialize session data
        this.sessionData = {
            id: Date.now().toString(),
            date: new Date(),
            cards: [],
            totalCards: this.deck.length,
            startTime: performance.now(),
            endTime: null
        };
        
        // Hide start screen
        this.startScreen.classList.add('hidden');
        
        // Show first card
        this.showCard();
        this.updateProgress();
        this.updateCounter();
    }
    
    showCard() {
        const card = this.deck[this.currentIndex];
        
        this.cardValue.textContent = card.value;
        this.cardSuit.textContent = card.suit;
        this.cardSuit.className = 'suit ' + (card.suit === '♥' || card.suit === '♦' ? 'red' : 'black');
        
        this.card.classList.remove('hidden');
        
        // Start timing
        this.cardStartTime = performance.now();
        this.waitingForTap = true;
    }
    
    nextCard() {
        if (!this.sessionActive || !this.waitingForTap) return;
        
        // Record time for current card
        const time = (performance.now() - this.cardStartTime) / 1000;
        const card = this.deck[this.currentIndex];
        
        this.sessionData.cards.push({
            card: `${card.value}${card.suit}`,
            value: card.value,
            suit: card.suit,
            time: time,
            timestamp: new Date()
        });
        
        // Update current session stats
        this.updateSessionStats();
        
        // Move to next card
        this.currentIndex++;
        this.waitingForTap = false;
        
        if (this.currentIndex >= this.deck.length) {
            this.endSession();
        } else {
            // Brief pause before showing next card
            this.card.classList.add('hidden');
            setTimeout(() => {
                this.showCard();
                this.updateProgress();
                this.updateCounter();
                this.updateTimer(time);
            }, 300);
        }
    }
    
    updateProgress() {
        const progress = (this.currentIndex / this.deck.length) * 100;
        document.getElementById('progress').style.width = progress + '%';
    }
    
    updateCounter() {
        document.getElementById('card-counter').textContent = 
            `${this.currentIndex + 1}/${this.deck.length}`;
    }
    
    updateTimer(time) {
        document.getElementById('timer').textContent = time.toFixed(2) + 's';
    }
    
    updateSessionStats() {
        const times = this.sessionData.cards.map(c => c.time);
        if (times.length === 0) return;
        
        const total = times.reduce((a, b) => a + b, 0);
        const avg = total / times.length;
        const best = Math.min(...times);
        const worst = Math.max(...times);
        
        // Update stats view
        document.getElementById('total-time').textContent = total.toFixed(2) + 's';
        document.getElementById('avg-time').textContent = avg.toFixed(2) + 's';
        document.getElementById('best-time').textContent = best.toFixed(2) + 's';
        document.getElementById('worst-time').textContent = worst.toFixed(2) + 's';
        
        // Update cards list
        this.updateCardsList();
    }
    
    updateCardsList() {
        const list = document.getElementById('cards-list');
        list.innerHTML = '';
        
        this.sessionData.cards.forEach(cardData => {
            const item = document.createElement('div');
            item.className = 'card-item';
            
            const name = document.createElement('span');
            name.className = 'card-name';
            name.innerHTML = `<span class="${cardData.suit === '♥' || cardData.suit === '♦' ? 'red' : 'black'}">${cardData.card}</span>`;
            
            const time = document.createElement('span');
            time.className = 'card-time';
            if (cardData.time > 2) {
                time.className += ' time-very-slow';
            } else if (cardData.time > 1) {
                time.className += ' time-slow';
            }
            time.textContent = cardData.time.toFixed(2) + 's';
            
            item.appendChild(name);
            item.appendChild(time);
            list.appendChild(item);
        });
    }
    
    endSession() {
        this.sessionActive = false;
        this.sessionData.endTime = performance.now();
        this.card.classList.add('hidden');
        
        // Calculate final stats
        const times = this.sessionData.cards.map(c => c.time);
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const best = Math.min(...times);
        const worst = Math.max(...times);
        
        // Display summary
        document.getElementById('summary-avg').textContent = avg.toFixed(2) + 's';
        document.getElementById('summary-best').textContent = best.toFixed(2) + 's';
        document.getElementById('summary-worst').textContent = worst.toFixed(2) + 's';
        
        this.finishScreen.classList.remove('hidden');
        
        // Save session
        this.saveSession();
        this.updateHistory();
        
        // Long vibration for completion
        this.vibrate([100, 50, 100]);
    }
    
    reset() {
        this.sessionActive = false;
        this.currentIndex = 0;
        this.waitingForTap = false;
        this.sessionData = {
            id: '',
            date: null,
            cards: [],
            totalCards: 0,
            startTime: null,
            endTime: null
        };
        
        this.card.classList.add('hidden');
        this.finishScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        
        document.getElementById('progress').style.width = '0%';
        document.getElementById('card-counter').textContent = '0/0';
        document.getElementById('timer').textContent = '0.00s';
    }
    
    saveSession() {
        this.sessions.unshift(this.sessionData);
        // Keep only last 50 sessions
        this.sessions = this.sessions.slice(0, 50);
        localStorage.setItem('recognition_sessions', JSON.stringify(this.sessions));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('recognition_sessions');
        if (saved) {
            this.sessions = JSON.parse(saved);
            this.updateHistory();
        }
    }
    
    updateHistory() {
        const list = document.getElementById('sessions-list');
        const noData = document.getElementById('no-history');
        
        if (this.sessions.length === 0) {
            list.style.display = 'none';
            noData.style.display = 'flex';
            return;
        }
        
        list.style.display = 'block';
        noData.style.display = 'none';
        list.innerHTML = '';
        
        this.sessions.forEach((session, index) => {
            const item = document.createElement('div');
            item.className = 'session-item';
            
            const times = session.cards.map(c => c.time);
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            
            const date = new Date(session.date);
            const dateStr = date.toLocaleDateString('pl-PL', { 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            item.innerHTML = `
                <div class="session-header">
                    <span>Sesja ${this.sessions.length - index}</span>
                    <span class="session-date">${dateStr}</span>
                </div>
                <div class="session-stats">
                    <div>
                        <span class="stat-label">Karty</span>
                        <span class="stat-value">${session.totalCards}</span>
                    </div>
                    <div>
                        <span class="stat-label">Średni</span>
                        <span class="stat-value">${avg.toFixed(2)}s</span>
                    </div>
                    <div>
                        <span class="stat-label">Najlepszy</span>
                        <span class="stat-value">${Math.min(...times).toFixed(2)}s</span>
                    </div>
                </div>
            `;
            
            list.appendChild(item);
        });
    }
    
    clearHistory() {
        this.sessions = [];
        localStorage.removeItem('recognition_sessions');
        this.updateHistory();
    }
    
    showChart() {
        const modal = document.getElementById('chart-modal');
        modal.classList.remove('hidden');
        
        // Prepare data for chart
        const labels = [];
        const data = [];
        
        // Show last 20 sessions
        const sessionsToShow = this.sessions.slice(0, 20).reverse();
        
        sessionsToShow.forEach((session, index) => {
            labels.push(`Sesja ${index + 1}`);
            const times = session.cards.map(c => c.time);
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            data.push(avg);
        });
        
        // Create or update chart
        const ctx = document.getElementById('progress-chart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Średni czas (s)',
                    data: data,
                    borderColor: '#007aff',
                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    }
                }
            }
        });
    }
    
    async exportData() {
        const exportData = {
            sessions: this.sessions,
            settings: {
                cardCount: this.cardCount,
                selectedSuits: this.selectedSuits,
                focusMode: this.focusMode
            },
            exportDate: new Date().toISOString()
        };
        
        const json = JSON.stringify(exportData, null, 2);
        
        // Try Web Share API first (for iOS)
        if (navigator.share) {
            try {
                const file = new File([json], 'card-trainer-data.json', { type: 'application/json' });
                await navigator.share({
                    title: 'Card Trainer Data',
                    files: [file]
                });
            } catch (err) {
                // Fallback to clipboard
                this.copyToClipboard(json);
            }
        } else {
            // Fallback to clipboard
            this.copyToClipboard(json);
        }
    }
    
    copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        alert('Dane skopiowane do schowka!');
    }
    
    saveSettings() {
        const settings = {
            cardCount: this.cardCount,
            selectedSuits: this.selectedSuits,
            focusMode: this.focusMode,
            vibrationEnabled: this.vibrationEnabled
        };
        localStorage.setItem('recognition_settings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('recognition_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            this.cardCount = settings.cardCount || 10;
            this.selectedSuits = settings.selectedSuits || ['♠', '♥', '♦', '♣'];
            this.focusMode = settings.focusMode || false;
            this.vibrationEnabled = settings.vibrationEnabled !== false;
            
            // Update UI - settings
            document.getElementById('cards-slider').value = this.cardCount;
            document.getElementById('cards-count').textContent = this.cardCount;
            
            // Update UI - start screen
            document.getElementById('start-cards-slider').value = this.cardCount;
            document.getElementById('start-cards-count').textContent = this.cardCount;
            
            // Update suit toggles - settings
            document.querySelectorAll('.suit-toggle').forEach(btn => {
                if (this.selectedSuits.includes(btn.dataset.suit)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Update suit toggles - start screen
            document.querySelectorAll('.suit-quick').forEach(btn => {
                if (this.selectedSuits.includes(btn.dataset.suit)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            document.getElementById('focus-mode-switch').checked = this.focusMode;
            document.getElementById('vibration-switch').checked = this.vibrationEnabled;
            
            if (this.focusMode) {
                document.body.classList.add('focus-mode');
            }
        }
    }
    
    vibrate(pattern) {
        if (this.vibrationEnabled && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new RecognitionTrainer();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js');
    }
    
    // Detect standalone mode
    if (window.navigator.standalone) {
        document.body.classList.add('standalone');
    }
});