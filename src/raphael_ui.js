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

import { Draw, DrawConstants, Input, State } from "./ui.js";

// This class registers for mouse move and click input from the DOM |element|.
export class DomInput extends Input {
  constructor(element) {
    super();
    this.element = element;
    this.moveRegistry = [];
    this.clickRegistry = [];

    element.addEventListener("click", (ev) => {
      let box = this.element.getBoundingClientRect();
      let x = ev.clientX - box.left;
      let y = ev.clientY - box.top;
      for (let i = 0; i < this.clickRegistry.length; i++) {
        this.clickRegistry[i](x, y);
      }
    });

    element.addEventListener("mousemove", (ev) => {
      let box = this.element.getBoundingClientRect();
      let x = ev.clientX - box.left;
      let y = ev.clientY - box.top;
      for (let i = 0; i < this.moveRegistry.length; i++) {
        this.moveRegistry[i](x, y);
      }
    });
  }

  registerMove(fn) {
    if (typeof fn !== "function") return
    this.moveRegistry.push(fn);
  }

  registerClick(fn) {
    if (typeof fn !== "function") return
    this.clickRegistry.push(fn);
  }
}

function isDuration(obj) {
  return obj.hasOwnProperty(DrawConstants.start);
}

// This class draws the current state of events to the Raphael-managed |paper|.
export class RaphaelDraw extends Draw {
  constructor(paper, shortSoundLen, commentDiv, messageDiv) {
    super(shortSoundLen, {});

    let textHeight = 250;
    this.elementHeight = {
      lines: 200,
      [DrawConstants.proj]: 190,
      [DrawConstants.weak]: 180,
      [DrawConstants.exp]: 170,
      hiatus: textHeight,
      accel: textHeight,
      decel: textHeight,
      parens: textHeight,
      accent: textHeight
    }
    this.paper = paper;

    // Use a State object to store graphics objects.
    this.drawState = new State({});

    // Where to write comments and messages.
    this.drawState.text[DrawConstants.comment] = commentDiv;
    this.drawState.text[DrawConstants.message] = messageDiv;

    // Three lines, one for each sound.
    this.drawState.lines[DrawConstants.first] = paper.path("M0,0").hide();
    this.drawState.lines[DrawConstants.second] = paper.path("M0,0").hide();
    this.drawState.lines[DrawConstants.third] = paper.path("M0,0").hide();

    // A projection and an expected projection for the first sound.
    this.drawState.projs[DrawConstants.first] = {};
    this.drawState.projs[DrawConstants.first][DrawConstants.proj] =
      paper.path("M0,0").hide();
    this.drawState.projs[DrawConstants.first][DrawConstants.exp] =
      paper.path("M0,0").hide();

    // A projection and a weak projection for the second sound.
    this.drawState.projs[DrawConstants.second] = {};
    this.drawState.projs[DrawConstants.second][DrawConstants.proj] =
      paper.path("M0,0").hide();
    this.drawState.projs[DrawConstants.second][DrawConstants.weak] =
      paper.path("M0,0").hide();

    // A projection and an expected projection for the third sound.
    this.drawState.projs[DrawConstants.third] = {};
    this.drawState.projs[DrawConstants.third][DrawConstants.proj] =
      paper.path("M0,0").hide();
    this.drawState.projs[DrawConstants.third][DrawConstants.exp] =
      paper.path("M0,0").hide();

    // Hiatus, accel, decel, parens, and accent marks.
    this.hiatus = paper.text(0, 0, "||").hide();
    this.accel = paper.text(0, 0, "accel").hide();
    this.decel = paper.text(0, 0, "decel").hide(); 

    // TODO(tmroeder): Wrap the actual line in parens instead.
    this.parens = paper.text(0, 0, "()").hide();
    this.accent = paper.text(0, 0, ">").hide();
  }


  composePath(key, value) {
    let start = value[DrawConstants.start];
    let end = value[DrawConstants.end];
    let height = this.elementHeight[key];
    return "M" + start + "," + height + " L" + end + "," + height;
  }

  hideObjects(element) {
    if (element.hasOwnProperty("show") && typeof element.show === "function") {
      element.show();
      return;
    }

    for (let child of Object.keys(element)) {
      if (typeof child === "object") {
        this.hideObjects(child);
      }
    }
  }

  draw(points, state, states, cur) {
    super.draw(points, state, states, cur);
    console.log("State is", this.state);
    let drawKeys = Object.keys(this.drawState);
    for (let drawKey of drawKeys) {
      let drawValue = this.drawState[drawKey];
      if (!this.state.hasOwnProperty(drawKey)) {
        this.hideObjects(drawValue);
        continue;
      }

      let stateValue = this.state[drawKey];
      if (typeof stateValue === "string") {
        drawValue.innerHTML = stateValue;
        continue;
      }

      if (typeof stateValue !== "object") {
        continue;
      }

      if (stateValue.hasOwnProperty(DrawConstants.start)) {
        // E.g., drawKey might be "lines".
        drawValue.attr("path", this.composePath(drawKey, stateValue)).show();
        continue;
      }

      // At this point, the state object is an object, and it doesn't have a key
      // DrawConstants.start. So, we iterate over its inner structure to try to
      // find more lines to draw.
      let innerDrawKeys = Object.keys(drawValue);
      for (let innerDrawKey of innerDrawKeys) {
        if (!stateValue.hasOwnProperty(innerDrawKey)) {
          this.hideObjects(drawValue[innerDrawKey]);
          continue;
        }

        let innerStateValue = stateValue[innerDrawKey];
        let innerDrawValue = drawValue[innerDrawKey];
        if (typeof innerStateValue === "string") {
          innerDrawValue.innerHTML = innerStateValue;
          continue;
        }

        // Handle the special case of projections, with multiple types.
        if (drawKey === "projs") {
          let innerProjDrawKeys = Object.keys(innerDrawValue);
          for (let innerProjDrawKey of innerProjDrawKeys) {
            let innerProjDrawValue = innerDrawValue[innerProjDrawKey];
            if (!innerStateValue.hasOwnProperty(innerProjDrawKey)) {
              this.hideObjects(innerProjDrawValue);
              continue;
            }

            let innerProjStateValue = innerStateValue[innerProjDrawKey];
            if (typeof innerProjStateValue !== "object" ||
                !innerProjStateValue.hasOwnProperty(DrawConstants.start)) {
              this.hideObjects(innerProjDrawValue);
              continue;
            }

            if (!innerProjStateValue.hasOwnProperty(DrawConstants.start)) {
              continue;
            }

            innerProjDrawValue.attr("path",
                this.composePath(innerProjDrawKey, innerProjStateValue)).show();
          }

          continue;
        }

        if (!innerStateValue.hasOwnProperty(DrawConstants.start)) {
          continue;
        }

        innerDrawValue.attr("path",
            this.composePath(drawKey, innerStateValue)).show();
      }
    }
  }
}
