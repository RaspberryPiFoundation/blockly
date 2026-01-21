/**
 * Colour Picker v2.0
 *
 * Copyright 2006 Neil Fraser
 * https://neil.fraser.name/software/colourpicker/
 * SPDX-License-Identifier: Apache-2.0
 */

// Include at the top of your page:
//   <script src="cp.js"></script>
//   <link rel="stylesheet" href="cp.css">
// Call with:
//   <input name="mycolour" id="mycolour" value="ff00ff">
//   <script>
//     cp_init('mycolour')
//   </script>

var cp_grid = [
  ['ffffff', 'ffcccc', 'ffcc99', 'ffff99', 'ffffcc', '99ff99', '99ffff', 'ccffff', 'ccccff', 'ffccff'],
  ['cccccc', 'ff6666', 'ff9966', 'ffff66', 'ffff33', '66ff99', '33ffff', '66ffff', '9999ff', 'ff99ff'],
  ['c0c0c0', 'ff0000', 'ff9900', 'ffcc66', 'ffff00', '33ff33', '66cccc', '33ccff', '6666cc', 'cc66cc'],
  ['999999', 'cc0000', 'ff6600', 'ffcc33', 'ffcc00', '33cc00', '00cccc', '3366ff', '6633ff', 'cc33cc'],
  ['666666', '990000', 'cc6600', 'cc9933', '999900', '009900', '339999', '3333ff', '6600cc', '993399'],
  ['333333', '660000', '993300', '996633', '666600', '006600', '336666', '000099', '333399', '663366'],
  ['000000', '330000', '663300', '663333', '333300', '003300', '003333', '000066', '330099', '330033'],
  ['']
];

var cp_popupDom = null;
var cp_activeSwatch = null;
var cp_closePid = null;

function cp_init(id) {
  var input = document.getElementById(id);
  if (!input) {
    throw Error('Colour picker can\'t find "' + id + '"');
  }
  if (!input.cp_swatch) {
    // Hide the input.
    input.type = 'hidden';
    // <img style="background-color: #ff0000; border: outset 3px #888;"
    // src="1x1.gif" height=20 width=30 class="cp_swatch">
    var swatch = document.createElement('span');
    swatch.className = 'cp_swatch';
    swatch.addEventListener('click', cp_open);
    swatch.addEventListener('mouseover', cp_cancelclose);
    swatch.addEventListener('mouseout', cp_closesoon);
    input.parentNode.insertBefore(swatch, input);
    // Cross-link the swatch and input.
    swatch.cp_input = input;
    input.cp_swatch = swatch;
  }
  cp_updateSwatch(input.cp_swatch);
}

function cp_updateSwatch(swatch) {
  var colour = swatch.cp_input.value;
  if (colour) {
    swatch.style.backgroundColor = '#' + colour;
    swatch.textContent = '\xa0';
  } else {
    swatch.style.backgroundColor = '#fff';
    swatch.innerHTML = 'X';
  }
}

function cp_open(e) {
  // Create a table of colours.
  if (cp_popupDom) {
    cp_close();
    return;
  }
  cp_activeSwatch = e.currentTarget;
  var currentColour = cp_activeSwatch.cp_input.value.toLowerCase();
  var element = cp_activeSwatch;
  var posX = 0;
  var posY = element.offsetHeight;
  while (element) {
    posX += element.offsetLeft;
    posY += element.offsetTop;
    element = element.offsetParent;
  }
  cp_popupDom = document.createElement('div');
  cp_popupDom.id = 'cp_popup';
  var table = document.createElement('table');
  table.addEventListener('mouseover', cp_cancelclose);
  table.addEventListener('mouseout', cp_closesoon);
  table.addEventListener('click', cp_onclick);
  var tbody = document.createElement('tbody');
  var row, cell, div;
  for (var y = 0; y < cp_grid.length; y++) {
    row = document.createElement('tr');
    tbody.appendChild(row);
    for (var x = 0; x < cp_grid[y].length; x++) {
      var colour = cp_grid[y][x];
      if (colour === undefined) continue;
      cell = document.createElement('td');
      row.appendChild(cell);
      div = document.createElement('div');
      cell.appendChild(div);
      cell.cp_colour = colour;
      if (colour) {
        div.style.backgroundColor = '#' + colour;
        div.innerHTML = '\xa0';
      } else {
        div.innerHTML = 'X';
      }
      if (currentColour === colour.toLowerCase()) {
        div.className = 'cp_current'
      }
    }
  }
  table.appendChild(tbody);
  cp_popupDom.appendChild(table);

  document.body.appendChild(cp_popupDom);
  // Don't widen the screen.
  var rightOverhang = (posX + cp_popupDom.offsetWidth) -
      (window.innerWidth + window.scrollX) + 15;  // Scrollbar is 15px.
  if (rightOverhang > 0) {
    posX -= rightOverhang;
  }
  // Flip to above swatch if no room below.
  if (posY + cp_popupDom.offsetHeight >= window.innerHeight + window.scrollY) {
    posY -= cp_popupDom.offsetHeight + cp_activeSwatch.offsetHeight;
    if (posY < window.scrollY) {
      posY = window.scrollY;
    }
  }
  cp_popupDom.style.left = posX + 'px';
  cp_popupDom.style.top = posY + 'px';
}

function cp_close() {
  // Close the table now.
  cp_cancelclose();
  if (cp_popupDom) {
    document.body.removeChild(cp_popupDom)
  }
  cp_popupDom = null;
  cp_activeSwatch = null;
}

function cp_closesoon() {
  // Close the table a split-second from now.
  cp_closePid = setTimeout(cp_close, 250);
}

function cp_cancelclose() {
  // Don't close the colour table after all.
  if (cp_closePid) {
    clearTimeout(cp_closePid);
  }
}

function cp_onclick(e) {
  // Clicked on a colour.
  var element = e.target;
  var colour;
  // Walk up the DOM, looking for a colour.
  while (element) {
    colour = element.cp_colour;
    if (colour !== undefined) {
      break;
    }
    element = element.parentNode;
  }
  if (colour !== undefined) {
    // Set the colour.
    cp_activeSwatch.cp_input.value = colour;
    cp_updateSwatch(cp_activeSwatch);
    // Fire a change event.
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('change', false, true);
    cp_activeSwatch.cp_input.dispatchEvent(evt);
  }
  // Close the table.
  cp_close();
}
