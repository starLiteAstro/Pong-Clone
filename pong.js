const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const hit_sound = new Audio('/assets/pong_sounds/pong_paddle.ogg');
const wall_sound = new Audio('/assets/pong_sounds/pong_wall.ogg');
const score_sound = new Audio('/assets/pong_sounds/pong_score.ogg');

// Camvas dimensions
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Paddle properties
const PADDLE_WIDTH = 8;
const PADDLE_HEIGHT = 40;
const PADDLE_MARGIN = 100;
const PADDLE_COLOR = 'white';

const AI_SPEED = 5;
const AI_DIFFICULTY = 1.1;
const AI_TOLERANCE = 5; // How close the ball must be to the paddle center to stop moving

// Ball properties
const BALL_SIZE = 8;
const BALL_SPEED = 6;

// User paddle
const user = {
  x: PADDLE_MARGIN,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  color: PADDLE_COLOR,
  score: 0
}

// AI paddle
const com = {
  x: WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
  y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  color: PADDLE_COLOR,
  score: 0
}

// Ball
const ball = { 
  x: WIDTH / 2 - BALL_SIZE / 2,
  y: HEIGHT / 2 - BALL_SIZE / 2,
  size: BALL_SIZE,
  velocityX: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1), // Random initial x-direction
  velocityY: BALL_SPEED * (Math.random() * 2 - 1), // Random initial vertical speed
  color: 'white',
  visible: true // Used for pause and reset
}

// Net
const net = {
  x: WIDTH / 2 - 2,
  y: 0,
  width: 2,
  height: 8,
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
  ctx.font = '20px PongScoreExtended';
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
  drawText(user.score, WIDTH / 4, HEIGHT / 6, 'white');
  // AI score: top center of right half
  drawText(com.score, (WIDTH * 3) / 4, HEIGHT / 6, 'white');

  drawNet(); 

  // Draw paddles
  drawRect(user.x, user.y, user.width, user.height, user.color);
  drawRect(com.x, com.y, com.width, com.height, com.color);

  // Draw ball
  if (ball.visible) {
    drawRect(ball.x, ball.y, ball.size, ball.size, ball.color);
  }
}

// Reset ball to center and randomize direction
function resetBall(scorePlayer = null) {
  // Random starting position
  ball.x = WIDTH / 2 - BALL_SIZE / 2;
  // Range from 0.2 to 0.8 of canvas height
  ball.y = (Math.random() * 0.6 + 0.2) * (HEIGHT - BALL_SIZE);
  ball.velocityX = 0;
  ball.velocityY = 0;
  ball.visible = false; // Hide ball

  // After a short delay, serve the ball
  setTimeout(() => {
    ball.visible = true;
    // Serve towards non-scoring player
    if (scorePlayer == user) {
      ball.velocityX = BALL_SPEED;
    } else if (scorePlayer == com) {
      ball.velocityX = -BALL_SPEED;
    } else {
      // Random direction for initial serve
      ball.velocityX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    }
    ball.velocityY = BALL_SPEED * (Math.random() * 2 - 1);
  }, 1500);
}

function update() {
  // Update ball position
  ball.x += ball.velocityX;
  ball.y += ball.velocityY;
  
  let ballCenterY = ball.y + ball.size / 2;
  let comCenterY = com.y + com.height / 2;
  // Simple AI to control computer paddle
  if (ballCenterY > comCenterY + AI_TOLERANCE) {
    com.y += AI_SPEED * AI_DIFFICULTY;
  } else if (ballCenterY < comCenterY - AI_TOLERANCE) {
    com.y -= AI_SPEED * AI_DIFFICULTY;
  }

  // Prevent computer paddle from moving out of bounds
  com.y = Math.max(Math.min(com.y, HEIGHT - com.height), 0);

  // Ball collision with top and bottom walls
  if (ball.y <= 0) {
    ball.y = 0; // Prevent ball from going out of bounds
    ball.velocityY = -ball.velocityY; // Reverse y direction
    // Play wall sound
    wall_sound.play();
  }
  if (ball.y + ball.size >= HEIGHT) {
    ball.y = HEIGHT - ball.size;
    ball.velocityY = -ball.velocityY; // Reverse y direction
    // Play wall sound
    wall_sound.play();
  }

  // Ball collision with user paddle
  if (ball.x >= user.x &&
      ball.x <= user.x + user.width &&
      ball.y + ball.size >= user.y &&
      ball.y <= user.y + user.height
  ) {
    ball.x = user.x + user.width; // Prevent ball from getting stuck in paddle
    ball.velocityX = -ball.velocityX;

    // Add some "spin" based on where it hit the paddle
    let collidePoint = (ball.y + ball.size / 2) - (user.y + user.height / 2);
    collidePoint = collidePoint / (user.height / 2);
    let angleRad = collidePoint * (5 * Math.PI / 12); // Max 75 degree angle
    ball.velocityY = BALL_SPEED * Math.sin(angleRad);

    // Play hit sound
    hit_sound.play();
  }

  // Ball collision with computer paddle
  if (ball.x + ball.size >= com.x &&
      ball.x + ball.size <= com.x + com.width &&
      ball.y + ball.size >= com.y &&
      ball.y <= com.y + com.height
  ) {
    ball.x = com.x - ball.size; // Prevent ball from getting stuck in paddle
    ball.velocityX = -ball.velocityX;

    // Add some "spin" based on where it hit the paddle
    let collidePoint = (ball.y + ball.size / 2) - (com.y + com.height / 2);
    collidePoint = collidePoint / (com.height / 2);
    let angleRad = collidePoint * (5 * Math.PI / 12); // Max 75 degree angle
    ball.velocityY = BALL_SPEED * Math.sin(angleRad);

    // Play hit sound
    hit_sound.play();
  }

  let player = (ball.x < WIDTH / 2) ? com : user;
  // Update score
  if (ball.x < 0 || ball.x + ball.size > WIDTH) {
    player.score++;
    // Play score sound
    score_sound.play();
    resetBall(player);
  }
}

// Controls
canvas.addEventListener('mousemove', function(event) {
  // Get mouse position relative to canvas
  const rect = canvas.getBoundingClientRect();
  // Center paddle on mouse Y position
  let mouseY = event.clientY - rect.top;
  user.y = mouseY - user.height / 2;
  // Move user paddle, ensuring it stays within bounds
  if (user.y < 0) user.y = 0;
  if (user.y + user.height > HEIGHT) user.y = HEIGHT - user.height;
});

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
      Pong(); // Resume game loop
    }
  }
});

// Game function
function Pong() {
  if (isPaused) return; // Skip update and render if paused
  update(); // Movements, collision, score, etc.
  render();
  requestAnimationFrame(Pong);
}

// Start game
resetBall();
Pong();