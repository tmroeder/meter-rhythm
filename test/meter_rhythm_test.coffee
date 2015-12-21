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

describe 'The declarative States object', ->
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

# A regular expression that describes a valid GraphViz edge for the states.
edgeRegex = /^\s*\w+ -> \w+$/

describe 'The writeGraph function', ->
  it 'should return a valid GraphViz graph', ->
    graph = meter.writeGraph(meter.states)
    lines = graph.split "\n"
    expect(lines).to.not.be.empty
    expect(line).to.match(edgeRegex) for line in lines
