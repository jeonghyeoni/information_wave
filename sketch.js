let string = 
    "Please enter a keyword ";
let intervalX = 0;
let intervalY = 0;
const noiseScale = 0.02; //wave speed
const fontSize = 18;
const playerSpeed = 2;
const playerSize = 10;
let pFrame = 0;
let userInput;
let keyword;
let searchButton;
let gameStarted = false;
let screenSize = 320;

function preload() {
  roboto = loadFont('Pretendard-Regular.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
   if (height < width) {
    screenSize = height / 2.5;
  } else {
    screenSize = width / 2.5;
  }
  
  fontsize = int(screenSize / 45);

  // 사용자 입력을 받는 input 요소
  userInput = createInput();
  userInput.size(200);
  userInput.position(width/2 - 100, height/2 + screenSize);
  
  // 버튼을 클릭하면 Wikipedia 내용을 가져와 콘솔에 출력
  const searchButton = createButton('Search');
  searchButton.position(width/2 + 100, height/2 + screenSize);
  searchButton.mousePressed(() => {
    keyword = userInput.value();
    gameStarted = false;
    if(isAlnum(keyword)){ //keyword가 영어일 경우
      intervalX = 15;
      fetchWikipediaContent(keyword)
      .then(content => {
        string = content; // Promise의 결과 값을 string 변수에 할당
        if(!string){
          string = "Search results do not exist. Please enter another keyword.";
        }
        wave = new Wave(string, intervalX, intervalY, noiseScale, fontSize);
      })
      .catch(error => {
        console.error('Error:', error);
      });
    } 
    else{ //keyword가 한국어일 경우
      intervalX = 20;
      fetchWikipediaContentKorean(keyword)
      .then(content => {
        string = content; // Promise의 결과 값을 string 변수에 할당
        if(!string){
          string = "Search results do not exist. Please enter another keyword.";
        }
        wave = new Wave(string, intervalX, intervalY, noiseScale, fontSize);
      })
      .catch(error => {
        console.error('Error:', error);
      });                    
    }
  }); /*searchButton Pressed*/

  intervalX = 15;
  intervalY = 40;
  
  rectMode(CENTER);
  player = new Player(width/2, height - 20, playerSize, playerSize, playerSpeed);
  wave = new Wave(string, intervalX, intervalY, noiseScale, fontSize);
  
  background(0);
  //stroke(255);
  //fill(255);
  textFont(roboto);
  textAlign(LEFT, TOP);
  textSize(fontSize);
  //noLoop();
}

function draw() {
  background(0);
  fill(0);
  stroke(255);
  rect(width/2, height/2, screenSize*2, screenSize*2);

  //player.update();
  wave.show();
  fill(0, 255, 255);
  player.collision(wave);
  player.show();
  
}

/*---------------------------------------------------------------------*/

class Player{
  constructor(x, y, w, h, v){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.o_v = v;
    this.v = v;
    this.collided = false;
  }
  
  show(){
    noStroke();
    
    this.update();
    rect(this.x, this.y, this.w, this.h);    
  }
  
  update(){
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= this.v;
      gameStarted = true;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += this.v;
      gameStarted = true;
    }
    if (keyIsDown(UP_ARROW)) {
      this.y -= this.v;
      gameStarted = true;
    }
    if (keyIsDown(DOWN_ARROW)) {
      this.y += this.v;
      gameStarted = true;
    }
    this.restriction();
  }
  
  restriction(){
    if(this.x - this.w/2 < width/2 - screenSize){
      this.x = width/2 - screenSize + this.w/2;
    } else if(this.x + this.w/2 > width/2 + screenSize){
      this.x = width/2 + screenSize - this.w/2;
    }
    if(this.y - this.h/2 < height/2 - screenSize){
      this.y = height/2 - screenSize + this.h/2;
    } else if(this.y + this.h/2 > height/2 + screenSize){
      this.y = height/2 + screenSize - this.h/2;
    }
  }
  
  collision(other){
    let n;
    let index;
    
    for(let i = 0; i < other.arr.length; i++){
      index = i % other.string.length; 
      let bound = roboto.textBounds(other.string[index], other.arr[i].x, other.arr[i].y, other.size);
      
      if(bound.x<=this.x+this.w && this.x+this.w<=bound.x+bound.w){
        if(bound.y <= this.y && this.y<=bound.y+bound.h){
          pFrame = frameCount;
          this.debuff(bound, other);
        }
        else if(bound.y <= this.y+this.h && this.y+this.h <=bound.y+bound.h){
          pFrame = frameCount;
          this.debuff(bound, other);
        }        
      } 
      else if(this.x<=bound.x+bound.w && this.x >= bound.x){
        if(this.y<=bound.y+bound.h && this.y>=bound.y){
          pFrame = frameCount;
          this.debuff(bound, other);
        }
        else if(this.y+this.h >= bound.y && this.y+this.h <=bound.y+bound.h){
          pFrame = frameCount;
          this.debuff(bound, other);
        }
      } 
      else if(frameCount - pFrame >= 0.2 * deltaTime){
        this.v = this.o_v;
      }
      
    } //forLoop end
  } //collision function end
  
  debuff(bound, other){
    fill(255, 0, 0);
    this.v = 0;
    let n = noise(
        bound.x * other.velocity + millis() / 1000,
        bound.y * other.velocity + millis() / 1000,
        frameCount * noiseScale * noiseScale
      );
    let a = TAU * n;
    this.x += cos(a);
    this.y += sin(a) + sin(0.02 * this.x + millis()/300);
  }
} //Player class end

/*---------------------------------------------------------------------*/

class Wave{
  constructor(string, intervalX, intervalY, velocity, fontSize){
    this.string = string;
    this.intervalX = intervalX;
    this.intervalY = intervalY;
    this.velocity = velocity; 
    this.size = fontSize;
    this.arr = [];
    this.wordOrder = [];
    this.index = 0;
    
    for (let j = height/2 - screenSize; j < height/2 + screenSize; j += this.intervalY) {
      for (let i = width/2 - screenSize; i < width/2 + screenSize; i += this.intervalX) {
        this.arr.push(createVector(i, j));
      }
    }
  }
  
  show(){
    let space = false;
    let j;
    
    strokeWeight(1);
    stroke(255);
    fill(255);
    
    for (let i = 0; i < this.arr.length; i++) {
      this.index = i % this.string.length;
      this.c = this.arr[i];
      text(this.string[this.index], this.c.x, this.c.y);
      
      if(this.string[this.index] == ' ' || this.index == 0){
        space = true;
        j = 0;
      } else{
        space = false;
        j++;
      }
      
      this.bound = roboto.textBounds(this.string[this.index], this.c.x, this.c.y, this.size);
      
      if(gameStarted){
        if(!space){
          this.update(this.arr[i-j].x , this.arr[i-j].y);
        } else{
          this.update(this.c.x, this.c.y);
        }
      }

      if(gameStarted){
        if (this.c.x < width/2 - screenSize) {
          this.c.x = width/2 + screenSize- this.size;
          //this.c.y = random(height);
        } else if (this.c.x > width/2 + screenSize - this.size) {
          this.c.x = width/2 - screenSize;
          //this.c.y = random(height);
        }
        if (this.c.y < height/2 - screenSize) {
          this.c.y = height/2 + screenSize - this.size;
          //this.c.x = random(width);
        } else if (this.c.y > height/2 + screenSize - this.size) {
          this.c.y = height/2 - screenSize;
          //this.c.x = random(width);
        }
      }
    }
  }
  
  update(px, py){
    let n = noise(
        px * this.velocity + millis() / 1000,
        py * this.velocity + millis() / 1000,
        frameCount * noiseScale * noiseScale
      );
    let a = TAU * n;
    this.c.x += cos(a);
    this.c.y += sin(a) + sin(0.02 * this.c.x + millis()/300);
  }
}

/*---------------------------------------------------------------------*/

function fetchWikipediaContent(keyword) {
  return new Promise((resolve, reject) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=9&exlimit=1&titles=${encodeURIComponent(keyword)}&explaintext=1&format=json&formatversion=2&origin=*`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const page = data.query.pages[0];
        const content = page.extract;
        console.log(content);
        resolve(content);
      })
      .catch(error => {
        console.error('Error:', error);
        reject(error);
      });
  });
}

function fetchWikipediaContentKorean(keyword){
  return new Promise((resolve, reject) => {
    const url = `https://ko.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=9&exlimit=1&titles=${encodeURIComponent(keyword)}&explaintext=1&format=json&formatversion=2&origin=*`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const page = data.query.pages[0];
        const content = page.extract;
        console.log(content);
        resolve(content);
      })
      .catch(error => {
        console.error('Error:', error);
        reject(error);
      });
  });
}

function isAlnum(text) {
  for (let i = 0; i < text.length; i++) {
    let charCode = text.charCodeAt(i);
    if ((charCode < 0x0041 || charCode > 0x005A) && // 대문자 A-Z
        (charCode < 0x0061 || charCode > 0x007A) && // 소문자 a-z
        (charCode < 0x0030 || charCode > 0x0039)) { // 숫자 0-9
      return false;
    }
  }
  return true;
}
