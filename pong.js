const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const hit_sound = new Audio('/pong_sounds/pong_paddle.ogg');
const wall_sound = new Audio('/pong_sounds/pong_wall.ogg');
const score_sound = new Audio('/pong_sounds/pong_score.ogg');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const BALL_SIZE = 15;
const BALL_SPEED = 5;

// User paddle
const user = {
  x: 0,
  y: HEIGHT / 2 - 50,
  width: 15,
  height: 100,
  color: 'white',
  score: 0
}

// AI paddle
const com = {
  x: WIDTH - 15,
  y: HEIGHT / 2 - 50,
  width: 15,
  height: 100,
  color: 'white',
  score: 0
}

// Net
const net = {
  x: WIDTH / 2 - 2,
  y: 0,
  width: 2,
  height: 10,
  color: 'white',
}

// Ball
const ball = { 
  x: WIDTH / 2 - BALL_SIZE / 2,
  y: HEIGHT / 2 - BALL_SIZE / 2,
  velocityX: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1), // Random initial x-direction
  velocityY: BALL_SPEED * (Math.random() * 2 - 1), // Random initial vertical speed
  color: 'white',
}

// Draw net
function drawNet() {
  for (let i = 0; i < HEIGHT; i += 15) {
    drawRect(net.x, net.y + i, net.width, net.height, net.color);
  }
}

// Draw rectangle
function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Draw text
function drawText(text, x, y, color, spacing = 50) {
  ctx.fillStyle = color;
  ctx.font = '30px PongScoreExtended';
  ctx.textAlign = 'center';
  

  let chars = String(text).split('');
  // Calculate total width
  let totalWidth = 0;
  chars.forEach((char, i) => {
    totalWidth += ctx.measureText(char).width;
    if (i < chars.length - 1) totalWidth += spacing;
  });

  // Start position so text is centered
  let startX = x - totalWidth / 2;
  chars.forEach((char, i) => {
    let charWidth = ctx.measureText(char).width;
    // Draw each character centered in its own box
    ctx.fillText(char, startX + charWidth / 2, y);
    startX += charWidth + spacing;
  });
}

// Render game
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Draw background
  drawRect(0, 0, WIDTH, HEIGHT, 'black');
  
  // Draw score
  // User score: top center of left half
  drawText(user.score, WIDTH / 4, HEIGHT / 5, 'white');
  // AI score: top center of right half
  drawText(com.score, (WIDTH * 3) / 4, HEIGHT / 5, 'white');
  
  drawNet();
  
  // Draw paddles
  drawRect(user.x, user.y, user.width, user.height, user.color);
  drawRect(com.x, com.y, com.width, com.height, com.color);
  
  // Draw ball
  drawRect(ball.x, ball.y, ball.width, ball.height, ball.color);
}

// Reset ball to center and randomize direction
function resetBall() {
  ball.x = WIDTH / 2 - BALL_SIZE / 2;
  ball.y = HEIGHT / 2 - BALL_SIZE / 2;
  ball.velocityX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
  ball.velocityY = BALL_SPEED * (Math.random() * 2 - 1);
}

// Controls
canvas.addEventListener('mousemove', movePaddle);
function movePaddle(event) {
  let rect = canvas.getBoundingClientRect();
  if (user.y > HEIGHT / 2) {
    user.y = Math.min(event.clientY - rect.top - user.height / 2, HEIGHT - user.height);
  } else {
    user.y = Math.max(event.clientY - rect.top - user.height / 2, 0);
  }
}

// Collision detection
function collision(b, p) { 
  // Ball boundaries (use actual position and size)
  b.top = b.y;
  b.bottom = b.y + b.height;
  b.left = b.x;
  b.right = b.x + b.width;

  // Paddle boundaries
  p.top = p.y;
  p.bottom = p.y + p.height;
  p.left = p.x;
  p.right = p.x + p.width;

  return b.right > p.left && b.bottom > p.top && b.left < p.right && b.top < p.bottom;
}

function update() {
  // Update ball position
  ball.x += ball.velocityX;
  ball.y += ball.velocityY;
  console.log(ball.x, ball.y); 
  // Simple AI to control computer paddle
  let computerLevel = 0.1;
  com.y += (ball.y - (com.y + com.height / 2)) * computerLevel;

  // Prevent computer paddle from moving out of bounds
  if (com.y < 0) com.y = 0;
  if (com.y + com.height > HEIGHT) {
    com.y = HEIGHT - com.height;
  }

  // Ball collision with top and bottom walls
  if (ball.y + ball.height > HEIGHT || ball.y < 0) {
    ball.velocityY = -ball.velocityY; // Reverse y direction
    // Play wall sound
    wall_sound.play();
  }

  // Determine which paddle to check for collision
  let player = (ball.x < WIDTH / 2) ? user : com;
  if (collision(ball, player)) {
    let collidePoint = ball.y - (player.y + player.height / 2);
    collidePoint = collidePoint / (player.height / 2);
    let angleRad = collidePoint * Math.PI / 4;
    
    let direction = (ball.x < WIDTH / 2) ? 1 : -1;
    
    ball.velocityX = direction * Math.cos(angleRad);
    ball.velocityY = direction * Math.sin(angleRad);
    // Play hit sound
    hit_sound.play();
  }

  // Update score
  if (ball.x < 0 || ball.x + ball.width > WIDTH) {
    player.score++;
    // Play score sound
    score_sound.play();
    resetBall();  
  }
}

// Game function
function Pong() {
  if (isPaused) return; // Skip update and render if paused
  update(); // Movements, collision, score, etc.
  render();
  requestAnimationFrame(Pong);
}

// Pause and resume functionality
var isPaused = false;
document.addEventListener('keydown', function(event) {
  if (event.code === 'Space') { // Toggle pause on spacebar press
    isPaused = !isPaused;
    if (isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      drawText('Paused', WIDTH / 2, HEIGHT / 2, 'white', 20);
    } else {
      Pong();
    }
  }
});

// Start game
Pong();