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

import { Points, states } from "../lib/state_machine.js";
import { Draw, DrawConstants, TextDraw, UIError } from "../lib/ui.js";
import * as chai from "chai";
let expect = chai.expect;
let should = chai.should();

describe("The TextDraw object", () => {
  it("should succeed in its constructor", () => {
    let instantiate = () => { let t = new TextDraw(); };
    expect(instantiate).to.not.throw(Error);
    expect(instantiate).to.not.throw(UIError);
  });
});

const maxLen = 10;
const shortSoundLen = 20;

describe("The Draw class", () => {
  it("should capture start events", () => {
    let d = new Draw(shortSoundLen);
    d.drawPoint(50, DrawConstants.first, DrawConstants.start);

    let lines = {
      first: {
        start: 50
      }
    };
    d.state.lines.should.deep.equal(lines);
  });

  it("should capture duration events", () => {
    let d = new Draw(shortSoundLen);
    d.drawDuration(50, 100, DrawConstants.first);

    let lines = {
      first: {
        start: 50,
        end: 100
      }
    };
    d.state.lines.should.deep.equal(lines);
  });

  it("should capture end events", () => {
    let d = new Draw(shortSoundLen);
    d.drawPoint(50, DrawConstants.first, DrawConstants.end);

    let lines = {
      first: {
        end: 50
      }
    };
    d.state.lines.should.deep.equal(lines);
  });

  it("should capture projection events", () => {
    let d = new Draw(shortSoundLen);
    d.drawProjection(50, 100, DrawConstants.first, DrawConstants.proj);

    let projs = {
      first: {
        normal: {
          start: 50,
          end: 100
        }
      }
    };
    d.state.projs.should.deep.equal(projs);
  });

  it("should capture weak projection events", () => {
    let d = new Draw(shortSoundLen);
    d.drawProjection(50, 100, DrawConstants.second, DrawConstants.weak);

    let projs = {
      second: {
        weak: {
          start: 50,
          end: 100
        }
      }
    };
    d.state.projs.should.deep.equal(projs);
  });

  it("should capture expected projection events", () => {
    let d = new Draw(shortSoundLen);
    d.drawProjection(50, 100, DrawConstants.third, DrawConstants.exp);

    let projs = {
      third: {
        expected: {
          start: 50,
          end: 100
        }
      }
    };
    d.state.projs.should.deep.equal(projs);
  });

  it("should capture comment events", () => {
    let d = new Draw(shortSoundLen);
    d.write("Test comment", DrawConstants.comment);
    d.state.text.should.deep.equal({
      comment: "Test comment"
    });
  });

  it("should capture message events", () => {
    let d = new Draw(shortSoundLen);
    d.write("Test message", DrawConstants.message);
    d.state.text.should.deep.equal({
      message: "Test message"
    });
  });

  it("should capture hiatus events", () => {
    let d = new Draw(shortSoundLen);
    d.drawHiatus(50);
    d.state.hiatus.should.equal(50);
  });

  it("should capture accel events", () => {
    let d = new Draw(shortSoundLen);
    d.drawAccel(50);
    d.state.accel.should.equal(50);
  });

  it("should capture decel events", () => {
    let d = new Draw(shortSoundLen);
    d.drawDecel(50);
    d.state.decel.should.equal(50);
  });

  it("should capture parens events", () => {
    let d = new Draw(shortSoundLen);
    d.drawParens(50);
    d.state.parens.should.equal(50);
  });
});
