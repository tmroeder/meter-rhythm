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

const PointConstants = require("./state_machine.js").PointConstants;

// UIError is thrown for error cases that happen in methods of the Draw
// classes.
class UIError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = "UIError";
  }
}
exports.UIError = UIError;

class State {
  constructor({lines = {}, projs = {}, text = {}, hiatus = 0, accel = 0,
      decel = 0, parens = 0, accent = 0, short = 0} = {}) {
    this.lines = lines;
    this.projs = projs;
    this.text = text;
    this.hiatus = hiatus;
    this.accel = accel;
    this.decel = decel;
    this.parens = parens;
    this.accent = accent;
    this.short = short;
  }
}
exports.State = State;

// These values represent types of events that can occur.
const DrawConstants = {
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
exports.DrawConstants = DrawConstants;

// Draw gives the interface for Draw classes that can be used by the state
// machine states to draw themselves. It writes the current drawing state to a
// variable that can be accessed by subclasses to render themselves.
class Draw {
  constructor(shortSoundLen, state) {
    this.shortSoundLen = shortSoundLen;
    this.state = new State(state);
  }

  // The default drawing function.
  draw(points, state, states, cur) {
    // Wipe the state for each draw operation.
    this.state = new State();

    this.write(states[state].comment, DrawConstants.comment);
    this.write(states[state].message, DrawConstants.message);

    // Draw the start of the first sound.
    let sound1Start = points.points[PointConstants.sound1First];
    if (sound1Start === null) {
      return;
    }
    this.drawPoint(sound1Start, DrawConstants.first, DrawConstants.start);

    // Draw the dynamic components of the first sound.
    if (cur != null && cur !== sound1Start && points.inFirstSound()) {
      this.drawDuration(sound1Start, cur, DrawConstants.first);
    }

    let sound1End = points.points[PointConstants.sound1Second];
    let status = points.firstProjection(cur);
    if (status === PointConstants.projectionOn && points.points.length > 2) {
      let end = points.points[PointConstants.sound2First];
      let difference = end - sound1Start;
      this.drawProjection(sound1Start, end, DrawConstants.first,
                          DrawConstants.proj);
      this.drawProjection(end, end + difference, DrawConstants.first,
                          DrawConstants.exp);
    } else if (status === PointConstants.projectionCurrent) {
      // Don't draw a projection that is shorter than an existing first sound.
      if (sound1End != null && cur < sound1End) {
        this.drawProjection(sound1Start, sound1End, DrawConstants.first,
                            DrawConstants.proj);
      } else {
        this.drawProjection(sound1Start, cur, DrawConstants.first,
                            DrawConstants.proj);
      }
    }

    // Draw the end of the first sound.
    if (sound1End == null) {
      return;
    }
    this.drawDuration(sound1Start, sound1End, DrawConstants.first);
    this.drawPoint(sound1End, DrawConstants.first, DrawConstants.end);

    // Draw the beginning of the second sound.
    let sound2Start = points.points[PointConstants.sound2First];
    if (sound2Start == null) {
      return;
    }
    this.drawPoint(sound2Start, DrawConstants.second, DrawConstants.start);

    // Draw the dynamic components of the second sound.
    if (cur != null && cur > sound2Start && points.inSecondSound()) {
      this.drawDuration(sound2Start, cur, DrawConstants.second);
    }
    status = points.secondProjection(cur);
    if (status === PointConstants.projectionOn ||
        status === PointConstants.projectionCurrent) {
      this.drawProjection(sound2Start, cur, DrawConstants.second,
                          DrawConstants.proj);
    } else if (points.secondProjection(cur) ===
               PointConstants.projectionWeak) {
      this.drawProjection(sound2Start, cur, DrawConstants.second,
                          DrawConstants.weak);
    }

    // Draw the end of the second sound.
    let sound2End = points.points[PointConstants.sound2Second];
    if (sound2End == null) {
      return;
    }

    this.drawDuration(sound2Start, sound2End, DrawConstants.second);
    this.drawPoint(sound2End, DrawConstants.second, DrawConstants.end);

    // There are no dynamic components to the third sound, and its ending point
    // is defined simultaneously with its starting point.
    let sound3Start = points.points[PointConstants.sound3First];
    if (sound3Start == null) {
      return;
    }

    let accel = points.isAccel(sound2Start, sound2End, sound3Start);
    let realized = points.isRealized(sound2Start, sound2End, sound3Start);

    let sound3End = points.points[PointConstants.sound3Second];
    if (sound3End == null) {
      if (accel || realized) {
        points.pushPoint(2 * sound2Start);
      } else {
        points.pushPoint(sound3Start + this.shortSoundLen);
      }
      sound3End = points.points[PointConstants.sound3Second];
    }

    this.drawPoint(sound3Start, DrawConstants.third, DrawConstants.start);
    this.drawDuration(sound3Start, sound3End, DrawConstants.third);
    this.drawPoint(sound3End, DrawConstants.third, DrawConstants.end);

    let sound3Length = sound3End - sound3Start;

    if (accel) {
      this.drawAccel(sound3Start);
      return;
    }
    
    if (realized) {
      if (state === "sound3StartsRealized") {
        this.drawProjection(sound3Start, sound3End, DrawConstants.third,
                            DrawConstants.exp);
        this.drawParens(sound3Start);
        return;
      }
      
      if (state === "sound3StartsAltInterpretation") {
        this.drawAccent(sound3Start);
        this.drawProjection(sound3Start, sound3End + sound3Length,
                            DrawConstants.third, DrawConstants.proj);
        return;
      }

      return;
    }
    
    if (points.isSlightlyLate(sound2Start, sound3Start)) {
      this.drawDecel(sound3Start);
      return;
    }
    
    if (points.isSlightlyLateNewProjection(sound2Start, sound3Start)) {
      this.drawProjection(sound3Start, sound3End, DrawConstants.third,
                          DrawConstants.proj);
      return;
    }
    
    if (!points.isDeterminate(sound2Start, sound3Start)) {
      this.drawHiatus(sound3Start);
      this.drawProjection(sound3Start, sound3End + sound3Length,
                          DrawConstants.third, DrawConstants.proj);
    }
  }

  // drawPoint draws the beginning or end of a sound. It draws to the lines
  // object, but unlike drawDuration, it can draw a single start/end element
  // without the other.
  drawPoint(pos, soundName, soundType) {
    if (!(soundName in this.state.lines)) {
      this.state.lines[soundName] = {}
    }
    this.state.lines[soundName][soundType] = pos;
  }

  // drawDuration draws the length of a duration.
  drawDuration(start, end, soundName) {
    if (!(soundName in this.state.lines)) {
      this.state.lines[soundName] = {}
    }
    this.state.lines[soundName][DrawConstants.start] = start;
    this.state.lines[soundName][DrawConstants.end] = end;
  }

  // drawProjection draws a projection, potentially one that is not realized.
  drawProjection(start, end, soundName, projType) {
    if (!(soundName in this.state.projs)) {
      this.state.projs[soundName] = {}
    }
    let sound = this.state.projs[soundName];
    if (!(projType in sound)) {
      sound[projType] = {}
    }
    sound[projType][DrawConstants.start] = start;
    sound[projType][DrawConstants.end] = end;
  }

  // write outputs text. The valid text types are Draw.comment and Draw.message.
  write(text, textType) {
    this.state.text[textType] = text;
  }

  // drawHiatus outputs something thuat represents a hiatus.
  drawHiatus(pos) {
    this.state.hiatus = pos;
  }

  // drawAccel outputs a representation of an accelerando at the given position.
  drawAccel(pos) {
    this.state.accel = pos;
  }

  // drawDecel outputs a representation of a decelerando at the given position.
  drawDecel(pos) {
    this.state.decel = pos;
  }

  // drawParens outputs a representation of parentheses bracketing the range
  // start to end.
  drawParens(pos) {
    this.state.parens = pos;
  }

  // drawAccent outputs an accent mark at the given point.
  drawAccent(pos) {
    this.state.accent = pos;
  }
}
exports.Draw = Draw;

// TextDraw is a Draw class that is used to output the current drawing state
// object.
class TextDraw extends Draw {
  constructor(shortSoundLen) {
    super(shortSoundLen);
  }

  draw(points, state, states, cur) {
    super.draw(points, state, states, cur);
    console.log(this.state);
  }
}
exports.TextDraw = TextDraw;

// The Input class is an interface for registering input handlers. Sublcasses
// need to provide a connection to a source of input events.
class Input {
  // registerMove takes a function and registers it to receive notification when
  // movement occurs. The function will be called as fn(x, y) where (x, y) is
  // the current position.
  registerMove(fn) {
    throw new UIError("registerMove is not implemented");
  }

  // registerClick takes a function and registers it to receive notification
  // when a click occurs. The function will be called as fn(x, y), where (x, y)
  // is the current position.
  registerClick(fn) {
    throw new UIError("registerClick is not implemented");
  }
}
exports.Input = Input;
