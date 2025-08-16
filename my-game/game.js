// ====== スクロール固定（スマホ対策） ======
document.body.addEventListener("touchstart", function(e) {
    e.preventDefault();
}, { passive: false });

document.body.addEventListener("touchmove", function(e) {
    e.preventDefault();
}, { passive: false });

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = "loading"; // 初期状態はローディング
let loadingProgress = 0;
let totalImages = 0;
let loadedImages = 0;

let score = 0;
let level = 1;
let step = 0;
let currentLane = 0;
let bgOffset = 0;
let startY = 0;
let startX = 0;

let isColliding = false;
let collisionTimer = null;

let goButton = { x: 300, y: 500, w: 200, h: 50 };

// ====== レーン位置とキャラサイズ ======
const laneY = [160, 280, 400];
const playerX = 100;
const playerSize = 80;

// ====== 画像格納用 ======
let playerImg1, playerImg2, backgrounds = [], obstacleImgs = [], startImg, gameOverImgs = [], loadingImg;

// ====== 画像リスト ======
const imageSources = {
    player: ["images/player/girl1.png", "images/player/girl2.png"],
    backgrounds: Array.from({length: 9}, (_,i)=>`images/background/bg${i+1}.png`),
    obstacles: Array.from({length: 9}, (_,i)=>[`images/obstacle/${i+1}_1.png`, `images/obstacle/${i+1}_2.png`]),
    start: ["images/start.png"],
    gameovers: Array.from({length: 9}, (_,i)=>`images/gameover${i+1}.png`)
};

// ====== 画像プリロード ======
function preloadImages() {
    totalImages = 1 // loading.png 追加分
                + imageSources.player.length
                + imageSources.backgrounds.length
                + imageSources.obstacles.flat().length
                + imageSources.start.length
                + imageSources.gameovers.length;

    return new Promise((resolve) => {
        function load(src) {
            return new Promise((res, rej) => {
                const img = new Image();
                img.onload = () => { loadedImages++; res(img); };
                img.onerror = rej;
                img.src = src;
            });
        }

        Promise.all([
            load("images/loading.png"), // ローディング画面用
            ...imageSources.player.map(load),
            ...imageSources.backgrounds.map(load),
            ...imageSources.obstacles.flat().map(load),
            ...imageSources.start.map(load),
            ...imageSources.gameovers.map(load)
        ]).then(results => {
            let idx = 0;
            loadingImg = results[idx++];

            playerImg1 = results[idx++];
            playerImg2 = results[idx++];
            backgrounds = results.slice(idx, idx+9); idx += 9;

            obstacleImgs = [];
            for (let i=0;i<9;i++){
                obstacleImgs.push([results[idx++], results[idx++]]);
            }

            startImg = results[idx++];
            gameOverImgs = results.slice(idx, idx+9);

            resolve();
        });
    });
}

// ====== 障害物スピード ======
function getObstacleSpeed() {
    if (Math.random() < 0.5) {
        return 2; // 遅い障害物
    } else {
        let maxSpeed;
        if (level <= 3) maxSpeed = 4;
        else if (level <= 6) maxSpeed = 5;
        else maxSpeed = 6;
        return 2 + Math.random() * (maxSpeed - 2);
    }
}

// ====== レベル別障害物数 ======
function getObstacleCount() {
    if (level <= 3) return 3;
    if (level <= 6) return 4;
    return 5;
}

let obstacles = [];
function initObstacles() {
    obstacles = [];
    const count = getObstacleCount();
    for (let i = 0; i < count; i++) {
        obstacles.push({
            x: canvas.width + i * 400,
            lane: Math.floor(Math.random() * 3),
            speed: getObstacleSpeed(),
            img: null
        });
    }
}

function startGame() {
    gameState = "play";
    score = 0;
    level = 1;
    currentLane = 0;
    bgOffset = 0;
    isColliding = false;
    if (collisionTimer) clearTimeout(collisionTimer);
    initObstacles();
}

function handleCollision() {
    if (!isColliding) {
        isColliding = true;
        collisionTimer = setTimeout(() => {
            gameState = "gameover";
            isColliding = false;
        }, 1000);
    }
}

function handleInputStart(y, x) {
    startY = y;
    startX = x;
}
function handleInputEnd(y, x) {
    if (gameState === "play") {
        if (!isColliding) {
            if (startY - y > 30 && currentLane > 0) currentLane--;
            if (y - startY > 30 && currentLane < laneY.length - 1) currentLane++;
        }
    } else if (gameState === "start") {
        startGame();
    } else if (gameState === "gameover") {
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

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "loading") {
        // イラスト付きローディング画面
        ctx.drawImage(loadingImg, 0, 0, canvas.width, canvas.height);

        loadingProgress = Math.floor((loadedImages / totalImages) * 100);

        const barWidth = 400;
        const barHeight = 20;
        const barX = (canvas.width - barWidth) / 2;
        const barY = canvas.height - 100;

        ctx.strokeStyle = "white";
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = "lime";
        ctx.fillRect(barX, barY, (loadingProgress/100) * barWidth, barHeight);

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`${loadingProgress}%`, barX + barWidth/2 - 20, barY - 10);

        if (loadedImages >= totalImages) {
            gameState = "start";
        }

    } else if (gameState === "start") {
        ctx.drawImage(startImg, 0, 0, canvas.width, canvas.height);

    } else if (gameState === "play") {
        if (!isColliding) {
            bgOffset -= 2;
            if (bgOffset <= -canvas.width) bgOffset = 0;
        }
        ctx.drawImage(backgrounds[level - 1], bgOffset, 0, canvas.width, canvas.height);
        ctx.drawImage(backgrounds[level - 1], bgOffset + canvas.width, 0, canvas.width, canvas.height);

        obstacles.forEach(obs => {
            if (!isColliding) obs.x -= obs.speed;

            if (obs.x < -50 && !isColliding) {
                obs.x = canvas.width + Math.random() * 400;
                obs.lane = Math.floor(Math.random() * 3);
                obs.speed = getObstacleSpeed();
                score++;

                if (score % 10 === 0 && level < 9) {
                    level++;
                    const desiredCount = getObstacleCount();
                    while (obstacles.length < desiredCount) {
                        obstacles.push({
                            x: canvas.width + Math.random() * 400,
                            lane: Math.floor(Math.random() * 3),
                            speed: getObstacleSpeed(),
                            img: null
                        });
                    }
                }
            }

            obs.img = obstacleImgs[level - 1][obs.speed > 2 ? 1 : 0];
            ctx.drawImage(obs.img, obs.x, laneY[obs.lane], 50, 50);

            if (!isColliding && Math.abs(playerX - obs.x) < playerSize - 10 && currentLane === obs.lane) {
                handleCollision();
            }
        });

        if (step % 20 < 10) {
            ctx.drawImage(playerImg1, playerX, laneY[currentLane], playerSize, playerSize);
        } else {
            ctx.drawImage(playerImg2, playerX, laneY[currentLane], playerSize, playerSize);
        }

        if (isColliding) {
            ctx.beginPath();
            ctx.arc(playerX + playerSize/2, laneY[currentLane] + playerSize/2, 40, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fill();
        }

        step++;

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

preloadImages().then(() => {
    console.log("All images queued for loading...");
});
gameLoop();