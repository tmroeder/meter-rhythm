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

{Points, states} = require "../meter_rhythm.coffee"
{TextDraw, UIError} = require "../meter_rhythm_ui.coffee"
{MockDraw} = require "./mock_ui.coffee"

chai = require "chai"
expect = chai.expect
should = chai.should()

describe "The TextDraw object", ->
  it "should succeed in its constructor", ->
    expect(TextDraw.bind(null)).to.not.throw(Error)
    expect(TextDraw.bind(null)).to.not.throw(undefined)
    expect(TextDraw.bind(null)).to.not.throw(null)
    expect(TextDraw.bind(null)).to.not.throw(UIError)

maxLen = 10
describe "The Draw class", ->
  it "should make the right calls for a simple state", ->
    state = "sound2Continues"
    p = new Points maxLen, 0, 4, 8
    m = new MockDraw()
    m.draw(p, state, states, 9)
    m.soundStartCount.should.equal(2)
    m.durationCount.should.equal(2)
    m.soundEndCount.should.equal(1)
    m.projectionCount.should.equal(2)
    m.weakProjectionCount.should.equal(0)
    m.messageCount.should.equal(1)
    m.commentCount.should.equal(1)
    m.hiatusCount.should.equal(0)
