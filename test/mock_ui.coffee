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

{Draw, Input} = require "../meter_rhythm_ui.coffee"
chai = require "chai"
expect = chai.expect
should = chai.should()

# MockInput is an Input class that can be used to programmatically drive tests
# over the input-dependent code.
exports.MockInput = class MockInput extends Input
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
exports.MockDraw = class MockDraw extends Draw
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
