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

{Points, states} = require "../src/state_machine.coffee"
{Draw, TextDraw, UIError} = require "../src/ui.coffee"

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
shortSoundLen = 20
describe "The Draw class", ->
  it "should capture start events", ->
    d = new Draw(shortSoundLen)
    d.drawPoint(50, Draw.first, Draw.start)
    lines = first: start: 50
    d.state.lines.should.deep.equal(lines)

  it "should capture duration events", ->
    d = new Draw(shortSoundLen)
    d.drawDuration(50, 100, Draw.first)
    lines = first: {start: 50, end: 100}
    d.state.lines.should.deep.equal(lines)

  it "should capture end events", ->
    d = new Draw(shortSoundLen)
    d.drawPoint(50, Draw.first, Draw.end)
    lines = first: end: 50
    d.state.lines.should.deep.equal(lines)

  it "should capture projection events", ->
    d = new Draw(shortSoundLen)
    d.drawProjection(50, 100, Draw.first, Draw.proj)
    projs = first: {normal: {start: 50, end: 100}}
    d.state.projs.should.deep.equal(projs)

  it "should capture weak projection events", ->
    d = new Draw(shortSoundLen)
    d.drawProjection(50, 100, Draw.second, Draw.weak)
    projs = second: {weak: {start: 50, end: 100}}
    d.state.projs.should.deep.equal(projs)

  it "should capture expected projection events", ->
    d = new Draw(shortSoundLen)
    d.drawProjection(50, 100, Draw.third, Draw.exp)
    projs = third: {expected: {start: 50, end: 100}}
    d.state.projs.should.deep.equal(projs)

  it "should capture comment events", ->
    d = new Draw(shortSoundLen)
    d.write("Test comment", Draw.comment)
    d.state.text.should.deep.equal(comment: "Test comment")

  it "should capture message events", ->
    d = new Draw(shortSoundLen)
    d.write("Test message", Draw.message)
    d.state.text.should.deep.equal(message: "Test message")

  it "should capture hiatus events", ->
    d = new Draw(shortSoundLen)
    d.drawHiatus(50)
    d.state.hiatus.should.equal(50)

  it "should capture accel events", ->
    d = new Draw(shortSoundLen)
    d.drawAccel(50)
    d.state.accel.should.equal(50)

  it "should capture decel events", ->
    d = new Draw(shortSoundLen)
    d.drawDecel(50)
    d.state.decel.should.equal(50)

  it "should capture parens events", ->
    d = new Draw(shortSoundLen)
    d.drawParens(50)
    d.state.parens.should.equal(50)
