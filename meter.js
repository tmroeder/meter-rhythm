(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright 2015 Tom Roeder (tmroeder@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Driver = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _state_machine = require("./state_machine.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Driver = exports.Driver = function () {
  function Driver(maxLen, states, input, ui) {
    _classCallCheck(this, Driver);

    this.cur = "start";
    this.maxLen = maxLen;
    this.states = states;
    this.points = new _state_machine.Points(maxLen);

    input.registerMove(this.handleMove.bind(this));
    input.registerClick(this.handleClick.bind(this));

    this.ui = ui;
    this.ui.draw(this.points, this.cur, this.states);
  }

  _createClass(Driver, [{
    key: "handleMove",
    value: function handleMove(x, y) {
      var handler = this.states[this.cur].moveHandler;
      if (handler != null) {
        this.cur = handler(this.points, x);
        this.ui.draw(this.points, this.cur, this.states, x);
      }
    }
  }, {
    key: "handleClick",
    value: function handleClick(x, y) {
      var handler = this.states[this.cur].clickHandler;
      if (handler != null) {
        var skipPointCreation = this.states[this.cur].skipPointCreation;
        var skipPoint = skipPointCreation != null && skipPointCreation;
        this.cur = handler(this.points, x);
        if (!skipPoint) {
          this.points.pushPoint(x);
        }
        this.ui.draw(this.points, this.cur, this.states, x);
      }
    }
  }, {
    key: "reset",
    value: function reset() {
      this.cur = "start";
      this.points = new _state_machine.Points(this.maxLen);
      this.ui.draw(this.points, this.cur, this.states);
    }
  }]);

  return Driver;
}();

},{"./state_machine.js":5}],2:[function(require,module,exports){
// Copyright 2015 Tom Roeder (tmroeder@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

var _state_machine = require("./state_machine.js");

console.log("strict digraph Meter {");
console.log((0, _state_machine.writeGraph)(_state_machine.states));
console.log("}");

},{"./state_machine.js":5}],3:[function(require,module,exports){
// Copyright 2016 Tom Roeder (tmroeder@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

var driver = require("./driver.js");
var state_machine = require("./state_machine.js");
var raphael_ui = require("./raphael_ui.js");

// Set up the window.onload to run the UI in divs with the IDs "canvas",
// "messages", and "comments". This code will be bundled up as a single
// JavaScript closure, using Browserify.
//
// TODO(tmroeder): This code must not use ES6 features, or must not be compiled
// by Babel, since that seems to interfere with the way Browserify handles
// "require" statements.
window.onload = function () {
  var canvas = document.getElementById("canvas");

  // This line requires raphael.min.js to have been loaded before this script in
  // a way that leaves Raphael in scope in the Browserified closure.
  var paper = Raphael(canvas, "100%", 70);

  var messageDiv = document.getElementById("messages");
  var commentDiv = document.getElementById("comments");

  var domInput = new raphael_ui.DomInput(canvas);
  var raphaelDraw = new raphael_ui.RaphaelDraw(paper, 200, commentDiv, messageDiv);

  // Wire up the input to the output through the Driver.
  new driver.Driver(100, state_machine.states, domInput, raphaelDraw);
};

},{"./driver.js":1,"./raphael_ui.js":4,"./state_machine.js":5}],4:[function(require,module,exports){
// Copyright 2016 Tom Roeder (tmroeder@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RaphaelDraw = exports.DomInput = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ui = require("./ui.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// This class registers for mouse move and click input from the DOM |element|.

var DomInput = exports.DomInput = function (_Input) {
  _inherits(DomInput, _Input);

  function DomInput(element) {
    _classCallCheck(this, DomInput);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(DomInput).call(this));

    _this.element = element;
    _this.moveRegistry = [];
    _this.clickRegistry = [];

    element.addEventListener("click", function (ev) {
      var box = _this.element.getBoundingClientRect();
      var x = ev.clientX - box.left;
      var y = ev.clientY - box.top;
      for (var i = 0; i < _this.clickRegistry.length; i++) {
        _this.clickRegistry[i](x, y);
      }
    });

    element.addEventListener("mousemove", function (ev) {
      var box = _this.element.getBoundingClientRect();
      var x = ev.clientX - box.left;
      var y = ev.clientY - box.top;
      for (var i = 0; i < _this.moveRegistry.length; i++) {
        _this.moveRegistry[i](x, y);
      }
    });
    return _this;
  }

  _createClass(DomInput, [{
    key: "registerMove",
    value: function registerMove(fn) {
      if (typeof fn !== "function") return;
      this.moveRegistry.push(fn);
    }
  }, {
    key: "registerClick",
    value: function registerClick(fn) {
      if (typeof fn !== "function") return;
      this.clickRegistry.push(fn);
    }
  }]);

  return DomInput;
}(_ui.Input);

function isDuration(obj) {
  return obj.hasOwnProperty(_ui.DrawConstants.start);
}

// This class draws the current state of events to the Raphael-managed |paper|.

var RaphaelDraw = exports.RaphaelDraw = function (_Draw) {
  _inherits(RaphaelDraw, _Draw);

  function RaphaelDraw(paper, shortSoundLen, commentDiv, messageDiv) {
    var _this2$elementHeight;

    _classCallCheck(this, RaphaelDraw);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(RaphaelDraw).call(this, shortSoundLen, {}));

    var textHeight = 15;
    _this2.elementHeight = (_this2$elementHeight = {
      lines: 55
    }, _defineProperty(_this2$elementHeight, _ui.DrawConstants.proj, 55), _defineProperty(_this2$elementHeight, _ui.DrawConstants.weak, 55), _defineProperty(_this2$elementHeight, _ui.DrawConstants.exp, 55), _defineProperty(_this2$elementHeight, "hiatus", textHeight), _defineProperty(_this2$elementHeight, "accel", textHeight), _defineProperty(_this2$elementHeight, "decel", textHeight), _defineProperty(_this2$elementHeight, "parens", textHeight), _defineProperty(_this2$elementHeight, "accent", textHeight), _this2$elementHeight);
    _this2.paper = paper;
    paper.rect(0, 0, paper.width, paper.height).attr({
      stroke: "black",
      fill: "white",
      "fill-opacity": 0
    });

    _this2.gapWidth = 10;

    // Use a State object to store graphics objects.
    _this2.drawState = new _ui.State({});

    // Where to write comments and messages.
    _this2.drawState.text[_ui.DrawConstants.comment] = commentDiv;
    _this2.drawState.text[_ui.DrawConstants.message] = messageDiv;

    var lineColor = "crimson";
    var projColor = "green";
    var expColor = "darkorchid";
    var weakColor = "deepskyblue";

    // Three lines, one for each sound.
    _this2.drawState.lines[_ui.DrawConstants.first] = paper.path("M0,0").attr({ stroke: lineColor }).hide();
    _this2.drawState.lines[_ui.DrawConstants.second] = paper.path("M0,0").attr({ stroke: lineColor }).hide();
    _this2.drawState.lines[_ui.DrawConstants.third] = paper.path("M0,0").attr({ stroke: lineColor }).hide();

    // A projection and an expected projection for the first sound.
    _this2.drawState.projs[_ui.DrawConstants.first] = {};
    _this2.drawState.projs[_ui.DrawConstants.first][_ui.DrawConstants.proj] = paper.path("M0,0").attr({ stroke: projColor }).hide();
    _this2.drawState.projs[_ui.DrawConstants.first][_ui.DrawConstants.exp] = paper.path("M0,0").attr({ stroke: expColor }).hide();

    // A projection and a weak projection for the second sound.
    _this2.drawState.projs[_ui.DrawConstants.second] = {};
    _this2.drawState.projs[_ui.DrawConstants.second][_ui.DrawConstants.proj] = paper.path("M0,0").attr({ stroke: projColor }).hide();
    _this2.drawState.projs[_ui.DrawConstants.second][_ui.DrawConstants.weak] = paper.path("M0,0").attr({ stroke: weakColor }).hide();

    // A projection and an expected projection for the third sound.
    _this2.drawState.projs[_ui.DrawConstants.third] = {};
    _this2.drawState.projs[_ui.DrawConstants.third][_ui.DrawConstants.proj] = paper.path("M0,0").attr({ stroke: projColor }).hide();
    _this2.drawState.projs[_ui.DrawConstants.third][_ui.DrawConstants.exp] = paper.path("M0,0").attr({ stroke: expColor }).hide();

    // Hiatus, accel, decel, parens, and accent marks.
    _this2.hiatus = paper.text(0, 0, "||").hide();
    _this2.accel = paper.text(0, 0, "accel").hide();
    _this2.decel = paper.text(0, 0, "decel").hide();

    // TODO(tmroeder): Wrap the actual line in parens instead.
    _this2.parens = paper.text(0, 0, "()").hide();
    _this2.accent = paper.text(0, 0, ">").hide();

    // TODO(tmroeder): This (and other numbers here) are not good responsive
    // design. This code needs to register for events that change the size of
    // the window and adapt the lengths accordingly.
    //
    // Draw a legend for the colors.
    var canvasWidth = document.getElementById("canvas").clientWidth;
    var legendEltHeight = 10;
    var legendEltWidth = 100;
    var x = canvasWidth - legendEltWidth;
    var y = legendEltHeight + 10;
    var barWidth = 20;
    var textStart = 25;

    // TODO(tmroeder): refactor this into a loop over an array of name/color
    // pairs.
    paper.path("M" + x + "," + y + " L" + (x + barWidth) + "," + y).attr({ stroke: lineColor }).show();
    paper.text(x + textStart, y, "sound").attr({ "text-anchor": "start" });

    y = y + legendEltHeight;
    paper.path("M" + x + "," + y + " L" + (x + barWidth) + "," + y).attr({ stroke: projColor }).show();
    paper.text(x + textStart, y, "projection").attr({ "text-anchor": "start" });

    y = y + legendEltHeight;
    paper.path("M" + x + "," + y + " L" + (x + barWidth) + "," + y).attr({ stroke: expColor }).show();
    paper.text(x + textStart, y, "expectation").attr({ "text-anchor": "start" });

    y = y + legendEltHeight;
    paper.path("M" + x + "," + y + " L" + (x + barWidth) + "," + y).attr({ stroke: weakColor }).show();
    paper.text(x + textStart, y, "weak projection").attr({ "text-anchor": "start" });
    return _this2;
  }

  _createClass(RaphaelDraw, [{
    key: "composeLine",
    value: function composeLine(key, value) {
      var start = value[_ui.DrawConstants.start];
      var end = value[_ui.DrawConstants.end] - this.gapWidth;
      var height = this.elementHeight[key];
      return "M" + start + "," + height + " L" + end + "," + height;
    }
  }, {
    key: "composeArc",
    value: function composeArc(key, value) {
      var start = value[_ui.DrawConstants.start];
      var end = value[_ui.DrawConstants.end] - this.gapWidth;
      var height = this.elementHeight[key];
      return "M" + start + "," + height + " A25,25 0 0,1 " + end + "," + height;
    }
  }, {
    key: "hideObjects",
    value: function hideObjects(element) {
      if (element.hasOwnProperty("hide") && typeof element.hide === "function") {
        element.hide();
        return;
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(element)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var child = _step.value;

          if ((typeof child === "undefined" ? "undefined" : _typeof(child)) === "object") {
            this.hideObjects(child);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: "draw",
    value: function draw(points, state, states, cur) {
      _get(Object.getPrototypeOf(RaphaelDraw.prototype), "draw", this).call(this, points, state, states, cur);
      var drawKeys = Object.keys(this.drawState);
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = drawKeys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var drawKey = _step2.value;

          var drawValue = this.drawState[drawKey];
          if (!this.state.hasOwnProperty(drawKey)) {
            this.hideObjects(drawValue);
            continue;
          }

          var stateValue = this.state[drawKey];
          if (typeof stateValue === "string") {
            drawValue.innerHTML = stateValue;
            continue;
          }

          if ((typeof stateValue === "undefined" ? "undefined" : _typeof(stateValue)) !== "object") {
            continue;
          }

          if (stateValue.hasOwnProperty(_ui.DrawConstants.start)) {
            // E.g., drawKey might be "lines".
            drawValue.attr("path", this.composeLine(drawKey, stateValue)).show();
            continue;
          }

          // At this point, the state object is an object, and it doesn't have a key
          // DrawConstants.start. So, we iterate over its inner structure to try to
          // find more lines to draw.
          var innerDrawKeys = Object.keys(drawValue);
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = innerDrawKeys[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var innerDrawKey = _step3.value;

              if (!stateValue.hasOwnProperty(innerDrawKey)) {
                this.hideObjects(drawValue[innerDrawKey]);
                continue;
              }

              var innerStateValue = stateValue[innerDrawKey];
              var innerDrawValue = drawValue[innerDrawKey];
              if (typeof innerStateValue === "string") {
                innerDrawValue.innerHTML = innerStateValue;
                continue;
              }

              // Handle the special case of projections, with multiple types.
              if (drawKey === "projs") {
                var innerProjDrawKeys = Object.keys(innerDrawValue);
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                  for (var _iterator4 = innerProjDrawKeys[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var innerProjDrawKey = _step4.value;

                    var innerProjDrawValue = innerDrawValue[innerProjDrawKey];
                    if (!innerStateValue.hasOwnProperty(innerProjDrawKey)) {
                      this.hideObjects(innerProjDrawValue);
                      continue;
                    }

                    var innerProjStateValue = innerStateValue[innerProjDrawKey];
                    if ((typeof innerProjStateValue === "undefined" ? "undefined" : _typeof(innerProjStateValue)) !== "object" || !innerProjStateValue.hasOwnProperty(_ui.DrawConstants.start)) {
                      this.hideObjects(innerProjDrawValue);
                      continue;
                    }

                    if (!innerProjStateValue.hasOwnProperty(_ui.DrawConstants.start)) {
                      continue;
                    }

                    innerProjDrawValue.attr("path", this.composeArc(innerProjDrawKey, innerProjStateValue)).show();
                  }
                } catch (err) {
                  _didIteratorError4 = true;
                  _iteratorError4 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                      _iterator4.return();
                    }
                  } finally {
                    if (_didIteratorError4) {
                      throw _iteratorError4;
                    }
                  }
                }

                continue;
              }

              if (!innerStateValue.hasOwnProperty(_ui.DrawConstants.start)) {
                continue;
              }

              innerDrawValue.attr("path", this.composeLine(drawKey, innerStateValue)).show();
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }]);

  return RaphaelDraw;
}(_ui.Draw);

},{"./ui.js":6}],5:[function(require,module,exports){
// Copyright 2015 Tom Roeder (tmroeder@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

// The states object holds the state machine for the simulation. It consists of
// a set of named states (like "start"), each with a comment and a message. The
// comment provides an interpretation of the current state, and the message
// suggests actions to take in the current state.
// TODO(tmroeder): Add the comments back from the CoffeeScript version.

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.writeGraph = writeGraph;
exports.visit = visit;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var states = exports.states = {
  // The starting state of the program.
  start: {
    comment: "This demonstrates the concepts in Chapter 7 of Christopher " + "Hasty's 'Meter as Rhythm'. Imagine time 0 as an instant that " + "is a potential beginning of a sound, yet prior to and " + "independent of it.",
    message: "You may perform graphically up to three successive sounds by " + "clicking and moving. The first click sets the beginning of the sound " + "at time 0. Click but don't move.",
    transitions: {
      sound1Starts: true
    },
    clickHandler: function clickHandler() {
      return "sound1Starts";
    }
  },

  //
  // Sound 1
  //

  // The beginning of the first sound.
  sound1Starts: {
    comment: "The first sound begins, but time 0 will not be a beginning " + "until it is past.",
    message: "Perform the first sound by moving to the right.",
    transitions: {
      sound1Continues: true
    },
    moveHandler: function moveHandler() {
      return "sound1Continues";
    }
  },

  // The first sound continues and isn't too long.
  sound1Continues: {
    comment: "The first sound is becoming. Time 0 becomes its beginning. " + "'Projective potential'--the potential of a duration to be " + "reproduced by a successive duration--accumulates, as indicated " + "by the solid arc.",
    message: "End the first sound by clicking.",
    transitions: {
      sound1Continues: true,
      sound1ContinuesTooLong: true,
      sound1Ends: true
    },
    moveHandler: function moveHandler(points, x) {
      var startPoint = points.points[PointConstants.sound1First];
      if (startPoint < x && !points.isDeterminate(startPoint, x)) {
        return "sound1ContinuesTooLong";
      }
      return "sound1Continues";
    },
    clickHandler: function clickHandler() {
      return "sound1Ends";
    }
  },

  // The first sound is too long.
  sound1ContinuesTooLong: {
    comment: "The first sound's duration is so long that it is 'mensurally " + "indeterminate'--it has lost its projective potential to be " + "reproduced.",
    message: "To make the first sound's duration determinate, move back to " + "the left. Or click to end the sound.",
    transitions: {
      sound1Continues: true,
      sound1ContinuesTooLong: true,
      sound1EndsTooLong: true
    },
    moveHandler: function moveHandler(points, x) {
      if (!points.isDeterminate(points.points[PointConstants.sound1First], x)) {
        return "sound1ContinuesTooLong";
      }
      return "sound1Continues";
    },
    clickHandler: function clickHandler() {
      return "sound1EndsTooLong";
    }
  },

  // The first sound ends with a length that isn't too long.
  sound1Ends: {
    comment: "The first sound ends. Its duration is 'mensurally determinate' " + "because it has the potential for being precisely reproduced.",
    message: "To begin the second sound, click.",
    transitions: {
      pause1: true,
      pause1Negative: true
    },
    moveHandler: function moveHandler(points, x) {
      if (x < points.points[PointConstants.sound1Second]) {
        return "pause1Negative";
      }
      return "pause1";
    }
  },

  // The first sound ends with a length that exceeds kMaxSoundLen.
  sound1EndsTooLong: {
    comment: "The first sound ends; it is too long to have projective " + "potential.",
    message: "Reload to try again.",
    transitions: {
      start: true
    }
  },

  //
  // Pause 1
  //

  // There is a pause between the first and second sounds.
  pause1: {
    comment: "There is a pause between the first two sounds. Its duration is " + "relatively indeterminate, if our attention is focused on the " + "beginning of sounds. The growing line indicates that the " + "duration of the first sound *plus* the following silence " + "itself has the 'projective potential' to be reproduced.",
    message: "Click to begin the second sound.",
    transitions: {
      pause1: true,
      pause1Negative: true,
      sound2Starts: true,
      sound2StartsTooLong: true
    },
    moveHandler: function moveHandler(points, x) {
      if (points.points[PointConstants.sound1Second] > x) {
        return "pause1Negative";
      }
      return "pause1";
    },
    clickHandler: function clickHandler(points, x) {
      if (!points.isDeterminate(points.points[PointConstants.sound1First], x)) {
        return "sound2StartsTooLong";
      }
      return "sound2Starts";
    }
  },

  // The pause between sounds can't be negative.
  pause1Negative: {
    comment: "",
    message: "Click at the end of the first sound or later.",
    transitions: {
      pause1: true,
      pause1Negative: true
    },
    moveHandler: function moveHandler(points, x) {
      if (x < points.points[PointConstants.sound1Second]) {
        return "pause1Negative";
      }
      return "pause1";
    }
  },

  //
  // Sound 2
  //

  // The beginning of the second sound.
  sound2Starts: {
    comment: "This beginning of the second sound 'realizes' the projective " + "potential of the duration begun by the first event's attack. " + "The new line represents this projective potential. The " + "event now beginning has the potential to reproduce this past " + "duration. The new projection, extending for this duration into the " + "future, symbolizes this 'projected potential'.",
    message: "Perform the second sound by moving to the right.",
    transitions: {
      sound2Continues: true
    },
    moveHandler: function moveHandler(points, x) {
      var start = points.points[PointConstants.sound2First];
      if (points.isWeakDeterminate(start, x)) {
        return "sound2ContinuesWithoutProjection";
      } else if (points.isDeterminate(start, x)) {
        return "sound2Continues";
      }
      return "sound2ContinuesTooLong";
    }
  },

  // the beginning of the second sound after too long a duration since the first
  // sound started.
  sound2StartsTooLong: {
    comment: "The second sound begins. It is so long since the beginning of " + "the first event that the interonset duration is mensurally " + "indeterminate--it has no potential to be reproduced--so there " + "is no projection.",
    message: "Reload to try again.",
    transitions: {
      pause1: true,
      start: true
    }
  },

  // the second sound continues and is not too long.
  sound2Continues: {
    comment: "The accumulating duration of the second sound is realizing the " + "expected projected potential of the first interonset duration. " + "Simultaneously the present event accumulates its own projective " + "potential (represented by the growing projection) to be reproduced by " + "a successive, third event.",
    message: "Click to end the second sound.",
    transitions: {
      sound2Continues: true,
      sound2ContinuesNegative: true,
      sound2ContinuesWithoutProjection: true,
      sound2Ends: true
    },
    moveHandler: function moveHandler(points, x) {
      var start = points.points[PointConstants.sound2First];
      if (start > x) {
        return "sound2ContinuesNegative";
      } else if (points.isWeakDeterminate(start, x)) {
        return "sound2ContinuesWithoutProjection";
      } else if (points.isDeterminate(start, x)) {
        return "sound2Continues";
      }
      return "sound2ContinuesTooLong";
    },
    clickHandler: function clickHandler() {
      return "sound2Ends";
    }
  },

  // The second sound has a negative duration.
  sound2ContinuesNegative: {
    comment: "",
    message: "Move to the right to perform the second sound.",
    transitions: {
      sound2ContinuesNegative: true,
      sound2Continues: true
    },
    moveHandler: function moveHandler(points, x) {
      var start = points.points[PointConstants.sound2First];
      if (start <= x) {
        return "sound2Continues";
      }
      return "sound2ContinuesNegative";
    }
  },

  // The second sound continues too long to realize its projection.
  sound2ContinuesWithoutProjection: {
    comment: "The second sound exceeds the duration projected at its onset; " + "the projection is not clearly realized, as indicated by the change in " + "the projection.",
    message: "Move to the left to shorten the second sound, or " + "click to end it.",
    transitions: {
      sound2Continues: true,
      sound2ContinuesWithoutProjection: true,
      sound2ContinuesTooLong: true,
      sound2EndsWithoutProjection: true
    },
    moveHandler: function moveHandler(points, x) {
      var start = points.points[PointConstants.sound2First];
      if (points.isWeakDeterminate(start, x)) {
        return "sound2ContinuesWithoutProjection";
      } else if (points.isDeterminate(start, x)) {
        return "sound2Continues";
      }
      return "sound2ContinuesTooLong";
    },
    clickHandler: function clickHandler() {
      return "sound2EndsWithoutProjection";
    }
  },

  // the second sound continues too long to be mensurally determinate.
  sound2ContinuesTooLong: {
    comment: "The second sound is so long that it is mensurally " + "indeterminate. (The projection of the first interonset " + "duration is not realized.)",
    message: "Move to the left to shorten the second sound, or " + "click to end it.",
    transitions: {
      sound2ContinuesWithoutProjection: true,
      sound2ContinuesTooLong: true,
      sound2EndsTooLong: true
    },
    moveHandler: function moveHandler(points, x) {
      var start = points.points[PointConstants.sound2First];
      if (points.isWeakDeterminate(start, x)) {
        return "sound2ContinuesWithoutProjection";
      } else if (points.isDeterminate(start, x)) {
        return "sound2Continues";
      }
      return "sound2ContinuesTooLong";
    },
    clickHandler: function clickHandler() {
      return "sound2EndsTooLong";
    }
  },

  // The second sound ends, realizing its projection.
  sound2Ends: {
    comment: "The second sound ends. Its duration is 'mensurally " + "determinate' because it has the potential for being precisely " + "reproduced. But it does not affect the projection of the first " + "interonset duration, as shown.",
    message: "Click to begin the third sound.",
    transitions: {
      pause2: true,
      pause2Negative: true
    },
    moveHandler: function moveHandler(points, x) {
      var start = points.points[PointConstants.sound2Second];
      if (x < start) {
        return "pause2Negative";
      }
      return "pause2";
    }
  },

  // The second sound ends without realizing its projection.
  sound2EndsWithoutProjection: {
    comment: "The second sound exceeds the duration projected at its onset.  " + "The projection is not clearly realized, as indicated by the changed " + "projection.",
    message: "Reload to try again.",
    transitions: {
      start: true
    }
  },

  // The second sound ends but is too long.
  sound2EndsTooLong: {
    comment: "The second sound is so long that it is mensurally " + "indeterminate.  Since the projected potential of the first " + "interonset duration is denied there is no projection at all.",
    message: "Reload to try again.",
    transitions: {
      start: true
    }
  },

  //
  // Pause 2
  //

  // The second pause begins.
  pause2: {
    comment: "The silence between the second and third sounds is relatively " + "indeterminate if our attention is focused on the sounds' " + "beginnings. The growing projection indicates that the duration from " + "the beginning of the second sound up to now, including the " + "silence, has 'projective potential' to be reproduced.",
    message: "Click to begin the third sound.",
    transitions: {
      pause2: true,
      pause2Negative: true,
      pause2TooLong: true,
      sound3StartsAccel: true,
      sound3StartsRealized: true,
      sound3StartsExactly: true,
      sound3StartsSlightlyLate: true,
      sound3StartsSlightlyLateNewProjection: true
    },
    moveHandler: function moveHandler(points, x) {
      var start = points.points[PointConstants.sound2Second];
      if (x < start) {
        return "pause2Negative";
      }
      if (!points.isDeterminate(start, x)) {
        return "pause2TooLong";
      }
      return "pause2";
    },
    clickHandler: function clickHandler(points, x) {
      var first = points.points[PointConstants.sound2First];
      var second = points.points[PointConstants.sound2Second];
      if (points.isAccel(first, second, x)) {
        return "sound3StartsAccel";
      }
      if (points.isExact(first, x)) {
        return "sound3StartsExactly";
      }
      if (points.isRealized(first, x)) {
        return "sound3StartsRealized";
      }
      if (points.isSlightlyLate(first, x)) {
        return "sound3StartsSlightlyLate";
      }
      if (points.isSlightlyLateNewProjection(first, x)) {
        return "sound3StartsSlightlyLateNewProjection";
      }

      // This should not be possible to reach, but if it somehow is reached,
      // then ignore the click and stay in pause2.
      return "pause2";
    }
  },

  // The second pause is negative
  pause2Negative: {
    comment: "",
    message: "Click at the end of the second sound or later.",
    transitions: {
      pause2: true,
      pause2Negative: true
    },
    moveHandler: function moveHandler(points, x) {
      if (x < points.points[PointConstants.sound2Second]) {
        return "pause2Negative";
      }
      return "pause2";
    }
  },

  // The pause has lasted too long to be mensurally determinate.
  pause2TooLong: {
    comment: "The time since the beginning of the second sound is mensurally " + "indeterminate, having no projective potential to be reproduced.",
    message: "Click to begin the third sound (earlier if you want a " + "projection).",
    transitions: {
      pause2: true,
      pause2TooLong: true,
      sound3StartsTooLate: true
    },
    moveHandler: function moveHandler(points, x) {
      if (!points.isDeterminate(points.points[PointConstants.sound2Second], x)) {
        return "pause2TooLong";
      }
      return "pause2";
    },
    clickHandler: function clickHandler() {
      return "sound3StartsTooLate";
    }
  },

  //
  // Sound 3
  //

  // The third sound starts earlier than expected.
  sound3StartsAccel: {
    comment: "The beginning of the third sound is earlier than projected. " + "The second interonset duration is shorter than, but at least " + "three-fourths of the first interonset duration. We feel an " + "*acceleration* because we sense the realization of the first " + "projected duration even as we also perceive the difference " + "between the two durations.",
    message: "Reload to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  },

  sound3StartsExactly: {
    comment: "Since the third sound begins exactly at the end of the " + "projected duration (the upper dashed arc), the projected " + "duration is 'realized'. A new projection is created, " + "conditioned by the first, in which the second interonset " + "duration has the projective potential (the lower arrow) to be " + "reproduced.",
    message: "Reload to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts too late to be mensurally determinate.
  sound3StartsTooLate: {
    comment: "The projective potential of the first interonset duration (the " + "dashed arc) is realized, but the projective potential of the " + "second interonset duration is not, since it is mensurally " + "indeterminate. Because the third sound begins much later than " + "projected, we may come to feel 'hiatus' (symbolized by the " + "double bar)--a break between the realization of projected " + "potential and a new beginning. A new and relatively " + "unconditioned potential emerges from the beginning of the " + "third sound.",
    message: "Reload to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts, realizing the first projection and suggesting a
  // new projection.
  sound3StartsRealized: {
    comment: "The projection of the first interonset duration is realized. " + "As show, another projection can be completed within the promised " + "duration, so may enhance its mensural determinacy. The emergence of " + "a new beginning, shown in parentheses, would clarify this.",
    message: "Click anywhere to see an alternate interpretation.",
    transitions: {
      sound3StartsAltInterpretation: true
    },
    skipPointCreation: true,
    clickHandler: function clickHandler() {
      return "sound3StartsAltInterpretation";
    }
  },

  sound3StartsAltInterpretation: {
    comment: "In this interpretation, the accent symbolizes an unequivocal " + "second beginning that denies the projection of the first " + "interonset duration in order to realize a larger projective " + "potential.",
    message: "Reload to try again",
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts later than expected.
  sound3StartsSlightlyLate: {
    comment: "The beginning of the third sound is slightly later than " + "projected. We hear a *deceleration* because we sense the " + "realization of the first projected duration even as we also " + "perceive the difference between the two durations.",
    message: "Reload to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts slightly late and suggests a new projection.
  sound3StartsSlightlyLateNewProjection: {
    comment: "The third sound begins somewhat later than projected. A new " + "projection, indicated by the lowest arrow and dashed arc, " + "emerges, breaking off from the emerging first projection. We " + "reject the relevance of the first projection to the mensural " + "determinacy of the second interonset duration.",
    message: "Reload to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  }
};

// writeGraph outputs a GraphViz diagram to check the state machine.
// Generate the graph with the test/graph script. The output of this function
// must be wrapped in a graph statement like `strict digraph Meter{` (and with
// a closing bracket at the end).
function writeGraph(states) {
  var graph = "";
  for (var name in states) {
    for (var dest in states[name].transitions) {
      if (graph !== "") {
        graph += "\n";
      }
      graph += "  " + name + " -> " + dest;
    }
  }
  return graph;
};

// visitHelper keeps track of visited states as it traverses a graph.
function visitHelper(states, state, visited, fn) {
  if (visited[state]) {
    return;
  }
  visited[state] = true;
  if (typeof fn === "function") {
    fn(state);
  }
  var results = [];
  for (var neighbor in states[state].transitions) {
    results.push(visitHelper(states, neighbor, visited, fn));
  }
  return results;
};

function visit(states, fn) {
  var visited = {};
  for (var name in states) {
    visited[name] = false;
  }
  visitHelper(states, "start", visited, fn);
  return visited;
};

// PointError is thrown for error cases that happen in methods of the Points
// class.

var PointError = exports.PointError = function (_Error) {
  _inherits(PointError, _Error);

  function PointError(message) {
    _classCallCheck(this, PointError);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(PointError).call(this, message));

    _this.message = message;
    _this.name = "PointError";
    return _this;
  }

  _createClass(PointError, [{
    key: "toString",
    value: function toString() {
      return this.message;
    }
  }]);

  return PointError;
}(Error);

// These constants name positions in the point array, give identifiers for
// different kinds of projections, and give bounds on different types of
// realization of projections.


var PointConstants = exports.PointConstants = {
  sound1First: 0,
  sound1Second: 1,
  sound2First: 2,
  sound2Second: 3,
  sound3First: 4,
  sound3Second: 5,
  maxPointCount: 6,
  projectionOn: "Projection On",
  projectionOff: "Projection Off",
  projectionCurrent: "Projection Current",
  projectionWeak: "Projection Weak",
  projectionEarly: 1.75,
  projectionExact: 2,
  projectionSlightlyLate: 2.5
};

// Points keeps track of the current point positions and the properties of these
// positions with respect to each other and with respect to determinacy.

var Points = exports.Points = function () {
  function Points(maxDeterminateLen) {
    _classCallCheck(this, Points);

    this.maxDeterminateLen = maxDeterminateLen;

    for (var _len = arguments.length, points = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      points[_key - 1] = arguments[_key];
    }

    if (points.length > PointConstants.maxPointCount) {
      throw new PointError("too many points");
    }
    this.points = points;
    if (points.length > 0) {
      this.points[0] = 0;
    }
  }

  // pushPoint puts a new point at the end of the points.


  _createClass(Points, [{
    key: "pushPoint",
    value: function pushPoint(pos) {
      if (this.points.length >= PointConstants.maxPointCount) {
        throw new PointError("all points already defined");
      }
      if (this.points.length === 0) {
        pos = 0;
      }
      return this.points.push(pos);
    }

    // popPoint removes and returns the last point in the array, if any.

  }, {
    key: "popPoint",
    value: function popPoint() {
      if (this.points.length === 0) {
        throw new PointError("no points to remove");
      }
      return this.points.pop();
    }

    // isDeterminate checks to make sure that the difference between the first and
    // second points is less than the amount needed to be mensurally determinate.

  }, {
    key: "isDeterminate",
    value: function isDeterminate(first, second) {
      return first < second && second - first <= this.maxDeterminateLen;
    }

    // isWeakDeterminate is like isDeterminate, but it fails if second <= 2 *
    // first. In other words, it's the upper range of mensural determinacy.

  }, {
    key: "isWeakDeterminate",
    value: function isWeakDeterminate(first, second) {
      return this.isDeterminate(first, second) && second > 2 * first;
    }

    // isAccel checks to see if the third onset is earlier than projected.

  }, {
    key: "isAccel",
    value: function isAccel(first, second, end) {
      return this.isDeterminate(first, end) && end > second && end < 1.75 * first;
    }

    // TODO(tmroeder): there's some confusion in the original source about the
    // details of these possibilities. Check them and correct them.
    // isRealized checks to see if the third onset is close to the projected
    // duration.

  }, {
    key: "isRealized",
    value: function isRealized(start, end) {
      return this.isDeterminate(start, end) && end > 1.75 * start && end < 2 * start;
    }

    // isExact checks to see if the third onset is exactly as projected.

  }, {
    key: "isExact",
    value: function isExact(start, end) {
      return this.isDeterminate(start, end) && end === 2 * start;
    }

    // isSlightlyLate checks to see if a determinate start and end has its end
    // point within (2 * start, 2.5 * start).

  }, {
    key: "isSlightlyLate",
    value: function isSlightlyLate(start, end) {
      return this.isDeterminate(start, end) && end > 2 * start && end < 2.5 * start;
    }

    // isSlightlyLateNewProjection checks to see if a determinate start and end
    // has its end greater than 2.5 * start.

  }, {
    key: "isSlightlyLateNewProjection",
    value: function isSlightlyLateNewProjection(start, end) {
      return this.isDeterminate(start, end) && end >= 2.5 * start;
    }

    // isTooLate checks to see if the third onset occurs in a mensurally
    // indeterminate position after the second sound.

  }, {
    key: "isTooLate",
    value: function isTooLate(start, end) {
      return !this.isDeterminate(start, end);
    }

    // Whether or not this set of points is in the first sound.

  }, {
    key: "inFirstSound",
    value: function inFirstSound() {
      return this.points.length === 1;
    }

    // Whether or not this set of points is in the second sound.

  }, {
    key: "inSecondSound",
    value: function inSecondSound() {
      return this.points.length === 3;
    }

    // firstProjection describes the projective potential of the first inter-onset
    // duration.

  }, {
    key: "firstProjection",
    value: function firstProjection(cur) {
      var pointCount = this.points.length;
      if (pointCount === 0) {
        return PointConstants.projectionOff;
      }

      var first = this.points[PointConstants.sound1First];
      var determinate = this.isDeterminate(first, cur);
      if (pointCount === 1 || pointCount === 2) {
        if (!determinate) {
          return PointConstants.projectionOff;
        }
        return PointConstants.projectionCurrent;
      }

      if (pointCount > 2) {
        var third = this.points[PointConstants.sound2First];
        if (this.isDeterminate(first, third)) {
          return PointConstants.projectionOn;
        }
      }
      return PointConstants.projectionOff;
    }

    // secondProjection describes the current projective potential of the second
    // sound.

  }, {
    key: "secondProjection",
    value: function secondProjection(cur) {
      var pointCount = this.points.length;
      if (pointCount < 3 || pointCount > 4) {
        return PointConstants.projectionOff;
      }

      var first = this.points[PointConstants.sound2First];
      if (pointCount === 3) {
        // Weak projection occurs if cur is the right amount beyond the first
        // sound.
        if (this.isWeakDeterminate(first, cur)) {
          return PointConstants.projectionWeak;
        }
        if (this.isDeterminate(first, cur)) {
          return PointConstants.projectionOn;
        }
        return PointConstants.projectionOff;
      }

      // Projection occurs if there's no current point or it's between the first
      // and second points.
      var second = this.points[PointConstants.sound2Second];
      if (!this.isDeterminate(first, second)) {
        return PointConstants.projectionOff;
      }
      if (cur == null || cur < second) {
        return PointConstants.projectionOn;
      }

      // Projection also occurs if cur is a mensurally determinate distance past
      // the first sound.
      if (this.isDeterminate(first, cur)) {
        return PointConstants.projectionOn;
      }
      return PointConstants.projectionOff;
    }
  }]);

  return Points;
}();

},{}],6:[function(require,module,exports){
// Copyright 2015 Tom Roeder (tmroeder@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Input = exports.TextDraw = exports.Draw = exports.DrawConstants = exports.State = exports.UIError = undefined;

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _state_machine = require("./state_machine.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// UIError is thrown for error cases that happen in methods of the Draw
// classes.

var UIError = exports.UIError = function (_Error) {
  _inherits(UIError, _Error);

  function UIError(message) {
    _classCallCheck(this, UIError);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(UIError).call(this, message));

    _this.message = message;
    _this.name = "UIError";
    return _this;
  }

  return UIError;
}(Error);

var State = exports.State = function State() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var _ref$lines = _ref.lines;
  var lines = _ref$lines === undefined ? {} : _ref$lines;
  var _ref$projs = _ref.projs;
  var projs = _ref$projs === undefined ? {} : _ref$projs;
  var _ref$text = _ref.text;
  var text = _ref$text === undefined ? {} : _ref$text;
  var _ref$hiatus = _ref.hiatus;
  var hiatus = _ref$hiatus === undefined ? 0 : _ref$hiatus;
  var _ref$accel = _ref.accel;
  var accel = _ref$accel === undefined ? 0 : _ref$accel;
  var _ref$decel = _ref.decel;
  var decel = _ref$decel === undefined ? 0 : _ref$decel;
  var _ref$parens = _ref.parens;
  var parens = _ref$parens === undefined ? 0 : _ref$parens;
  var _ref$accent = _ref.accent;
  var accent = _ref$accent === undefined ? 0 : _ref$accent;
  var _ref$short = _ref.short;
  var short = _ref$short === undefined ? 0 : _ref$short;

  _classCallCheck(this, State);

  this.lines = lines;
  this.projs = projs;
  this.text = text;
  this.hiatus = hiatus;
  this.accel = accel;
  this.decel = decel;
  this.parens = parens;
  this.accent = accent;
  this.short = short;
};

// These values represent types of events that can occur.


var DrawConstants = exports.DrawConstants = {
  first: "first",
  second: "second",
  third: "third",
  start: "start",
  end: "end",
  proj: "normal",
  weak: "weak",
  exp: "expected",
  comment: "comment",
  message: "message"
};

// Draw gives the interface for Draw classes that can be used by the state
// machine states to draw themselves. It writes the current drawing state to a
// variable that can be accessed by subclasses to render themselves.

var Draw = exports.Draw = function () {
  function Draw(shortSoundLen, state) {
    _classCallCheck(this, Draw);

    this.shortSoundLen = shortSoundLen;
    this.state = new State(state);
  }

  // The default drawing function.


  _createClass(Draw, [{
    key: "draw",
    value: function draw(points, state, states, cur) {
      // Wipe the state for each draw operation.
      this.state = new State();

      this.write(states[state].comment, DrawConstants.comment);
      this.write(states[state].message, DrawConstants.message);

      // Draw the start of the first sound.
      var sound1Start = points.points[_state_machine.PointConstants.sound1First];
      if (sound1Start === undefined) {
        return;
      }
      this.drawPoint(sound1Start, DrawConstants.first, DrawConstants.start);

      // Draw the dynamic components of the first sound.
      if (cur !== undefined && cur !== sound1Start && points.inFirstSound()) {
        this.drawDuration(sound1Start, cur, DrawConstants.first);
      }

      var sound1End = points.points[_state_machine.PointConstants.sound1Second];
      var status = points.firstProjection(cur);
      if (status === _state_machine.PointConstants.projectionOn && points.points.length > 2) {
        var end = points.points[_state_machine.PointConstants.sound2First];
        var difference = end - sound1Start;
        this.drawProjection(sound1Start, end, DrawConstants.first, DrawConstants.proj);
        this.drawProjection(end, end + difference, DrawConstants.first, DrawConstants.exp);
      } else if (status === _state_machine.PointConstants.projectionCurrent) {
        // Don't draw a projection that is shorter than an existing first sound.
        if (sound1End !== undefined && cur < sound1End) {
          this.drawProjection(sound1Start, sound1End, DrawConstants.first, DrawConstants.proj);
        } else {
          this.drawProjection(sound1Start, cur, DrawConstants.first, DrawConstants.proj);
        }
      }

      // Draw the end of the first sound.
      if (sound1End == null) {
        return;
      }
      this.drawDuration(sound1Start, sound1End, DrawConstants.first);
      this.drawPoint(sound1End, DrawConstants.first, DrawConstants.end);

      // Draw the beginning of the second sound.
      var sound2Start = points.points[_state_machine.PointConstants.sound2First];
      if (sound2Start == null) {
        return;
      }
      this.drawPoint(sound2Start, DrawConstants.second, DrawConstants.start);

      // Draw the dynamic components of the second sound.
      if (cur !== undefined && cur > sound2Start && points.inSecondSound()) {
        this.drawDuration(sound2Start, cur, DrawConstants.second);
      }
      status = points.secondProjection(cur);
      if (status === _state_machine.PointConstants.projectionOn || status === _state_machine.PointConstants.projectionCurrent) {
        this.drawProjection(sound2Start, cur, DrawConstants.second, DrawConstants.proj);
      } else if (points.secondProjection(cur) === _state_machine.PointConstants.projectionWeak) {
        this.drawProjection(sound2Start, cur, DrawConstants.second, DrawConstants.weak);
      }

      // Draw the end of the second sound.
      var sound2End = points.points[_state_machine.PointConstants.sound2Second];
      if (sound2End == null) {
        return;
      }

      this.drawDuration(sound2Start, sound2End, DrawConstants.second);
      this.drawPoint(sound2End, DrawConstants.second, DrawConstants.end);

      // There are no dynamic components to the third sound, and its ending point
      // is defined simultaneously with its starting point.
      var sound3Start = points.points[_state_machine.PointConstants.sound3First];
      if (sound3Start == null) {
        return;
      }

      var accel = points.isAccel(sound2Start, sound2End, sound3Start);
      var realized = points.isRealized(sound2Start, sound2End, sound3Start);

      var sound3End = points.points[_state_machine.PointConstants.sound3Second];
      if (sound3End == null) {
        if (accel || realized) {
          points.pushPoint(2 * sound2Start);
        } else {
          points.pushPoint(sound3Start + this.shortSoundLen);
        }
        sound3End = points.points[_state_machine.PointConstants.sound3Second];
      }

      this.drawPoint(sound3Start, DrawConstants.third, DrawConstants.start);
      this.drawDuration(sound3Start, sound3End, DrawConstants.third);
      this.drawPoint(sound3End, DrawConstants.third, DrawConstants.end);

      var sound3Length = sound3End - sound3Start;

      if (accel) {
        this.drawAccel(sound3Start);
        return;
      }

      if (realized) {
        if (state === "sound3StartsRealized") {
          this.drawProjection(sound3Start, sound3End, DrawConstants.third, DrawConstants.exp);
          this.drawParens(sound3Start);
          return;
        }

        if (state === "sound3StartsAltInterpretation") {
          this.drawAccent(sound3Start);
          this.drawProjection(sound3Start, sound3End + sound3Length, DrawConstants.third, DrawConstants.proj);
          return;
        }

        return;
      }

      if (points.isSlightlyLate(sound2Start, sound3Start)) {
        this.drawDecel(sound3Start);
        return;
      }

      if (points.isSlightlyLateNewProjection(sound2Start, sound3Start)) {
        this.drawProjection(sound3Start, sound3End, DrawConstants.third, DrawConstants.proj);
        return;
      }

      if (!points.isDeterminate(sound2Start, sound3Start)) {
        this.drawHiatus(sound3Start);
        this.drawProjection(sound3Start, sound3End + sound3Length, DrawConstants.third, DrawConstants.proj);
      }
    }

    // drawPoint draws the beginning or end of a sound. It draws to the lines
    // object, but unlike drawDuration, it can draw a single start/end element
    // without the other.

  }, {
    key: "drawPoint",
    value: function drawPoint(pos, soundName, soundType) {
      if (!(soundName in this.state.lines)) {
        this.state.lines[soundName] = {};
      }
      this.state.lines[soundName][soundType] = pos;
    }

    // drawDuration draws the length of a duration.

  }, {
    key: "drawDuration",
    value: function drawDuration(start, end, soundName) {
      if (!(soundName in this.state.lines)) {
        this.state.lines[soundName] = {};
      }
      this.state.lines[soundName][DrawConstants.start] = start;
      this.state.lines[soundName][DrawConstants.end] = end;
    }

    // drawProjection draws a projection, potentially one that is not realized.

  }, {
    key: "drawProjection",
    value: function drawProjection(start, end, soundName, projType) {
      if (!(soundName in this.state.projs)) {
        this.state.projs[soundName] = {};
      }
      var sound = this.state.projs[soundName];
      if (!(projType in sound)) {
        sound[projType] = {};
      }
      sound[projType][DrawConstants.start] = start;
      sound[projType][DrawConstants.end] = end;
    }

    // write outputs text. The valid text types are Draw.comment and Draw.message.

  }, {
    key: "write",
    value: function write(text, textType) {
      this.state.text[textType] = text;
    }

    // drawHiatus outputs something thuat represents a hiatus.

  }, {
    key: "drawHiatus",
    value: function drawHiatus(pos) {
      this.state.hiatus = pos;
    }

    // drawAccel outputs a representation of an accelerando at the given position.

  }, {
    key: "drawAccel",
    value: function drawAccel(pos) {
      this.state.accel = pos;
    }

    // drawDecel outputs a representation of a decelerando at the given position.

  }, {
    key: "drawDecel",
    value: function drawDecel(pos) {
      this.state.decel = pos;
    }

    // drawParens outputs a representation of parentheses bracketing the range
    // start to end.

  }, {
    key: "drawParens",
    value: function drawParens(pos) {
      this.state.parens = pos;
    }

    // drawAccent outputs an accent mark at the given point.

  }, {
    key: "drawAccent",
    value: function drawAccent(pos) {
      this.state.accent = pos;
    }
  }]);

  return Draw;
}();

// TextDraw is a Draw class that is used to output the current drawing state
// object.


var TextDraw = exports.TextDraw = function (_Draw) {
  _inherits(TextDraw, _Draw);

  function TextDraw(shortSoundLen) {
    _classCallCheck(this, TextDraw);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TextDraw).call(this, shortSoundLen));
  }

  _createClass(TextDraw, [{
    key: "draw",
    value: function draw(points, state, states, cur) {
      _get(Object.getPrototypeOf(TextDraw.prototype), "draw", this).call(this, points, state, states, cur);
      console.log(this.state);
    }
  }]);

  return TextDraw;
}(Draw);

// The Input class is an interface for registering input handlers. Subclasses
// need to provide a connection to a source of input events.


var Input = exports.Input = function () {
  function Input() {
    _classCallCheck(this, Input);
  }

  _createClass(Input, [{
    key: "registerMove",

    // registerMove takes a function and registers it to receive notification when
    // movement occurs. The function will be called as fn(x, y) where (x, y) is
    // the current position.
    value: function registerMove(fn) {
      throw new UIError("registerMove is not implemented");
    }

    // registerClick takes a function and registers it to receive notification
    // when a click occurs. The function will be called as fn(x, y), where (x, y)
    // is the current position.

  }, {
    key: "registerClick",
    value: function registerClick(fn) {
      throw new UIError("registerClick is not implemented");
    }
  }]);

  return Input;
}();

},{"./state_machine.js":5}]},{},[1,2,3,4,5,6]);
