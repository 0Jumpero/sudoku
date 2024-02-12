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
let active = null;
let currentDigit = null;
let currentHighlight = null;
let selection = 0;
let pencil = false;
let lock = false;
let history = [];
let totals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];


// Sudoku Builder

let sudoku = [];
sudoku.DOM = document.createElement('div');
sudoku.DOM.className = 'sudoku';
for(let r = 0; r < 9; r++) {

  sudoku[r] = [];

  for(let c = 0; c < 9; c++) {
    sudoku[r][c] = {
      'DOM': document.createElement('div'),
      'value': null,
      'pencil': [],
      'class': 'cell',
      'lock': false,
      'r': r,
      'c': c
    }
    sudoku[r][c].DOM.className = 'cell';
    sudoku[r][c].DOM.onclick = () => { activeClick('cell', sudoku[r][c]) };
    sudoku.DOM.appendChild(sudoku[r][c].DOM);

    // Separator Vertical
    if(c != 2 && c != 5 && c != 8) {
      let separator = document.createElement('div');
      separator.className = 'sepV';
      sudoku.DOM.appendChild(separator);
    }
    // Line Verical
    if(c == 2 || c == 5) {
      let separator = document.createElement('div');
      separator.className = 'lineV';
      sudoku.DOM.appendChild(separator);
    }
  }

  // Separator Horizontal
  if(r != 2 && r != 5 && r != 8) {
    for(let i = 0; i < 9; i++) {
      // Line Spacer Horizontal
      if(i == 3 || i == 6) {
        let spacer = document.createElement('div');
        spacer.className = 'lineCV';
        sudoku.DOM.appendChild(spacer);
      }
      let separator = document.createElement('div');
      separator.className = 'sepH';
      sudoku.DOM.appendChild(separator);
      // Separator Spacer Horizontal
      if(i != 2 && i != 5 && i != 8) {
        let spacer = document.createElement('div');
        spacer.className = 'sepC';
        sudoku.DOM.appendChild(spacer);
      }

    }
  }
  // Line Horizontal
  if(r == 2 || r == 5) {
    for(let i = 0; i < 9; i++) {
      let separator = document.createElement('div');
      separator.className = 'lineH';
      sudoku.DOM.appendChild(separator);
      // Line Spacer HOrizontal
      if(i < 8) {
        let spacer = document.createElement('div');
        spacer.className = 'lineCH';
        sudoku.DOM.appendChild(spacer);
      }
      if(i == 2 || i == 5) {
        let spacer = document.createElement('div');
        spacer.className = 'lineCH';
        sudoku.DOM.appendChild(spacer);
      }
    }
  }

}
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

        // If cell is empty or has digit or has other pencil digits
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
        // add active anim
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

        // If cell is empty or has digit or has other pencil digits
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

      //if(currentHighlight) setHighlight(currentHighlight);
    }

    if(elem.id == 'lock') {
      if(lock) {
        switchLocks(false);
        elem.classList.remove('UIoptionEnabled');
      } else {
        switchLocks(true);
        elem.classList.add('UIoptionEnabled');
      }
      lock = !lock;
      history = [];
    }

    if(elem.id == 'restart') {
      if(lock) while(history.length) activeClick('option', { id: 'reverse' });
      else reload();
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

function switchLocks(state) {
  for(let r = 0; r < 9; r++)
    for(let c = 0; c < 9; c++)
      if(sudoku[r][c].value) {
        sudoku[r][c].lock = state;
        sudoku[r][c].DOM.firstChild.classList.remove('locked', 'unlocked');
      }
}

function updateCounters() {
  for(let digit of document.querySelectorAll('.UIdigitCount')) {
    digit.innerText = 9 - totals[digit.parentElement.id];
  }
}

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
    let restart = document.createElement('div');
    restart.className = 'restart';
    restart.innerText = '⟳';
    restart.onclick = () => reload(true);

    switchLocks(true);
    sudoku.DOM.ontransitionend = function () {
      // After sudoku board slide
      for(let e of sudoku.DOM.querySelectorAll('.sepV, .sepH')) {
        e.style.animationDelay = `${Math.random() * 7}s`;
        e.classList.add('end');
      }
      document.body.append(restart);
      // After everyting + 10ms
      setTimeout(() => {
        restart.classList.add('end');
        sudoku.DOM.ontransitionend = "";
      }, 10);
    };
    document.body.classList.add('end');
    digits.ontransitionend = function () {
      this.remove();
      this.ontransitionend = "";
    };
    digits.classList.add('end');
    options.ontransitionend = function () {
      this.remove();
      this.ontransitionend = "";
    };
    options.classList.add('end');
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


  if(total) {
    for(let e of sudoku.DOM.querySelectorAll('.sepV, .sepH')) {
      e.style.animationDelay = '';
      e.classList.remove('end');
    }

    document.getElementsByClassName('restart')[0].remove();
    document.body.classList.remove('end');
    digits.classList.remove('end');
    options.classList.remove('end');
    document.body.append(digits, options);
  }
}