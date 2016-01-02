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

{Counts, MockDraw, MockInput} = require "./mock_ui.coffee"

chai = require "chai"
expect = chai.expect
should = chai.should()

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
    c.dashedProj = 1
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

  it "should capture accel events", ->
    md = new MockDraw()
    md.drawAccel(50)
    md.counts.accel.should.equal(1)

  it "should capture decel events", ->
    md = new MockDraw()
    md.drawDecel(50)
    md.counts.decel.should.equal(1)

  it "should capture parens events", ->
    md = new MockDraw()
    md.drawParens(50, 100)
    md.counts.parens.should.equal(1)
