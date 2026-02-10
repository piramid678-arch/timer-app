// ===== 프로그레스 링 설정 =====
const circle = document.querySelector('.progress-ring__circle');
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = 0;

// ===== 타이머 상태 변수 =====
let timerInterval;
let timeLeft = 1500;
let totalTime = 1500;
let isRunning = false;

// ===== DOM 요소 =====
const timeDisplay = document.getElementById('time-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const chips = document.querySelectorAll('.chip');
const streakCountEl = document.getElementById('streak-count');
const todayPomodorosEl = document.getElementById('today-pomodoros');
const todayMinutesEl = document.getElementById('today-minutes');
const totalPomodorosEl = document.getElementById('total-pomodoros');

// ===== Local Storage 유틸 =====
const STORAGE_KEY = 'focusTimerData';

function getToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayOfWeek(dateStr) {
    const d = new Date(dateStr);
    // 0=일, 1=월 ... 6=토 → 우리는 0=월 ~ 6=일
    return (d.getDay() + 6) % 7;
}

function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? 6 : day - 1); // 월요일 기준
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return {
            dailyRecords: {},  // { "2026-02-10": { pomodoros: 3, minutes: 75 } }
            totalPomodoros: 0,
            streak: 0,
            lastActiveDate: null
        };
    }
    return JSON.parse(raw);
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ===== Streak 계산 =====
function calculateStreak(data) {
    const today = getToday();
    const todayRecord = data.dailyRecords[today];

    // 오늘 기록이 있으면 오늘부터, 없으면 어제부터 시작
    let checkDate = new Date();
    if (!todayRecord || todayRecord.pomodoros === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    let streak = 0;
    while (true) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        const record = data.dailyRecords[dateStr];
        if (record && record.pomodoros > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// ===== 뽀모도로 완료 기록 =====
function recordPomodoro(durationMinutes) {
    const data = loadData();
    const today = getToday();

    if (!data.dailyRecords[today]) {
        data.dailyRecords[today] = { pomodoros: 0, minutes: 0 };
    }

    data.dailyRecords[today].pomodoros++;
    data.dailyRecords[today].minutes += durationMinutes;
    data.totalPomodoros++;
    data.lastActiveDate = today;
    data.streak = calculateStreak(data);

    saveData(data);
    updateStatsUI();
}

// ===== UI 업데이트 =====
function updateStatsUI() {
    const data = loadData();
    const today = getToday();
    const todayData = data.dailyRecords[today] || { pomodoros: 0, minutes: 0 };

    // 오늘 통계
    animateNumber(todayPomodorosEl, todayData.pomodoros);
    animateNumber(todayMinutesEl, todayData.minutes);
    animateNumber(totalPomodorosEl, data.totalPomodoros);

    // Streak
    const streak = calculateStreak(data);
    animateNumber(streakCountEl, streak);

    // 주간 차트
    updateWeeklyChart(data);
}

function animateNumber(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const diff = target - current;
    const steps = Math.min(Math.abs(diff), 20);
    const increment = diff / steps;
    let step = 0;

    const interval = setInterval(() => {
        step++;
        if (step >= steps) {
            el.textContent = target;
            clearInterval(interval);
        } else {
            el.textContent = Math.round(current + increment * step);
        }
    }, 30);
}

// ===== 주간 차트 업데이트 =====
function updateWeeklyChart(data) {
    const weekStart = getWeekStart();
    const weekData = [];
    const todayIndex = getDayOfWeek(getToday());

    // 이번 주 월~일 데이터 수집
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const record = data.dailyRecords[dateStr];
        weekData.push(record ? record.pomodoros : 0);
    }

    const maxVal = Math.max(...weekData, 1); // 최소 1로 나눗셈 방지

    for (let i = 0; i < 7; i++) {
        const bar = document.getElementById(`bar-${i}`);
        const wrapper = bar.closest('.chart-bar-wrapper');
        const value = weekData[i];
        const heightPercent = (value / maxVal) * 100;

        bar.style.height = `${Math.max(heightPercent, 5)}%`;
        bar.querySelector('.bar-value').textContent = value;

        // 오늘 표시
        if (i === todayIndex) {
            wrapper.classList.add('today');
        } else {
            wrapper.classList.remove('today');
        }
    }
}

// ===== 완료 팝업 =====
function showCompletionPopup(pomodoros) {
    // 기존 팝업이 있으면 제거
    const existing = document.querySelector('.completion-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'completion-overlay';

    const messages = [
        { emoji: '🎉', title: '훌륭해요!', subtitle: '집중을 완료했습니다!' },
        { emoji: '⭐', title: '대단해요!', subtitle: '오늘 벌써 ' + pomodoros + '번째 뽀모도로!' },
        { emoji: '🚀', title: '최고예요!', subtitle: '꾸준함이 실력을 만듭니다!' },
        { emoji: '💪', title: '화이팅!', subtitle: '집중의 힘을 느끼세요!' },
    ];

    const msg = messages[Math.min(pomodoros - 1, messages.length - 1)];

    overlay.innerHTML = `
        <div class="completion-card">
            <div class="completion-emoji">${msg.emoji}</div>
            <div class="completion-title">${msg.title}</div>
            <div class="completion-subtitle">${msg.subtitle}</div>
            <button class="completion-btn" id="completion-close">확인</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // 살짝 딜레이 후 표시 (애니메이션)
    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });

    document.getElementById('completion-close').addEventListener('click', () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    });
}

// ===== 타이머 디스플레이 업데이트 =====
function updateDisplay() {
    if (timeLeft < 0) timeLeft = 0;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const progressRatio = timeLeft / totalTime;
    const offset = circumference * (1 - progressRatio);
    circle.style.strokeDashoffset = offset;
}

// ===== 타이머 기능 =====
function startTimer() {
    if (isRunning) return;

    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            timeLeft = 0;
            updateDisplay();

            // 뽀모도로 완료 기록 (집중 타이머만 = 15분 이상)
            const durationMinutes = Math.round(totalTime / 60);
            if (totalTime >= 900) {
                recordPomodoro(durationMinutes);
                const data = loadData();
                const today = getToday();
                const todayData = data.dailyRecords[today];
                showCompletionPopup(todayData.pomodoros);
            } else {
                // 휴식 완료
                showCompletionPopup(0);
            }
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    startBtn.textContent = "계속";
    pauseBtn.disabled = true;
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    startBtn.textContent = "시작";
    pauseBtn.disabled = true;

    const activeChip = document.querySelector('.chip.active');
    if (activeChip) {
        totalTime = parseInt(activeChip.dataset.time);
    } else {
        totalTime = 1500;
    }
    timeLeft = totalTime;

    updateDisplay();
}

// ===== 이벤트 리스너 =====
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

chips.forEach(chip => {
    chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const selectedTime = parseInt(chip.dataset.time);
        totalTime = selectedTime;
        timeLeft = selectedTime;

        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.textContent = "시작";
        } else {
            startBtn.textContent = "시작";
        }

        updateDisplay();
    });
});

// ===== SNS 공유 기능 =====
document.getElementById('share-facebook').addEventListener('click', () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
});

document.getElementById('share-twitter').addEventListener('click', () => {
    const url = window.location.href;
    const text = "⏱️ 오늘의 집중 - 집중력을 높여주는 무료 온라인 타이머!";
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
});

document.getElementById('share-copy').addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert("링크가 복사되었습니다! 원하는 곳에 붙여넣으세요.");
    }).catch(err => {
        console.error('링크 복사 실패:', err);
    });
});

// ===== 초기화 =====
updateDisplay();
updateStatsUI();
