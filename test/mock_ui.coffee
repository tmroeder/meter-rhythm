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
  constructor: ->
    @moveRegistry = []
    @clickRegistry = []

  registerMove: (fn) ->
    @moveRegistry.push fn

  registerClick: (fn) ->
    @clickRegistry.push fn

  # move is a method used to mock movement events to registered functions.
  move: (x, y) ->
    for fn in @moveRegistry
      fn? x, y

  # click is a method used to mock click events to registered functions.
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
    m.registerMove(fn)
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
    m.registerClick(fn)
    m.click(2, 2)
    expect(latestX).to.equal(2)
    expect(latestY).to.equal(2)

exports.Counts = class Counts
  constructor: (counts) ->
    {
      @start = 0
      @line = 0
      @end = 0
      @proj = 0
      @weakProj = 0
      @comment = 0
      @message = 0
      @hiatus = 0
    } = (counts ? {})

# MockDraw tracks the draw events that have been sent to it.
exports.MockDraw = class MockDraw extends Draw
  constructor: ->
    @counts = new Counts()

  # drawSoundStart draws the starting point of a sound.
  drawSoundStart: (x) -> @counts.start++

  # drawDuration draws the length of a duration.
  drawDuration: (start, end) -> @counts.line++

  # drawSoundEnd draws the endpoint of a sound.
  drawSoundEnd: (x) -> @counts.end++

  # drawProjection draws a projection, potentially one that is not realized.
  drawProjection: (start, end, weak) ->
    if weak
      @counts.weakProj++
    else
      @counts.proj++

  # writeComment outputs comment text.
  writeComment: (text) -> @counts.comment++

  # writeMessage outputs message text.
  writeMessage: (text) -> @counts.message++

  # drawHiatus outputs something that represents a hiatus.
  drawHiatus: (pos) -> @counts.hiatus++

describe "The MockDraw class", ->
  it "should capture start events", ->
    md = new MockDraw()
    md.drawSoundStart(50)
    md.counts.start.should.equal(1)

  it "should capture duration events", ->
    md = new MockDraw()
    md.drawDuration(50, 100)
    md.counts.line.should.equal(1)

  it "should capture end events", ->
    md = new MockDraw()
    md.drawSoundEnd(50)
    md.counts.end.should.equal(1)

  it "should capture projection events", ->
    md = new MockDraw()
    md.drawProjection(50, 100, false)
    c = new Counts proj: 1
    md.counts.should.deep.equal(c)

    md.drawProjection(150, 200, true)
    c.weakProj = 1
    md.counts.should.deep.equal(c)

  it "should capture comment events", ->
    md = new MockDraw()
    md.writeComment("Test comment")
    md.counts.comment.should.equal(1)

  it "should capture message events", ->
    md = new MockDraw()
    md.writeMessage("Test message")
    md.counts.message.should.equal(1)

  it "should capture hiatus events", ->
    md = new MockDraw()
    md.drawHiatus(50)
    md.counts.hiatus.should.equal(1)
