const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CẤU HÌNH HỆ THỐNG ---
const GRID_SIZE = 20;
let score = 0;
let gameOver = false;
let spawnTimer = 0;

// Bộ kiểm soát tốc độ (Hãm phanh game)
let lastTime = 0;
const FPS = 7; // Chỉnh số này nhỏ xuống (ví dụ 5, 6) nếu bạn muốn chậm hơn nữa

// 1. ĐỘI QUÂN CHIẾN BINH (Thân Rắn)
let squad = [
    { x: 15, y: 15, color: "#38bdf8", type: "LEADER" }, // Đại ca dẫn đường (Xanh lam)
    { x: 14, y: 15, color: "#fbbf24", type: "ARCHER" }, // Cung thủ (Vàng)
    { x: 13, y: 15, color: "#f43f5e", type: "MAGE" }    // Pháp sư (Đỏ)
];

// Hướng di chuyển mặc định
let dx = 1;
let dy = 0;
let nextDx = 1;
let nextDy = 0;

// 2. NGỌC KINH NGHIỆM
let xpGem = { x: 5, y: 5 };

// 3. QUÁI VẬT (ZOMBIE) & ĐẠN
let zombies = [];
let bullets = [];

// Bắt sự kiện bàn phím
window.addEventListener("keydown", (e) => {
    if ((e.code === "ArrowUp" || e.code === "KeyW") && dy !== 1) { nextDx = 0; nextDy = -1; }
    if ((e.code === "ArrowDown" || e.code === "KeyS") && dy !== -1) { nextDx = 0; nextDy = 1; }
    if ((e.code === "ArrowLeft" || e.code === "KeyA") && dx !== 1) { nextDx = -1; nextDy = 0; }
    if ((e.code === "ArrowRight" || e.code === "KeyD") && dx !== -1) { nextDx = 1; nextDy = 0; }
});

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

    zombies.push({ x: zX, y: zY, speed: 1.2, radius: 8 });
}

// --- LOGIC TRÒ CHƠI ---
function update() {
    if (gameOver) return;

    dx = nextDx; dy = nextDy;

    // 1. Đội quân di chuyển
    const newHead = { 
        x: squad[0].x + dx, 
        y: squad[0].y + dy, 
        color: "#38bdf8", 
        type: "LEADER" 
    };
    squad.unshift(newHead);

    // Kiểm tra ăn Ngọc EXP
    const hasEatenGem = squad[0].x === xpGem.x && squad[0].y === xpGem.y;
    if (hasEatenGem) {
        score += 10;
        spawnXpGem();
        squad[squad.length - 1].color = ["#a855f7", "#10b981", "#f97316"][Math.floor(Math.random() * 3)];
    } else {
        squad.pop();
    }

    // Thua nếu đâm vào tường
    if (squad[0].x < 0 || squad[0].x >= canvas.width/GRID_SIZE || squad[0].y < 0 || squad[0].y >= canvas.height/GRID_SIZE) {
        gameOver = true;
    }

    // 2. Các chiến binh tự động BẮN ĐẠN
    if (spawnTimer % 2 === 0 && zombies.length > 0) {
        squad.forEach((soldier, index) => {
            if (index > 0 && Math.random() > 0.4) {
                let target = zombies[Math.floor(Math.random() * zombies.length)];
                let sX = soldier.x * GRID_SIZE + GRID_SIZE/2;
                let sY = soldier.y * GRID_SIZE + GRID_SIZE/2;
                
                let angle = Math.atan2(target.y - sY, target.x - sX);
                bullets.push({
                    x: sX, y: sY,
                    vx: Math.cos(angle) * 6,
                    vy: Math.sin(angle) * 6
                });
            }
        });
    }

    // 3. Sinh quái vật Zombie
    spawnTimer++;
    if (spawnTimer % 5 === 0) spawnZombie(); // Điều chỉnh nhịp sinh quái tương thích tốc độ mới

    // 4. Di chuyển Đạn
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.x += b.vx; b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }

    // 5. Di chuyển Zombie và xử lý va chạm
    let leaderX = squad[0].x * GRID_SIZE + GRID_SIZE/2;
    let leaderY = squad[0].y * GRID_SIZE + GRID_SIZE/2;

    for (let i = zombies.length - 1; i >= 0; i--) {
        let z = zombies[i];
        
        let angle = Math.atan2(leaderY - z.y, leaderX - z.x);
        z.x += Math.cos(angle) * z.speed;
        z.y += Math.sin(angle) * z.speed;

        let distToLeader = Math.hypot(leaderX - z.x, leaderY - z.y);
        if (distToLeader < z.radius + GRID_SIZE/2) {
            gameOver = true;
        }

        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            let distToBullet = Math.hypot(b.x - z.x, b.y - z.y);
            if (distToBullet < z.radius + 4) {
                zombies.splice(i, 1);
                bullets.splice(j, 1);
                score += 5;
                break;
            }
        }
    }
}

// --- VẼ ĐỒ HỌA ĐẤU TRƯỜNG ---
function draw() {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ Ngọc EXP
    ctx.fillStyle = "#c084fc";
    ctx.shadowBlur = 10; ctx.shadowColor = "#c084fc";
    ctx.fillRect(xpGem.x * GRID_SIZE + 4, xpGem.y * GRID_SIZE + 4, GRID_SIZE - 8, GRID_SIZE - 8);
    ctx.shadowBlur = 0;

    // Vẽ Đội Quân Chiến Binh
    squad.forEach((soldier, index) => {
        ctx.fillStyle = soldier.color;
        let sX = soldier.x * GRID_SIZE;
        let sY = soldier.y * GRID_SIZE;
        ctx.fillRect(sX + 1, sY + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        
        if (index === 0) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(sX + 4, sY + 4, 4, 4);
            ctx.fillRect(sX + 12, sY + 4, 4, 4);
        }
    });

    // Vẽ Đạn
    ctx.fillStyle = "#38bdf8";
    bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill();
    });

    // Vẽ Quái Vật Zombie
    ctx.fillStyle = "#ef4444";
    zombies.forEach(z => {
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fde047";
        ctx.fillRect(z.x - 2, z.y - 3, 1.5, 1.5);
        ctx.fillRect(z.x + 1, z.y - 3, 1.5, 1.5);
        ctx.fillStyle = "#ef4444";
    });

    // Thông tin hiển thị
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 16px Arial";
    ctx.fillText(`Kinh Nghiệm: ${score}`, 20, 35);
    ctx.fillText(`Quân Số: ${squad.length}`, 20, 60);

    // Game Over
    if (gameOver) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ef4444"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center";
        ctx.fillText("BỊ QUÁI VẬT NUỐT CHỬNG!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#ffffff"; ctx.font = "20px Arial";
        ctx.fillText(`Đội hình của bạn sống sót với ${squad.length} chiến binh`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.font = "14px Arial"; ctx.fillText("Nhấn F5 để xây dựng lại đội quân mới!", canvas.width / 2, canvas.height / 2 + 60);
        ctx.textAlign = "start";
    }
}

// --- VÒNG LẶP KIỂM SOÁT TỐC ĐỘ CHUẨN ---
function mainLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let elapsed = timestamp - lastTime;

    if (elapsed > 1000 / FPS) {
        update();
        draw();
        lastTime = timestamp;
    }

    requestAnimationFrame(mainLoop);
}

// Khởi động
spawnXpGem();
requestAnimationFrame(mainLoop);