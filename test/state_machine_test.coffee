# Copyright 2015 Tom Roeder (tmroeder@gmail.com)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
   
{PointError, Points, states, writeGraph, visit} =
  require "../state_machine.coffee"
chai = require "chai"
expect = chai.expect
should = chai.should()

projectionOff = Points.projectionOff
projectionOn = Points.projectionOn
projectionCurrent = Points.projectionCurrent
projectionWeak = Points.projectionWeak

describe "The states object", ->
  states = states
  it "should have a start state", ->
    states.should.have.property "start"

  it "should have at least one end state", ->
    endNodes = (src for src, val of states when "start" of val.transitions)
    expect(endNodes).to.not.be.empty

  it "should be able to reach every node from start", ->
    visited = visit(states)
    unvisited = (src for src, val of visited when !val)
    expect(unvisited).to.be.empty

# A regular expression that describes a valid GraphViz edge for the states.
edgeRegex = /^\s*\w+ -> \w+$/

describe "The writeGraph function", ->
  it "should return a graph that matches its input", ->
    states =
      start:
        transitions:
          second: true
      second:
        transitions:
          end: true
          start: true
      end:
        transitions:
          second: true
    graph = writeGraph(states)
    expected = "  start -> second\n  second -> end\n  second -> start\n  " +
               "end -> second"
    expect(graph).to.not.be.empty
    graph.should.equal(expected)

  it "should return a valid GraphViz graph", ->
    graph = writeGraph(states)
    lines = graph.split "\n"
    expect(lines).to.not.be.empty
    expect(line).to.match(edgeRegex) for line in lines

maxLen = 100
describe "The Points class", ->
  it "should allow points to be added", ->
    p = new Points maxLen, 13

  it "should throw in the constructor if given too many points", ->
    expect(Points.bind(null, maxLen, [0..7]...)).to.throw(
      PointError, "too many points")

  it "should throw a PointError if more than 6 points are added", ->
    p = new Points maxLen, [13..18]...
    expect(p.pushPoint.bind(p, 20)).to.throw(PointError,
                                             "all points already defined")

  it "should fail popPoint when no points are present", ->
    p = new Points maxLen
    expect(p.popPoint.bind(p)).to.throw(PointError, "no points to remove")

  it "should pop a point when popPoint is called", ->
    p = new Points maxLen, [13..18]...
    x = p.popPoint()
    expect(x).to.exist
    expect(p.pushPoint.bind(p, 20)).to.not.throw(Error)

maxLen = 10
describe "The first sound", ->
  it "should project if an in-progress sound is determinate", ->
    p = new Points maxLen, 0
    p.firstProjection(8).should.equal(projectionCurrent)

  it "should not project if an in-progress sound is indeterminate", ->
    p = new Points maxLen, 0
    p.firstProjection(11).should.equal(projectionOff)

  it "should not project if a completed first sound is indeterminate", ->
    p = new Points maxLen, 0, 11
    p.firstProjection(11).should.equal(projectionOff)

  it "should project if a completed first sound is determinate", ->
    p = new Points maxLen, 0, 1
    p.firstProjection(2).should.equal(projectionCurrent)

  it "should not project if the sum of a sound and pause is indeterminate", ->
    p = new Points maxLen, 0, 5
    p.firstProjection(11).should.equal(projectionOff)

describe "The second sound", ->
  it "should not project outside the second sound and subsequent pause", ->
    p = new Points maxLen, [0..5]...
    p.secondProjection().should.equal(projectionOff)

    p2 = new Points maxLen, 0, 1
    p2.secondProjection().should.equal(projectionOff)

  it "should project if a determinate second event is in progress", ->
    p = new Points maxLen, 0, 9, 18
    p.secondProjection(20).should.equal(projectionOn)
    p.secondProjection(27).should.equal(projectionOn)

  it "should project weakly if pos is greater than 2*start but determinate", ->
    p = new Points maxLen, 0, 4, 8
    p.secondProjection(17).should.equal(projectionWeak)

  it "should not project if an in-progress sound is indeterminate", ->
    p = new Points maxLen, 0, 4, 8
    p.secondProjection(19).should.equal(projectionOff)

  it "should project if a determinate second sound has been formed", ->
    p = new Points maxLen, 0, 4, 8, 12
    p.secondProjection().should.equal(projectionOn)
    p.secondProjection(10).should.equal(projectionOn)

  it "should project if a determinate pause is occurring", ->
    p = new Points maxLen, 0, 4, 8, 12
    p.secondProjection(14).should.equal(projectionOn)

  it "should not project if an indeterminate pause is occurring", ->
    p = new Points maxLen, 0, 4, 8, 12
    p.secondProjection(23).should.equal(projectionOff)
