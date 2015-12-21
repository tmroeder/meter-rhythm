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
   
meter = require '../meter_rhythm.coffee'
chai = require 'chai'
expect = chai.expect
should = chai.should()

projectionOff = meter.Points.projectionOff
projectionOn = meter.Points.projectionOn
projectionBroken = meter.Points.projectionBroken

##
## Test the states object
##

describe 'The states object', ->
  states = meter.states
  it 'should have a start state', ->
    states.should.have.property 'start'
  it 'should have at least one end state', ->
    endNodes = (src for src, val of states when 'start' of val.transitions)
    expect(endNodes).to.not.be.empty
  it 'should be able to reach every node from start', ->
    visited = meter.visit(states)
    unvisited = (src for src, val of visited when !val)
    expect(unvisited).to.be.empty

##
## Test the graph-writing function.
##

# A regular expression that describes a valid GraphViz edge for the states.
edgeRegex = /^\s*\w+ -> \w+$/

describe 'The writeGraph function', ->
  it 'should return a graph that matches its input', ->
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
    graph = meter.writeGraph(states)
    expected = "  start -> second\n  second -> end\n  second -> start\n  " +
               "end -> second"
    expect(graph).to.not.be.empty
    graph.should.equal(expected)
  it 'should return a valid GraphViz graph', ->
    graph = meter.writeGraph(meter.states)
    lines = graph.split "\n"
    expect(lines).to.not.be.empty
    expect(line).to.match(edgeRegex) for line in lines

##
## Test the Points class and its push/pop methods.
##

maxLen = 100
describe 'The Points class', ->
  it 'should allow points to be added', ->
    p = new meter.Points maxLen, 13
  it 'should throw in the constructor if given too many points', ->
    expect(meter.Points.bind(null, maxLen, [0..7]...)).to.throw(
      meter.PointError, 'too many points')
  it 'should throw a PointError if more than 6 points are added', ->
    p = new meter.Points maxLen, [13..18]...
    expect(p.pushPoint.bind(p, 20)).to.throw(meter.PointError,
                                            'all points already defined')
  it 'should fail popPoint when no points are present', ->
    p = new meter.Points maxLen
    expect(p.popPoint.bind(p)).to.throw(meter.PointError, 'no points to remove')
  it 'should pop a point when popPoint is called', ->
    p = new meter.Points maxLen, [13..18]...
    x = p.popPoint()
    expect(x).to.exist
    expect(p.pushPoint.bind(p, 20)).to.not.throw(Error)

##
## Test the projection calculations for the first length.
##

maxLen = 10
describe 'The first length', ->
  it 'should project if an in-progress sound is determinate', ->
    p = new meter.Points maxLen, 0
    p.projectFirstLength(8).should.equal(projectionOn)
  it 'should not project if an in-progress sound is indeterminate', ->
    p = new meter.Points maxLen, 0
    p.projectFirstLength(11).should.equal(projectionOff)
  it 'should not project if a completed first sound is indeterminate', ->
    p = new meter.Points maxLen, 0, 11
    p.projectFirstLength().should.equal(projectionOff)
  it 'should project if a completed first sound is determinate', ->
    p = new meter.Points maxLen, 0, 1
    p.projectFirstLength().should.equal(projectionOn)

##
## Test the projection calculations for the second length.
##

describe 'The second length', ->
  it 'should not project outside the second sound and subsequent pause', ->
    p = new meter.Points maxLen, [0..5]...
    p.projectSecondLength().should.equal(projectionOff)
