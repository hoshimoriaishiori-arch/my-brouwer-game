// ====== 基本設定 ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = "start"; // start / play / gameover
let score = 0;
let level = 1;
let step = 0;
let currentLane = 0;
let bgOffset = 0;

// ====== レーンのY座標 ======
const laneY = [200, 300, 400];
const playerX = 100;

// ====== プレイヤー画像 ======
const playerImg1 = new Image();
playerImg1.src = "images/player/girl1.png";
const playerImg2 = new Image();
playerImg2.src = "images/player/girl2.png";

// ====== 背景画像（レベル1～9） ======
const backgrounds = [];
for (let i = 1; i <= 9; i++) {
    let bg = new Image();
    bg.src = `images/background/bg${i}.jpg`;
    backgrounds.push(bg);
}

// ====== 障害物画像（レベルごとに2種類） ======
const obstacleImgs = [];
for (let i = 1; i <= 9; i++) {
    let img1 = new Image();
    img1.src = `images/obstacle/${i}_1.png`;
    let img2 = new Image();
    img2.src = `images/obstacle/${i}_2.png`;
    obstacleImgs.push([img1, img2]);
}

// ====== スタート・ゲームオーバー画像 ======
const startImg = new Image();
startImg.src = "images/start.png";

const gameOverImgs = [];
for (let i = 1; i <= 9; i++) {
    let img = new Image();
    img.src = `images/gameover${i}.png`;
    gameOverImgs.push(img);
}

// ====== 障害物の初期設定 ======
let obstacles = [];
for (let i = 0; i < 3; i++) {
    obstacles.push({
        x: canvas.width + i * 400,
        lane: Math.floor(Math.random() * 3),
        speed: 2 + Math.random() * 3,
        img: null
    });
}

// ====== ゲーム開始処理 ======
function startGame() {
    gameState = "play";
    score = 0;
    level = 1;
    currentLane = 0;
    bgOffset = 0;
    obstacles.forEach((o, i) => {
        o.x = canvas.width + i * 400;
        o.lane = Math.floor(Math.random() * 3);
        o.speed = 2 + Math.random() * 3;
    });
}

// ====== スワイプ操作 ======
let startY = 0;
canvas.addEventListener("touchstart", e => {
    startY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", e => {
    let endY = e.changedTouches[0].clientY;
    if (gameState === "play") {
        if (startY - endY > 30 && currentLane > 0) currentLane--;
        if (endY - startY > 30 && currentLane < laneY.length - 1) currentLane++;
    } else if (gameState === "start" || gameState === "gameover") {
        startGame();
    }
});

// ====== ゲームループ ======
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "start") {
        ctx.drawImage(startImg, 0, 0, canvas.width, canvas.height);

    } else if (gameState === "play") {
        // 背景スクロール
        bgOffset -= 2;
        if (bgOffset <= -canvas.width) bgOffset = 0;
        ctx.drawImage(backgrounds[level - 1], bgOffset, 0, canvas.width, canvas.height);
        ctx.drawImage(backgrounds[level - 1], bgOffset + canvas.width, 0, canvas.width, canvas.height);

        // 障害物描画
        obstacles.forEach(obs => {
            obs.x -= obs.speed;
            if (obs.x < -50) {
                obs.x = canvas.width + Math.random() * 400;
                obs.lane = Math.floor(Math.random() * 3);
                obs.speed = 2 + Math.random() * 3;
                score++;
                if (score % 10 === 0 && level < 9) level++;
            }
            obs.img = obstacleImgs[level - 1][obs.speed > 3 ? 1 : 0];
            ctx.drawImage(obs.img, obs.x, laneY[obs.lane], 50, 50);

            // 当たり判定
            if (Math.abs(playerX - obs.x) < 40 && currentLane === obs.lane) {
                gameState = "gameover";
            }
        });

        // プレイヤー描画（走るアニメーション）
        if (step % 20 < 10) {
            ctx.drawImage(playerImg1, playerX, laneY[currentLane], 50, 50);
        } else {
            ctx.drawImage(playerImg2, playerX, laneY[currentLane], 50, 50);
        }
        step++;

        // スコア・レベル表示
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Score: ${score}`, 10, 30);
        ctx.fillText(`Level: ${level}`, 10, 60);

    } else if (gameState === "gameover") {
        ctx.drawImage(gameOverImgs[level - 1], 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.fillText(`Level: ${level}`, 10, 90);
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
