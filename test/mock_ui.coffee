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

{Draw, Input} = require "../src/ui.coffee"

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

exports.Counts = class Counts
  constructor: (counts) ->
    {
      @start = 0
      @line = 0
      @end = 0
      @proj = 0
      @dashedProj = 0
      @expectProj = 0
      @comment = 0
      @message = 0
      @hiatus = 0
      @accel = 0
      @decel = 0
      @parens = 0
      @accent = 0
      @short = 0
    } = (counts ? {})

# MockDraw tracks the draw events that have been sent to it.
exports.MockDraw = class MockDraw extends Draw
  constructor: (latest) ->
    @counts = new Counts()
    @latest = latest ? false

  # draw calls the parent Draw class but resets the Counts if @latest is set.
  draw: (points, state, states, cur) ->
    @counts = new Counts() if @latest
    super(points, state, states, cur)

  # drawSoundStart draws the starting point of a sound.
  drawSoundStart: (x) -> @counts.start++

  # drawDuration draws the length of a duration.
  drawDuration: (start, end) -> @counts.line++

  # drawSoundEnd draws the endpoint of a sound.
  drawSoundEnd: (x) -> @counts.end++

  # drawProjection draws a projection, potentially one that is not realized.
  drawProjection: (start, end, dashed) ->
    if dashed
      @counts.dashedProj++
    else
      @counts.proj++

  # drawExpectedProjection draws a projection that is expected to be realized.
  drawExpectedProjection: (start, end) -> @counts.expectProj++

  # writeComment outputs comment text.
  writeComment: (text) -> @counts.comment++

  # writeMessage outputs message text.
  writeMessage: (text) -> @counts.message++

  # drawHiatus outputs something that represents a hiatus.
  drawHiatus: (pos) -> @counts.hiatus++

  # drawAccel outputs a representation of an accelerando at the given position.
  drawAccel: (pos) -> @counts.accel++

  # drawDecel outputs a representation of an decelerando at the given position.
  drawDecel: (pos) -> @counts.decel++

  # drawParens outpus a representation of parentheses bracketing the range start
  # to end.
  drawParens: (pos) -> @counts.parens++

  # drawAccent outputs an accent mark at the given point.
  drawAccent: (pos) -> @counts.accent++

  # shortSoundLength returns the length that should be used for a short sound,
  # like for some of the cases in the third sound (the ones that are past the
  # projected duration). Since it doesn't matter for a Mock UI, this returns 20.
  shortSoundLength: ->
    @counts.short++
    20
