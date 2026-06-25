const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CẤU HÌNH HỆ THỐNG ---
const GRID_SIZE = 20;
let score = 0;
let gameOver = false;
let spawnTimer = 0;

let lastTime = 0;
const FPS = 7; // Tốc độ chạy chậm vừa phải, mượt mà

// 1. ĐỘI QUÂN CHIẾN BINH (Thân Rắn)
let squad = [
    { x: 15, y: 10, color: "#38bdf8" }, // Đại ca (Xanh lam)
    { x: 14, y: 10, color: "#fbbf24" }, // Cung thủ (Vàng)
    { x: 13, y: 10, color: "#f43f5e" }  // Pháp sư (Đỏ)
];

let dx = 1; let dy = 0;
let nextDx = 1; let nextDy = 0;

// 2. NGỌC KINH NGHIỆM & QUÁI VẬT
let xpGem = { x: 5, y: 5 };
let zombies = [];
let bullets = [];

// --- ĐIỀU KHIỂN TRÊN MÁY TÍNH (BÀN PHÍM) ---
window.addEventListener("keydown", (e) => {
    if ((e.code === "ArrowUp" || e.code === "KeyW") && dy !== 1) { nextDx = 0; nextDy = -1; }
    if ((e.code === "ArrowDown" || e.code === "KeyS") && dy !== -1) { nextDx = 0; nextDy = 1; }
    if ((e.code === "ArrowLeft" || e.code === "KeyA") && dx !== 1) { nextDx = -1; nextDy = 0; }
    if ((e.code === "ArrowRight" || e.code === "KeyD") && dx !== -1) { nextDx = 1; nextDy = 0; }
});

// --- ĐIỀU KHIỂN TRÊN ĐIỆN THOẠI (CẢM ỨNG) ---
function setDirection(dir) {
    if (gameOver) return;
    if (dir === "UP" && dy !== 1) { nextDx = 0; nextDy = -1; }
    if (dir === "DOWN" && dy !== -1) { nextDx = 0; nextDy = 1; }
    if (dir === "LEFT" && dx !== 1) { nextDx = -1; nextDy = 0; }
    if (dir === "RIGHT" && dx !== -1) { nextDx = 1; nextDy = 0; }
}

// Bắt sự kiện chạm (touchstart cho điện thoại để không bị trễ)
document.getElementById("btnUp").addEventListener("touchstart", (e) => { e.preventDefault(); setDirection("UP"); });
document.getElementById("btnDown").addEventListener("touchstart", (e) => { e.preventDefault(); setDirection("DOWN"); });
document.getElementById("btnLeft").addEventListener("touchstart", (e) => { e.preventDefault(); setDirection("LEFT"); });
document.getElementById("btnRight").addEventListener("touchstart", (e) => { e.preventDefault(); setDirection("RIGHT"); });

// Hỗ trợ cả click chuột trên máy tính nếu muốn test nút
document.getElementById("btnUp").addEventListener("mousedown", () => setDirection("UP"));
document.getElementById("btnDown").addEventListener("mousedown", () => setDirection("DOWN"));
document.getElementById("btnLeft").addEventListener("mousedown", () => setDirection("LEFT"));
document.getElementById("btnRight").addEventListener("mousedown", () => setDirection("RIGHT"));


function spawnXpGem() {
    xpGem.x = Math.floor(Math.random() * (canvas.width / GRID_SIZE));
    xpGem.y = Math.floor(Math.random() * (canvas.height / GRID_SIZE));
}

function spawnZombie() {
    let edge = Math.floor(Math.random() * 4);
    let zX, zY;
    if (edge === 0) { zX = Math.random() * canvas.width; zY = -10; }
    else if (edge === 1) { zX = canvas.width + 10; zY = Math.random() * canvas.height; }
    else if (edge === 2) { zX = Math.random() * canvas.width; zY = canvas.height + 10; }
    else { zX = -10; zY = Math.random() * canvas.height; }

    zombies.push({ x: zX, y: zY, speed: 1.0, radius: 8 });
}

// --- LOGIC GAME ---
function update() {
    if (gameOver) return;

    dx = nextDx; dy = nextDy;

    // Di chuyển đội hình
    const newHead = { x: squad[0].x + dx, y: squad[0].y + dy, color: "#38bdf8" };
    squad.unshift(newHead);

    // Ăn ngọc
    if (squad[0].x === xpGem.x && squad[0].y === xpGem.y) {
        score += 10;
        spawnXpGem();
        squad[squad.length - 1].color = ["#a855f7", "#10b981", "#f97316"][Math.floor(Math.random() * 3)];
    } else {
        squad.pop();
    }

    // Đâm tường -> Game Over
    if (squad[0].x < 0 || squad[0].x >= canvas.width/GRID_SIZE || squad[0].y < 0 || squad[0].y >= canvas.height/GRID_SIZE) {
        gameOver = true;
    }

    // Tự động bắn đạn
    if (spawnTimer % 2 === 0 && zombies.length > 0) {
        squad.forEach((soldier, index) => {
            if (index > 0 && Math.random() > 0.4) {
                let target = zombies[Math.floor(Math.random() * zombies.length)];
                let sX = soldier.x * GRID_SIZE + GRID_SIZE/2;
                let sY = soldier.y * GRID_SIZE + GRID_SIZE/2;
                let angle = Math.atan2(target.y - sY, target.x - sX);
                bullets.push({ x: sX, y: sY, vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6 });
            }
        });
    }

    spawnTimer++;
    if (spawnTimer % 6 === 0) spawnZombie();

    // Di chuyển đạn
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i]; b.x += b.vx; b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
    }

    // Di chuyển quái và va chạm
    let leaderX = squad[0].x * GRID_SIZE + GRID_SIZE/2;
    let leaderY = squad[0].y * GRID_SIZE + GRID_SIZE/2;

    for (let i = zombies.length - 1; i >= 0; i--) {
        let z = zombies[i];
        let angle = Math.atan2(leaderY - z.y, leaderX - z.x);
        z.x += Math.cos(angle) * z.speed; z.y += Math.sin(angle) * z.speed;

        if (Math.hypot(leaderX - z.x, leaderY - z.y) < z.radius + GRID_SIZE/2) gameOver = true;

        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (Math.hypot(b.x - z.x, b.y - z.y) < z.radius + 4) {
                zombies.splice(i, 1); bullets.splice(j, 1);
                score += 5; break;
            }
        }
    }
}

// --- VẼ ĐỒ HỌA ---
function draw() {
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ngọc EXP
    ctx.fillStyle = "#c084fc"; ctx.fillRect(xpGem.x * GRID_SIZE + 4, xpGem.y * GRID_SIZE + 4, GRID_SIZE - 8, GRID_SIZE - 8);

    // Chiến binh
    squad.forEach((soldier, index) => {
        ctx.fillStyle = soldier.color;
        ctx.fillRect(soldier.x * GRID_SIZE + 1, soldier.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
    });

    // Đạn
    ctx.fillStyle = "#38bdf8";
    bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill(); });

    // Quái vật
    ctx.fillStyle = "#ef4444";
    zombies.forEach(z => { ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI*2); ctx.fill(); });

    // Điểm số
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 16px Arial";
    ctx.fillText(`Điểm: ${score}`, 20, 35);

    if (gameOver) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ef4444"; ctx.font = "bold 30px Arial"; ctx.textAlign = "center";
        ctx.fillText("BỊ QUÁI VẬT NUỐT CHỬNG!", canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = "#ffffff"; ctx.font = "16px Arial";
        ctx.fillText("Tải lại trang (F5) để chơi lại", canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = "start";
    }
}

// --- VÒNG LẶP CHÍNH ---
function mainLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let elapsed = timestamp - lastTime;
    if (elapsed > 1000 / FPS) { update(); draw(); lastTime = timestamp; }
    requestAnimationFrame(mainLoop);
}

spawnXpGem();
requestAnimationFrame(mainLoop);
