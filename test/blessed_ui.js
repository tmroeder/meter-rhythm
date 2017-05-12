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
  Screen,
  Box
} from "blessed";
import {
  Driver
} from "../src/driver.js";
import {
  States
} from "../src/state_machine.js";
import {
  Draw,
  Input
} from "../src/ui.js";

// BlessedInput tracks an implicit horizontal position on the window.  It sends
// click and move events to registered handlers.  Click and move keys are
// defined by incoming arrays.
export class BlessedInput extends Input {
  constructor(screen, moveIncrement, clickKeys, leftKeys, rightKeys) {
    super();
    this.screen = screen;
    this.moveIncrement = moveIncrement;
    this.pos = 0;

    // BlessedInput avoids knowing much about the underlying driver, but it
    // does need to know that no movement is possible without an initial click.
    // This member variable tracks that information.
    this.allowMovement = false;
    this.moveRegistry = [];
    this.clickRegistry = [];
    this.setUpClickHandlers(clickKeys);
    this.setUpMoveHandlers(leftKeys, rightKeys);
  }

  registerMove(fn) {
    this.moveRegistry.push(fn);
  }

  registerClick(fn) {
    this.clickRegistry.push(fn);
  }

  setUpClickHandlers(clickKeys) {
    this.screen.key(clickKeys, (data) => {
      this.allowMovement = true;
      this.screen.debug("{click: " + _this.pos + "}");
      for (let i = 0; len < this.clickRegistry.length; i++) {
        let fn = this.clickRegistry[i];
        if (typeof fn === "function") {
          fn(this.pos, 0);
        }
      }
    });
  }

  setUpMoveHandlers(leftKeys, rightKeys) {
    this.screen.key(leftKeys, (ch, key) => {
      if (!this.allowMovement) {
        return;
      }
      if (this.pos >= this.moveIncrement) {
        this.pos -= this.moveIncrement;
        this.screen.debug("{move: " + this.pos + "}");
        for (let i = 0; len < this.moveRegistry.length; i++) {
          let fn = this.moveRegistry[i];
          if (typeof fn === "function") {
            fn(this.pos, 0);
          }
        }
      } else {
        this.screen.debug("can't move below 0");
      }
    });

    this.screen.key(rightKeys, (ch, key) => {
      if (!this.allowMovement) {
        return;
      }
      if (this.pos <= this.screen.width - this.moveIncrement) {
        this.pos += this.moveIncrement;
        this.screen.debug("{move: " + this.pos + "}");
        for (let i = 0; len = this.moveRegistry.length; i++) {
          let fn = this.moveRegistry[i];
          if (typeof fn === "function") {
            fn(this.pos, 0);
          }
        }
      } else {
        this.screen.debug("can't move beyond " + this.screen.width);
      }
    });
  }
}

// The Blessed UI for Meter as Rhythm runs in an 120x60 terminal.
const standardTerminalWidth = 120;
const standardTerminalHeight = 60;
const shortSoundLen = 5;

// BlessedDraw uses the Blessed UI to draw to the terminal.
export class BlessedDraw extends Draw {

  // The BlessedDraw class takes a structure that gives the parameters of the
  // screen and the heights and positions of the elements.
  constructor({
    title = "Meter as Rhythm",
    logName = "meter.log",
    boxHeight = 6,
    pos = 0
  } = {}) {
    super(shortSoundLen);
    this.title = title;
    this.logName = logName;
    this.boxHeight = boxHeight;
    this.pos = pos;
    this.screen = Screen({
      smartCSR: true,
      autoPadding: true,
      log: this.logName,
      debug: true,
      dockBorders: true,
      title: this.title,
      width: standardTerminalWidth,
      height: standardTerminalHeight
    });

    this.screenWidth = this.screen.width;
    this.stateBox = this.createBox("top", "left", standardTerminalHeight);
    this.screen.append(this.stateBox);
    this.screen.key(["escape", "q", "C-c"], (ch, key) => {
      this.screen.debug("exiting");
      process.exit(0);
    });
  }

  createBox(top, left, height) {
    return Box({
      top: top,
      left: left,
      width: standardTerminalWidth,
      height: height != null ? height : this.boxHeight,
      content: "",
      border: {
        type: "line"
      },
      style: {
        fg: "white",
        border: {
          fg: "white"
        }
      }
    });
  }

  moveHandler(x, y) {
    this.pos = x;
  }

  // draw calls the parent Draw class and follows it by rendering the screen.
  draw(points, state, States, cur) {
    super.draw(points, state, States, cur);
    this.updateElements();
    this.screen.render();
  }

  updateElements() {
    this.stateBox.setContent("pos: " + this.pos + "\n" +
      JSON.stringify(this.state, null, 2));
  }
}

export function StartUI() {
  let maxLen = 10;
  let draw = new BlessedDraw();
  let input = new BlessedInput(draw.screen, 2, "space", "left", "right");
  input.registerMove(draw.moveHandler);
  let driver = new Driver(maxLen, States, input, draw);
  draw.screen.render();
};
