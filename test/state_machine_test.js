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

import { PointError, Points, PointConstants, states, writeGraph, visit } from "../lib/state_machine.js";

let projectionOff = PointConstants.projectionOff;
let projectionOn = PointConstants.projectionOn;
let projectionCurrent = PointConstants.projectionCurrent;
let projectionWeak = PointConstants.projectionWeak;

import * as chai from "chai";
let expect = chai.expect;
let should = chai.should();

describe("The state machine", () => {
  it("should have a start state", () => {
    states.should.have.property("start");
  });

  it("should have at least one end state", () => {
    let endNodes = [];
    for (let src in states) {
      let val = states[src];
      if ("start" in val.transitions) {
        endNodes.push(src);
      }
    }
    expect(endNodes).to.not.be.empty;
  });

  it("should be able to reach every node from start", () => {
    let visited = visit(states);
    let unvisited = [];
    for (let src in visited) {
      let val = visited[src];
      if (!val) {
        unvisited.push(src);
      }
    }
    expect(unvisited).to.be.empty;
  });
});

const edgeRegex = /^\s*\w+ -> \w+$/;

describe("The writeGraph function", () => {
  it("should a graph that matches its input", () => {
    let states = {
      start: {
        transitions: {
          second: true
        }
      },
      second: {
        transitions: {
          end: true,
          start: true
        }
      },
      end: {
        transitions: {
          second: true
        }
      }
    };
    let graph = writeGraph(states);
    let expected = "  start -> second\n  second -> end\n  second -> start\n  " +
                   "end -> second";
    expect(graph).to.not.be.empty;
    graph.should.equal(expected);
  });

  it("should return a valid GraphViz graph", () => {
    let graph = writeGraph(states);
    let lines = graph.split("\n");
    expect(lines).to.not.be.empty;
    for (let i = 0; i < lines.length; i++) {
      expect(lines[i]).to.match(edgeRegex);
    }
  });
});

let maxLen = 100;

describe("The Points class", () => {
  it("should allow points to be added", () => {
    let p = new Points(maxLen, 13);
  });

  it("should throw in the constructor if given too many points", () => {
    let construct = () => new Points(maxLen, 0, 1, 2, 3, 4, 5, 6, 7);
    expect(construct).to.throw(/too many points/);
  });

  it("should throw a PointError if more than 6 points are added", () => {
    let add = () => {
      let p = new Points(maxLen, 13, 14, 15, 16, 17, 18);
      p.pushPoint(20);
    };
    expect(add).to.throw(/all points already defined/);
  });

  it("should fail popPoint when no points are present", () => {
    let pop = () => {
      let p = new Points(maxLen);
      p.popPoint();
    };
    expect(pop).to.throw(/no points to remove/);
  });

  it("should pop a point when popPoint is called", () => {
    let x = undefined;
    let pop = () => {
      let p = new Points(maxLen, 13, 14, 15, 16, 17, 18);
      x = p.popPoint();
    };

    expect(pop).to.not.throw(Error);
    expect(x).to.exist;
  });
});

maxLen = 10;

describe("The first sound", () => {
  it("should project if an in-progress sound is determinate", () => {
    let p = new Points(maxLen, 0);
    p.firstProjection(8).should.equal(projectionCurrent);
  });

  it("should not project if an in-progress sound is indeterminate", () => {
    let p = new Points(maxLen, 0);
    p.firstProjection(11).should.equal(projectionOff);
  });

  it("should not project if a completed first sound is indeterminate", () => {
    let p = new Points(maxLen, 0, 11);
    p.firstProjection(11).should.equal(projectionOff);
  });

  it("should project if a completed first sound is determinate", () => {
    let p = new Points(maxLen, 0, 1);
    p.firstProjection(2).should.equal(projectionCurrent);
  });

  it("should not project if the sum of a sound and pause is indeterminate", () => {
    let p = new Points(maxLen, 0, 5);
    p.firstProjection(11).should.equal(projectionOff);
  });
});

describe("The second sound", () => {
  it("should not project outside the second sound and subsequent pause", () => {
    let p = new Points(maxLen, 0, 1, 2, 3, 4, 5);
    p.secondProjection().should.equal(projectionOff);

    let p2 = new Points(maxLen, 0, 1);
    p2.secondProjection().should.equal(projectionOff);
  });

  it("should project if a determinate second event is in progress", () => {
    let p = new Points(maxLen, 0, 9, 18);
    p.secondProjection(20).should.equal(projectionOn);
    p.secondProjection(27).should.equal(projectionOn);
  });

  it("should project weakly if pos is greater than 2*start but determinate", () => {
    let p = new Points(maxLen, 0, 4, 8);
    p.secondProjection(17).should.equal(projectionWeak);
  });

  it("should not project if an in-progress sound is indeterminate", () => {
    let p = new Points(maxLen, 0, 4, 8);
    p.secondProjection(19).should.equal(projectionOff);
  });

  it("should project if a determinate second sound has been formed", () => {
    let p = new Points(maxLen, 0, 4, 8, 12);
    p.secondProjection().should.equal(projectionOn);
    p.secondProjection(10).should.equal(projectionOn);
  });

  it("should project if a determinate pause is occurring", () => {
    let p = new Points(maxLen, 0, 4, 8, 12);
    p.secondProjection(14).should.equal(projectionOn);
  });

  it("should not project if an indeterminate pause is occurring", () => {
    let p = new Points(maxLen, 0, 4, 8, 12);
    p.secondProjection(23).should.equal(projectionOff);
  });
});
