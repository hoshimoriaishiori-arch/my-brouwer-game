const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ========= フォルダ構成 =========
const PATHS = {
  bg: "images/background/",
  obs: "images/obstacle/",
  player: "images/player/",
  ui: "images/", // loading.png
};

let gameState = "loading"; // "loading", "title", "playing", "gameover"
let score = 0;
let level = 1;
let player = { x: 100, y: 0, width: 60, height: 60, lane: 1 };
let obstacles = [];
let obstacleTimer = 0;
let images = {};
let assetsToLoad = 30; // 背景9 + 障害物18 + プレイヤー2 + ローディング1
let assetsLoaded = 0;

const lanes = [canvas.height / 6, canvas.height / 2, (canvas.height * 5) / 6];

// ===== ロード画面の画像 =====
const loadingImg = new Image();
loadingImg.src = PATHS.ui + "loading.png";
loadingImg.onload = () => {
  assetsLoaded++;
  console.log("✅ loaded:", "loading.png", `(${assetsLoaded}/${assetsToLoad})`);
};
loadingImg.onerror = () => {
  console.error("❌ ERROR: loading.png が見つかりません（", loadingImg.src, "）");
};

// ===== 画像ロード関数 =====
function loadImage(name, src) {
  images[name] = new Image();
  images[name].src = src;

  images[name].onload = () => {
    assetsLoaded++;
    console.log("✅ loaded:", src, `(${assetsLoaded}/${assetsToLoad})`);
  };

  images[name].onerror = () => {
    console.error("❌ ERROR:", src, "が見つかりません");
  };
}

// ===== 背景と障害物をロード =====
for (let i = 1; i <= 9; i++) {
  loadImage("bg" + i, `${PATHS.bg}bg${i}.png`);
  loadImage(i + "_1", `${PATHS.obs}${i}_1.png`);
  loadImage(i + "_2", `${PATHS.obs}${i}_2.png`);
}

// ===== プレイヤー画像 =====
loadImage("player1", `${PATHS.player}girl1.png`);
loadImage("player2", `${PATHS.player}girl2.png`);

let playerFrame = 0;
let frameCount = 0;

// 背景スクロール
let bgX = 0;

// ===== ゲームリセット =====
function resetGame() {
  score = 0;
  level = 1;
  obstacles = [];
  obstacleTimer = 0;
  player.lane = 1;
  player.y = lanes[player.lane] - player.height / 2;
  bgX = 0;
}

// ===== ゲーム開始 =====
function startGame() {
  resetGame();
  gameState = "playing";
}

// ===== ゲームオーバー =====
function gameOver() {
  gameState = "gameover";
}

// ===== メインループ =====
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "loading") {
    drawLoading();
  } else if (gameState === "title") {
    drawTitle();
  } else if (gameState === "playing") {
    updateGame();
    drawGame();
  } else if (gameState === "gameover") {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

// ===== ローディング画面 =====
function drawLoading() {
  ctx.drawImage(loadingImg, 0, 0, canvas.width, canvas.height);
  let percent = Math.floor((assetsLoaded / assetsToLoad) * 100);

  // 進捗バー
  ctx.fillStyle = "gray";
  ctx.fillRect(canvas.width / 4, canvas.height - 60, canvas.width / 2, 20);

  ctx.fillStyle = "green";
  ctx.fillRect(
    canvas.width / 4,
    canvas.height - 60,
    (canvas.width / 2) * (percent / 100),
    20
  );

  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(percent + "%", canvas.width / 2 - 20, canvas.height - 65);

  if (assetsLoaded >= assetsToLoad) {
    console.log("🎉 すべての画像ロードが完了しました！");
    setTimeout(() => {
      gameState = "title";
    }, 500);
  }
}

// ===== タイトル画面 =====
function drawTitle() {
  ctx.fillStyle = "skyblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "40px Arial";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "black";
  ctx.strokeText("RUN GAME", canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.fillText("RUN GAME", canvas.width / 2 - 100, canvas.height / 2 - 40);

  ctx.font = "24px Arial";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "black";
  ctx.strokeText("タップでスタート", canvas.width / 2 - 80, canvas.height / 2 + 40);
  ctx.fillText("タップでスタート", canvas.width / 2 - 80, canvas.height / 2 + 40);
}

// ===== プレイ中の更新 =====
function updateGame() {
  frameCount++;

  // 背景スクロール
  bgX -= 2;
  if (bgX <= -canvas.width) bgX = 0;

  // プレイヤーアニメーション
  if (frameCount % 20 === 0) {
    playerFrame = (playerFrame + 1) % 2;
  }

  // 障害物生成
  obstacleTimer++;
  if (obstacleTimer > 100 - level * 5) {
    const isSlow = Math.random() < 0.5; 
    let speed = isSlow ? 2 : 2 + Math.floor(Math.random() * level);
    let type = isSlow ? "_1" : "_2";

    obstacles.push({
      x: canvas.width,
      y: lanes[Math.floor(Math.random() * 3)] - 30,
      width: 60,
      height: 60,
      speed: speed,
      img: level + type,
    });
    obstacleTimer = 0;
  }

  // 障害物移動 & 消去
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= obstacles[i].speed;
    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1);
      score++;
      if (score % 10 === 0 && level < 9) level++;
    }
  }

  // 衝突判定
  for (let obs of obstacles) {
    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < obs.y + obs.height &&
      player.y + player.height > obs.y
    ) {
      gameOver();
    }
  }

  // プレイヤーの位置
  player.y = lanes[player.lane] - player.height / 2;
}

// ===== プレイ中の描画 =====
function drawGame() {
  // 背景（スクロール）
  let bg = images["bg" + level];
  ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);

  // プレイヤー
  let playerImgKey = "player" + (playerFrame + 1);
  let playerImg = images[playerImgKey];
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // 障害物
  for (let obs of obstacles) {
    ctx.drawImage(images[obs.img], obs.x, obs.y, obs.width, obs.height);
  }

  // スコア＆レベル
  ctx.font = "20px Arial";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "black";
  ctx.strokeText("スコア: " + score, 10, canvas.height - 40);
  ctx.fillText("スコア: " + score, 10, canvas.height - 40);
  ctx.strokeText("レベル: " + level, 10, canvas.height - 15);
  ctx.fillText("レベル: " + level, 10, canvas.height - 15);
}

// ===== ゲームオーバー画面 =====
function drawGameOver() {
  ctx.font = "40px Arial";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "red";
  ctx.strokeText("ゲームオーバー", canvas.width / 2 - 120, canvas.height / 2 - 20);
  ctx.fillText("ゲームオーバー", canvas.width / 2 - 120, canvas.height / 2 - 20);

  ctx.font = "24px Arial";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "black";
  ctx.strokeText("スコア: " + score, canvas.width / 2 - 60, canvas.height / 2 + 20);
  ctx.fillText("スコア: " + score, canvas.width / 2 - 60, canvas.height / 2 + 20);
  ctx.strokeText("レベル: " + level, canvas.width / 2 - 60, canvas.height / 2 + 50);
  ctx.fillText("レベル: " + level, canvas.width / 2 - 60, canvas.height / 2 + 50);

  ctx.strokeText("タップでタイトルに戻る", canvas.width / 2 - 120, canvas.height / 2 + 100);
  ctx.fillText("タップでタイトルに戻る", canvas.width / 2 - 120, canvas.height / 2 + 100);
}

// ===== 入力処理 =====
canvas.addEventListener("click", () => {
  if (gameState === "title") {
    startGame();
  } else if (gameState === "gameover") {
    gameState = "title";
  }
});

// ===== スワイプで上下移動 =====
let touchStartY = null;
canvas.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", (e) => {
  let touchEndY = e.changedTouches[0].clientY;
  if (touchStartY !== null) {
    if (touchEndY < touchStartY - 30 && player.lane > 0) {
      player.lane--;
    } else if (touchEndY > touchStartY + 30 && player.lane < 2) {
      player.lane++;
    }
  }
  touchStartY = null;
});

// ===== ループ開始 =====
gameLoop();