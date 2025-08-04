const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suitColors = {
    '♠': 'black',
    '♣': 'black',
    '♥': 'red',
    '♦': 'red'
};

const suitNames = {
    '♠': 'pik',
    '♥': 'kier',
    '♦': 'karo',
    '♣': 'trefl'
};

const valueNames = {
    'A': 'As',
    'J': 'Walet',
    'Q': 'Dama',
    'K': 'Król'
};

// Game state
let deck = [];
let currentCardIndex = 0;
let isSessionActive = false;
let isWaitingForCard = false;
let cardStartTime = 0;
let sessionData = {
    sessionId: '',
    date: '',
    totalCards: 0,
    cards: [],
    startTime: null,
    endTime: null
};

// Session history
let sessions = [];

// DOM elements
const cardElement = document.getElementById('card');
const cardValueElement = document.getElementById('card-value');
const cardSuitElement = document.getElementById('card-suit');
// const timerElement = document.getElementById('timer'); // Removed timer display
const startScreen = document.getElementById('start-screen');
const finishScreen = document.getElementById('finish-screen');
const cardsCountSlider = document.getElementById('cards-count');
const cardsCountValue = document.getElementById('cards-count-value');
const currentCardNumber = document.getElementById('current-card-number');
const totalCardsElement = document.getElementById('total-cards');
const suitCheckboxes = document.querySelectorAll('.suits-checkboxes input[type="checkbox"]');
const progressFill = document.getElementById('progress-fill');

// Stats elements
const totalTimeElement = document.getElementById('total-time');
const averageTimeElement = document.getElementById('average-time');
const bestTimeElement = document.getElementById('best-time');
const worstTimeElement = document.getElementById('worst-time');
const cardsListElement = document.getElementById('cards-list');

// Final stats elements
const finalTotalElement = document.getElementById('final-total');
const finalAverageElement = document.getElementById('final-average');
const finalBestElement = document.getElementById('final-best');
const finalWorstElement = document.getElementById('final-worst');

// Buttons
const exportBtn = document.getElementById('export-btn');
const restartBtn = document.getElementById('restart-btn');
const exportAllBtn = document.getElementById('export-all-btn');
const resetHistoryBtn = document.getElementById('reset-history-btn');
const showChartBtn = document.getElementById('show-chart-btn');
const chartModal = document.getElementById('chart-modal');
const closeChartBtn = document.getElementById('close-chart-btn');

// Tab buttons
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Timer interval
let timerInterval = null;

function getSelectedSuits() {
    const selectedSuits = [];
    suitCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedSuits.push(checkbox.value);
        }
    });
    return selectedSuits;
}

function createDeck() {
    deck = [];
    const selectedSuits = getSelectedSuits();
    
    for (const suit of selectedSuits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function startTimer() {
    cardStartTime = performance.now();
    // Timer display removed - still tracking time internally
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    const elapsed = (performance.now() - cardStartTime) / 1000;
    return elapsed;
}

function showCard(card) {
    cardValueElement.textContent = card.value;
    cardSuitElement.textContent = card.suit;
    
    const colorClass = suitColors[card.suit];
    cardValueElement.className = colorClass;
    cardSuitElement.className = colorClass;
    
    cardElement.classList.remove('hidden');
    cardElement.classList.add('show');
    
    startTimer();
    isWaitingForCard = true;
}

function hideCard() {
    cardElement.classList.remove('show');
    cardElement.classList.add('hidden');
}

function getCardName(card) {
    const valueName = valueNames[card.value] || card.value;
    const suitName = suitNames[card.suit];
    return `${valueName} ${suitName.charAt(0).toUpperCase() + suitName.slice(1)}`;
}

function recordCardTime(card, time) {
    const cardData = {
        card: getCardName(card),
        suit: card.suit,
        value: card.value,
        recognitionTime: parseFloat(time.toFixed(2)),
        timestamp: new Date().toISOString()
    };
    
    sessionData.cards.push(cardData);
    updateStats();
    addCardToList(cardData);
}

function updateStats() {
    if (sessionData.cards.length === 0) return;
    
    const times = sessionData.cards.map(c => c.recognitionTime);
    const total = times.reduce((a, b) => a + b, 0);
    const average = total / times.length;
    const best = Math.min(...times);
    const worst = Math.max(...times);
    
    totalTimeElement.textContent = total.toFixed(2) + 's';
    averageTimeElement.textContent = average.toFixed(2) + 's';
    bestTimeElement.textContent = best.toFixed(2) + 's';
    worstTimeElement.textContent = worst.toFixed(2) + 's';
}

function updateProgressBar() {
    const progress = (currentCardIndex / sessionData.totalCards) * 100;
    progressFill.style.width = progress + '%';
}

function addCardToList(cardData) {
    const cardItem = document.createElement('div');
    cardItem.className = 'card-item';
    
    const cardName = document.createElement('span');
    cardName.className = 'card-name';
    cardName.innerHTML = `<span class="${suitColors[cardData.suit]}">${cardData.value}${cardData.suit}</span>`;
    
    const cardTime = document.createElement('span');
    cardTime.className = 'card-time';
    cardTime.textContent = cardData.recognitionTime.toFixed(2) + 's';
    
    // Add color coding for time
    if (cardData.recognitionTime < 1.0) {
        cardTime.classList.add('time-good');
    } else if (cardData.recognitionTime < 2.0) {
        cardTime.classList.add('time-medium');
    } else {
        cardTime.classList.add('time-slow');
    }
    
    cardItem.appendChild(cardName);
    cardItem.appendChild(cardTime);
    cardsListElement.appendChild(cardItem);
}

function nextCard() {
    hideCard();
    isWaitingForCard = false;
    
    currentCardIndex++;
    currentCardNumber.textContent = currentCardIndex;
    updateProgressBar();
    
    if (currentCardIndex < sessionData.totalCards && currentCardIndex < deck.length) {
        setTimeout(() => {
            showCard(deck[currentCardIndex]);
        }, 300); // Short delay between cards
    } else {
        endSession();
    }
}

function startSession() {
    const selectedSuits = getSelectedSuits();
    if (selectedSuits.length === 0) {
        alert('Wybierz co najmniej jeden kolor kart!');
        return;
    }
    
    // Initialize session
    createDeck();
    shuffleDeck();
    
    sessionData = {
        sessionId: Date.now().toString(),
        date: new Date().toISOString(),
        totalCards: parseInt(cardsCountSlider.value),
        cards: [],
        startTime: new Date().toISOString(),
        endTime: null
    };
    
    currentCardIndex = 0;
    isSessionActive = true;
    cardsListElement.innerHTML = '';
    
    // Update UI
    startScreen.classList.add('hidden');
    finishScreen.classList.add('hidden');
    currentCardNumber.textContent = '1';
    totalCardsElement.textContent = sessionData.totalCards;
    
    // Reset stats display
    totalTimeElement.textContent = '-';
    averageTimeElement.textContent = '-';
    bestTimeElement.textContent = '-';
    worstTimeElement.textContent = '-';
    
    // Reset progress bar
    updateProgressBar();
    
    // Disable controls during session
    cardsCountSlider.disabled = true;
    suitCheckboxes.forEach(cb => cb.disabled = true);
    
    // Add session-active class for focus mode
    if (isFocusMode) {
        document.body.classList.add('session-active');
    }
    
    // Show first card
    showCard(deck[0]);
}

function endSession() {
    isSessionActive = false;
    isWaitingForCard = false;
    stopTimer();
    hideCard();
    
    sessionData.endTime = new Date().toISOString();
    
    // Calculate final stats
    if (sessionData.cards.length > 0) {
        const times = sessionData.cards.map(c => c.recognitionTime);
        const total = times.reduce((a, b) => a + b, 0);
        const average = total / times.length;
        const best = Math.min(...times);
        const worst = Math.max(...times);
        
        finalTotalElement.textContent = total.toFixed(2);
        finalAverageElement.textContent = average.toFixed(2);
        finalBestElement.textContent = best.toFixed(2);
        finalWorstElement.textContent = worst.toFixed(2);
        
        // Save session to history
        sessions.unshift({
            ...sessionData,
            totalTime: parseFloat(total.toFixed(2)),
            averageTime: parseFloat(average.toFixed(2)),
            bestTime: parseFloat(best.toFixed(2)),
            worstTime: parseFloat(worst.toFixed(2))
        });
        saveSessions();
        renderSessionHistory();
    }
    
    // Remove session-active class for focus mode
    document.body.classList.remove('session-active');
    
    // Show finish screen
    finishScreen.classList.remove('hidden');
    
    // Re-enable controls
    cardsCountSlider.disabled = false;
    suitCheckboxes.forEach(cb => cb.disabled = false);
}

function exportResults() {
    const exportData = {
        ...sessionData,
        totalTime: parseFloat(finalTotalElement.textContent),
        averageTime: parseFloat(finalAverageElement.textContent),
        bestTime: parseFloat(finalBestElement.textContent),
        worstTime: parseFloat(finalWorstElement.textContent)
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `card-recognition-times-${timestamp}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

function restart() {
    currentCardIndex = 0;
    isSessionActive = false;
    isWaitingForCard = false;
    stopTimer();
    hideCard();
    
    // Destroy session chart if it exists
    if (window.sessionChart) {
        window.sessionChart.destroy();
        window.sessionChart = null;
    }
    
    // timerElement.textContent = '0.00'; // Timer display removed
    cardsListElement.innerHTML = '';
    
    startScreen.classList.remove('hidden');
    finishScreen.classList.add('hidden');
    
    // Reset current session stats display
    totalTimeElement.textContent = '-';
    averageTimeElement.textContent = '-';
    bestTimeElement.textContent = '-';
    worstTimeElement.textContent = '-';
    
    // Reset progress bar
    progressFill.style.width = '0%';
}

function updateMaxCards() {
    const selectedSuits = getSelectedSuits();
    const maxCards = selectedSuits.length * 13;
    
    cardsCountSlider.max = maxCards;
    
    if (parseInt(cardsCountSlider.value) > maxCards) {
        cardsCountSlider.value = maxCards;
        cardsCountValue.textContent = maxCards;
        totalCardsElement.textContent = maxCards;
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        
        if (!isSessionActive && !finishScreen.classList.contains('hidden')) {
            restart();
        } else if (!isSessionActive) {
            startSession();
        } else if (isWaitingForCard) {
            const elapsed = stopTimer();
            const currentCard = deck[currentCardIndex];
            recordCardTime(currentCard, elapsed);
            nextCard();
        }
    } else if (e.code === 'Escape') {
        if (isFocusMode && !isSessionActive) {
            // Exit focus mode when not in session
            focusModeToggle.checked = false;
            toggleFocusMode();
        } else if (isSessionActive) {
            // End session when in session
            endSession();
        }
    }
});

cardsCountSlider.addEventListener('input', (e) => {
    cardsCountValue.textContent = e.target.value;
    totalCardsElement.textContent = e.target.value;
});

suitCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateMaxCards);
});

// Session management functions
function saveSessions() {
    localStorage.setItem('cardRecognitionSessions', JSON.stringify(sessions));
}

function loadSessions() {
    const saved = localStorage.getItem('cardRecognitionSessions');
    if (saved) {
        sessions = JSON.parse(saved);
        renderSessionHistory();
    }
}

function renderSessionHistory() {
    const historyContainer = document.getElementById('sessions-history');
    
    if (sessions.length === 0) {
        historyContainer.innerHTML = '<div class="no-sessions">Brak zapisanych sesji</div>';
        return;
    }
    
    historyContainer.innerHTML = sessions.map((session, index) => {
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="session-item">
                <div class="session-header">
                    <span class="session-number">Sesja #${sessions.length - index}</span>
                    <span class="session-date">${dateStr}</span>
                </div>
                <div class="session-stats">
                    <div class="session-stat">
                        <span>Karty:</span>
                        <span>${session.cards.length}/${session.totalCards}</span>
                    </div>
                    <div class="session-stat">
                        <span>Łączny czas:</span>
                        <span class="${getTimeClass(session.averageTime)}">${session.totalTime || (session.cards.length * session.averageTime).toFixed(2)}s</span>
                    </div>
                    <div class="session-stat">
                        <span>Średni czas:</span>
                        <span class="${getTimeClass(session.averageTime)}">${session.averageTime}s</span>
                    </div>
                    <div class="session-stat">
                        <span>Najlepszy:</span>
                        <span class="${getTimeClass(session.bestTime)}">${session.bestTime}s</span>
                    </div>
                    <div class="session-stat">
                        <span>Najgorszy:</span>
                        <span class="${getTimeClass(session.worstTime)}">${session.worstTime}s</span>
                    </div>
                </div>
                <div class="session-actions">
                    <button class="export-session-btn" onclick="exportSession(${index})">Eksportuj</button>
                    <button class="delete-session-btn" onclick="deleteSession(${index})">Usuń</button>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeClass(time) {
    if (time < 1.0) return 'time-good';
    if (time < 2.0) return 'time-medium';
    return 'time-slow';
}

function exportSession(index) {
    const session = sessions[index];
    const jsonString = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date(session.date).toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `card-recognition-session-${timestamp}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

function exportAllSessions() {
    const exportData = {
        exportDate: new Date().toISOString(),
        totalSessions: sessions.length,
        sessions: sessions
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `card-recognition-all-sessions-${timestamp}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

function exportLastSessions(count) {
    if (sessions.length === 0) {
        alert('Brak sesji do eksportu!');
        return;
    }
    
    const sessionsToExport = sessions.slice(0, Math.min(count, sessions.length));
    
    const exportData = {
        exportDate: new Date().toISOString(),
        sessionCount: sessionsToExport.length,
        requestedCount: count,
        sessions: sessionsToExport
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `card-recognition-last-${count}-sessions-${timestamp}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
}

function deleteSession(index) {
    if (confirm('Czy na pewno chcesz usunąć tę sesję?')) {
        sessions.splice(index, 1);
        saveSessions();
        renderSessionHistory();
        
        // Update chart if it's currently open
        if (!chartModal.classList.contains('hidden')) {
            if (sessions.length === 0) {
                // Close chart if no sessions left
                closeChart();
                alert('Brak sesji do wyświetlenia');
            } else {
                // Refresh chart with current filter settings
                const fullDeckFilter = document.getElementById('full-deck-filter');
                const minSlider = document.getElementById('session-length-min-slider');
                const maxSlider = document.getElementById('session-length-max-slider');
                showProgressChart(fullDeckFilter.checked, parseInt(minSlider.value), parseInt(maxSlider.value));
            }
        }
    }
}

function resetHistory() {
    if (confirm('Czy na pewno chcesz usunąć całą historię sesji? Ta operacja jest nieodwracalna.')) {
        sessions = [];
        localStorage.removeItem('cardRecognitionSessions');
        renderSessionHistory();
    }
}

// Tab switching
function switchTab(tabName) {
    tabButtons.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Polynomial regression function
function polynomialRegression(x, y, degree) {
    const n = x.length;
    const matrix = [];
    const rhs = [];
    
    for (let i = 0; i <= degree; i++) {
        const row = [];
        for (let j = 0; j <= degree; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += Math.pow(x[k], i + j);
            }
            row.push(sum);
        }
        matrix.push(row);
        
        let sum = 0;
        for (let k = 0; k < n; k++) {
            sum += y[k] * Math.pow(x[k], i);
        }
        rhs.push(sum);
    }
    
    // Gaussian elimination
    for (let i = 0; i <= degree; i++) {
        let maxRow = i;
        for (let k = i + 1; k <= degree; k++) {
            if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) {
                maxRow = k;
            }
        }
        [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
        [rhs[i], rhs[maxRow]] = [rhs[maxRow], rhs[i]];
        
        for (let k = i + 1; k <= degree; k++) {
            const c = matrix[k][i] / matrix[i][i];
            for (let j = i; j <= degree; j++) {
                matrix[k][j] -= c * matrix[i][j];
            }
            rhs[k] -= c * rhs[i];
        }
    }
    
    // Back substitution
    const coefficients = new Array(degree + 1);
    for (let i = degree; i >= 0; i--) {
        coefficients[i] = rhs[i];
        for (let j = i + 1; j <= degree; j++) {
            coefficients[i] -= matrix[i][j] * coefficients[j];
        }
        coefficients[i] /= matrix[i][i];
    }
    
    return coefficients;
}

function renderSessionChart() {
    const canvas = document.getElementById('session-chart');
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.sessionChart) {
        window.sessionChart.destroy();
    }
    
    // Prepare data for the chart
    const labels = sessionData.cards.map(card => `${card.value}${card.suit}`);
    const times = sessionData.cards.map(card => card.recognitionTime);
    
    // Prepare colors based on time values
    const backgroundColors = times.map(time => {
        if (time < 1.5) return 'rgba(39, 174, 96, 0.8)';  // green
        else if (time < 1.75) return 'rgba(100, 200, 100, 0.8)';  // lighter green
        else if (time < 2.0) return 'rgba(144, 238, 144, 0.8)';  // lightgreen
        else if (time < 2.5) return 'rgba(255, 165, 0, 0.8)';  // orange
        else return 'rgba(231, 76, 60, 0.8)';  // red
    });
    
    const borderColors = times.map(time => {
        if (time < 1.5) return 'rgba(39, 174, 96, 1)';
        else if (time < 1.75) return 'rgba(100, 200, 100, 1)';
        else if (time < 2.0) return 'rgba(144, 238, 144, 1)';
        else if (time < 2.5) return 'rgba(255, 165, 0, 1)';
        else return 'rgba(231, 76, 60, 1)';
    });
    
    window.sessionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Czas rozpoznania (s)',
                data: times,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Czas: ${context.parsed.y.toFixed(2)}s`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Karta',
                        font: {
                            size: 14
                        }
                    },
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Czas rozpoznania (sekundy)',
                        font: {
                            size: 14
                        }
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + 's';
                        }
                    }
                }
            }
        }
    });
}

function showProgressChart(onlyFullDecks = false, minCards = 1, maxCards = 52) {
    if (sessions.length === 0) {
        alert('Brak sesji do wyświetlenia');
        return;
    }
    
    // Filter sessions if needed
    let filteredSessions = sessions;
    
    // Apply min and max cards filter
    filteredSessions = filteredSessions.filter(session => 
        session.totalCards >= minCards && session.totalCards <= maxCards
    );
    
    // Apply full deck filter if enabled
    if (onlyFullDecks) {
        filteredSessions = filteredSessions.filter(session => session.totalCards === 52);
    }
    
    if (filteredSessions.length === 0) {
        alert(`Brak sesji spełniających kryteria filtrowania (${minCards}-${maxCards} kart)`);
        return;
    }
    
    // Extract average times in chronological order
    const averageTimes = filteredSessions.slice().reverse().map(session => session.averageTime);
    const sessionNumbers = Array.from({length: averageTimes.length}, (_, i) => i);
    
    // Prepare colors based on time values
    const backgroundColors = averageTimes.map(time => {
        if (time < 1.5) return 'rgba(39, 174, 96, 0.8)';  // green
        else if (time < 1.75) return 'rgba(100, 200, 100, 0.8)';  // lighter green
        else if (time < 2.0) return 'rgba(144, 238, 144, 0.8)';  // lightgreen
        else if (time < 2.5) return 'rgba(255, 165, 0, 0.8)';  // orange
        else return 'rgba(231, 76, 60, 0.8)';  // red
    });
    
    const borderColors = averageTimes.map(time => {
        if (time < 1.5) return 'rgba(39, 174, 96, 1)';
        else if (time < 1.75) return 'rgba(100, 200, 100, 1)';
        else if (time < 2.0) return 'rgba(144, 238, 144, 1)';
        else if (time < 2.5) return 'rgba(255, 165, 0, 1)';
        else return 'rgba(231, 76, 60, 1)';
    });
    
    // Calculate polynomial regression for trend line
    const coefficients = polynomialRegression(sessionNumbers, averageTimes, 2);
    const trendData = sessionNumbers.map(x => {
        return coefficients[0] + coefficients[1] * x + coefficients[2] * x * x;
    });
    
    // Find best and worst sessions
    const bestTime = Math.min(...averageTimes);
    const worstTime = Math.max(...averageTimes);
    const bestSession = averageTimes.indexOf(bestTime);
    const worstSession = averageTimes.indexOf(worstTime);
    
    // Calculate improvement
    const firstFiveAvg = averageTimes.slice(0, Math.min(5, averageTimes.length)).reduce((a, b) => a + b, 0) / Math.min(5, averageTimes.length);
    const lastFiveAvg = averageTimes.slice(-Math.min(5, averageTimes.length)).reduce((a, b) => a + b, 0) / Math.min(5, averageTimes.length);
    const improvement = ((firstFiveAvg - lastFiveAvg) / firstFiveAvg * 100).toFixed(1);
    
    // Show modal
    chartModal.classList.remove('hidden');
    
    // Create chart
    const ctx = document.getElementById('progress-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.progressChart) {
        window.progressChart.destroy();
    }
    
    window.progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sessionNumbers.map(n => `Sesja ${n}`),
            datasets: [{
                label: 'Średni czas (s)',
                data: averageTimes,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }, {
                label: 'Linia trendu',
                data: trendData,
                type: 'line',
                borderColor: 'rgba(255, 0, 0, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        },
                        filter: function(item) {
                            return item.text !== 'Średni czas (s)';
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'Linia trendu') {
                                return `Trend: ${context.parsed.y.toFixed(2)}s`;
                            }
                            return `Średni czas: ${context.parsed.y.toFixed(2)}s`;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 2.0,
                            yMax: 2.0,
                            borderColor: 'rgba(128, 128, 128, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: '2 sekundy',
                                enabled: true,
                                position: 'end'
                            }
                        },
                        line2: {
                            type: 'line',
                            yMin: 1.5,
                            yMax: 1.5,
                            borderColor: 'rgba(128, 128, 128, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: '1.5 sekundy',
                                enabled: true,
                                position: 'end'
                            }
                        },
                        bestPoint: {
                            type: 'point',
                            xValue: bestSession,
                            yValue: bestTime,
                            backgroundColor: 'green',
                            radius: 8,
                            borderColor: 'darkgreen',
                            borderWidth: 2,
                            label: {
                                content: `Najlepszy: ${bestTime.toFixed(2)}s`,
                                enabled: true,
                                position: 'top'
                            }
                        },
                        worstPoint: {
                            type: 'point',
                            xValue: worstSession,
                            yValue: worstTime,
                            backgroundColor: 'red',
                            radius: 8,
                            borderColor: 'darkred',
                            borderWidth: 2,
                            label: {
                                content: `Najgorszy: ${worstTime.toFixed(2)}s`,
                                enabled: true,
                                position: 'top'
                            }
                        },
                        infoBox: {
                            type: 'label',
                            xValue: 0,
                            yValue: Math.max(...averageTimes) * 0.95,
                            content: [
                                `Poprawa: ${improvement}%`,
                                `Początek (pierwsze 5 sesji): ${firstFiveAvg.toFixed(2)}s`,
                                `Koniec (ostatnie 5 sesji): ${lastFiveAvg.toFixed(2)}s`
                            ],
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderColor: 'rgba(0, 0, 0, 0.3)',
                            borderWidth: 1,
                            font: {
                                size: 12
                            },
                            padding: 10,
                            position: 'start'
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Numer sesji',
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Średni czas rozpoznania karty (sekundy)',
                        font: {
                            size: 14
                        }
                    },
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

function closeChart() {
    chartModal.classList.add('hidden');
    if (window.progressChart) {
        window.progressChart.destroy();
        window.progressChart = null;
    }
}

exportBtn.addEventListener('click', exportResults);
restartBtn.addEventListener('click', restart);
exportAllBtn.addEventListener('click', exportAllSessions);
resetHistoryBtn.addEventListener('click', resetHistory);
showChartBtn.addEventListener('click', () => {
    const fullDeckFilter = document.getElementById('full-deck-filter');
    const minSlider = document.getElementById('session-length-min-slider');
    const maxSlider = document.getElementById('session-length-max-slider');
    showProgressChart(fullDeckFilter.checked, parseInt(minSlider.value), parseInt(maxSlider.value));
});
closeChartBtn.addEventListener('click', closeChart);

// Close modal when clicking outside
chartModal.addEventListener('click', (e) => {
    if (e.target === chartModal) {
        closeChart();
    }
});

// Export dropdown functionality
const exportLastBtn = document.getElementById('export-last-btn');
const exportDropdown = document.getElementById('export-dropdown');

if (exportLastBtn && exportDropdown) {
    exportLastBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!exportDropdown.contains(e.target) && e.target !== exportLastBtn) {
            exportDropdown.classList.add('hidden');
        }
    });
    
    // Prevent dropdown from closing when clicking inside it
    exportDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Close dropdown after selecting an option
    const exportOptions = exportDropdown.querySelectorAll('.export-option');
    exportOptions.forEach(option => {
        option.addEventListener('click', () => {
            setTimeout(() => {
                exportDropdown.classList.add('hidden');
            }, 100);
        });
    });
}

// Session chart modal functionality
const showSessionChartBtn = document.getElementById('show-session-chart-btn');
const sessionChartModal = document.getElementById('session-chart-modal');
const closeSessionChartBtn = document.getElementById('close-session-chart-btn');

function showSessionChart() {
    sessionChartModal.classList.remove('hidden');
    renderSessionChart();
}

function closeSessionChart() {
    sessionChartModal.classList.add('hidden');
    if (window.sessionChart) {
        window.sessionChart.destroy();
        window.sessionChart = null;
    }
}

if (showSessionChartBtn) {
    showSessionChartBtn.addEventListener('click', showSessionChart);
}

if (closeSessionChartBtn) {
    closeSessionChartBtn.addEventListener('click', closeSessionChart);
}

// Close session chart modal when clicking outside
sessionChartModal.addEventListener('click', (e) => {
    if (e.target === sessionChartModal) {
        closeSessionChart();
    }
});

// Make functions globally available
window.exportSession = exportSession;
window.exportLastSessions = exportLastSessions;
window.deleteSession = deleteSession;

// Focus mode functionality
const focusModeToggle = document.getElementById('focus-mode-toggle');
let isFocusMode = false;

function toggleFocusMode() {
    isFocusMode = focusModeToggle.checked;
    
    if (isFocusMode) {
        document.body.classList.add('focus-mode');
    } else {
        document.body.classList.remove('focus-mode');
        document.body.classList.remove('session-active');
    }
    
    // Save preference
    localStorage.setItem('focusMode', isFocusMode);
}

// Load focus mode preference
function loadFocusModePreference() {
    const savedFocusMode = localStorage.getItem('focusMode') === 'true';
    focusModeToggle.checked = savedFocusMode;
    isFocusMode = savedFocusMode;
    if (savedFocusMode) {
        document.body.classList.add('focus-mode');
    }
}

focusModeToggle.addEventListener('change', toggleFocusMode);

// Initialize
updateMaxCards();
loadSessions();
loadFocusModePreference();

// Add event listener for full deck filter checkbox
document.addEventListener('DOMContentLoaded', () => {
    const fullDeckFilter = document.getElementById('full-deck-filter');
    const minSlider = document.getElementById('session-length-min-slider');
    const maxSlider = document.getElementById('session-length-max-slider');
    const minValue = document.getElementById('session-length-min-value');
    const maxValue = document.getElementById('session-length-max-value');
    
    if (fullDeckFilter) {
        fullDeckFilter.addEventListener('change', (e) => {
            if (!chartModal.classList.contains('hidden')) {
                showProgressChart(e.target.checked, parseInt(minSlider.value), parseInt(maxSlider.value));
            }
        });
    }
    
    if (minSlider && maxSlider) {
        minSlider.addEventListener('input', (e) => {
            let min = parseInt(e.target.value);
            let max = parseInt(maxSlider.value);
            
            // Ensure min doesn't exceed max
            if (min > max) {
                maxSlider.value = min;
                maxValue.textContent = min;
            }
            
            minValue.textContent = min;
            
            if (!chartModal.classList.contains('hidden')) {
                showProgressChart(fullDeckFilter.checked, min, Math.max(min, max));
            }
        });
        
        maxSlider.addEventListener('input', (e) => {
            let max = parseInt(e.target.value);
            let min = parseInt(minSlider.value);
            
            // Ensure max doesn't go below min
            if (max < min) {
                minSlider.value = max;
                minValue.textContent = max;
            }
            
            maxValue.textContent = max;
            
            if (!chartModal.classList.contains('hidden')) {
                showProgressChart(fullDeckFilter.checked, Math.min(min, max), max);
            }
        });
    }
});