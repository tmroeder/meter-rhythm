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

{Driver} = require "../src/driver.coffee"
{Points, states} = require "../src/state_machine.coffee"
{Draw, TextDraw} = require "../src/ui.coffee"
{Counts, Drawn, StateDraw, MockInput} = require "./mock_ui.coffee"

chai = require "chai"
expect = chai.expect
should = chai.should()

# setup creates and sets up mocks and a driver using those mocks.
# The latestCounts parameter causes the counts to only record the last draw()
# operation instead of all draw() operations. This can make tests clearer.
setup = (len, states, latestCounts=true) ->
  draw = new Draw 4
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
    else if "moveClick" of op
      input.move op.moveClick, 0
      input.click op.moveClick, 0

maxLen = 10
describe "The Driver class", ->
  it "should construct an instance with a Draw class", ->
    {draw, input, driver} = setup maxLen, states
    draw.state.text.should.have.property(Draw.comment)
    draw.state.text.should.have.property(Draw.message)
    draw.state.text.should.not.have.property("this is not a property")

  it "should move from start to sound1Starts on a click event", ->
    {draw, input, driver} = setup maxLen, states

    sendInput input, {click: 0}

    driver.cur.should.equal("sound1Starts")
    driver.points.points.length.should.equal(1)
    p = first: start: 0
    draw.state.lines.should.deep.equal(p)

  it "should stay in sound1Continues if the duration goes back to 0", ->
    {draw, input, driver} = setup maxLen, states

    sendInput input, {click: 0}, {move: 1}, {move: 0}

    driver.cur.should.equal("sound1Continues")

  it "should draw a sound and a projection for three determinate clicks", ->
    {draw, input, driver} = setup maxLen, states

    # Build the first event and the first entry of the second event.
    sendInput input, {click: 0}, {moveClick: 4}, {moveClick: 8}

    driver.cur.should.equal("sound2Starts")
    driver.points.points.length.should.equal(3)
    lines = first: {start: 0, end: 4}, second: {start: 8}
    projs = first: {normal: {start: 0, end: 8}, expected: {start: 8, end: 16}}
    draw.state.lines.should.deep.equal(lines)
    draw.state.projs.should.deep.equal(projs)

  it "should produce a projection for a sound with exactly the max length", ->
    {draw, input, driver} = setup maxLen, states

    sendInput input, {click: 0}, {moveClick: maxLen}
    lines = first: {start: 0, end: maxLen}
    projs = first: normal: {start: 0, end: maxLen}
    draw.state.lines.should.deep.equal(lines)
    draw.state.projs.should.deep.equal(projs)

  it "should not accept two clicks without intervening movement", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {click: 4}
    driver.cur.should.equal("sound1Starts")

  it "should draw two sounds and three projections for 4 determinate clicks " +
     "and one determinate movement", ->
    {draw, input, driver} = setup maxLen, states
    sendInput(input, {click: 0}, {moveClick: 4}, {moveClick: 8},
                     {moveClick: 12}, {move: 16})

    driver.cur.should.equal("pause2")
    driver.points.points.length.should.equal(4)
    draw.state.text.should.have.property(Draw.comment)
    draw.state.text.should.have.property(Draw.message)

    lines = first: {start: 0, end: 4}, second: {start: 8, end: 12}
    projs =
      first: normal: {start: 0, end: 8}, expected: {start: 8, end: 16}
      second: normal: {start: 8, end: 16}
    draw.state.lines.should.deep.equal(lines)
    draw.state.projs.should.deep.equal(projs)

  it "should not draw a projection for an indeterminate first sound", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {move: 20}
    draw.state.projs.should.be.empty

  it "should not draw a projection shorter than an existing first sound", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {moveClick: 4}, {move: 3}
    draw.state.projs.should.deep.equal(first: normal: {start: 0, end: 4})

  it "should not accept clicks if the first pause is negative", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {moveClick: 4}, {move: 3}
    driver.cur.should.equal("pause1Negative")
    sendInput input, {click: 3}
    driver.cur.should.equal("pause1Negative")

  it "should enter sound2StartsTooLong if sound two starts too late", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {moveClick: 6}, {move: 8}, {move: 12}
    driver.cur.should.equal("pause1")
    sendInput input, {click: 12}
    driver.cur.should.equal("sound2StartsTooLong")

  it "should change any initial click to a click at x = 0", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 4}
    driver.cur.should.equal("sound1Starts")
    driver.points.points[Points.sound1First].should.equal(0)

  it "should not draw a projection if the first inter-onset duration is too " +
     "long", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {moveClick: 4}, {move: 11}
    driver.cur.should.equal("pause1")
    draw.state.projs.should.be.empty

  it "should draw a sound and a weak projection for 3 clicks and a " +
     "move to a position that is late but not mensurally indeterminate", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {moveClick: 4}, {moveClick: 8}, {move: 17}
    driver.cur.should.equal("sound2ContinuesWithoutProjection")
    lines = first: {start: 0, end: 4}, second: {start: 8, end: 17}
    projs =
      first: normal: {start: 0, end: 8}, expected: {start: 8, end: 16}
      second: weak: {start: 8, end: 17}
    draw.state.lines.should.deep.equal(lines)
    draw.state.projs.should.deep.equal(projs)

  it "should not draw a second projection if the second sound continues too " +
     "long", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {moveClick: 4}, {moveClick: 8}, {move: 19}
    driver.cur.should.equal("sound2ContinuesTooLong")
    lines = first: {start: 0, end: 4}, second: {start: 8, end: 19}
    projs =
      first:
        normal: {start: 0, end: 8}
        expected: {start: 8, end: 16}
    draw.state.lines.should.deep.equal(lines)
    draw.state.projs.should.deep.equal(projs)

  it "should not draw a second projection if the second sound ends late", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {moveClick: 4}, {moveClick: 8}, {moveClick: 19}
    driver.cur.should.equal("sound2EndsTooLong")
    lines = first: {start: 0, end: 4}, second: {start: 8, end: 19}
    projs =
      first:
        normal: {start: 0, end: 8}
        expected: {start: 8, end: 16}
    draw.state.lines.should.deep.equal(lines)
    draw.state.projs.should.deep.equal(projs)

  it "should not draw a projection or line ending for a negative duration", ->
    {draw, input, driver} = setup maxLen, states
    sendInput(input, {click: 0}, {moveClick: 5}, {moveClick: 10}, {move: 11},
              {move: 9})
    driver.cur.should.equal("sound2ContinuesNegative")
    draw.state.lines[Draw.second].should.not.have.property(Draw.end)
    draw.state.projs.should.not.have.property(Draw.second)

  it "should not accept clicks if the second pause is negative", ->
    {draw, input, driver} = setup maxLen, states
    sendInput input, {click: 0}, {moveClick: 4}, {moveClick: 8}, {moveClick: 12}
    driver.cur.should.equal("sound2Ends")
    sendInput input, {move: 10}
    driver.cur.should.equal("pause2Negative")
    sendInput input, {click: 14}
    driver.cur.should.equal("pause2Negative")

  it "should draw three sounds and two projections for 5 determinate clicks", ->
    {draw, input, driver} = setup maxLen, states
    sendInput(input, {click: 0}, {moveClick: 4}, {moveClick: 8},
              {moveClick: 12}, {moveClick: 16})

    driver.cur.should.equal("sound3StartsExactly")
    lines =
      first: {start: 0, end: 4}
      second: {start: 8, end: 12}
      third: {start: 16, end: 20}
    projs =
      first:
        normal: {start: 0, end: 8}
        expected: {start: 8, end: 16}
    draw.state.lines.should.deep.equal(lines)
    draw.state.projs.should.deep.equal(projs)

  it "should draw an accelerando if the third sound starts early", ->
    {draw, input, driver} = setup maxLen, states
    sendInput(input, {click: 0}, {moveClick: 4}, {moveClick: 8},
              {moveClick: 12}, {moveClick: 13})
    driver.cur.should.equal("sound3StartsAccel")
    draw.state.accel.should.equal(13)

  it "should draw an decelerando if the third sound starts slightly late", ->
    {draw, input, driver} = setup maxLen, states
    sendInput(input, {click: 0}, {moveClick: 4}, {moveClick: 8},
              {moveClick: 12}, {moveClick: 17})
    driver.cur.should.equal("sound3StartsSlightlyLate")
    draw.state.decel.should.equal(17)

  it "should draw a new projection if the third sound starts late enough", ->
    {draw, input, driver} = setup maxLen, states
    sendInput(input, {click: 0}, {moveClick: 4}, {moveClick: 6},
              {moveClick: 10}, {moveClick: 15.5})
    driver.cur.should.equal("sound3StartsSlightlyLateNewProjection")
    draw.state.projs.should.have.property(Draw.third)
    draw.state.projs[Draw.third].should.deep.equal(normal: {start: 15.5, end: 19.5})

  it "should draw a hiatus for a long pause before the third onset", ->
    {draw, input, driver} = setup maxLen, states
    sendInput(input, {click: 0}, {moveClick: 2}, {moveClick: 4},
              {moveClick: 6}, {move: 7}, {moveClick: 20})
    driver.cur.should.equal("sound3StartsTooLate")
    draw.state.hiatus.should.equal(20)
