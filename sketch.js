let faceMesh;
let handPose;
let video;
let faces = [];
let hands = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
let earringImgs = [];
let currentEarringIndex = 1; // 預設顯示第一款

function preload() {
  // 初始化 ml5 faceMesh 模型
  faceMesh = ml5.faceMesh(options);
  // 初始化 ml5 handPose 模型
  handPose = ml5.handPose(options);
  
  // 載入五款耳環圖片
  earringImgs[1] = loadImage('pic/acc1_ring.png');
  earringImgs[2] = loadImage('pic/acc2_pearl.png');
  earringImgs[3] = loadImage('pic/acc3_tassel.png');
  earringImgs[4] = loadImage('pic/acc4_jade.png');
  earringImgs[5] = loadImage('pic/acc5_phoenix.png');
}

function setup() {
  // 1. 產生全螢幕畫布
  createCanvas(windowWidth, windowHeight);

  // 2. 擷取攝影機影像內容
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // 開始臉部辨識偵測
  faceMesh.detectStart(video, gotFaces);
  // 開始手勢辨識偵測
  handPose.detectStart(video, gotHands);
}

function gotFaces(results) {
  faces = results;
}

function gotHands(results) {
  hands = results;
}

function draw() {
  // 3. 設定畫布背景顏色為 e7c6ff
  background('#c6dcffff');

  // 4. 置中上方顯示文字
  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(24);
  text("414730977楊心ㄩˊ", width / 2, 30);
  textSize(18);
  text("影像辨識_耳環臉譜", width / 2, 80);

  // 5. 計算影像顯示寬高 (畫布寬高的 50%)
  let w = width * 0.5;
  let h = height * 0.5;
  let x = (width - w) / 2;
  let y = (height - h) / 2;

  // 6. 顯示影像並做左右顛倒處理
  push();
  translate(x + w, y); // 移動到顯示區域的右側邊界
  scale(-1, 1);        // 水平翻轉
  image(video, 0, 0, w, h);

  // 7. 辨識手勢並更新目前要顯示的耳環索引
  if (hands.length > 0) {
    let hand = hands[0];
    let count = 0;
    
    // 簡單判斷手指是否伸直 (指尖 Y 座標小於第二指節)
    // 食指 (8 vs 6), 中指 (12 vs 10), 無名指 (16 vs 14), 小指 (20 vs 18)
    if (hand.keypoints[8] && hand.keypoints[8].y < hand.keypoints[6].y) count++;
    if (hand.keypoints[12] && hand.keypoints[12].y < hand.keypoints[10].y) count++;
    if (hand.keypoints[16] && hand.keypoints[16].y < hand.keypoints[14].y) count++;
    if (hand.keypoints[20] && hand.keypoints[20].y < hand.keypoints[18].y) count++;
    
    // 針對短拇指優化的判斷：
    // 比較「拇指尖(4)到小指根部(17)」的距離與「食指根部(5)到小指根部(17)」的基準距離
    if (hand.keypoints[4] && hand.keypoints[5] && hand.keypoints[17]) {
      let d1 = dist(hand.keypoints[4].x, hand.keypoints[4].y, hand.keypoints[17].x, hand.keypoints[17].y);
      let d2 = dist(hand.keypoints[5].x, hand.keypoints[5].y, hand.keypoints[17].x, hand.keypoints[17].y);
      if (d1 > d2) count++; 
    }

    // 更新索引：確保 1隻手指=圖片1，5隻手指=圖片5
    if (count >= 1 && count <= 5) {
      currentEarringIndex = count;
    }
  }

  // 7. 辨識耳垂並畫出黃色圓圈耳環
  if (faces.length > 0) {
    let face = faces[0];
    // 使用更準確的耳垂底部索引點：172(右), 397(左)
    let earPoints = [face.keypoints[172], face.keypoints[397]];
    
    // 確保索引不超出陣列範圍
    let earringImg = earringImgs[currentEarringIndex];
    if (!earringImg) return; 

    for (let pt of earPoints) {
      if (pt) {
        // 使用 video.width/height 確保映射精確
        let px = map(pt.x, 0, video.width, 0, w);
        let py = map(pt.y, 0, video.height, 0, h);
        
        // 根據影像寬度動態調整耳環大小
        let imgW = w * 0.1; // 稍微放大一點點
        let imgH = imgW * (earringImg.height / earringImg.width);

        // 設定位移比率 (使用圖片寬高的 20% 作為位移)
        let offsetX = imgW * 0.2;
        let offsetY = imgH * 0.2;
        
        // 判斷左右耳，調整「往外」的方向
        // 172 是右耳(畫面左側)，往外是減；397 是左耳(畫面右側)，往外是加
        let xPos = (pt === face.keypoints[172]) ? (px - imgW/2 - offsetX) : (px - imgW/2 + offsetX);
        let yPos = py - offsetY; // 向上移動
        
        // 繪製耳環圖片
        image(earringImg, xPos, yPos, imgW, imgH);
      }
    }
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}