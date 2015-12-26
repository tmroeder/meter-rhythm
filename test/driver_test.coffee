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
{TextDraw} = require "../meter_rhythm_ui.coffee"
{Counts, MockDraw, MockInput} = require "./mock_ui.coffee"

chai = require "chai"
expect = chai.expect
should = chai.should()

# setup creates and sets up mocks and a driver using those mocks.
setup = (len, states) ->
  draw = new MockDraw()
  input = new MockInput()
  driver = new Driver len, states, input, draw
  {draw: draw, input: input, driver: driver}

# sendInput performs a series of moves and clicks given by a list.
sendInput = (input, ops...) ->
  for op in ops
    if "move" of op
      input.move op.move, 0
    else if "click" of op
      input.click op.click, 0

maxLen = 10
describe "The Driver class", ->
  it "should construct an instance with mock UI", ->
    {draw, input, driver} = setup maxLen, states
    c = new Counts comment: 1, message: 1
    draw.counts.should.deep.equal(c)

  it "should move from start to sound1Starts on a click event", ->
    {draw, input, driver} = setup maxLen, states

    input.click 0, 0

    driver.cur.should.equal("sound1Starts")
    driver.points.points.length.should.equal(1)

    c = new Counts comment: 2, message: 2, start: 1
    draw.counts.should.deep.equal(c)

  it "should draw a sound and a projection for three determinate clicks", ->
    {draw, input, driver} = setup maxLen, states

    # Build the first event and the first entry of the second event.
    sendInput input, {click: 0}, {move: 4}, {click: 4}, {move: 8}, {click: 8}

    driver.cur.should.equal("sound2Starts")
    driver.points.points.length.should.equal(3)
    c = new Counts {
      comment: 6, message: 6, start: 6, line: 4, end: 3, proj: 4, expectProj: 1
    }
    draw.counts.should.deep.equal(c)

  it "should not accept two clicks without intervening movement.", ->
    return

  it "should draw two sounds and three projections for 4 determinate clicks " +
     "and one determinate movement.", ->
    {draw, input, driver} = setup maxLen, states
    sendInput(input, {click: 0}, {move: 4}, {click: 4}, {move: 8}, {click: 8},
              {move: 12}, {click: 12}, {move: 16})

    driver.cur.should.equal("pause2")
    driver.points.points.length.should.equal(4)
    c = new Counts {
      comment: 9, message: 9, start: 12, line: 10, end: 8, proj: 10,
      expectProj: 4
    }
    draw.counts.should.deep.equal(c)

  it "should not draw a projection for an indeterminate first sound.", ->
    return

  it "should not accept clicks if the first pause is negative.", ->
    return

  it "should not draw a projection if the first inter-onset duration is too " +
     "long.", ->
    return

  it "should draw a sound and a weak projection for 3 clicks and an " +
     "move to a position that is late but not mensurally indeterminate.", ->
    return

  it "should not draw a second projection if the second sound continues too " +
     "long.", ->
    return

  it "should not draw a second projection if the second sound ends late.", ->
    return

  it "should not accept clicks if the second pause is negative.", ->
    return

  it "should draw three sounds and two realized projections for 5 " +
     "determinate clicks.", ->
    return

  it "should draw an accelerando if the third sound starts early.", ->
    return

  it "should draw an decelerando if the third sound starts slightly late.", ->
    return

  it "should draw a new projection if the third sound starts late enough.", ->
    return

  it "should draw three sounds, two projections, and a future projection for " +
     "5 clicks with the last one exactly matching the projection of the " +
     "first inter-onset duration.", ->
    return

  it "should draw a hiatus for an long pause before the third onset.", ->
    return
