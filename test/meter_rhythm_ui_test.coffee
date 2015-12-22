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

ui = require '../meter_rhythm_ui.coffee'
chai = require 'chai'
expect = chai.expect
should = chai.should()

##
## Test the TextDraw object.
##

describe 'The TextDraw object', ->
  it 'should succeed in its constructor', ->
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

describe 'The MockInput class', ->
  it 'should send movement events', ->
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
  it 'should send click events', ->
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

