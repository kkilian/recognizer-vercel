// iPhone-only Card Trainer - Touch events only
class CardTrainer {
    constructor() {
        this.deck = [];
        this.currentIndex = 0;
        this.times = [];
        this.startTime = 0;
        this.isRunning = false;
        this.isFocusMode = false;
        
        // Settings
        this.cardCount = 10;
        this.selectedSuits = ['♠', '♥', '♦', '♣'];
        
        // DOM elements
        this.views = {
            start: document.getElementById('start-view'),
            session: document.getElementById('session-view'),
            results: document.getElementById('results-view')
        };
        
        this.card = document.getElementById('card');
        this.cardValue = this.card.querySelector('.value');
        this.cardSuit = this.card.querySelector('.suit');
        
        this.init();
    }
    
    init() {
        // Prevent default touch behaviors
        document.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
        
        // Start button
        document.getElementById('start-btn').addEventListener('touchend', e => {
            e.preventDefault();
            this.vibrate(10);
            this.startSession();
        });
        
        // Tap zone during session
        document.getElementById('tap-zone').addEventListener('touchend', e => {
            e.preventDefault();
            if (this.isRunning) {
                this.vibrate(5);
                this.nextCard();
            }
        });
        
        // Restart button
        document.getElementById('restart-btn').addEventListener('touchend', e => {
            e.preventDefault();
            this.vibrate(10);
            this.reset();
        });
        
        // Settings
        const slider = document.getElementById('cards-slider');
        slider.addEventListener('input', e => {
            this.cardCount = parseInt(e.target.value);
            document.getElementById('cards-count').textContent = this.cardCount;
        });
        
        // Suit selectors
        document.querySelectorAll('.suit-btn').forEach(btn => {
            btn.addEventListener('touchend', e => {
                e.preventDefault();
                e.stopPropagation();
                this.vibrate(5);
                btn.classList.toggle('active');
                this.updateSelectedSuits();
            });
        });
        
        // Focus mode toggle
        document.getElementById('focus-toggle').addEventListener('touchend', e => {
            e.preventDefault();
            e.stopPropagation();
            this.vibrate(10);
            this.toggleFocusMode();
        });
        
        // Swipe gestures
        this.setupSwipeGestures();
        
        // Load preferences
        this.loadPreferences();
    }
    
    setupSwipeGestures() {
        let touchStartY = 0;
        let touchStartX = 0;
        
        document.addEventListener('touchstart', e => {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
        });
        
        document.addEventListener('touchend', e => {
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            const deltaY = touchStartY - touchEndY;
            const deltaX = touchStartX - touchEndX;
            
            // Swipe down to exit focus mode
            if (Math.abs(deltaY) > 100 && deltaY < 0 && this.isFocusMode) {
                this.toggleFocusMode();
                this.vibrate(10);
            }
        });
    }
    
    updateSelectedSuits() {
        this.selectedSuits = [];
        document.querySelectorAll('.suit-btn.active').forEach(btn => {
            this.selectedSuits.push(btn.dataset.suit);
        });
        
        // Update max cards
        const maxCards = this.selectedSuits.length * 13;
        const slider = document.getElementById('cards-slider');
        slider.max = maxCards;
        if (this.cardCount > maxCards) {
            this.cardCount = maxCards;
            slider.value = maxCards;
            document.getElementById('cards-count').textContent = maxCards;
        }
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
        this.times = [];
        this.isRunning = true;
        
        // Switch view
        this.showView('session');
        
        // Show first card
        this.showCard();
        this.startTimer();
        
        // Update counter
        this.updateCounter();
    }
    
    showCard() {
        const card = this.deck[this.currentIndex];
        
        this.cardValue.textContent = card.value;
        this.cardSuit.textContent = card.suit;
        this.cardSuit.className = 'suit ' + (card.suit === '♥' || card.suit === '♦' ? 'red' : 'black');
        
        this.card.classList.remove('hidden');
        this.card.classList.add('flip-in');
        
        setTimeout(() => {
            this.card.classList.remove('flip-in');
        }, 500);
    }
    
    nextCard() {
        if (!this.isRunning) return;
        
        // Record time
        const time = this.stopTimer();
        this.times.push(time);
        
        // Move to next card
        this.currentIndex++;
        
        if (this.currentIndex >= this.deck.length) {
            this.endSession();
        } else {
            this.showCard();
            this.startTimer();
            this.updateCounter();
        }
    }
    
    startTimer() {
        this.startTime = performance.now();
    }
    
    stopTimer() {
        const elapsed = (performance.now() - this.startTime) / 1000;
        document.getElementById('timer').textContent = elapsed.toFixed(2) + 's';
        return elapsed;
    }
    
    updateCounter() {
        document.getElementById('counter').textContent = `${this.currentIndex + 1} / ${this.deck.length}`;
    }
    
    endSession() {
        this.isRunning = false;
        this.card.classList.add('hidden');
        
        // Calculate stats
        const avg = this.times.reduce((a, b) => a + b, 0) / this.times.length;
        const best = Math.min(...this.times);
        const worst = Math.max(...this.times);
        
        // Display results
        document.getElementById('avg-time').textContent = avg.toFixed(2) + 's';
        document.getElementById('best-time').textContent = best.toFixed(2) + 's';
        document.getElementById('worst-time').textContent = worst.toFixed(2) + 's';
        
        this.showView('results');
        
        // Save to history
        this.saveSession({
            date: new Date(),
            times: this.times,
            avg: avg,
            cardCount: this.deck.length
        });
        
        this.vibrate([100, 50, 100]);
    }
    
    reset() {
        this.isRunning = false;
        this.currentIndex = 0;
        this.times = [];
        this.card.classList.add('hidden');
        this.showView('start');
    }
    
    showView(viewName) {
        Object.values(this.views).forEach(v => v.classList.add('hidden'));
        this.views[viewName].classList.remove('hidden');
    }
    
    toggleFocusMode() {
        this.isFocusMode = !this.isFocusMode;
        document.body.classList.toggle('focus-mode');
        localStorage.setItem('focusMode', this.isFocusMode);
    }
    
    vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
    
    saveSession(data) {
        let history = JSON.parse(localStorage.getItem('sessions') || '[]');
        history.unshift(data);
        history = history.slice(0, 20); // Keep last 20
        localStorage.setItem('sessions', JSON.stringify(history));
    }
    
    loadPreferences() {
        const focusMode = localStorage.getItem('focusMode') === 'true';
        if (focusMode) {
            this.isFocusMode = true;
            document.body.classList.add('focus-mode');
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new CardTrainer();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js');
    }
    
    // Detect standalone mode
    if (window.navigator.standalone) {
        document.body.classList.add('standalone');
    }
});