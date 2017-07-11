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
  Sound
} from "./duration.js"

import {
  States,
  StartState
} from "./state_machine.js";

export class Driver {
  constructor(maxLen, input) {
    this.state = StartState;
    // The first sound always starts at 0, and it starts at the beginning,
    // without a click.
    this.sounds = [
      new Sound(maxLen, 0),
      new Sound(maxLen),
      new Sound(maxLen)
    ];
    this.currentSound = 0;

    input.registerMove(this.handleMove.bind(this));
    input.registerClick(this.handleClick.bind(this));
  }

  handleMove(x, y) {
    let handler = States[this.state].moveHandler;
    // All a move event can ever do is change the current position and maybe the
    // state. However, it does need to know the current sounds.
    let sound = this.sounds[this.currentSound];
    sound.cur = x;

    if (handler != null) {
      this.state = handler(sound, x);
    }
  }

  handleClick(x, y) {
    let handler = States[this.state].clickHandler;
    if (handler != null) {
      let skipPointCreation = States[this.state].skipPointCreation;
      let skipPoint = (skipPointCreation != null) && skipPointCreation;
      this.state = handler(this.sounds, x);
      if (!skipPoint) {
        this.points.pushPoint(x);
      }
      this.ui.draw(this.points, this.cur, this.states, x);
    }
  }

  reset() {
    this.cur = "start";
    this.points = new Points(this.maxLen);
    this.ui.draw(this.points, this.cur, this.states);
  }
}
