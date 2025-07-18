let g = 0.9; // Gravity constant
let l1, l2; // Lengths of the pendulums
let m1, m2; // Masses of the pendulums
let t = 0;
let h = 0.5;
let sliderSpeed = 0.6;
let initialState = [Math.PI / 2, Math.PI / 3.8, 0, 0]; // Initial conditions [a1(0), a2(0), w1(0), w2(0)]
let state = [...initialState]; // Copy of initial state for reset
let trace = []; // Array to store the positions for the trace

// Sliders
let l1Slider, l2Slider, m1Slider, m2Slider;
let resetButton;

// Keys
let keysDown = new Set();

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace');
  
  // Create sliders
  l1Slider = createSlider(1, 300, 150, 0.1); // Length of the first pendulum
  l1Slider.position(20, 20);
  
  l2Slider = createSlider(1, 300, 150, 0.1); // Length of the second pendulum
  l2Slider.position(20, 50);
  
  m1Slider = createSlider(1, 20, 10, 0.01); // Mass of the first pendulum
  m1Slider.position(20, 80);
  
  m2Slider = createSlider(1, 20, 10, 0.01); // Mass of the second pendulum
  m2Slider.position(20, 110);

  // Create reset button
  resetButton = createButton('Reset');
  resetButton.position(20, 140);
  resetButton.mousePressed(resetSimulation); // Attach event listener
}

function draw() {
  background(255);
  // --- Continuous slider updates based on held keys (percentage + speed) ---
  if (keysDown.size > 0) {
    const dt = deltaTime; // milliseconds since last frame
    if (keysDown.has('q') || keysDown.has('Q')) adjustSlider(l1Slider, -1, dt);
    if (keysDown.has('w') || keysDown.has('W')) adjustSlider(l1Slider,  1, dt);
    if (keysDown.has('e') || keysDown.has('E')) adjustSlider(l2Slider, -1, dt);
    if (keysDown.has('r') || keysDown.has('R')) adjustSlider(l2Slider,  1, dt);
    if (keysDown.has('a') || keysDown.has('A')) adjustSlider(m1Slider, -1, dt);
    if (keysDown.has('s') || keysDown.has('S')) adjustSlider(m1Slider,  1, dt);
    if (keysDown.has('d') || keysDown.has('D')) adjustSlider(m2Slider, -1, dt);
    if (keysDown.has('f') || keysDown.has('F')) adjustSlider(m2Slider,  1, dt);
  }
  // Update the values from sliders
  l1 = l1Slider.value();
  l2 = l2Slider.value();
  m1 = m1Slider.value();
  m2 = m2Slider.value();
  // Draw text labels
  fill(0);
  textSize(20);
  textStyle(NORMAL);  // Set font weight to normal (not bold)
  // Labels
  const labelX = l1Slider.x * 2 + l1Slider.width;
  let l1Str = (l1).toFixed(1);
  let l2Str = (l2).toFixed(1);
  let m1Str = (m1).toFixed(1);
  let m2Str = (m2).toFixed(1);
  
  text(`L₁: ${l1Str}`, labelX, 35);
  text(`L₂: ${l2Str}`, labelX, 65);
  text(`M₁: ${m1Str}`, labelX, 95);
  text(`M₂: ${m2Str}`, labelX, 125);
  
  // Midpoint of coordinate system
  translateX = width / 2;
  translateY = height / 2;
  translate(translateX, translateY);

  // Integrate from t to t+h
  let result = numeric.dopri(t, t + h, state, doublependulum, 1e-8);
  state = result.at(t + h); // Update the state
  t += h; // Increment time

  // Compute the end points of the pendulums
  let a1 = state[0]; // example: use x1 for plotting
  let a2 = state[1]; // example: use x2 for plotting
  x1 = l1 * sin(a1);
  y1 = l1 * cos(a1);
  x2 = x1 + l2 * sin(a2);
  y2 = y1 + l2 * cos(a2);

  // Store the position of the second pendulum bob for the trace
  trace.push({x: x2, y: y2, age: 150}); // age starts at full opacity (255)
  if (trace.length > 2000) {
    trace.shift(); // Remove the oldest trace point if too many
  }

  // Draw the trace
  noFill();
  strokeWeight(2);
  for (let i = 0; i < trace.length - 1; i++) {
    let alpha1 = trace[i].age;
    let alpha2 = trace[i + 1].age;
    stroke(0, 0, 0, alpha1); // Set stroke color with varying alpha
    line(trace[i].x, trace[i].y, trace[i + 1].x, trace[i + 1].y);
    trace[i].age = max(0, trace[i].age - 0.5); // Fade out by decreasing alpha
  }


  // Draw the pendulums
  stroke(0);
  strokeWeight(2);
  fill(127);
  line(0, 0, x1, y1);
  ellipse(x1, y1, m1, m1); // Size changes based on hover
  line(x1, y1, x2, y2);
  ellipse(x2, y2, m2, m2);

}

function doublependulum(t, state) {
  let a1 = state[0]; // angle 1
  let a2 = state[1]; // angle 2
  let w1 = state[2]; // omega 1
  let w2 = state[3]; // omega 2


  let delta = a2 - a1;
  
  let den1 = (m1 + m2) * l1 - m2 * l1 * cos(delta) * cos(delta);
  let dw1dt = (m2 * l1 * w1 * w1 * sin(delta) * cos(delta) +
              m2 * g * sin(a2) * cos(delta) +
              m2 * l2 * w2 * w2 * sin(delta) -
              (m1 + m2) * g * sin(a1)) / den1;

  let den2 = (l2 / l1) * den1;
  let dw2dt = (-m2 * l2 * w2 * w2 * sin(delta) * cos(delta) +
              (m1 + m2) * g * sin(a1) * cos(delta) -
              (m1 + m2) * l1 * w1 * w1 * sin(delta) -
              (m1 + m2) * g * sin(a2)) / den2;

  let da1dt = w1;
  let da2dt = w2;

  return [da1dt, da2dt, dw1dt, dw2dt];
}

function resetSimulation() {
  state = [...initialState]; // Reset the state to initial conditions
  t = 0; // Reset time
  l1Slider.value(150); // Reset slider for length of the first pendulum
  l2Slider.value(150); // Reset slider for length of the second pendulum
  m1Slider.value(10);  // Reset slider for mass of the first pendulum
  m2Slider.value(10);  // Reset slider for mass of the second pendulum
}

function adjustSlider(slider, direction, dt) {
  // direction = +1 or -1
  let minVal = Number(slider.elt.min);
  let maxVal = Number(slider.elt.max);
  let range = maxVal - minVal;

  // dt is deltaTime in ms; convert to seconds
  let step = range * sliderSpeed * (dt / 1000); 
  let newVal = slider.value() + direction * step;
  newVal = constrain(newVal, minVal, maxVal);
  slider.value(newVal);
}

function keyPressed() {
  keysDown.add(key);
  return false;
}

function keyReleased() {
  keysDown.delete(key);
  return false;
}