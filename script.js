/**
 * PulseTime Pro - Core JavaScript
 * Premium Time Management Suite Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Global State & DOM Elements ---
    const state = {
        theme: localStorage.getItem('theme') || 'light',
        activeTab: 'stopwatch',
        stopwatch: {
            startTime: 0,
            elapsedTime: 0,
            timerInterval: null,
            laps: []
        },
        timer: {
            duration: 0,
            remaining: 0,
            interval: null
        },
        pomodoro: {
            duration: 25 * 60,
            remaining: 25 * 60,
            interval: null,
            mode: 'work'
        },
        sleep: {
            duration: 30 * 60,
            remaining: 30 * 60,
            interval: null
        },
        multiTimers: JSON.parse(localStorage.getItem('multiTimers')) || [],
        alarms: JSON.parse(localStorage.getItem('alarms')) || []
    };

    // --- UI Helpers ---
    const formatTime = (ms, showMs = true) => {
        const date = new Date(ms);
        const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
        const m = date.getUTCMinutes().toString().padStart(2, '0');
        const s = date.getUTCSeconds().toString().padStart(2, '0');
        const msPart = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
        return showMs ? `${h}:${m}:${s}.${msPart}` : `${h}:${m}:${s}`;
    };

    const formatShortTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const playAlarm = (soundId = 'audio-alarm-1') => {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    // --- Navigation ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            state.activeTab = tabId;
            
            navItems.forEach(i => i.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- Theme Management ---
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (theme) => {
        document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
        themeToggle.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('theme', theme);
    };
    applyTheme(state.theme);
    themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(state.theme);
    });

    // --- Stopwatch Logic ---
    const swDisplay = document.getElementById('stopwatch-display');
    const swStartBtn = document.getElementById('stopwatch-start');
    const swLapBtn = document.getElementById('stopwatch-lap');
    const swResetBtn = document.getElementById('stopwatch-reset');
    const lapList = document.getElementById('lap-list');

    const updateStopwatch = () => {
        const now = Date.now();
        state.stopwatch.elapsedTime = now - state.stopwatch.startTime;
        swDisplay.textContent = formatTime(state.stopwatch.elapsedTime);
    };

    swStartBtn.addEventListener('click', () => {
        if (state.stopwatch.timerInterval) {
            // Pause
            clearInterval(state.stopwatch.timerInterval);
            state.stopwatch.timerInterval = null;
            swStartBtn.textContent = 'Resume';
            swLapBtn.disabled = true;
        } else {
            // Start/Resume
            state.stopwatch.startTime = Date.now() - state.stopwatch.elapsedTime;
            state.stopwatch.timerInterval = setInterval(updateStopwatch, 10);
            swStartBtn.textContent = 'Pause';
            swLapBtn.disabled = false;
        }
    });

    swLapBtn.addEventListener('click', () => {
        const lapTime = state.stopwatch.elapsedTime;
        state.stopwatch.laps.push(lapTime);
        const li = document.createElement('li');
        li.className = 'lap-item';
        li.innerHTML = `<span>Lap ${state.stopwatch.laps.length}</span><span>${formatTime(lapTime)}</span>`;
        lapList.prepend(li);
    });

    swResetBtn.addEventListener('click', () => {
        clearInterval(state.stopwatch.timerInterval);
        state.stopwatch.timerInterval = null;
        state.stopwatch.elapsedTime = 0;
        state.stopwatch.laps = [];
        swDisplay.textContent = '00:00:00.00';
        swStartBtn.textContent = 'Start';
        swLapBtn.disabled = true;
        lapList.innerHTML = '';
    });

    // --- Timer Logic ---
    const tDisplay = document.getElementById('timer-display');
    const tStartBtn = document.getElementById('timer-start');
    const tResetBtn = document.getElementById('timer-reset');
    const tInputs = { h: document.getElementById('timer-h'), m: document.getElementById('timer-m'), s: document.getElementById('timer-s') };

    const updateTimer = () => {
        if (state.timer.remaining <= 0) {
            clearInterval(state.timer.interval);
            state.timer.interval = null;
            tDisplay.textContent = '00:00:00';
            tStartBtn.textContent = 'Start';
            playAlarm();
            alert('Timer Finished!');
            return;
        }
        state.timer.remaining--;
        const h = Math.floor(state.timer.remaining / 3600).toString().padStart(2, '0');
        const m = Math.floor((state.timer.remaining % 3600) / 60).toString().padStart(2, '0');
        const s = (state.timer.remaining % 60).toString().padStart(2, '0');
        tDisplay.textContent = `${h}:${m}:${s}`;
    };

    tStartBtn.addEventListener('click', () => {
        if (state.timer.interval) {
            clearInterval(state.timer.interval);
            state.timer.interval = null;
            tStartBtn.textContent = 'Resume';
        } else {
            if (state.timer.remaining <= 0) {
                const h = parseInt(tInputs.h.value) || 0;
                const m = parseInt(tInputs.m.value) || 0;
                const s = parseInt(tInputs.s.value) || 0;
                state.timer.remaining = (h * 3600) + (m * 60) + s;
            }
            if (state.timer.remaining > 0) {
                state.timer.interval = setInterval(updateTimer, 1000);
                tStartBtn.textContent = 'Pause';
            }
        }
    });

    tResetBtn.addEventListener('click', () => {
        clearInterval(state.timer.interval);
        state.timer.interval = null;
        state.timer.remaining = 0;
        tDisplay.textContent = '00:00:00';
        tStartBtn.textContent = 'Start';
    });

    // --- Pomodoro Logic ---
    const pomoDisplay = document.getElementById('pomodoro-display');
    const pomoStartBtn = document.getElementById('pomodoro-start');
    const pomoResetBtn = document.getElementById('pomodoro-reset');
    const pomoModeBtns = document.querySelectorAll('.pomo-mode');

    const updatePomo = () => {
        if (state.pomodoro.remaining <= 0) {
            clearInterval(state.pomodoro.interval);
            state.pomodoro.interval = null;
            pomoStartBtn.textContent = 'Start';
            playAlarm();
            alert(`${state.pomodoro.mode.toUpperCase()} finished!`);
            return;
        }
        state.pomodoro.remaining--;
        pomoDisplay.textContent = formatShortTime(state.pomodoro.remaining);
    };

    pomoStartBtn.addEventListener('click', () => {
        if (state.pomodoro.interval) {
            clearInterval(state.pomodoro.interval);
            state.pomodoro.interval = null;
            pomoStartBtn.textContent = 'Resume';
        } else {
            state.pomodoro.interval = setInterval(updatePomo, 1000);
            pomoStartBtn.textContent = 'Pause';
        }
    });

    pomoResetBtn.addEventListener('click', () => {
        clearInterval(state.pomodoro.interval);
        state.pomodoro.interval = null;
        state.pomodoro.remaining = state.pomodoro.duration;
        pomoDisplay.textContent = formatShortTime(state.pomodoro.remaining);
        pomoStartBtn.textContent = 'Start';
    });

    pomoModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            pomoModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mins = parseInt(btn.getAttribute('data-time'));
            state.pomodoro.duration = mins * 60;
            state.pomodoro.remaining = mins * 60;
            state.pomodoro.mode = btn.textContent.toLowerCase();
            pomoDisplay.textContent = formatShortTime(state.pomodoro.remaining);
            clearInterval(state.pomodoro.interval);
            state.pomodoro.interval = null;
            pomoStartBtn.textContent = 'Start';
        });
    });

    // --- Sleep Timer Logic ---
    const sleepDisplay = document.getElementById('sleep-display');
    const sleepStartBtn = document.getElementById('sleep-start');
    const sleepResetBtn = document.getElementById('sleep-reset');
    const sleepInput = document.getElementById('sleep-m');
    const fadeStatus = document.getElementById('fade-status');

    const updateSleep = () => {
        if (state.sleep.remaining <= 0) {
            clearInterval(state.sleep.interval);
            state.sleep.interval = null;
            sleepStartBtn.textContent = 'Start';
            fadeStatus.textContent = 'Audio fade-out simulation complete.';
            return;
        }
        state.sleep.remaining--;
        sleepDisplay.textContent = formatShortTime(state.sleep.remaining);
        
        // Simulate fade out in the last 60 seconds
        if (state.sleep.remaining <= 60 && state.sleep.remaining > 0) {
            fadeStatus.textContent = `Fading out audio... ${Math.round((state.sleep.remaining / 60) * 100)}% volume`;
        }
    };

    sleepStartBtn.addEventListener('click', () => {
        if (state.sleep.interval) {
            clearInterval(state.sleep.interval);
            state.sleep.interval = null;
            sleepStartBtn.textContent = 'Resume';
        } else {
            if (state.sleep.remaining <= 0 || state.sleep.remaining === state.sleep.duration) {
                state.sleep.duration = (parseInt(sleepInput.value) || 30) * 60;
                state.sleep.remaining = state.sleep.duration;
            }
            state.sleep.interval = setInterval(updateSleep, 1000);
            sleepStartBtn.textContent = 'Pause';
            fadeStatus.textContent = 'Sleep timer active.';
        }
    });

    sleepResetBtn.addEventListener('click', () => {
        clearInterval(state.sleep.interval);
        state.sleep.interval = null;
        state.sleep.remaining = (parseInt(sleepInput.value) || 30) * 60;
        sleepDisplay.textContent = formatShortTime(state.sleep.remaining);
        sleepStartBtn.textContent = 'Start';
        fadeStatus.textContent = '';
    });

    // --- Multi-Timer System ---
    const multiContainer = document.getElementById('multitimer-container');
    const addMultiBtn = document.getElementById('add-multitimer');

    const renderMultiTimers = () => {
        multiContainer.innerHTML = '';
        state.multiTimers.forEach((timer, index) => {
            const card = document.createElement('div');
            card.className = 'glass-card timer-card';
            card.innerHTML = `
                <div class="timer-card-header">
                    <span class="timer-card-title">${timer.name}</span>
                    <button class="btn-icon delete-timer" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="timer-card-display">${formatShortTime(timer.remaining)}</div>
                <div class="controls">
                    <button class="btn btn-primary btn-sm toggle-multi" data-index="${index}">${timer.running ? 'Pause' : 'Start'}</button>
                    <button class="btn btn-danger btn-sm reset-multi" data-index="${index}">Reset</button>
                </div>
            `;
            multiContainer.appendChild(card);
        });
        localStorage.setItem('multiTimers', JSON.stringify(state.multiTimers));
    };

    addMultiBtn.addEventListener('click', () => {
        const name = prompt('Timer Name:', `Timer ${state.multiTimers.length + 1}`) || 'New Timer';
        const mins = parseInt(prompt('Minutes:', '10')) || 10;
        state.multiTimers.push({
            name,
            duration: mins * 60,
            remaining: mins * 60,
            running: false,
            interval: null
        });
        renderMultiTimers();
    });

    multiContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const index = target.getAttribute('data-index');
        const timer = state.multiTimers[index];

        if (target.classList.contains('delete-timer')) {
            clearInterval(timer.interval);
            state.multiTimers.splice(index, 1);
            renderMultiTimers();
        } else if (target.classList.contains('toggle-multi')) {
            if (timer.running) {
                clearInterval(timer.interval);
                timer.running = false;
            } else {
                timer.running = true;
                timer.interval = setInterval(() => {
                    if (timer.remaining <= 0) {
                        clearInterval(timer.interval);
                        timer.running = false;
                        playAlarm();
                        renderMultiTimers();
                        alert(`Timer "${timer.name}" finished!`);
                    } else {
                        timer.remaining--;
                        renderMultiTimers();
                    }
                }, 1000);
            }
            renderMultiTimers();
        } else if (target.classList.contains('reset-multi')) {
            clearInterval(timer.interval);
            timer.running = false;
            timer.remaining = timer.duration;
            renderMultiTimers();
        }
    });

    // --- Alarm System ---
    const alarmContainer = document.getElementById('alarm-container');
    const addAlarmBtn = document.getElementById('add-alarm');

    const renderAlarms = () => {
        alarmContainer.innerHTML = '';
        state.alarms.forEach((alarm, index) => {
            const item = document.createElement('div');
            item.className = 'glass-card alarm-item';
            item.innerHTML = `
                <div class="alarm-info">
                    <h4>${alarm.time}</h4>
                    <p>${alarm.label || 'Alarm'}</p>
                </div>
                <div class="alarm-actions">
                    <label class="switch">
                        <input type="checkbox" class="toggle-alarm" data-index="${index}" ${alarm.active ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <button class="btn-icon delete-alarm" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            alarmContainer.appendChild(item);
        });
        localStorage.setItem('alarms', JSON.stringify(state.alarms));
    };

    addAlarmBtn.addEventListener('click', () => {
        const time = prompt('Alarm Time (HH:MM):', '08:00');
        if (!time || !time.includes(':')) return;
        const label = prompt('Label:', 'Wake up!');
        state.alarms.push({ time, label, active: true });
        renderAlarms();
    });

    alarmContainer.addEventListener('click', (e) => {
        const target = e.target;
        const index = target.getAttribute('data-index');
        if (target.classList.contains('delete-alarm') || target.closest('.delete-alarm')) {
            const idx = target.closest('button').getAttribute('data-index');
            state.alarms.splice(idx, 1);
            renderAlarms();
        } else if (target.classList.contains('toggle-alarm')) {
            state.alarms[index].active = target.checked;
            localStorage.setItem('alarms', JSON.stringify(state.alarms));
        }
    });

    // Check alarms every minute
    setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        state.alarms.forEach(alarm => {
            if (alarm.active && alarm.time === currentTime && now.getSeconds() === 0) {
                playAlarm();
                alert(`ALARM: ${alarm.label}`);
            }
        });
    }, 1000);

    // Initial Renders
    renderMultiTimers();
    renderAlarms();
});
