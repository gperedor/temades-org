// Global variables initilized during setup()

// GoL variables
var ALIVE = 255;
var DEAD = 0;
var board = [];

// image variables
var canvasState;
var capture;

// initialization state variables
var captured = false;
var settingUp = true;

var fps = 2;
var introTime = 5 * fps;

function setup() {
  const canvas = createCanvas(512, 512);
  pixelDensity(2);

  capture = createCapture(VIDEO);

  capture.hide();

  frameRate(fps);
  canvas.parent('preview');

}

function draw() {
  // if (!captured) return;
  if (!capture.loadedmetadata) return;
  if (settingUp) {
    // can't run methods like filter on setup LMAO
    canvasState = captureFrame(capture);

    canvasState = preprocess(canvasState, 512);
    canvasState.loadPixels();
    board = binaryModel(canvasState);
    resizeCanvas(canvasState.width, canvasState.height);
  }

  var w = canvasState.width;
  var h = canvasState.height;

  image(canvasState, 0, 0);

  // A few seconds of displaying the base image before GoL'ing it
  if (introTime > 0) {
    introTime--;
    return;
  }

  settingUp = false;

  board = gameOfLife(board, w, h);
  nextFrame(board, canvasState);
  canvasState.updatePixels();
}

/**
 * An iteration of the Game of Life
 * @param {the board} board
 * @param {width} w
 * @param {height} h
 * @returns the next state's board
 */
function gameOfLife(board, w, h) {
  let next = [];
  for (let i = 0; i < board.length; i++) {
    n = neighbors(board, i, w, h);
    next[i] = board[i];
    if (n < 2) {
      next[i] = DEAD;
    } else if (board[i] == ALIVE && (n == 2 || n == 3)) {
      next[i] = ALIVE;
    } else if (board[i] == ALIVE && n > 3) {
      next[i] = DEAD;
    } else if (board[i] == DEAD && n == 3) {
      next[i] = ALIVE;
    }
  }

  return next;
}

/**
 * Constructs the Game of Life board from a black and white image pixel array
 * @param {p5 image} img
 * @returns
 */
function binaryModel(img) {
  pixels = img.pixels;
  let board = [];
  for (let i = 0; i < pixels.length - 3; i += 4) {
    board.push(pixels[i]);
  }
  return board;
}

/**
 * Computes number of neighbors around pos in the board
 * @param {a linear "board" containing all points} seq
 * @param {the centre position} pos
 * @param {width of board as laid out in 2D} w
 * @param {height of the board as laid out in 2D} h
 * @returns the number of neighbors
 */
function neighbors(seq, pos, w, h) {
  var x = pos % w;
  var y = Math.floor(pos / w);
  var neighbors = 0;
  for (var i = -1; i <= 1; i++) {
    for (var j = 1; j >= -1; j--) {
      var ix = (y + j) * w + x + i;
      if ((x + i >= 0 && x + i < w) && (y + j >= 0 && y + j < h) && !(i == 0 && j == 0)) {
        neighbors += seq[ix] === ALIVE ? 1 : 0;
      }
    }
  }
  return neighbors;
}

/**
 * Takes a still frame from a video capture element
 * @param {the webcam video element} capture
 * @returns
 */
function captureFrame(capture) {
  let img = createImage(capture.width, capture.height);

  img.loadPixels();
  capture.loadPixels();
  for (let i = 0; i < capture.pixels.length; i++) {
    img.pixels[i] = capture.pixels[i];
  }
  img.updatePixels();
  return img;
}

/**
 * Resizes and filters image to black and white
 * @param {the image} img
 * @param {max(height, width)} maxPixel
 * @returns a black and white version of the image
 */
function preprocess(img, maxPixel) {
  var w, h;
  if (img.width > img.height) {
    w = maxPixel;
    h = img.height * maxPixel / img.width;
  } else {
    w = img.width * maxPixel / img.height;
    h = maxPixel;
  }
  img.resize(w, h);
  img.filter(THRESHOLD);
  return img;
}

/**
 * Re-colors the image element according to the Game of Life board
 * @param {Game of Life board} board
 * @param {the image} img
 */
function nextFrame(board, img) {
  let pixels = img.pixels;
  for (let i = 0; i < board.length; i++) {
    pixels[i * 4] = board[i];
    pixels[i * 4 + 1] = board[i];
    pixels[i * 4 + 2] = board[i];
    pixels[i * 4 + 3] = 255;
  }
}
