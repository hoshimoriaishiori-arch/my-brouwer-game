// ====== 基本設定 ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = "start"; // start / play / gameover
let score = 0;
let level = 1;
let step = 0;
let currentLane = 0;
let bgOffset = 0;
let startY = 0;

// ゲームオーバーボタンの領域（後で使う）
let goButton = { x: 300, y: 500, w: 200, h: 50 };

// ====== レーンのY座標 ======
const laneY = [200, 300, 400];
const playerX = 100;

// ====== 画像読み込み関数 ======
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.error("画像読み込み失敗:", src);
            reject();
        };
        img.src = src;
    });
}

// ====== 画像読み込み ======
let playerImg1, playerImg2, backgrounds = [], obstacleImgs = [], startImg, gameOverImgs = [];

async function loadAssets() {
    // プレイヤー
    playerImg1 = await loadImage("images/player/girl1.png");
    playerImg2 = await loadImage("images/player/girl2.png");

    // 背景
    for (let i = 1; i <= 9; i++) {
        backgrounds.push(await loadImage(`images/background/bg${i}.png`));
    }

    // 障害物
    for (let i = 1; i <= 9; i++) {
        const img1 = await loadImage(`images/obstacle/${i}_1.png`);
        const img2 = await loadImage(`images/obstacle/${i}_2.png`);
        obstacleImgs.push([img1, img2]);
    }

    // スタート画面
    startImg = await loadImage("images/start.png");

    // ゲームオーバー画面
    for (let i = 1; i <= 9; i++) {
        gameOverImgs.push(await loadImage(`images/gameover${i}.png`));
    }
}

// ====== 障害物初期設定 ======
let obstacles = [];
function initObstacles() {
    obstacles = [];
    for (let i = 0; i < 3; i++) {
        obstacles.push({
            x: canvas.width + i * 400,
            lane: Math.floor(Math.random() * 3),
            speed: 2 + Math.random() * 3,
            img: null
        });
    }
}

// ====== ゲーム開始処理 ======
function startGame() {
    gameState = "play";
    score = 0;
    level = 1;
    currentLane = 0;
    bgOffset = 0;
    initObstacles();
}

// ====== 入力イベント ======
function handleInputStart(y, x) {
    startY = y;
    startX = x;
}
function handleInputEnd(y, x) {
    if (gameState === "play") {
        if (startY - y > 30 && currentLane > 0) currentLane--;
        if (y - startY > 30 && currentLane < laneY.length - 1) currentLane++;
    } else if (gameState === "start") {
        startGame();
    } else if (gameState === "gameover") {
        // ボタンタップ判定
        if (x >= goButton.x && x <= goButton.x + goButton.w &&
            y >= goButton.y && y <= goButton.y + goButton.h) {
            gameState = "start";
        }
    }
}

canvas.addEventListener("touchstart", e => {
    handleInputStart(e.touches[0].clientY, e.touches[0].clientX);
});
canvas.addEventListener("touchend", e => {
    handleInputEnd(e.changedTouches[0].clientY, e.changedTouches[0].clientX);
});

canvas.addEventListener("mousedown", e => {
    handleInputStart(e.clientY, e.clientX);
});
canvas.addEventListener("mouseup", e => {
    handleInputEnd(e.clientY, e.clientX);
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

        // プレイヤーアニメ
        if (step % 20 < 10) {
            ctx.drawImage(playerImg1, playerX, laneY[currentLane], 50, 50);
        } else {
            ctx.drawImage(playerImg2, playerX, laneY[currentLane], 50, 50);
        }
        step++;

        // スコア表示
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Score: ${score}`, 10, 30);
        ctx.fillText(`Level: ${level}`, 10, 60);

    } else if (gameState === "gameover") {
        ctx.drawImage(gameOverImgs[level - 1], 0, 0, canvas.width, canvas.height);

        // スコア & レベル
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.fillText(`Level: ${level}`, 10, 90);

        // 戻るボタン
        ctx.fillStyle = "#222";
        ctx.fillRect(goButton.x, goButton.y, goButton.w, goButton.h);
        ctx.strokeStyle = "white";
        ctx.strokeRect(goButton.x, goButton.y, goButton.w, goButton.h);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("スタート画面に戻る", goButton.x + 15, goButton.y + 30);
    }

    requestAnimationFrame(gameLoop);
}

// ====== 実行 ======
loadAssets().then(() => {
    gameLoop();
});
