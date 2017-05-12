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

import {
  Driver
} from "../src/driver.js";
import {
  States
} from "../src/state_machine.js";
import {
  TextDraw
} from "../src/ui.js";
import {
  MockInput
} from "./mock_ui.js";

export class TextSimulator {
  constructor(maxLen) {
    this.maxLen = maxLen;
    this.draw = new TextDraw();
    this.input = new MockInput();
    this.driver = new Driver(this.maxLen, States, this.input, this.draw);
  }

  c(x) {
    this.input.click(x, 0);
  }

  m(x) {
    this.input.move(x, 0);
  }

  r() {
    this.driver.reset();
  }
}
