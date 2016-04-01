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

let Input = require("../lib/ui.js").Input;

class MockInput extends Input {
  constructor() {
    super();
    this.moveRegistry = [];
    this.clickRegistry = [];
  }

  registerMove(fn) {
    this.moveRegistry.push(fn);
  }

  registerClick(fn) {
    this.clickRegistry.push(fn);
  }

  move(x, y) {
    for (let i = 0; i < this.moveRegistry.length; i++) {
      let fn = this.moveRegistry[i];
      if (typeof fn === "function") {
        fn(x, y);
      }
    }
  }

  click(x, y) {
    for (let i = 0; i < this.clickRegistry.length; i++) {
      let fn = this.clickRegistry[i];
      if (typeof fn === "function") {
        fn(x, y);
      }
    }
  }
}
