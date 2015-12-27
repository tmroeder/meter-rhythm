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

{Points} = require "./meter_rhythm.coffee"

# UIError is thrown for error cases that happen in methods of the Draw
# classes.
exports.UIError = class UIError extends Error
  name: "UIError"
  constructor: (message) ->
    @message = message

# Draw gives the interface for Draw classes that can be used by the state
# machine states to draw themselves.
exports.Draw = class Draw
  constructor: ->
    throw new UIError("Draw cannot be constructed directly")

  # The default drawing function.
  draw: (points, state, states, cur) ->
    @writeComment states[state].comment
    @writeMessage states[state].message

    # Draw the start of the first sound.
    sound1Start = points.points[Points.sound1First]
    return unless sound1Start?
    @drawSoundStart sound1Start

    # Draw the dynamic components of the first sound.
    if cur? and cur != sound1Start and points.inFirstSound()
      @drawDuration sound1Start, cur

    # TODO(tmroeder): figure out exactly where the projection should be drawn.
    status = points.firstProjection(cur)
    if status == Points.projectionOn and points.points.length > 2
      end = points.points[Points.sound2First]
      difference = end - sound1Start
      @drawProjection sound1Start, end, false
      @drawExpectedProjection end, end + difference, false
    else if status == Points.projectionCurrent
      @drawProjection sound1Start, cur, false

    # Draw the end of the first sound.
    sound1End = points.points[Points.sound1Second]
    return unless sound1End?

    @drawDuration sound1Start, sound1End
    @drawSoundEnd sound1End

    # Draw the beginning of the second sound.
    sound2Start = points.points[Points.sound2First]
    return unless sound2Start?
    @drawSoundStart sound2Start

    # Draw the dynamic components of the second sound
    if cur? and cur != sound2Start and points.inSecondSound()
      @drawDuration sound2Start, cur

    status = points.secondProjection(cur)
    if status == Points.projectionOn or status == Points.projectionCurrent
      @drawProjection sound2Start, cur, false
    else if points.secondProjection(cur) == Points.projectionWeak
      @drawProjection sound2Start, cur, true

    # Draw the end of the second sound.
    sound2End = points.points[Points.sound2Second]
    return unless sound2End?

    @drawDuration sound2Start, sound2End
    @drawSoundEnd sound2End

    # There are no dynamic components to the third sound, and its ending point
    # is defined simultaneously with its starting point.
    sound3Start = points.points[Points.sound3First]
    sound3End = points.points[Points.sound3Second]
    return unless sound3Start? and sound3End?
    @drawSoundStart sound3Start
    @drawDuration sound3Start, sound3End
    @drawSoundEnd sound3End

  # drawSoundStart draws the beginning of a sound.
  drawSoundStart: (x) -> throw new UIError('not implemented')

  # drawDuration draws the length of a duration.
  drawDuration: (start, end) -> throw new UIError('not implemented')

  # drawSoundEnd draws the endpoint of a sound.
  drawSoundEnd: (x) -> throw new UIError('not implemented')

  # drawProjection draws a projection, potentially one that is not realized.
  drawProjection: (start, end, weak) -> throw new UIError('not implemented')

  # drawExpected draws a projection that is expected to be realized.
  drawExpectedProjection: (start, end) -> throw new UIError('not implemented')

  # writeComment outputs comment text.
  writeComment: (text) -> throw new UIError('not implemented')

  # writeMessage outputs message text.
  writeMessage: (text) -> throw new UIError('not implemented')

  # drawHiatus outputs something that represents a hiatus.
  drawHiatus: (pos) -> throw new UIError('not implemented')

# TextDraw is a Draw class that is used to output elements of the simulation.
exports.TextDraw = class TextDraw extends Draw
  constructor: -> return

  # drawSoundStart draws the beginning of a sound.
  drawSoundStart: (x) -> console.log "Sound started at position #{x}"

  # drawDuration draws the length of a duration.
  drawDuration: (start, end) -> console.log "Duration from #{start} to #{end}"

  # drawSoundEnd draws the endpoint of a sound.
  drawSoundEnd: (x) -> console.log "Sound ended at position #{x}"

  # drawProjection draws a projection, potentially one that is not realized.
  drawProjection: (start, end, weak) ->
    if weak
      console.log "Weak projection from #{start} to #{end}"
    else
      console.log "Projection from #{start} to #{end}"

  # drawExpectedProjection draws a projection that is expected to be realized.
  drawExpectedProjection: (start, end) ->
    console.log "Expected projection from #{start} to #{end}"

  # writeComment outputs comment text.
  writeComment: (text) -> console.log "\nComment: #{text}"

  # writeMessage outputs message text.
  writeMessage: (text) -> console.log "Message: #{text}"

  # drawHiatus outputs something that represents a hiatus.
  drawHiatus: (pos) -> console.log "Hiatus occurs at #{pos}"

# The Input class is an interface for registering input handlers. Subclasses
# need to provide a connection to a source of input events.
exports.Input = class Input
  constructor: ->
    throw new UIError("The Input class cannot be constructed directly")

  # registerMove takes a function and registers it to receive notification
  # when movement occurs. The function will be called as fn(x, y) where (x, y)
  # is the current position.
  registerMove: (fn) -> return

  # registerClick takes a function and registers it to receive notification
  # when a click occurs. The function will be called as fn(x, y), where (x, y)
  # is the current position.
  registerClick: (fn) -> return
