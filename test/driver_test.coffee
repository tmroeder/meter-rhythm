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

{Driver} = require "../driver.coffee"
{Points, states} = require "../meter_rhythm.coffee"
{Counts, MockDraw, MockInput} = require "./mock_ui.coffee"

chai = require "chai"
expect = chai.expect
should = chai.should()

maxLen = 10
describe "The Driver class", ->
  it "should construct an instance with mock UI", ->
    mockDraw = new MockDraw()
    mockInput = new MockInput()
    d = new Driver maxLen, states, mockInput, mockDraw
    c = new Counts comment: 1, message: 1
    mockDraw.counts.should.deep.equal(c)

  it "should move from start to sound1Starts on a click event", ->
    mockDraw = new MockDraw()
    mockInput = new MockInput()
    d = new Driver maxLen, states, mockInput, mockDraw

    mockInput.click 0, 0

    d.cur.should.equal("sound1Starts")
    d.points.points.length.should.equal(1)

    c = new Counts comment: 2, message: 2, start: 1
    mockDraw.counts.should.deep.equal(c)
