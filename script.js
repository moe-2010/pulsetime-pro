/**
 * PulseTime Pro - Core JavaScript (v1.1)
 * Premium Time Management Suite Logic
 * Improved for Mobile & Background Execution
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
            laps: [],
            isRunning: false
        },
        timer: {
            endTime: 0,
            remaining: 0,
            interval: null,
            isRunning: false
        },
        pomodoro: {
            endTime: 0,
            remaining: 25 * 60,
            duration: 25 * 60,
            interval: null,
            mode: 'work',
            isRunning: false
        },
        sleep: {
            endTime: 0,
            remaining: 30 * 60,
            duration: 30 * 60,
            interval: null,
            isRunning: false
        },
        multiTimers: JSON.parse(localStorage.getItem('multiTimers')) || [],
        alarms: JSON.parse(localStorage.getItem('alarms')) || []
    };

    // --- UI Helpers ---
    const formatTime = (ms, showMs = true) => {
        if (ms < 0) ms = 0;
        const h = Math.floor(ms / 3600000).toString().padStart(2, '0');
        const m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
        const msPart = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
        return showMs ? `${h}:${m}:${s}.${msPart}` : `${h}:${m}:${s}`;
    };

    const formatShortTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    const showToast = (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    const playAlarm = (soundId = 'audio-alarm-1') => {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.volume = 1.0;
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.log('Audio play failed, user interaction needed:', e);
                showToast('Timer finished! (Audio blocked by browser)', 'info');
            });
        }
    };

    // --- Navigation ---
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    const switchTab = (tabId) => {
        state.activeTab = tabId;
        navItems.forEach(i => {
            i.classList.toggle('active', i.getAttribute('data-tab') === tabId);
        });
        tabContents.forEach(t => {
            t.classList.toggle('active', t.id === tabId);
        });
        // Scroll to top on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => switchTab(item.getAttribute('data-tab')));
    });

    // --- Theme Management ---
    const themeToggles = document.querySelectorAll('.theme-toggle-btn');
    const applyTheme = (theme) => {
        document.body.className = theme === 'dark' ? 'dark-mode' : 'light-mode';
        themeToggles.forEach(btn => {
            btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });
        localStorage.setItem('theme', theme);
    };
    applyTheme(state.theme);
    themeToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            applyTheme(state.theme);
        });
    });

    // --- Stopwatch Logic (Robust) ---
    const swDisplay = document.getElementById('stopwatch-display');
    const swStartBtn = document.getElementById('stopwatch-start');
    const swLapBtn = document.getElementById('stopwatch-lap');
    const swResetBtn = document.getElementById('stopwatch-reset');
    const lapList = document.getElementById('lap-list');

    const updateStopwatch = () => {
        if (!state.stopwatch.isRunning) return;
        const now = Date.now();
        state.stopwatch.elapsedTime = now - state.stopwatch.startTime;
        swDisplay.textContent = formatTime(state.stopwatch.elapsedTime);
        state.stopwatch.timerInterval = requestAnimationFrame(updateStopwatch);
    };

    swStartBtn.addEventListener('click', () => {
        if (state.stopwatch.isRunning) {
            state.stopwatch.isRunning = false;
            cancelAnimationFrame(state.stopwatch.timerInterval);
            swStartBtn.textContent = 'Resume';
            swStartBtn.className = 'btn btn-primary';
            swLapBtn.disabled = true;
        } else {
            state.stopwatch.isRunning = true;
            state.stopwatch.startTime = Date.now() - state.stopwatch.elapsedTime;
            state.stopwatch.timerInterval = requestAnimationFrame(updateStopwatch);
            swStartBtn.textContent = 'Pause';
            swStartBtn.className = 'btn btn-secondary';
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
        state.stopwatch.isRunning = false;
        cancelAnimationFrame(state.stopwatch.timerInterval);
        state.stopwatch.elapsedTime = 0;
        state.stopwatch.laps = [];
        swDisplay.textContent = '00:00:00.00';
        swStartBtn.textContent = 'Start';
        swStartBtn.className = 'btn btn-primary';
        swLapBtn.disabled = true;
        lapList.innerHTML = '';
    });

    // --- Countdown Timer Logic (Robust) ---
    const tDisplay = document.getElementById('timer-display');
    const tStartBtn = document.getElementById('timer-start');
    const tResetBtn = document.getElementById('timer-reset');
    const tInputs = { h: document.getElementById('timer-h'), m: document.getElementById('timer-m'), s: document.getElementById('timer-s') };

    const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((state.timer.endTime - now) / 1000));
        state.timer.remaining = diff;
        
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        tDisplay.textContent = `${h}:${m}:${s}`;

        if (diff <= 0) {
            clearInterval(state.timer.interval);
            state.timer.interval = null;
            state.timer.isRunning = false;
            tStartBtn.textContent = 'Start';
            playAlarm();
            showToast('Timer Finished!', 'success');
        }
    };

    tStartBtn.addEventListener('click', () => {
        if (state.timer.isRunning) {
            clearInterval(state.timer.interval);
            state.timer.isRunning = false;
            tStartBtn.textContent = 'Resume';
        } else {
            if (state.timer.remaining <= 0) {
                const h = parseInt(tInputs.h.value) || 0;
                const m = parseInt(tInputs.m.value) || 0;
                const s = parseInt(tInputs.s.value) || 0;
                state.timer.remaining = (h * 3600) + (m * 60) + s;
            }
            if (state.timer.remaining > 0) {
                state.timer.endTime = Date.now() + (state.timer.remaining * 1000);
                state.timer.interval = setInterval(updateTimer, 1000);
                state.timer.isRunning = true;
                updateTimer();
                tStartBtn.textContent = 'Pause';
            } else {
                showToast('Please set a time first', 'info');
            }
        }
    });

    tResetBtn.addEventListener('click', () => {
        clearInterval(state.timer.interval);
        state.timer.interval = null;
        state.timer.remaining = 0;
        state.timer.isRunning = false;
        tDisplay.textContent = '00:00:00';
        tStartBtn.textContent = 'Start';
    });

    // --- Pomodoro Logic ---
    const pomoDisplay = document.getElementById('pomodoro-display');
    const pomoStartBtn = document.getElementById('pomodoro-start');
    const pomoResetBtn = document.getElementById('pomodoro-reset');
    const pomoModeBtns = document.querySelectorAll('.pomo-mode');

    const updatePomo = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((state.pomodoro.endTime - now) / 1000));
        state.pomodoro.remaining = diff;
        pomoDisplay.textContent = formatShortTime(diff);

        if (diff <= 0) {
            clearInterval(state.pomodoro.interval);
            state.pomodoro.isRunning = false;
            pomoStartBtn.textContent = 'Start';
            playAlarm();
            showToast(`${state.pomodoro.mode.toUpperCase()} session complete!`, 'success');
        }
    };

    pomoStartBtn.addEventListener('click', () => {
        if (state.pomodoro.isRunning) {
            clearInterval(state.pomodoro.interval);
            state.pomodoro.isRunning = false;
            pomoStartBtn.textContent = 'Resume';
        } else {
            state.pomodoro.endTime = Date.now() + (state.pomodoro.remaining * 1000);
            state.pomodoro.interval = setInterval(updatePomo, 1000);
            state.pomodoro.isRunning = true;
            updatePomo();
            pomoStartBtn.textContent = 'Pause';
        }
    });

    pomoResetBtn.addEventListener('click', () => {
        clearInterval(state.pomodoro.interval);
        state.pomodoro.isRunning = false;
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
            state.pomodoro.isRunning = false;
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
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((state.sleep.endTime - now) / 1000));
        state.sleep.remaining = diff;
        sleepDisplay.textContent = formatShortTime(diff);
        
        if (diff <= 60 && diff > 0) {
            fadeStatus.textContent = `Fading out audio... ${Math.round((diff / 60) * 100)}% volume`;
        }

        if (diff <= 0) {
            clearInterval(state.sleep.interval);
            state.sleep.isRunning = false;
            sleepStartBtn.textContent = 'Start';
            fadeStatus.textContent = 'Audio fade-out complete.';
            showToast('Sleep Timer Finished', 'success');
        }
    };

    sleepStartBtn.addEventListener('click', () => {
        if (state.sleep.isRunning) {
            clearInterval(state.sleep.interval);
            state.sleep.isRunning = false;
            sleepStartBtn.textContent = 'Resume';
        } else {
            if (state.sleep.remaining <= 0 || state.sleep.remaining === state.sleep.duration) {
                state.sleep.duration = (parseInt(sleepInput.value) || 30) * 60;
                state.sleep.remaining = state.sleep.duration;
            }
            state.sleep.endTime = Date.now() + (state.sleep.remaining * 1000);
            state.sleep.interval = setInterval(updateSleep, 1000);
            state.sleep.isRunning = true;
            updateSleep();
            sleepStartBtn.textContent = 'Pause';
            fadeStatus.textContent = 'Sleep timer active.';
        }
    });

    sleepResetBtn.addEventListener('click', () => {
        clearInterval(state.sleep.interval);
        state.sleep.isRunning = false;
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
        if (state.multiTimers.length === 0) {
            multiContainer.innerHTML = '<div class="glass-card" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No timers yet. Tap "New Timer" to start.</div>';
            return;
        }
        state.multiTimers.forEach((timer, index) => {
            const card = document.createElement('div');
            card.className = 'glass-card timer-card';
            card.innerHTML = `
                <div class="timer-card-header">
                    <span class="timer-card-title">${timer.name}</span>
                    <button class="btn-icon delete-timer" data-index="${index}" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="timer-card-display">${formatShortTime(timer.remaining)}</div>
                <div class="controls">
                    <button class="btn btn-primary btn-sm toggle-multi" data-index="${index}">${timer.running ? 'Pause' : 'Start'}</button>
                    <button class="btn btn-danger btn-sm reset-multi" data-index="${index}">Reset</button>
                </div>
            `;
            multiContainer.appendChild(card);
        });
        localStorage.setItem('multiTimers', JSON.stringify(state.multiTimers.map(t => ({...t, interval: null}))));
    };

    addMultiBtn.addEventListener('click', () => {
        const name = prompt('Timer Name:', `Timer ${state.multiTimers.length + 1}`) || 'New Timer';
        const mins = parseInt(prompt('Minutes:', '10')) || 10;
        state.multiTimers.push({
            name,
            duration: mins * 60,
            remaining: mins * 60,
            running: false,
            endTime: 0
        });
        renderMultiTimers();
    });

    multiContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const index = parseInt(target.getAttribute('data-index'));
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
                timer.endTime = Date.now() + (timer.remaining * 1000);
                timer.interval = setInterval(() => {
                    const now = Date.now();
                    timer.remaining = Math.max(0, Math.ceil((timer.endTime - now) / 1000));
                    if (timer.remaining <= 0) {
                        clearInterval(timer.interval);
                        timer.running = false;
                        playAlarm();
                        showToast(`Timer "${timer.name}" finished!`, 'success');
                    }
                    renderMultiTimers();
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
        if (state.alarms.length === 0) {
            alarmContainer.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--text-muted);">No alarms set.</div>';
            return;
        }
        state.alarms.forEach((alarm, index) => {
            const item = document.createElement('div');
            item.className = 'glass-card alarm-item';
            item.innerHTML = `
                <div class="alarm-info">
                    <h4 style="font-size:1.5rem;">${alarm.time}</h4>
                    <p>${alarm.label || 'Alarm'}</p>
                </div>
                <div class="alarm-actions">
                    <label class="switch">
                        <input type="checkbox" class="toggle-alarm" data-index="${index}" ${alarm.active ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <button class="btn-icon delete-alarm" data-index="${index}" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.2rem; margin-left:1rem;"><i class="fa-solid fa-trash"></i></button>
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
        state.alarms.push({ time, label, active: true, lastTriggered: null });
        renderAlarms();
    });

    alarmContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-alarm');
        if (btn) {
            const idx = parseInt(btn.getAttribute('data-index'));
            state.alarms.splice(idx, 1);
            renderAlarms();
            return;
        }
        
        if (e.target.classList.contains('toggle-alarm')) {
            const idx = parseInt(e.target.getAttribute('data-index'));
            state.alarms[idx].active = e.target.checked;
            localStorage.setItem('alarms', JSON.stringify(state.alarms));
        }
    });

    // Check alarms every second
    setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const today = now.toDateString();
        
        state.alarms.forEach(alarm => {
            if (alarm.active && alarm.time === currentTime && alarm.lastTriggered !== today) {
                alarm.lastTriggered = today;
                playAlarm();
                showToast(`ALARM: ${alarm.label}`, 'success');
                localStorage.setItem('alarms', JSON.stringify(state.alarms));
            }
        });
    }, 1000);

    // Initial Renders
    renderMultiTimers();
    renderAlarms();
});
