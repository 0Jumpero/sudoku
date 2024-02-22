/* 
Next update: timer
*/

// Register service worker 
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').then(
    (registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    },
    (error) => {
      console.error('Service Worker registration failed:', error);
    },
  );
}


// Global variables
let active = null; // current active element
let currentDigit = null; // current selected digit
let currentHighlight = null; // current digit highlight
let selection = 0;  // click type, 0 - nothing active, 1 - active cell, 2 - active UIdigit
let pencil = false; // pencil mode toggled
let lock = false; // lock mode toggled
let history = []; // move history
let totals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // counter for each digit inputed
let addedStyles = []; // additional style classes for end screen


// Sudoku Builder

let sudoku = [];
sudoku.DOM = document.createElement('table');
sudoku.DOM.className = 'sudoku';
for(let r = 0; r < 9; r++) {

  sudoku[r] = [];
  sudoku[r].DOM = sudoku.DOM.insertRow();

  for(let c = 0; c < 9; c++) {
    let inner = sudoku[r].DOM.insertCell();
    inner.classList.add('cellBorder');
    sudoku[r][c] = {
      'DOM': inner.appendChild(document.createElement("div")),
      'value': null,
      'pencil': [],
      'class': 'cell',
      'lock': false,
      'r': r,
      'c': c
    }
    sudoku[r][c].DOM.className = 'cell';
    sudoku[r][c].DOM.onclick = () => { activeClick('cell', sudoku[r][c]) };
  }
}

// Function to update elements sizes using --height variable (here before adding any elements)
updateSizes = () => {
  let height = window.innerHeight;
  let root = document.querySelector(':root');
  root.style.setProperty('--height', `${Math.floor(height)}px`);
}
updateSizes();
document.body.onresize = () => { updateSizes() };

document.body.appendChild(sudoku.DOM);


// Keyboard Builder

let digits = document.createElement('div');
digits.className = 'UIdigits';
for(let i = 1; i < 10; i++) {

  let digit = document.createElement('div');
  digit.className = 'UIdigit';
  digit.class = 'digit';
  digit.id = i;
  digit.onclick = () => { activeClick('digit', digit); };

  let id = document.createElement('div');
  id.className = 'UIdigitID';
  id.innerText = i;
  let count = document.createElement('div');
  count.className = 'UIdigitCount';

  digit.append(id, count);
  digits.appendChild(digit);

  if(i == 9) {
    x = document.createElement('div');
    x.className = 'UIdigit';
    x.class = 'digit';

    x.onclick = () => { activeClick('digit', x); };

    y = document.createElement('div');
    y.className = 'UIdigitID';
    y.innerText = 'X';

    x.append(y);
    digits.appendChild(x);
  }

}

document.body.appendChild(digits);
updateCounters();


// UI Builder

// Additional options
let addons = document.createElement('div');
addons.className = 'UIaddons';

let optionPuzzle = document.createElement('div');
optionPuzzle.className = 'UIoption';
optionPuzzle.id = 'puzzle';
optionPuzzle.innerText = '⚄';
optionPuzzle.onclick = () => { activeClick('option', optionPuzzle); };

let addonsToggle = document.createElement('div');
addonsToggle.className = 'UItoggle';
addonsToggle.id = 'toggle';
addonsToggle.innerText = '△';
addonsToggle.onclick = () => { activeClick('option', addonsToggle) };

addons.append(addonsToggle, optionPuzzle);
document.body.appendChild(addons);

// Main options
let options = document.createElement('div');
options.className = 'UIoptions';

let optionRestart = document.createElement('div');
optionRestart.className = 'UIoption';
optionRestart.id = 'restart';
optionRestart.innerText = '⟳';
optionRestart.onclick = () => { activeClick('option', optionRestart); };

let optionLock = document.createElement('div');
optionLock.className = 'UIoption';
optionLock.id = 'lock';
optionLock.innerText = 'ꗃ';
optionLock.onclick = () => { activeClick('option', optionLock); };

let optionReverse = document.createElement('div');
optionReverse.className = 'UIoption';
optionReverse.id = 'reverse';
optionReverse.innerText = '↶';
optionReverse.onclick = () => { activeClick('option', optionReverse); };

let optionPencil = document.createElement('div');
optionPencil.className = 'UIoption';
optionPencil.id = 'pencil';
optionPencil.innerText = '✎';
optionPencil.onclick = () => { activeClick('option', optionPencil); };

options.append(optionRestart, optionLock, optionReverse, optionPencil);
document.body.appendChild(options);


// Functions

function activeClick(area, elem) {

  // Cell click
  if(area == 'cell') {

    // Clear active cell
    if((selection == 1 && active == elem) || (selection < 2 && currentHighlight == elem.value && elem.lock)) {
      removeActive();
      removeHighlight();
      active = null;
      selection = 0;
      return;
    }

    // Set active cell
    if(selection < 2) {
      removeActive();
      // Remain highlight if empty cell
      if(selection == 1 && !elem.value && currentHighlight)
        if(active.value == currentHighlight || active.pencil.includes(currentHighlight))
          active.DOM.firstChild.classList.add('highlight');

      active = elem;
      selection = 1;

      // add active anim
      if(!active.DOM.firstChild) {
        let digit = document.createElement('div');
        digit.className = (lock) ? 'digit unlocked' : 'digit';
        active.DOM.appendChild(digit);
      }
      if(active.value) setHighlight(active.value);
      if(active.lock) {
        active = null;
        selection = 0;
      } else active.DOM.firstChild.classList.add('active');
    }

    // Input into cell with digit active
    if(selection == 2) {
      // If cell is empty create blob in the cell
      if(!elem.DOM.firstChild) {
        let digit = document.createElement('div');
        elem.DOM.appendChild(digit);
      }

      // If cell locked do nothing
      if(elem.lock) return;

      // Clearing cell if inputing X
      if(active.id == 0) {
        // History (clear cell)
        history.push({
          r: elem.r,
          c: elem.c,
          DOM: elem.DOM.cloneNode(true),
          value: elem.value,
          pencil: [...elem.pencil]
        });
        elem.DOM.firstChild.remove();
        elem.value = null;
        elem.pencil = [];
        return;
      }

      // Pencil mode distinction
      if(pencil) {
        // add active anim
        // If cell has pencil digit same as currentDigit already
        if(elem.pencil.includes(currentDigit)) {
          // History (remove pencil digit)
          history.push({
            r: elem.r,
            c: elem.c,
            DOM: elem.DOM.cloneNode(true),
            value: elem.value,
            pencil: [...elem.pencil]
          });
          elem.pencil = elem.pencil.filter(d => d != currentDigit);
          elem.DOM.firstChild.classList.remove('highlight');
        }

        // If cell is empty or has digit or has other pencil digits input pencil digit
        else {
          // History (overwrite cell with pencil digit)
          history.push({
            r: elem.r,
            c: elem.c,
            DOM: elem.DOM.cloneNode(true),
            value: elem.value,
            pencil: [...elem.pencil]
          });
          elem.pencil.push(currentDigit);
          elem.pencil.sort();
          elem.value = null;
          elem.DOM.firstChild.classList.add('highlight');
        }

        // Update cell
        if(!elem.pencil.length) {
          elem.DOM.firstChild.remove();
          return;
        }
        elem.DOM.firstChild.innerText = '';
        if(elem.DOM.firstChild.classList.contains('digit'))
          elem.DOM.firstChild.className = elem.DOM.firstChild.className.replace('digit', 'pencil');
        else elem.DOM.firstChild.className = 'pencil ' + elem.DOM.firstChild.className;
        for(let d of elem.pencil) {
          let pencilDigit = document.createElement('div');
          pencilDigit.className = 'pencilDigit';
          pencilDigit.innerText = d;
          elem.DOM.firstChild.append(pencilDigit);
        }

      } else {
        // If cell current value is the same as the one being inputed then clear cell
        if(elem.value == currentDigit) {
          // History (remove digit)
          history.push({
            r: elem.r,
            c: elem.c,
            DOM: elem.DOM.cloneNode(true),
            value: elem.value,
            pencil: [...elem.pencil]
          });
          elem.DOM.firstChild.remove();
          elem.value = null;
        }
        else {
          // History (overwrite cell with digit)
          history.push({
            r: elem.r,
            c: elem.c,
            DOM: elem.DOM.cloneNode(true),
            value: elem.value,
            pencil: [...elem.pencil]
          });
          elem.DOM.firstChild.className = (lock) ? 'digit unlocked' : 'digit';
          elem.DOM.firstChild.innerText = elem.value = currentDigit;
          elem.pencil = [];
          clearPencil(elem);
          elem.DOM.firstChild.classList.add('highlight');
        }

      }

    }

  }

  // Digit click
  if(area == 'digit') {

    // Clear active digit
    if(active == elem) {
      removeActive();
      active = null;
      selection = 0;
      return;
    }

    // Set active digit
    if(selection == 0 || selection == 2) {
      removeActive();
      active = elem;

      // add active anim
      setHighlight(active.id);
      active.classList.add('UIdigitEnabled');
      currentDigit = active.id;
      selection = 2;
    }

    // Input digit into active cell
    if(selection == 1) {
      // If cell is empty create blob in the cell
      if(!active.DOM.firstChild) {
        let digit = document.createElement('div');
        active.DOM.appendChild(digit);
      }

      // Clearing cell if inputing X
      if(elem.id == 0) {
        // History (clear cell)
        history.push({
          r: active.r,
          c: active.c,
          DOM: active.DOM.cloneNode(true),
          value: active.value,
          pencil: [...active.pencil]
        });
        active.DOM.firstChild.innerText = '';
        active.value = null;
        active.pencil = [];
        return;
      }

      currentDigit = elem.id;
      // Pencil mode distinction
      if(pencil) {
        // add active anim
        // If cell has pencil digit same as currentDigit already
        if(active.pencil.includes(currentDigit)) {
          // History (remove pencil digit)
          history.push({
            r: active.r,
            c: active.c,
            DOM: active.DOM.cloneNode(true),
            value: active.value,
            pencil: [...active.pencil]
          });
          active.pencil = active.pencil.filter(d => d != currentDigit);
        }

        // If cell is empty or has digit or has other pencil digits input pencil digit
        else {
          // History (overwrite with pencil digit)
          history.push({
            r: active.r,
            c: active.c,
            DOM: active.DOM.cloneNode(true),
            value: active.value,
            pencil: [...active.pencil]
          });
          active.pencil.push(currentDigit);
          active.pencil.sort();
          active.value = null;
        }

        // Update cell
        active.DOM.firstChild.innerText = '';
        active.DOM.firstChild.className = 'pencil active';
        replayAnim(active.DOM.firstChild);
        for(let d of active.pencil) {
          let pencilDigit = document.createElement('div');
          pencilDigit.className = 'pencilDigit';
          pencilDigit.innerText = d;
          active.DOM.firstChild.append(pencilDigit);
        }

      } else {
        // add active anim
        // If active cell value is the same as the one being inputed clear the cell
        if(active.value == currentDigit) {
          removeHighlight();
          // History (remove digit)
          history.push({
            r: active.r,
            c: active.c,
            DOM: active.DOM.cloneNode(true),
            value: active.value,
            pencil: [...active.pencil]
          });
          active.DOM.firstChild.innerText = active.value = null;
        }
        else {
          // History (overwrite with digit)
          history.push({
            r: active.r,
            c: active.c,
            DOM: active.DOM.cloneNode(true),
            value: active.value,
            pencil: [...active.pencil]
          });
          active.DOM.firstChild.className = (lock) ? 'digit unlocked active' : 'digit active';
          active.DOM.firstChild.innerText = active.value = currentDigit;
          active.pencil = [];
          replayAnim(active.DOM.firstChild);
          clearPencil(active);
          setHighlight(currentDigit);
        }
      }
      currentDigit = null;

    }

  }

  // UI click
  if(area == 'option') {
    if(elem.id == 'pencil') {
      if(pencil) elem.classList.remove('UIoptionEnabled');
      else elem.classList.add('UIoptionEnabled');
      pencil = !pencil;
    }

    if(elem.id == 'reverse') {
      if(history.length == 0) return;
      let prev;
      do {
        prev = history.pop();

        // If prev was an empty cell
        if(!prev.DOM.firstChild || prev.DOM.firstChild.innerText == '') {
          // Remove if cell is not active, otherwise just remove innerText
          if(!active || active.class == 'digit' || (active.class == 'cell' && (active.r != prev.r || active.c != prev.c)))
            sudoku[prev.r][prev.c].DOM.firstChild.remove();
          else sudoku[prev.r][prev.c].DOM.firstChild.innerText = '';
          sudoku[prev.r][prev.c].value = null;
          sudoku[prev.r][prev.c].pencil = [];
        }

        // If prev had a digit
        if(prev.value) {
          // If cell is empty create blob in the cell
          if(!sudoku[prev.r][prev.c].DOM.firstChild) {
            let digit = document.createElement('div');
            sudoku[prev.r][prev.c].DOM.appendChild(digit);
          }

          sudoku[prev.r][prev.c].DOM.firstChild.innerText = prev.value;
          sudoku[prev.r][prev.c].value = prev.value;
          sudoku[prev.r][prev.c].pencil = [];
          sudoku[prev.r][prev.c].DOM.firstChild.className = 'digit';
          if(prev.DOM.firstChild.classList.contains('unlocked'))
            sudoku[prev.r][prev.c].DOM.firstChild.classList.add('unlocked');
          if(prev.value == currentHighlight)
            sudoku[prev.r][prev.c].DOM.firstChild.classList.add('highlight');
          if(active && active.class == 'cell' && active.r == prev.r && active.c == prev.c)
            sudoku[prev.r][prev.c].DOM.firstChild.classList.add('active');
        }

        // If prev had any pencil digits
        if(prev.pencil.length) {
          // If cell is empty create blob in the cell
          if(!sudoku[prev.r][prev.c].DOM.firstChild) {
            let digit = document.createElement('div');
            sudoku[prev.r][prev.c].DOM.appendChild(digit);
          }

          sudoku[prev.r][prev.c].DOM.firstChild.innerText = '';
          sudoku[prev.r][prev.c].value = null;
          sudoku[prev.r][prev.c].pencil = [];
          for(let d of prev.pencil) {
            let pencilDigit = document.createElement('div');
            pencilDigit.className = 'pencilDigit';
            pencilDigit.innerText = d;
            sudoku[prev.r][prev.c].DOM.firstChild.append(pencilDigit);
            sudoku[prev.r][prev.c].pencil.push(d);
          }
          sudoku[prev.r][prev.c].DOM.firstChild.className = 'pencil';
          if(sudoku[prev.r][prev.c].pencil.includes(currentHighlight))
            sudoku[prev.r][prev.c].DOM.firstChild.classList.add('highlight');
          if(active && active.class == 'cell' && active.r == prev.r && active.c == prev.c)
            sudoku[prev.r][prev.c].DOM.firstChild.classList.add('active');
        }

        // If prev was auto removed remove next one from history
      } while(prev.auto);
    }

    if(elem.id == 'lock') {
      if(lock) switchLocks(false);
      else switchLocks(true);
      history = [];
    }

    if(elem.id == 'restart') {
      let overlay = document.createElement('div');
      overlay.classList.add('overlay');
      let dialog = document.createElement('div');
      dialog.classList.add('dialog');
      let dialogText = document.createElement('div');
      dialogText.classList.add('dialogText');
      dialogText.innerText = 'Are you sure you want to restart?';
      let dialogYes = document.createElement('div');
      dialogYes.classList.add('dialogButton');
      dialogYes.innerText = 'YES';
      dialogYes.onclick = () => {
        if(lock) while(history.length) activeClick('option', { id: 'reverse' });
        else reload();
        overlay.remove();
      };
      let dialogNo = document.createElement('div');
      dialogNo.classList.add('dialogButton');
      dialogNo.innerText = 'NO';
      dialogNo.onclick = () => { overlay.remove(); };

      dialog.append(dialogText, dialogNo, dialogYes);
      overlay.append(dialog);
      document.body.append(overlay);
    }

    if(elem.id == 'toggle') {
      if(elem.parentElement.classList.contains('expanded')) {
        elem.parentElement.classList.remove('expanded');
        elem.innerText = '△';
      } else {
        elem.parentElement.classList.add('expanded');
        elem.innerText = '▽';
      }
    }

    if(elem.id == 'puzzle') {
      let overlay = document.createElement('div');
      overlay.classList.add('overlay');
      let dialog = document.createElement('div');
      dialog.classList.add('dialog');
      let dialogText = document.createElement('div');
      dialogText.classList.add('dialogText');
      dialogText.innerText = 'Generate a puzzle. \n Select difficulty:';
      let dialogEasy = document.createElement('div');
      dialogEasy.classList.add('dialogButton');
      dialogEasy.innerText = 'Easy';
      dialogEasy.onclick = () => { generatePuzzle('Easy', overlay); };
      let dialogMid = document.createElement('div');
      dialogMid.classList.add('dialogButton');
      dialogMid.innerText = 'Medium';
      dialogMid.onclick = () => { generatePuzzle('Medium', overlay); };
      let dialogHard = document.createElement('div');
      dialogHard.classList.add('dialogButton');
      dialogHard.innerText = 'Hard';
      dialogHard.onclick = () => { generatePuzzle('Hard', overlay); };

      dialog.append(dialogText, dialogEasy, dialogMid, dialogHard);
      overlay.append(dialog);
      document.body.append(overlay);
    }
  }

  // Update counters and check finish
  totals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for(let r = 0; r < 9; r++) for(let c = 0; c < 9; c++) if(sudoku[r][c].value) {
    totals[sudoku[r][c].value]++;
    totals[0]++;
  }
  updateCounters();
  checkEnd();

}

// Keyboard integration
function keyboardPress(e) {
  let key = e.key;
  if(!isNaN(key)) {
    let elem = null;
    if(key > 0) elem = digits.childNodes[key - 1];
    else elem = digits.childNodes[9];
    let area = "digit";
    activeClick(area, elem);
  }
}
document.addEventListener('keypress', keyboardPress);

// Generating puzzle
async function generatePuzzle(diff, overlay) {
  let text = overlay.firstChild.firstChild;
  text.innerText = 'Loading...';
  overlay.firstChild.innerHTML = '';
  overlay.firstChild.append(text);

  try {
    let collection = await fetch('https://sudoku-api.vercel.app/api/dosuku?query={newboard(limit:20){grids{value,difficulty}}}').then((res) => res.json()).then((data) => data.newboard.grids);
    reload();
    for(let grid of collection) if(grid.difficulty == diff) {
      for(let r = 0; r < 9; r++) for(let c = 0; c < 9; c++) {
        if(grid.value[r][c] == 0) continue;
        let digit = document.createElement('div');
        digit.className = 'digit';
        sudoku[r][c].DOM.appendChild(digit);
        sudoku[r][c].DOM.firstChild.innerText = sudoku[r][c].value = grid.value[r][c];
      }
      switchLocks(true);
      overlay.remove();
      activeClick('option', addonsToggle);
      return;
    }
    generatePuzzle(diff, overlay);
    return;
  } catch(err) { };

  text.innerText = 'Something went wrong.\nTry again';
  setTimeout(() => overlay.remove(), 2000);
}

function removeActive() {
  if(!active) return;

  if(active.class == 'cell') {
    if(active.DOM.firstChild.innerText) active.DOM.firstChild.classList.remove('active');
    else active.DOM.firstChild.remove();
  }

  if(active.class == 'digit') {
    active.classList.remove('UIdigitEnabled');
    removeHighlight();
  }
}

function setHighlight(digit) {
  removeHighlight();
  currentHighlight = digit;
  for(let r = 0; r < 9; r++)
    for(let c = 0; c < 9; c++)
      if(sudoku[r][c].value == digit || sudoku[r][c].pencil.includes(digit)) {
        sudoku[r][c].DOM.firstChild.style.animationDelay = `${Math.floor(Math.random() * 100)}ms`;
        sudoku[r][c].DOM.firstChild.classList.add('highlight');
      }

}

function removeHighlight() {
  currentHighlight = null;
  for(let r = 0; r < 9; r++)
    for(let c = 0; c < 9; c++)
      if(sudoku[r][c].DOM.firstChild) sudoku[r][c].DOM.firstChild.classList.remove('highlight');
}

function replayAnim(e) {
  e.style.animation = 'none';
  e.offsetHeight;
  e.style.animation = null;
}

// Clearing rows, columns and nonets
function clearPencil(cell) {
  if(cell.value == 0) return;

  let nonet = {
    'r': Math.floor(cell.r / 3),
    'c': Math.floor(cell.c / 3)
  }

  // Clear row
  for(let c = 0; c < 9; c++) {
    // Skip currently inputed cell and cells with digits
    if(c == cell.c || sudoku[cell.r][c].value) continue;
    // If cell includes pencil digit
    if(sudoku[cell.r][c].pencil.includes(cell.value)) {
      // History (auto remove pencil digit)
      history.push({
        auto: true,
        r: cell.r,
        c: c,
        DOM: sudoku[cell.r][c].DOM.cloneNode(true),
        value: sudoku[cell.r][c].value,
        pencil: [...sudoku[cell.r][c].pencil]
      });
      sudoku[cell.r][c].pencil = sudoku[cell.r][c].pencil.filter(d => d != cell.value);
      sudoku[cell.r][c].DOM.firstChild.innerText = '';
      sudoku[cell.r][c].DOM.firstChild.classList.remove('highlight');
      // Clearing cell if empty
      if(!sudoku[cell.r][c].pencil.length) sudoku[cell.r][c].DOM.firstChild.remove();
      // Update cell
      else for(let d of sudoku[cell.r][c].pencil) {
        let pencilDigit = document.createElement('div');
        pencilDigit.className = 'pencilDigit';
        pencilDigit.innerText = d;
        sudoku[cell.r][c].DOM.firstChild.append(pencilDigit);
      }
    }
  }

  // Clear column
  for(let r = 0; r < 9; r++) {
    // Skip currently inputed cell and cells with digits
    if(r == cell.r || sudoku[r][cell.c].value) continue;
    // If cell includes pencil digit
    if(sudoku[r][cell.c].pencil.includes(cell.value)) {
      // History (auto remove pencil digit)
      history.push({
        auto: true,
        r: r,
        c: cell.c,
        DOM: sudoku[r][cell.c].DOM.cloneNode(true),
        value: sudoku[r][cell.c].value,
        pencil: [...sudoku[r][cell.c].pencil]
      });
      sudoku[r][cell.c].pencil = sudoku[r][cell.c].pencil.filter(d => d != cell.value);
      sudoku[r][cell.c].DOM.firstChild.innerText = '';
      sudoku[r][cell.c].DOM.firstChild.classList.remove('highlight');
      // Clearing cell if empty
      if(!sudoku[r][cell.c].pencil.length) sudoku[r][cell.c].DOM.firstChild.remove();
      // Update cell
      else for(let d of sudoku[r][cell.c].pencil) {
        let pencilDigit = document.createElement('div');
        pencilDigit.className = 'pencilDigit';
        pencilDigit.innerText = d;
        sudoku[r][cell.c].DOM.firstChild.append(pencilDigit);
      }
    }
  }

  // Clear nonet
  for(let r = nonet.r * 3; r < nonet.r * 3 + 3; r++) {
    for(let c = nonet.c * 3; c < nonet.c * 3 + 3; c++) {
      // Skip currently inputed cell and cells with digits
      if((r == cell.r && c == cell.c) || sudoku[r][c].value) continue;
      // If cell includes pencil digit
      if(sudoku[r][c].pencil.includes(cell.value)) {
        // History (auto remove pencil digit)
        history.push({
          auto: true,
          r: r,
          c: c,
          DOM: sudoku[r][c].DOM.cloneNode(true),
          value: sudoku[r][c].value,
          pencil: [...sudoku[r][c].pencil]
        });
        sudoku[r][c].pencil = sudoku[r][c].pencil.filter(d => d != cell.value);
        sudoku[r][c].DOM.firstChild.innerText = '';
        sudoku[r][c].DOM.firstChild.classList.remove('highlight');
        // Clearing cell if empty
        if(!sudoku[r][c].pencil.length) sudoku[r][c].DOM.firstChild.remove();
        // Update cell
        else for(let d of sudoku[r][c].pencil) {
          let pencilDigit = document.createElement('div');
          pencilDigit.className = 'pencilDigit';
          pencilDigit.innerText = d;
          sudoku[r][c].DOM.firstChild.append(pencilDigit);
        }
      }
    }
  }
}

// Locking inputed digits
function switchLocks(state) {
  if(selection == 1) {
    removeActive();
    selection = 0;
  }

  if(state) optionLock.classList.add('UIoptionEnabled');
  else optionLock.classList.remove('UIoptionEnabled');
  lock = state;

  for(let r = 0; r < 9; r++)
    for(let c = 0; c < 9; c++)
      if(sudoku[r][c].value) {
        sudoku[r][c].lock = state;
        sudoku[r][c].DOM.firstChild.classList.remove('unlocked');
      }
}

// Update keypad digits counters
function updateCounters() {
  for(let digit of document.querySelectorAll('.UIdigitCount')) {
    digit.innerText = 9 - totals[digit.parentElement.id];
  }
}

// End condition
function checkEnd() {
  let bingo = [];

  if(totals[0] == 81) {
    // Check rows
    for(let r = 0; r < 9; r++) {
      bingo = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      // For every cell in a row remove coresponding value from bingo array
      for(let c = 0; c < 9; c++) bingo = bingo.filter(v => v != sudoku[r][c].value);
      // If not every bingo value was removed exit
      if(bingo.length) return;
    }

    // Check columns
    for(let c = 0; c < 9; c++) {
      bingo = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      // For every cell in a column remove coresponding value from bingo array
      for(let r = 0; r < 9; r++) bingo = bingo.filter(v => v != sudoku[r][c].value);
      // If not every bingo value was removed exit
      if(bingo.length) return;
    }

    // Check nonets
    for(let nr = 0; nr < 3; nr++) for(let nc = 0; nc < 3; nc++) {
      bingo = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      // For every cell of a nonet remove corresponding value from bingo array
      for(let r = 0; r < 3; r++)
        for(let c = 0; c < 3; c++) bingo = bingo.filter(v => v != sudoku[nr * 3 + r][nc * 3 + c].value);
      // If not every bingo value was removed exit
      if(bingo.length) return;
    }

    // If all checks passed present end screen
    setTimeout(() => { end(); }, 200);
  }
}

function reload(total = false) {
  removeActive();
  active = null;
  currentDigit = null;
  currentHighlight = null;
  selection = 0;
  pencil = false;
  lock = false;
  history = [];
  totals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  for(let r = 0; r < 9; r++)
    for(let c = 0; c < 9; c++) {
      sudoku[r][c].value = null;
      sudoku[r][c].DOM.innerHTML = ""
      sudoku[r][c].lock = false;
    }

  optionLock.classList.remove('UIoptionEnabled');
  optionPencil.classList.remove('UIoptionEnabled');
  activeClick('option', addonsToggle);

  if(total) {
    for(let e of sudoku.DOM.querySelectorAll('td')) {
      e.className = 'cellBorder';
    }
    document.getElementsByClassName('restart')[0].remove();
    document.body.classList.remove('end');
    document.body.append(digits, options);
  }
}

// End screen
function end() {
  let restart = document.createElement('div');
  restart.className = 'restart';
  restart.innerText = '⟳';
  restart.onclick = () => reload(true);

  switchLocks(true);
  sudoku.DOM.ontransitionend = function () {
    // After sudoku board slide
    let id = 0;
    for(let e of sudoku.DOM.querySelectorAll('td')) {

      // If additional styles not defined add them
      if(addedStyles.length < 81) {
        addedStyles.push(document.createElement('style')) - 1;
        addedStyles[id].type = 'text/css';
        addedStyles[id].innerHTML = `.animDelay${id}::before { animation-delay: ${Math.random() * 7}s; } .animDelay${id}::after { animation-delay: ${Math.random() * 7}s; }`;
        document.head.append(addedStyles[id]);
      }
      e.classList.add(`animDelay${id}`, 'cellBorderAnim');
      e.classList.remove('cellBorder');
      id++;
    }
    document.body.append(restart);
    // After everyting + 10ms
    setTimeout(() => {
      restart.classList.add('end');
      sudoku.DOM.ontransitionend = "";
    }, 10);
  };
  // Before sudoku board slide
  digits.ontransitionend = function () {
    this.remove();
    this.ontransitionend = "";
  };
  options.ontransitionend = function () {
    this.remove();
    this.ontransitionend = "";
  };
  document.body.classList.add('end');
}