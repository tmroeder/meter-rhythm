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
window.onload = function() {
  var canvas = document.getElementById("canvas");

  // This line requires raphael.min.js to have been loaded before this script in
  // a way that leaves Raphael in scope in the Browserified closure.
  var paper = Raphael(canvas, 600, 70);

  var messageDiv = document.getElementById("messages");
  var commentDiv = document.getElementById("comments");

  var domInput = new raphael_ui.DomInput(canvas);
  var raphaelDraw =
    new raphael_ui.RaphaelDraw(paper, 200, commentDiv, messageDiv);

  // Wire up the input to the output through the Driver.
  new driver.Driver(100, state_machine.states, domInput, raphaelDraw);  
}
