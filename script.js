const circle = document.querySelector('.progress-ring__circle');
const radius = circle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = 0;

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

let timerInterval;
let timeLeft = 1500; // 25분 기본값 (초 단위)
let totalTime = 1500;
let isRunning = false;

const timeDisplay = document.getElementById('time-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const chips = document.querySelectorAll('.chip');

// 시간 표시 및 진행률 링 업데이트 함수
function updateDisplay() {
    // 음수가 되지 않도록 방지
    if (timeLeft < 0) timeLeft = 0;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // 시간 텍스트 업데이트 (00:00 형식)
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // 진행률 링 업데이트
    // 시간이 줄어들수록 링이 줄어들게 (Full -> Empty)
    // offset 0 = Full, offset circumference = Empty
    const progessRatio = timeLeft / totalTime;
    const offset = circumference * (1 - progessRatio);
    circle.style.strokeDashoffset = offset;
}

function startTimer() {
    if (isRunning) return;

    isRunning = true;
    startBtn.disabled = true; // 시작 버튼 비활성화
    pauseBtn.disabled = false; // 일시정지 버튼 활성화

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
            alert("집중 시간이 끝났습니다! 휴식을 취하세요.");
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    startBtn.textContent = "계속"; // 텍스트 변경
    pauseBtn.disabled = true;
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    startBtn.textContent = "시작";
    pauseBtn.disabled = true;

    // 현재 선택된 칩의 시간으로 리셋
    const activeChip = document.querySelector('.chip.active');
    if (activeChip) {
        totalTime = parseInt(activeChip.dataset.time);
    } else {
        totalTime = 1500;
    }
    timeLeft = totalTime;

    updateDisplay();
}


// 이벤트 리스너 등록
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// 시간 프리셋 버튼 (칩) 로직
chips.forEach(chip => {
    chip.addEventListener('click', () => {
        // 모든 칩에서 active 클래스 제거하고 현재 칩에 추가
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        // 시간 설정 (초 단위)
        const selectedTime = parseInt(chip.dataset.time);
        totalTime = selectedTime;
        timeLeft = selectedTime;

        // 타이머가 돌고 있었다면 정지하고 리셋
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

// 초기화 실행
updateDisplay();
