let quizData;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let quizState = 'start'; // 'start', 'question', 'feedback', 'end'

// Cursor effects
let cursorParticles = [];
let cursorColor;

// Feedback animation
let feedbackParticles = [];
let feedbackMessage = '';
let feedbackColor;
let feedbackAnimationTimer = 0;
const FEEDBACK_DURATION = 120; // frames

// Timer
let timerValue = 10;
let timerInterval;
const TIME_LIMIT = 10; // 10 seconds per question

// UI elements
let startButton;
let restartButton;

// Preload CSV file
function preload() {
  quizData = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(800, 600);
  cursorColor = color(255, 200, 0); // Initial cursor color

  // Parse CSV data
  for (let i = 0; i < quizData.getRowCount(); i++) {
    let row = quizData.getRow(i);
    questions.push({
      question: row.getString('Question'),
      options: [
        row.getString('OptionA'),
        row.getString('OptionB'),
        row.getString('OptionC'),
        row.getString('OptionD')
      ],
      correctAnswer: row.getString('CorrectAnswer')
    });
  }

  // Create start button
  startButton = createButton('Start Quiz');
  startButton.mouseOver(startBtnHoverIn);
  startButton.mouseOut(startBtnHoverOut);
  startButton.hide();

  // Create restart button
  restartButton = createButton('Restart Quiz');
  restartButton.mouseOver(restartBtnHoverIn);
  restartButton.mouseOut(restartBtnHoverOut);
  restartButton.hide();
}

function draw() {
  background(173, 216, 230); // Light blue background

  switch (quizState) {
    case 'start':
      drawStartScreen();
      break;
    case 'question':
      drawQuestion();
      break;
    case 'feedback':
      drawFeedback();
      break;
    case 'end':
      drawEndScreen();
      break;
  }

  drawCursorEffect();

  // Cursor drag effect: create particles when mouse is pressed and moved
  if (mouseIsPressed && (movedX !== 0 || movedY !== 0)) {
    // Generate a few particles per frame while dragging
    for (let i = 0; i < 5; i++) {
      cursorParticles.push(new Particle(mouseX, mouseY, color(255, 100, 0, 150), random(4, 10))); // Orange-ish color for drag effect
    }
  }
}

function drawStartScreen() {
  fill(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  text('Welcome to the Quiz System!', width / 2, height / 2 - 20);
  startButton.style('font-size', '28px');
  startButton.size(200, 70);
  startButton.style('background-color', '#6495ED'); // CornflowerBlue
  startButton.style('color', '#FFFFFF'); // White text
  startButton.mousePressed(startQuiz);
  startButton.show();
  startButton.position(width / 2 - startButton.width / 2 + 300, height / 2 + 50);
}

function drawQuestion() {
  startButton.hide();
  restartButton.hide();

  let q = questions[currentQuestionIndex];
  fill(0);
  textSize(20);
  textAlign(CENTER, TOP);
  text(q.question, width / 2, 50);

  // Display timer
  fill(0);
  textSize(20);
  textAlign(RIGHT, TOP);
  text(`Time: ${timerValue}`, width - 20, 20);

  let optionY = 150;
  let optionWidth = 300;  // Increased width
  let optionHeight = 60; // Increased height
  let optionX = width / 2 - optionWidth / 2;

  for (let i = 0; i < q.options.length; i++) {
    let currentOptionY = optionY + i * (optionHeight + 20);
    let isHovered = mouseX > optionX && mouseX < optionX + optionWidth &&
                     mouseY > currentOptionY && mouseY < currentOptionY + optionHeight;

    if (isHovered) {
      fill(150, 200, 255); // Highlight on hover
      cursorColor = color(0, 255, 255); // Cursor changes color
    } else {
      fill(200);
      cursorColor = color(255, 200, 0); // Reset cursor color
    }
    
    rect(optionX, currentOptionY, optionWidth, optionHeight, 5);
    fill(0);
    textSize(18);  // Increased text size
    text(q.options[i], width / 2, currentOptionY + optionHeight / 2);
  }
}

function drawFeedback() {
  fill(feedbackColor);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(feedbackMessage, width / 2, height / 2 - 50);

  // Update and display feedback particles
  for (let i = feedbackParticles.length - 1; i >= 0; i--) {
    let p = feedbackParticles[i];
    p.update();
    p.display();
    if (p.isFinished()) {
      feedbackParticles.splice(i, 1);
    }
  }

  feedbackAnimationTimer++;
  if (feedbackAnimationTimer > FEEDBACK_DURATION) {
    feedbackAnimationTimer = 0;
    nextQuestion();
  }
}

function drawEndScreen() {
  fill(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  text('Quiz Finished!', width / 2, height / 2 - 50);
  textSize(24);
  text(`Your Score: ${score} / ${questions.length}`, width / 2, height / 2);
  restartButton.style('background-color', '#6495ED'); // CornflowerBlue
  restartButton.style('color', '#FFFFFF'); // White text
  restartButton.mousePressed(startQuiz);
  restartButton.position(width / 2 - restartButton.width / 2, height / 2 + 50);
  restartButton.show();
}

function mousePressed() {
  if (quizState === 'question') {
    let q = questions[currentQuestionIndex];
    let optionWidth = 300;
    let optionHeight = 60;
    let optionX = width / 2 - optionWidth / 2;
    let optionY = 150;

    for (let i = 0; i < q.options.length; i++) {
      let currentOptionY = optionY + i * (optionHeight + 20);
      if (mouseX > optionX && mouseX < optionX + optionWidth &&
          mouseY > currentOptionY && mouseY < currentOptionY + optionHeight) {
        checkAnswer(String.fromCharCode(65 + i)); // 'A', 'B', 'C', 'D'
        // Emit cursor particles on selection
        for (let j = 0; j < 20; j++) {
          cursorParticles.push(new Particle(mouseX, mouseY, color(255, 255, 0), 5));
        }
        break;
      }
    }
  }
}

function startQuiz() {
  quizState = 'question';
  currentQuestionIndex = 0;
  score = 0;
  startButton.hide();
  restartButton.hide();
  startTimer();
}

function checkAnswer(selectedOptionChar) {
  stopTimer();
  let q = questions[currentQuestionIndex];
  let correctAnswer = q.correctAnswer.trim().toUpperCase(); // Trim whitespace and uppercase
  let selectedAnswer = selectedOptionChar.trim().toUpperCase(); // Trim whitespace and uppercase

  if (selectedAnswer === correctAnswer) {
    score++;
    displayFeedback(true);
  } else {
    displayFeedback(false);
  }
}

function displayFeedback(isCorrect) {
  quizState = 'feedback';
  let totalQuestions = questions.length;

  if (isCorrect) {
    feedbackColor = color(0, 200, 0);
    
    // 根據答對題數給予不同的讚美詞和煙火效果
    if (score === totalQuestions) {
      feedbackMessage = '太棒了！全部答對！';
      for (let i = 0; i < 150; i++) { // 更多粒子，更大尺寸
        feedbackParticles.push(new Particle(width / 2, height / 2, color(255, 255, 0), random(10, 20)));
      }
    } else if (score >= totalQuestions * 0.8) {
      feedbackMessage = '非常出色！你幾乎答對了所有題目！';
      for (let i = 0; i < 100; i++) {
        feedbackParticles.push(new Particle(width / 2, height / 2, color(0, 255, 0), random(8, 15)));
      }
    } else if (score >= totalQuestions * 0.5) {
      feedbackMessage = '做得好！繼續努力！';
      for (let i = 0; i < 70; i++) {
        feedbackParticles.push(new Particle(width / 2, height / 2, color(0, 200, 255), random(6, 12)));
      }
    } else {
      feedbackMessage = '答對了！';
      for (let i = 0; i < 40; i++) {
        feedbackParticles.push(new Particle(width / 2, height / 2, color(0, 255, 0), random(5, 10)));
      }
    }
  } else {
    feedbackMessage = 'Incorrect.';
    feedbackColor = color(200, 0, 0);
    for (let i = 0; i < 10; i++) {
      feedbackParticles.push(new Particle(width / 2, height / 2, color(255, 0, 0), 5));
    }
  }
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    quizState = 'question';
    startTimer();
  } else {
    quizState = 'end';
  }
}

function startTimer() {
  timerValue = TIME_LIMIT;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerValue--;
    if (timerValue < 0) {
      stopTimer();
      displayFeedback(false); // Time's up, incorrect
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function startBtnHoverIn() {
  startButton.style('background-color', '#4169E1'); // RoyalBlue
  startButton.style('color', '#FFFF00'); // Yellow text
}

function startBtnHoverOut() {
  startButton.style('background-color', '#6495ED'); // CornflowerBlue
  startButton.style('color', '#FFFFFF'); // White text
}

function restartBtnHoverIn() {
  restartButton.style('background-color', '#4169E1'); // RoyalBlue
  restartButton.style('color', '#FFFF00'); // Yellow text
}

function restartBtnHoverOut() {
  restartButton.style('background-color', '#6495ED'); // CornflowerBlue
  restartButton.style('color', '#FFFFFF'); // White text
}

function drawCursorEffect() {
  // Draw main cursor
  noStroke();
  fill(cursorColor, 150);
  ellipse(mouseX, mouseY, 20, 20);

  // Update and display cursor particles
  for (let i = cursorParticles.length - 1; i >= 0; i--) {
    let p = cursorParticles[i];
    p.update();
    p.display();
    if (p.isFinished()) {
      cursorParticles.splice(i, 1);
    }
  }
}

// Particle class for animations
class Particle {
  constructor(x, y, c, size) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(1, 3));
    this.acc = createVector(0, 0.05); // Gravity-like effect
    this.color = c;
    this.alpha = 255;
    this.size = random(size / 2, size * 1.5);
    this.lifespan = 255;
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.alpha -= 5;
    this.lifespan -= 5;
  }

  display() {
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  isFinished() {
    return this.alpha < 0;
  }
}
