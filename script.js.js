const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const spinButton = document.getElementById("spinButton");
const result = document.getElementById("result");
const resultName = document.getElementById("resultName");
const resultText = document.getElementById("resultText");
const pointer = document.getElementById("pointer");

const muteButton = document.getElementById("muteButton");
const resetButton = document.getElementById("resetButton");
const spinCountEl = document.getElementById("spinCount");
const topResultEl = document.getElementById("topResult");
const historyList = document.getElementById("historyList");
const characterEls = document.querySelectorAll(".character");

const confettiCanvas = document.getElementById("confetti");
const cctx = confettiCanvas.getContext("2d");

const mariem = [
    {
        name: "Mariem Njoum",
        emoji: "⭐",
        text: "Mariem tlam3 akther mel njoum ⭐"
    },
    {
        name: "Mariem Chams",
        emoji: "☀️",
        text: "Mariem chams tdhawi kol chay ☀️"
    },
    {
        name: "Mariem Ta3mel Fel 7es",
        emoji: "🤦",
        text: "Mariem yezi mel 7es 😂"
    },
    {
        name: "Mariem 3asir",
        emoji: "🧃",
        text: "Mariem t7eb 3asir barcha 🧃"
    },
    {
        name: "Mariem T7eb L7out">,
        emoji: "🐟",
        text: "Mariem metnefsa m3a l7out, ki chay ki la chay 🐟😂"
    },
    {
        name: "Mariem Bent Imen",
        emoji: "😂",
        text: "Mariem bent Imen, حاضر 😂"
    },
    {
        name: "Mariem Idha Sghayra",
        emoji: "👶",
        text: "Mariem wallat sghayra fjaa 👶"
    },
    {
        name: "Mariem Bhima",
        emoji: "🤪",
        text: "Mariem chwaya bhima lyom 🤪"
    },
    {
        name: "Mariem Bisa",
        emoji: "🐱",
        text: "Mariem bisa mode activé 🐱"
    },
    {
        name: "Mariem Basbousa",
        emoji: "🍰",
        text: "Mariem hlouwa kif basbousa 🍰"
    }
];

const colors = [
    "#ff2d75",
    "#ff6a00",
    "#ffd000",
    "#00c896",
    "#00a8ff",
    "#7c4dff",
    "#e84393",
    "#6c5ce7",
    "#00cec9",
    "#fd79a8"
];

let rotation = 0;
let spinning = false;
let muted = false;
let audioCtx = null;

let history = [];
let stats = {};
let lastWinnerName = null;
let streak = 0;

const center = canvas.width / 2;
const radius = 235;

/* ---------- Roue ---------- */

function drawWheel() {

    const slice = (Math.PI * 2) / mariem.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < mariem.length; i++) {

        const start = i * slice;
        const end = start + slice;

        ctx.beginPath();

        ctx.moveTo(center, center);
        ctx.arc(
            center,
            center,
            radius,
            start,
            end
        );

        ctx.closePath();

        ctx.fillStyle = colors[i];
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();

        ctx.translate(center, center);
        ctx.rotate(start + slice / 2);

        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 17px Arial";

        ctx.fillText(
            mariem[i].name,
            radius - 15,
            6
        );

        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(center, center, 42, 0, Math.PI * 2);

    ctx.fillStyle = "#111";
    ctx.fill();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;
    ctx.stroke();
}

drawWheel();

/* ---------- Son (Web Audio API, sans fichiers externes) ---------- */

function ensureAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function playTick() {
    if (muted || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = 700;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playWin() {
    if (muted || !audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const start = audioCtx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
    });
}

function scheduleTicks() {
    let elapsed = 0;
    let interval = 60;

    function tick() {
        if (elapsed >= 4800) return;
        playTick();
        interval = interval * 1.09;
        elapsed += interval;
        setTimeout(tick, interval);
    }

    tick();
}

muteButton.addEventListener("click", function () {
    muted = !muted;
    muteButton.textContent = muted ? "🔇" : "🔊";
    muteButton.title = muted ? "Son coupé" : "Son";
});

/* ---------- Confetti ---------- */

function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfetti);
resizeConfetti();

let confettiParticles = [];

function spawnConfetti() {
    const rect = canvas.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    for (let i = 0; i < 90; i++) {
        confettiParticles.push({
            x: originX,
            y: originY,
            vx: (Math.random() - 0.5) * 14,
            vy: Math.random() * -12 - 4,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            vr: (Math.random() - 0.5) * 12,
            life: 0,
            maxLife: 80 + Math.random() * 40
        });
    }

    requestAnimationFrame(updateConfetti);
}

function updateConfetti() {
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach(p => {
        p.vy += 0.28;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        p.life++;

        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate((p.rotation * Math.PI) / 180);
        cctx.fillStyle = p.color;
        cctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
        cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        cctx.restore();
    });

    confettiParticles = confettiParticles.filter(
        p => p.life < p.maxLife && p.y < confettiCanvas.height + 50
    );

    if (confettiParticles.length > 0) {
        requestAnimationFrame(updateConfetti);
    } else {
        cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}

/* ---------- Historique & stats ---------- */

function recordResult(item) {
    history.unshift(item);
    if (history.length > 10) history.pop();

    stats[item.name] = (stats[item.name] || 0) + 1;

    renderHistory();
    renderStats();
}

function renderHistory() {
    historyList.innerHTML = "";

    if (history.length === 0) {
        const empty = document.createElement("span");
        empty.className = "history-empty";
        empty.textContent = "Ama7ad dar spin bara9a 👀";
        historyList.appendChild(empty);
        return;
    }

    history.forEach(item => {
        const chip = document.createElement("div");
        chip.className = "history-chip";
        chip.textContent = `${item.emoji} ${item.name}`;
        historyList.appendChild(chip);
    });
}

function renderStats() {
    const totalSpins = Object.values(stats).reduce((a, b) => a + b, 0);
    spinCountEl.textContent = totalSpins;

    let top = "—";
    let topCount = 0;

    for (const [name, count] of Object.entries(stats)) {
        if (count > topCount) {
            top = name;
            topCount = count;
        }
    }

    topResultEl.textContent = topCount > 0 ? `${top} (${topCount}x)` : "—";
}

resetButton.addEventListener("click", function () {
    history = [];
    stats = {};
    lastWinnerName = null;
    streak = 0;
    renderHistory();
    renderStats();
});

/* ---------- Spin ---------- */

function highlightWinner(name) {
    characterEls.forEach(el => {
        el.classList.toggle("winner", el.dataset.name === name);
    });
}

function spin() {
    if (spinning) return;

    ensureAudio();

    spinning = true;
    spinButton.disabled = true;

    result.classList.remove("show", "shake");
    canvas.classList.add("spinning");

    scheduleTicks();

    const random = Math.floor(Math.random() * mariem.length);
    const chosen = mariem[random];

    const slice = 360 / mariem.length;

    const target =
        360 * 5 +
        (360 - (random * slice + slice / 2));

    rotation += target;

    canvas.style.transform = `rotate(${rotation}deg)`;

    setTimeout(function () {

        canvas.classList.remove("spinning");

        pointer.classList.remove("bump");
        void pointer.offsetWidth;
        pointer.classList.add("bump");

        if (lastWinnerName === chosen.name) {
            streak++;
        } else {
            streak = 1;
        }
        lastWinnerName = chosen.name;

        resultName.textContent = `${chosen.emoji} ${chosen.name}`;
        resultText.innerHTML = chosen.text +
            (streak >= 2 ? `<br><span class="streak">🔥 Streak x${streak}!</span>` : "");

        result.classList.add("show", "shake");
        highlightWinner(chosen.name);

        playWin();
        spawnConfetti();

        recordResult(chosen);

        spinButton.disabled = false;
        spinning = false;

    }, 5000);
}

spinButton.addEventListener("click", spin);

document.addEventListener("keydown", function (e) {
    if ((e.code === "Space" || e.key === " ") && !spinning) {
        e.preventDefault();
        spin();
    }
});
