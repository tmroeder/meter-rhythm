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

{Points} = require "./state_machine.coffee"

# UIError is thrown for error cases that happen in methods of the Draw
# classes.
exports.UIError = class UIError extends Error
  name: "UIError"
  constructor: (@message) ->

exports.State = class State
  constructor: (state) ->
    {
      @points = {}
      @lines = {}
      @projs = {}
      @text = {}
      @hiatus = 0
      @accel = 0
      @decel = 0
      @parens = 0
      @accent = 0
      @short = 0
    } = (state ? {})


# Draw gives the interface for Draw classes that can be used by the state
# machine states to draw themselves.
exports.Draw = class Draw
  # These values represent types of events that can occur.
  @first = "first"
  @second = "second"
  @third = "third"

  @start = "start"
  @end = "end"
  
  @proj = "normal"
  @weak = "weak"
  @exp = "expected"

  @comment = "comment"
  @message = "message"

  constructor: (state) -> @state = new State(state)

  # The default drawing function.
  draw: (points, state, states, cur) ->
    console.log state
    @write states[state].comment, Draw.comment
    @write states[state].message, Draw.message

    # Draw the start of the first sound.
    sound1Start = points.points[Points.sound1First]
    return unless sound1Start?
    @drawPoint sound1Start, Draw.first, Draw.start

    # Draw the dynamic components of the first sound.
    if cur? and cur != sound1Start and points.inFirstSound()
      @drawDuration sound1Start, cur, Draw.first

    sound1End = points.points[Points.sound1Second]

    # TODO(tmroeder): figure out exactly where the projection should be drawn.
    status = points.firstProjection(cur)
    if status == Points.projectionOn and points.points.length > 2
      end = points.points[Points.sound2First]
      difference = end - sound1Start
      @drawProjection sound1Start, end, Draw.first, Draw.proj
      @drawProjection end, end + difference, Draw.first, Draw.exp
    else if status == Points.projectionCurrent
      # Don't draw a projection that is shorter than an existing first sound.
      if sound1End? and cur < sound1End
        @drawProjection sound1Start, sound1End, Draw.first, Draw.proj
      else
        @drawProjection sound1Start, cur, Draw.first, Draw.proj

    # Draw the end of the first sound.
    return unless sound1End?
    @drawDuration sound1Start, sound1End, Draw.first
    @drawPoint sound1End, Draw.first, Draw.end

    # Draw the beginning of the second sound.
    sound2Start = points.points[Points.sound2First]
    return unless sound2Start?
    @drawPoint sound2Start, Draw.second, Draw.start

    # Draw the dynamic components of the second sound
    if cur? and cur > sound2Start and points.inSecondSound()
      @drawDuration sound2Start, cur, Draw.second

    status = points.secondProjection(cur)
    if status == Points.projectionOn or status == Points.projectionCurrent
      @drawProjection sound2Start, cur, Draw.second, Draw.proj
    else if points.secondProjection(cur) == Points.projectionWeak
      @drawProjection sound2Start, cur, Draw.second, Draw.weak

    # Draw the end of the second sound.
    sound2End = points.points[Points.sound2Second]
    return unless sound2End?

    @drawDuration sound2Start, sound2End, Draw.second
    @drawPoint sound2End, Draw.second, Draw.end

    # There are no dynamic components to the third sound, and its ending point
    # is defined simultaneously with its starting point.
    sound3Start = points.points[Points.sound3First]
    return unless sound3Start?

    accel = points.isAccel sound2Start, sound2End, sound3Start
    realized = points.isRealized sound2Start, sound2End, sound3Start

    sound3End = points.points[Points.sound3Second]
    if not sound3End?
      if accel or realized
        points.pushPoint 2 * sound2Start
      else
        points.pushPoint sound3Start + @shortSoundLength()
      sound3End = points.points[Points.sound3Second]

    @drawPoint sound3Start, Draw.third, Draw.start
    @drawDuration sound3Start, sound3End, Draw.third
    @drawPoint sound3End, Draw.third, Draw.end

    sound3Length = sound3End - sound3Start

    if accel
      @drawAccel sound3Start
    else if realized
      if state == "sound3StartsRealized"
        @drawProjection sound3Start, sound3End, Draw.third, Draw.dashed
        @drawParens sound3Start
      else if state == "sound3StartsAltInterpretation"
        @drawAccent sound3Start
        @drawProjection sound3Start, sound3End + sound3Length, Draw.third,
                        Draw.proj
    else if points.isSlightlyLate sound2Start, sound3Start
      @drawDecel sound3Start
    else if points.isSlightlyLateNewProjection sound2Start, sound3Start
      @drawProjection sound3Start, sound3End, Draw.third, Draw.proj
    else if not points.isDeterminate sound2Start, sound3Start
      @drawHiatus sound3Start
      @drawProjection sound3Start, sound3End + sound3Length, Draw.third,
                      Draw.proj

  # drawPoint draws the beginning or end of a sound.
  drawPoint: (pos, soundName, soundType) ->
    if soundName not in @state.points
      @state.points[soundName] = {}
    @state.points[soundName][soundType] = pos

  # drawDuration draws the length of a duration.
  drawDuration: (start, end, soundName) ->
    if soundName not in @state.lines
      @state.lines[soundName] = {}
    @state.lines[soundName][Draw.start] = start
    @state.lines[soundName][Draw.end] = end

  # drawProjection draws a projection, potentially one that is not realized.
  drawProjection: (start, end, soundName, projType) ->
    if soundName not in @state.proj
      @state.proj[soundName] = {}
    sound = @state.proj[soundName]
    if projType not in sound
      sound[projType] = {}
    sound[projType][Draw.start] = start
    sound[projType][Draw.end] = end

  # write outputs text. The valid text types are Draw.comment and Draw.message.
  write: (text, textType) -> @state.text[textType] = text

  # drawHiatus outputs something that represents a hiatus.
  drawHiatus: (pos) -> @state.hiatus = pos

  # drawAccel outputs a representation of an accelerando at the given position.
  drawAccel: (pos) -> @state.accel = pos

  # drawDecel outputs a representation of an decelerando at the given position.
  drawDecel: (pos) -> @state.decel = pos

  # drawParens outpus a representation of parentheses bracketing the range start
  # to end.
  drawParens: (pos) -> @state.parens = pos

  # drawAccent outputs an accent mark at the given point.
  drawAccent: (pos) -> @state.accent = pos

  # shortSoundLength returns the length that should be used for a short sound,
  # like for some of the cases in the third sound (the ones that are past the
  # projected duration). There's no reasonable default, so this has to be
  # handled by subclasses.
  shortSoundLength: -> throw new UIError("shortSoundLength not implemented")

# TextDraw is a Draw class that is used to output elements of the simulation.
exports.TextDraw = class TextDraw extends Draw
  constructor: ->
    super()

  draw: (points, state, states, cur) ->
    super(points, state, states, cur)
    console.log @state

  # shortSoundLength returns the length that should be used for a short sound,
  # like for some of the cases in the third sound (the ones that are past the
  # projected duration).
  shortSoundLength: -> 20

# The Input class is an interface for registering input handlers. Subclasses
# need to provide a connection to a source of input events.
exports.Input = class Input
  constructor: ->
    throw new UIError("The Input class cannot be constructed directly")

  # registerMove takes a function and registers it to receive notification
  # when movement occurs. The function will be called as fn(x, y) where (x, y)
  # is the current position.
  registerMove: (fn) -> throw new UIError("registerMove is not implemented")

  # registerClick takes a function and registers it to receive notification
  # when a click occurs. The function will be called as fn(x, y), where (x, y)
  # is the current position.
  registerClick: (fn) -> throw new UIError("registerClick is not implemented")
