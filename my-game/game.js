// ====== スクロール固定（スマホ対策） ======
document.body.addEventListener("touchstart", function(e) {
    e.preventDefault();
}, { passive: false });

document.body.addEventListener("touchmove", function(e) {
    e.preventDefault();
}, { passive: false });

// ====== Canvas ======
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ====== ゲーム状態 ======
let gameState = "loading"; // loading -> start -> play -> gameover
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
let gameOverButton = { x: btnX, y: btnY, w: btnWidth, h: btnHeight };

// ====== レーン位置とキャラサイズ ======
const laneY = [180, 300, 420];
const playerX = 100;
const playerSizeX = 50;
const playerSizeY = 150;

// ====== 画像置き場 ======
let playerImg1, playerImg2;
let backgrounds = Array(9).fill(null);
let obstacleImgs = Array.from({ length: 9 }, () => Array(2).fill(null));
let startImg, loadingImg;
let gameOverImgs = Array(9).fill(null);

// ====== ロード対象一覧 ======
const imagePaths = {
    loading: "images/loading.png",
    player: ["images/player/girl1.png", "images/player/girl2.png"],
    backgrounds: Array.from({length: 9}, (_, i) => `images/background/bg${i+1}.png`),
    obstacles: Array.from({length: 9}, (_, i) => [`images/obstacle/${i+1}_1.png`, `images/obstacle/${i+1}_2.png`]),
    start: "images/start.png",
    gameovers: Array.from({length: 9}, (_, i) => `images/gameover${i+1}.png`)
};

// ====== 画像プリロード（エラーでも先に進む・インデックスズレ無し） ======
function preloadImages() {
    totalImages =
        1 + // loading
        imagePaths.player.length +
        imagePaths.backgrounds.length +
        imagePaths.obstacles.flat().length +
        1 + // start
        imagePaths.gameovers.length;

    return new Promise((resolve) => {
        const makePlaceholderImage = () => {
            const c = document.createElement("canvas");
            c.width = 1; c.height = 1;
            const img = new Image();
            img.src = c.toDataURL();
            return img;
        };

        const tick = () => {
            loadedImages++;
            if (loadedImages >= totalImages) resolve();
        };

        const loadOne = (src, assign) => {
            const img = new Image();
            img.onload = () => { assign(img); tick(); };
            img.onerror = () => {
                console.error("画像が見つかりません:", src);
                assign(makePlaceholderImage());
                tick();
            };
            img.src = src;
        };

        // loading
        loadOne(imagePaths.loading, (img) => { loadingImg = img; });

        // player
        loadOne(imagePaths.player[0], (img) => { playerImg1 = img; });
        loadOne(imagePaths.player[1], (img) => { playerImg2 = img; });

        // backgrounds
        imagePaths.backgrounds.forEach((src, i) => {
            loadOne(src, (img) => { backgrounds[i] = img; });
        });

        // obstacles
        imagePaths.obstacles.forEach((pair, i) => {
            loadOne(pair[0], (img) => { obstacleImgs[i][0] = img; });
            loadOne(pair[1], (img) => { obstacleImgs[i][1] = img; });
        });

        // start
        loadOne(imagePaths.start, (img) => { startImg = img; });

        // gameovers
        imagePaths.gameovers.forEach((src, i) => {
            loadOne(src, (img) => { gameOverImgs[i] = img; });
        });
    });
}

// ====== 障害物スピード（50%遅い=2 / 50%速い>2、レベルで上限UP） ======
function getObstacleSpeed() {
    if (Math.random() < 0.5) {
        return 2; // 遅い
    } else {
        let maxSpeed;
        if (level <= 3) maxSpeed = 4;
        else if (level <= 6) maxSpeed = 5;
        else maxSpeed = 6;
        return 2 + Math.random() * (maxSpeed - 2);
    }
}

// ====== レベル別の障害物数 ======
function getObstacleCount() {
    if (level <= 3) return 3;
    if (level <= 6) return 4;
    return 5; // 7〜9
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
        if (
            //x >= goButton.x && x <= goButton.x + goButton.w &&
            //y >= goButton.y && y <= goButton.y + goButton.h) {
                clickX >= gameOverButton.x &&
      X <= gameOverButton.x + gameOverButton.w &&
      Y >= gameOverButton.y &&
      Y <= gameOverButton.y + gameOverButton.h){
            gameState === "start";
        }
    }
}

// ====== 入力イベント ======
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

// ====== メインループ ======
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "loading") {
        // 背景（ローディング画像の読み込み前でも真っ黒にはしない）
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (loadingImg) {
            ctx.drawImage(loadingImg, 0, 0, canvas.width, canvas.height);
        } else {
            // まだ画像が読めてない場合の暫定表示
            ctx.fillStyle = "white";
            ctx.font = "30px Arial";
            ctx.fillText("Loading...", canvas.width / 2 - 60, canvas.height / 2);
        }

        // 進捗バー
        loadingProgress = Math.floor((loadedImages / totalImages) * 100);
        const barWidth = 400;
        const barHeight = 20;
        const barX = (canvas.width - barWidth) / 2;
        const barY = canvas.height - 100;

        ctx.strokeStyle = "white";
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = "lime";
        ctx.fillRect(barX, barY, (loadingProgress / 100) * barWidth, barHeight);

        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`${loadingProgress}%`, barX + barWidth / 2 - 20, barY - 10);

        if (loadedImages >= totalImages) {
            gameState = "start";
        }

    } else if (gameState === "start") {
        ctx.drawImage(startImg, 0, 0, canvas.width, canvas.height);

    } else if (gameState === "play") {
        // 背景スクロール
        if (!isColliding) {
            bgOffset -= 2;
            if (bgOffset <= -canvas.width) bgOffset = 0;
        }
        const bg = backgrounds[level - 1] || backgrounds[0];
        ctx.drawImage(bg, bgOffset, 0, canvas.width, canvas.height);
        ctx.drawImage(bg, bgOffset + canvas.width, 0, canvas.width, canvas.height);

        // 障害物
        obstacles.forEach(obs => {
            if (!isColliding) obs.x -= obs.speed;

            if (obs.x < -50 && !isColliding) {
                obs.x = canvas.width + Math.random() * 400;
                obs.lane = Math.floor(Math.random() * 3);
                obs.speed = getObstacleSpeed();
                score++;

                // レベルアップ＆必要数まで障害物を追加
                if (score % 10 === 0 && level < 9) {
                    level++;
                    const desired = getObstacleCount();
                    while (obstacles.length < desired) {
                        obstacles.push({
                            x: canvas.width + Math.random() * 400,
                            lane: Math.floor(Math.random() * 3),
                            speed: getObstacleSpeed(),
                            img: null
                        });
                    }
                }
            }

            // 表示画像：speed=2 → 遅い(インデックス0)、>2 → 速い(インデックス1)
            const imgPair = obstacleImgs[level - 1] || obstacleImgs[0];
            obs.img = imgPair[obs.speed > 2 ? 1 : 0] || imgPair[0];
            ctx.drawImage(obs.img, obs.x, laneY[obs.lane], 50, 50);

            // 当たり判定
            if (!isColliding && Math.abs(playerX - obs.x) < playerSizeX - 10 && currentLane === obs.lane) {
                handleCollision();
            }
        });

        // 主人公（2枚交互）
        if (step % 20 < 10) {
            ctx.drawImage(playerImg1, playerX, laneY[currentLane], playerSizeX, playerSizeY);
        } else {
            ctx.drawImage(playerImg2, playerX, laneY[currentLane], playerSizeX, playerSizeY);
        }

        // ヒット演出
        if (isColliding) {
            ctx.beginPath();
            ctx.arc(playerX + playerSizeX / 2, laneY[currentLane] + playerSizeY / 2, 40, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fill();
        }

        step++;

        // スコアとレベルの表示（左下に配置、アウトライン付き）
        ctx.font = "20px Arial";
        ctx.lineWidth = 4;       // アウトラインの太さ
        ctx.strokeStyle = "white"; // アウトラインの色
        ctx.fillStyle = "black";   // 本文の色

        // スコア
        ctx.strokeText("スコア: " + score, 10, canvas.height - 40);
        ctx.fillText("スコア: " + score, 10, canvas.height - 40);

        // レベル
        ctx.strokeText("レベル: " + level, 10, canvas.height - 15);
        ctx.fillText("レベル: " + level, 10, canvas.height - 15);

    } else if (gameState === "gameover") {
        const gov = gameOverImgs[level - 1] || gameOverImgs[0];
        ctx.drawImage(gov, 0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText(`Score: ${score}`, 10, 50);
        ctx.fillText(`Level: ${level}`, 10, 90);

        // 戻るボタン
        //ctx.fillStyle = "#222";
        //ctx.fillRect(goButton.x, goButton.y, goButton.w, goButton.h);
        //ctx.strokeStyle = "white";
        //ctx.strokeRect(goButton.x, goButton.y, goButton.w, goButton.h);
        //ctx.fillStyle = "white";
        //ctx.font = "20px Arial";
        //ctx.fillText("スタート画面に戻る", goButton.x + 15, goButton.y + 30);
// ===== 大きなボタンを描画 =====
  const btnWidth = 260;
  const btnHeight = 60;
  const btnX = canvas.width / 2 - btnWidth / 2;
  const btnY = canvas.height / 2 + 100;

  // ボタン背景
  ctx.fillStyle = "lightblue";
  ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 4;
  ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

  // ボタン文字
  ctx.font = "28px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("スタートに戻る", btnX + 20, btnY + 40);

  // ボタン範囲を保存（クリック判定用）
  gameOverButton = { x: btnX, y: btnY, w: btnWidth, h: btnHeight };
        
        
    }

    requestAnimationFrame(gameLoop);
}

// ====== 起動 ======
preloadImages().then(() => {
    console.log("All images requested.");
});
gameLoop();
