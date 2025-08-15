const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// プレイヤー画像
let playerImg1 = new Image(); playerImg1.src = "images/player/girl1.png";
let playerImg2 = new Image(); playerImg2.src = "images/player/girl2.png";

// 背景読み込み
let backgrounds = [];
for(let i=1;i<=9;i++){
    let bg = new Image();
    bg.src = `images/background/bg${i}.jpg`;
    backgrounds.push(bg);
}

// 障害物読み込み
let obstacleImgs = [];
for(let i=1;i<=9;i++){
    let img1 = new Image(); img1.src = `images/obstacle/${i}_1.png`;
    let img2 = new Image(); img2.src = `images/obstacle/${i}_2.png`;
    obstacleImgs.push([img1,img2]);
}

// スタート画面・ゲームオーバー
let startImg = new Image(); startImg.src = "images/start.png";
let gameOverImgs = [];
for(let i=1;i<=9;i++){
    let img = new Image();
    img.src = `images/gameover${i}.png`;
    gameOverImgs.push(img);
}

// プレイヤー設定
let playerX = 100;
let laneY = [400,300,200];
let currentLane = 0;
let step = 0;

// 背景スクロール
let bgOffset = 0;

// スコア・レベル
let score = 0;
let level = 1;

// 障害物初期配置
let obstacles = [
    {x:800, img: obstacleImgs[level-1][0], speed: 2},
    {x:1200, img: obstacleImgs[level-1][1], speed: 4}
];

// ゲーム状態
let gameState = "start"; // start, play, gameover

// スワイプ操作
let startY = null;
canvas.addEventListener("touchstart", e=>startY=e.touches[0].clientY);
canvas.addEventListener("touchend", e=>{
    let endY = e.changedTouches[0].clientY;
    if(gameState==="play"){
        if(startY-endY>30 && currentLane>0) currentLane--;
        if(endY-startY>30 && currentLane<laneY.length-1) currentLane++;
    } else if(gameState==="start" || gameState==="gameover"){
        gameState = "play";
        score = 0;
        level = 1;
        currentLane = 0;
        bgOffset = 0;
        obstacles.forEach((o,i)=>o.x=800+i*400);
    }
});

// ゲームループ
function gameLoop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(gameState==="start"){
        ctx.drawImage(startImg,0,0,canvas.width,canvas.height);
    } else if(gameState==="play"){
        // 背景スクロール
        bgOffset -= 2;
        if(bgOffset <= -canvas.width) bgOffset = 0;
        ctx.drawImage(backgrounds[level-1], bgOffset,0,canvas.width,canvas.height);
        ctx.drawImage(backgrounds[level-1], bgOffset+canvas.width,0,canvas.width,canvas.height);

        // 障害物描画
        obstacles.forEach(obs=>{
            obs.x -= obs.speed;
            if(obs.x<-50){
                obs.x = canvas.width + Math.random()*400;
                score++;
                if(score%10===0 && level<9) level++;
            }
            let obsLane = Math.floor(Math.random()*3);
            obs.img = obstacleImgs[level-1][obs.img===obstacleImgs[level-1][0]?0:1]; // レベル変更時に画像更新
            ctx.drawImage(obs.img, obs.x, laneY[obsLane], 50,50);

            // 当たり判定
            if(Math.abs(playerX-obs.x)<40 && Math.abs(laneY[currentLane]-laneY[obsLane])<40){
                gameState="gameover";
            }
        });

        // プレイヤー描画
        if(step%20<10){
            ctx.drawImage(playerImg1,playerX,laneY[currentLane],50,50);
        } else {
            ctx.drawImage(playerImg2,playerX,laneY[currentLane],50,50);
        }
        step++;

        // スコア・レベル表示
        ctx.fillStyle="white";
        ctx.font="20px Arial";
        ctx.fillText(`Score: ${score}`,10,30);
        ctx.fillText(`Level: ${level}`,10,60);

    } else if(gameState==="gameover"){
        ctx.drawImage(gameOverImgs[level-1],0,0,canvas.width,canvas.height);
        ctx.fillStyle="white";
        ctx.font="30px Arial";
        ctx.fillText(`Score: ${score}`,10,50);
        ctx.fillText(`Level: ${level}`,10,90);
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
