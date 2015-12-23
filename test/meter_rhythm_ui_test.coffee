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

meter = require "../meter_rhythm.coffee"
ui = require "../meter_rhythm_ui.coffee"
chai = require "chai"
expect = chai.expect
should = chai.should()

##
## Test the TextDraw object.
##

describe "The TextDraw object", ->
  it "should succeed in its constructor", ->
    expect(ui.TextDraw.bind(null)).to.not.throw(Error)
    expect(ui.TextDraw.bind(null)).to.not.throw(undefined)
    expect(ui.TextDraw.bind(null)).to.not.throw(null)
    expect(ui.TextDraw.bind(null)).to.not.throw(ui.UIError)

# MockInput is an Input class that can be used to programmatically drive tests
# over the input-dependent code.
class MockInput extends ui.Input
  constructor: () ->
    @moveRegistry = []
    @clickRegistry = []

  registerMouseMove: (fn) ->
    @moveRegistry.push fn

  registerMouseUp: (fn) ->
    @clickRegistry.push fn

  # move is a method used to mock mouse movement events to registered functions.
  move: (x, y) ->
    for fn in @moveRegistry
      fn? x, y

  # click is a method used to mock mouse click events to registered functions.
  click: (x, y) ->
    for fn in @clickRegistry
      fn? x, y

describe "The MockInput class", ->
  it "should send movement events", ->
    latestX = 0
    latestY = 0
    fn = (x, y) ->
      latestX = x
      latestY = y
    m = new MockInput()
    m.registerMouseMove(fn)
    m.move(1, 1)
    expect(latestX).to.equal(1)
    expect(latestY).to.equal(1)

  it "should send click events", ->
    latestX = 0
    latestY = 0
    fn = (x, y) ->
      latestX = x
      latestY = y
    m = new MockInput()
    m.registerMouseUp(fn)
    m.click(2, 2)
    expect(latestX).to.equal(2)
    expect(latestY).to.equal(2)

# MockDraw tracks the draw events that have been sent to it.
class MockDraw extends ui.Draw
  constructor: ->
    @soundStartCount = 0
    @durationCount = 0
    @soundEndCount = 0
    @projectionCount = 0
    @weakProjectionCount = 0
    @commentCount = 0
    @messageCount = 0
    @hiatusCount = 0

  drawSoundStart: (x) -> @soundStartCount++

  # drawDuration draws the length of a duration.
  drawDuration: (start, end) -> @durationCount++

  # drawSoundEnd draws the endpoint of a sound.
  drawSoundEnd: (x) -> @soundEndCount++

  # drawProjection draws a projection, potentially one that is not realized.
  drawProjection: (start, end, weak) ->
    if weak
      @weakProjectionCount++
    else
      @projectionCount++

  # writeComment outputs comment text.
  writeComment: (text) -> @commentCount++

  # writeMessage outputs message text.
  writeMessage: (text) -> @messageCount++

  # drawHiatus outputs something that represents a hiatus.
  drawHiatus: (pos) -> @hiatusCount++


describe "The MockDraw class", ->
  md = new MockDraw()
  it "should capture start events", ->
    md.drawSoundStart(50)
    md.soundStartCount.should.equal(1)

  it "should capture duration events", ->
    md.drawDuration(50, 100)
    md.durationCount.should.equal(1)

  it "should capture end events", ->
    md.drawSoundEnd(50)
    md.soundEndCount.should.equal(1)

  it "should capture projection events", ->
    md.drawProjection(50, 100, false)
    md.projectionCount.should.equal(1)
    md.weakProjectionCount.should.equal(0)

    md.drawProjection(150, 200, true)
    md.projectionCount.should.equal(1)
    md.weakProjectionCount.should.equal(1)

  it "should capture comment events", ->
    md.writeComment("Test comment")
    md.commentCount.should.equal(1)

  it "should capture message events", ->
    md.writeMessage("Test message")
    md.messageCount.should.equal(1)

  it "should capture hiatus events", ->
    md.drawHiatus(50)
    md.hiatusCount.should.equal(1)

maxLen = 10
describe "The Draw class", ->
  it "should make the right calls for a simple state", ->
    state = "sound2Continues"
    states = meter.states
    p = new meter.Points maxLen, 0, 4, 8
    m = new MockDraw()
    m.draw(p, state, states, 9)
    m.soundStartCount.should.equal(2)
    m.durationCount.should.equal(2)
    m.soundEndCount.should.equal(1)
    m.projectionCount.should.equal(1)
    m.weakProjectionCount.should.equal(0)
    m.messageCount.should.equal(1)
    m.commentCount.should.equal(1)
    m.hiatusCount.should.equal(0)
