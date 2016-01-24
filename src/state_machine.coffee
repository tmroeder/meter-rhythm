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

# The states object holds the state machine for the simulation. It consists of a
# set of named states (like "start"), each with a comment and a message. The
# comment provides an interpretation of the current state, and the message
# suggests actions to take in the current state.

# TODO(tmroeder): write a function that operates over the states and moves them
# through the state machine by receiving input from an input class and writing
# output to a UI. Maybe have the states in a separate state_machine.coffee file,
# along with this driver.
exports.states =
  # The starting state of the program.
  start:
    comment: "This demonstrates the concepts in Chapter 7 of Christopher " +
             "Hasty's 'Meter as Rhythm'. Imagine time 0 as an instant that " +
             "is a potential beginning of a sound, yet prior to and " +
             "independent of it."
    message: "You may perform graphically up to three successive sounds by " +
             "clicking and moving the mouse. First, click the mouse at time " +
             "0, the leftmost point, but don't move it."
    transitions:
      sound1Starts: true
    clickHandler: -> "sound1Starts"

  ##
  ## Sound 1
  ##
  
  # The beginning of the first sound. 
  sound1Starts:
    comment: "The first sound begins, but time 0 will not be a beginning " +
             "until it is past."
    message: "Perform the first sound by moving the mouse to the right."
    transitions:
      sound1Continues: true
    moveHandler: -> "sound1Continues"

  # The first sound continues and isn't too long.
  sound1Continues:
    comment: "The first sound is becoming. Time 0 becomes its beginning. " +
             "'Projective potential'--the potential of a duration to be " +
             "reproduced by a successive duration--accumulates, as indicated " +
             "by the solid arc."
    message: "End the first sound by clicking the mouse."
    transitions:
      sound1Continues: true
      sound1ContinuesTooLong: true
      sound1Ends: true
    moveHandler: (points, x) ->
      startPoint = points.points[Points.sound1First]
      if startPoint < x and not points.isDeterminate(startPoint, x)
        return "sound1ContinuesTooLong"
      "sound1Continues"
    clickHandler: -> "sound1Ends"

  # The first sound is too long.
  sound1ContinuesTooLong:
    comment: "The first sound's duration is so long that it is 'mensurally " +
             "indeterminate'--it has lost its projective potential to be " +
             "reproduced."
    message: "To make the first sound's duration determinate, move the mouse " +
             "back to the left. Or click to end the sound."
    transitions:
      sound1Continues: true
      sound1ContinuesTooLong: true
      sound1EndsTooLong: true
    moveHandler: (points, x) ->
      if not points.isDeterminate(points.points[Points.sound1First], x)
        return "sound1ContinuesTooLong"
      "sound1Continues"
    clickHandler: -> "sound1EndsTooLong"

  # The first sound ends with a length that isn't too long.
  sound1Ends:
    comment: "The first sound ends. Its duration is 'mensurally determinate' " +
             "because it has the potential for being precisely reproduced."
    message: "To begin the second sound, click the mouse."
    transitions:
      pause1: true
      pause1Negative: true
    moveHandler: (points, x) ->
      if x < points.points[Points.sound1Second]
        return "pause1Negative"
      "pause1"
  
  # The first sound ends with a length that exceeds kMaxSoundLen.
  sound1EndsTooLong:
    comment: "The first sound ends; it is too long to have projective " +
             "potential."
    message: "Click on the Restart button to try again."
    transitions:
      start: true

  ##
  ## Pause 1
  ##

  # There is a pause between the first and second sounds.
  pause1:
    comment: "There is a pause between the first two sounds. Its duration is " +
             "relatively indeterminate, if our attention is focused on the " +
             "beginning of sounds. The growing arc indicates that the " +
             "duration of the first sound *plus* the following silence " +
             "itself has the 'projective potential' to be reproduced."
    message: "Click the mouse to begin the second sound."
    transitions:
      pause1: true
      pause1Negative: true
      sound2Starts: true
      sound2StartsTooLong: true
    # TODO(tmroeder): should there be a pause1TooLong?
    moveHandler: (points, x) ->
      if points.points[Points.sound1Second] > x
        return "pause1Negative"
      "pause1"
    clickHandler: (points, x) ->
      if not points.isDeterminate(points.points[Points.sound1First], x)
        return "sound2StartsTooLong"
      "sound2Starts"

  # The pause between sounds can't be negative.
  pause1Negative:
    # The comment does not change from pause1.
    comment: ""
    message: "Click the mouse at the end of the first sound or later."
    transitions:
      pause1: true
      pause1Negative: true
    moveHandler: (points, x) ->
      if x < points.points[Points.sound1Second]
        return "pause1Negative"
      "pause1"

  ##
  ## Sound 2
  ##

  # The beginning of the second sound.
  sound2Starts:
    comment: "This beginning of the second sound 'realizes' the projective " +
             "potential of the duration begun by the first event's attack. " +
             "The solid arrow represents this projective potential. The " +
             "event now beginning has the potential to reproduce this past " +
             "duration. The dotted arc, extending for this duration into the " +
             "future, symbolizes this 'projected potential'."
    message: "Perform the second sound by moving the mouse to the right."
    transitions:
      sound2Continues: true
    moveHandler: (points, x) ->
      start = points.points[Points.sound2First]
      if points.isWeakDeterminate(start, x)
        return "sound2ContinuesWithoutProjection"
      else if points.isDeterminate(start, x)
        return "sound2Continues"
      "sound2ContinuesTooLong"

  # The beginning of the second sound after too long a duration since the first
  # sound started.
  sound2StartsTooLong:
    comment: "The second sound begins. It is so long since the beginning of " +
             "the first event that the interonset duration is mensurally " +
             "indeterminate--it has no potential to be reproduced--so there " +
             "is no projection."
    message: "Click on the 'Back one step' button to select an earlier " +
             "beginning for the second sound, or click 'Restart'."
    transitions:
      pause1: true
      start: true

  # The second sound continues and is not too long.
  sound2Continues:
    comment: "The accumulating duration of the second sound is realizing the " +
             "projected potential (symbolized by the dashed arc) of the " +
             "first interonset duration. Simultaneously the present event " +
             "accumulates its own projective potential (represented by the " +
             "growing solid arc) to be reproduced by a successive, third event."
    message: "Click the mouse to end the second sound."
    transitions:
      sound2Continues: true
      sound2ContinuesNegative: true
      sound2ContinuesWithoutProjection: true
      sound2Ends: true
    moveHandler: (points, x) ->
      start = points.points[Points.sound2First]
      if start > x
        return "sound2ContinuesNegative"
      else if points.isWeakDeterminate(start, x)
        return "sound2ContinuesWithoutProjection"
      else if points.isDeterminate(start, x)
        return "sound2Continues"
      "sound2ContinuesTooLong"
    clickHandler: -> "sound2Ends"

  # The second sound has a negative duration.
  sound2ContinuesNegative:
    comment: ""
    message: "Move the mouse to the right to perform the second sound."
    transitions:
      sound2ContinuesNegative: true
      sound2Continues: true
    moveHandler: (points, x) ->
      start = points.points[Points.sound2First]
      if start <= x
        return "sound2Continues"
      "sound2ContinuesNegative"

  # The second sound continues too long to realize its projection.
  sound2ContinuesWithoutProjection:
    comment: "The second sound exceeds the duration projected at its onset; " +
             "the projection is not clearly realized, as indicated by the X " +
             "through the dashed arc."
    message: "Move the mouse to the left to shorten the second sound, or " +
             "click the mouse to end it."
    transitions:
      sound2Continues: true
      sound2ContinuesWithoutProjection: true
      sound2ContinuesTooLong: true
      sound2EndsWithoutProjection: true
    moveHandler: (points, x) ->
      start = points.points[Points.sound2First]
      if points.isWeakDeterminate(start, x)
        return "sound2ContinuesWithoutProjection"
      else if points.isDeterminate(start, x)
        return "sound2Continues"
      "sound2ContinuesTooLong"
    clickHandler: -> "sound2EndsWithoutProjection"

  # The second sound continues too long to be mensurally determinate.
  sound2ContinuesTooLong:
    comment: "The second sound is so long that it is mensurally " +
             "indeterminate. (The projection of the first interonset " +
             "duration is not realized.)"
    message: "Move the mouse to the left to shorten the second sound, or " +
             "click the mouse to end it."
    transitions:
      sound2ContinuesWithoutProjection: true
      sound2ContinuesTooLong: true
      sound2EndsTooLong: true
    moveHandler: (points, x) ->
      start = points.points[Points.sound2First]
      if points.isWeakDeterminate(start, x)
        return "sound2ContinuesWithoutProjection"
      else if points.isDeterminate(start, x)
        return "sound2Continues"
      "sound2ContinuesTooLong"
    clickHandler: -> "sound2EndsTooLong"

  # The second sound ends, realizing its projection.
  sound2Ends:
    comment: "The second sound ends. Its duration is 'mensurally " +
             "determinate' because it has the potential for being precisely " +
             "reproduced. But it does not affect the projection of the first " +
             "interonset duration, shown by the arrow and dashed arc"
    message: "Click the mouse to begin the third sound."
    transitions:
      pause2: true
      pause2Negative: true
    moveHandler: (points, x) ->
      start = points.points[Points.sound2Second]
      if x < start
        return "pause2Negative"
      "pause2"

  # The second sound ends without realizing its projection.
  sound2EndsWithoutProjection:
    comment: "The second sound exceeds the duration projected at its onset.  " +
             "The projection is not clearly realized, as indicated by the X " +
             "through the dashed arc."
    message: "Click on the 'Back one step' button to select an earlier " +
             "beginning for the second sound, or click 'Restart'."
    transitions:
      start: true

  # The second sound ends but is too long.
  sound2EndsTooLong:
    comment: "The second sound is so long that it is mensurally " +
             "indeterminate.  Since the projected potential of the first " +
             "interonset duration is denied there is no projection at all."
    message: "Click on the 'Back one step' button to select an earlier " +
             "beginning for the second sound, or click 'Restart'."
    transitions:
      start: true

  ##
  ## Pause 2
  ##

  # The second pause begins.
  pause2:
    comment: "The silence between the second and third sounds is relatively " +
             "indeterminate if our attention is focused on the sounds' " +
             "beginnings. The growing arc indicates that the duration from " +
             "the beginning of the second sound up to now, including the " +
             "silence, has 'projective potential' to be reproduced."
    message: "Click the mouse to begin the third sound."
    transitions:
      pause2: true
      pause2Negative: true
      pause2TooLong: true
      sound3StartsAccel: true
      sound3StartsRealized: true
      sound3StartsExactly: true
      sound3StartsSlightlyLate: true
      sound3StartsSlightlyLateNewProjection: true
    moveHandler: (points, x) ->
      start = points.points[Points.sound2Second]
      if x < start
        return "pause2Negative"
      if not points.isDeterminate(start, x)
        return "pause2TooLong"
      "pause2"
    clickHandler: (points, x) ->
      first = points.points[Points.sound2First]
      second = points.points[Points.sound2Second]
      if points.isAccel(first, second, x)
        return "sound3StartsAccel"
      if points.isExact(first, x)
        return "sound3StartsExactly"
      if points.isRealized(first, x)
        return "sound3StartsRealized"
      if points.isSlightlyLate(first, x)
        return "sound3StartsSlightlyLate"
      if points.isSlightlyLateNewProjection(first, x)
        return "sound3StartsSlightlyLateNewProjection"
      # This should not be possible to reach, but if it somehow does, then
      # ignore the click and stay in pause2.
      "pause2"

  # The second pause is negative.
  pause2Negative:
    comment: ""
    message: "Click the mouse at the end of the second sound or later."
    transitions:
      pause2: true
      pause2Negative: true
    moveHandler: (points, x) ->
      if x < points.points[Points.sound2Second]
        return "pause2Negative"
      "pause2"

  # The pause has lasted too long to be mensurally determinate.
  pause2TooLong:
    comment: "The time since the beginning of the second sound is mensurally " +
             "indeterminate, having no projective potential to be reproduced."
    message: "Click the mouse button to begin the third sound (earlier if " +
             "you want a projection)."
    transitions:
      pause2: true
      pause2TooLong: true
      sound3StartsTooLate: true
    moveHandler: (points, x) ->
      if not points.isDeterminate(points.points[Points.sound2Second], x)
        return "pause2TooLong"
      "pause2"
    clickHandler: -> "sound3StartsTooLate"

  ##
  ## Sound 3
  ##

  # The third sound starts earlier than expected.
  sound3StartsAccel:
    comment: "The beginning of the third sound is earlier than projected. " +
             "The second interonset duration is shorter than, but at least " +
             "three-fourths of the first interonset duration. We feel an " +
             "*acceleration* because we sense the realization of the first " +
             "projected duration even as we also perceive the difference " +
             "between the two durations."
    message: "Click on 'Back one step' to define a different third sound or " +
             "'Restart' to begin again."
    transitions:
      pause2: true
      start: true

  # The third sound starts exactly when expected.
  sound3StartsExactly:
    comment: "Since the third sound begins exactly at the end of the " +
             "projected duration (the upper dashed arc), the projected " +
             "duration is 'realized'. A new projection is created, " +
             "conditioned by the first, in which the second interonset " +
             "duration has the projective potential (the lower arrow) to be " +
             "reproduced."
    message: "Click on 'Back one step' to define a different third sound or " +
             "'Restart' to begin again."
    transitions:
      pause2: true
      start: true

  # The third sound starts too late to be mensurally determinate.
  sound3StartsTooLate:
    comment: "The projective potential of the first interonset duration (the " +
             "dashed arc) is realized, but the projective potential of the " +
             "second interonset duration is not, since it is mensurally " +
             "indeterminate. Because the third sound begins much later than " +
             "projected, we may come to feel 'hiatus' (symbolized by the " +
             "double bar)--a break between the realization of projected " +
             "potential and a new beginning. A new and relatively " +
             "unconditioned potential emerges from the beginning of the " +
             "third sound."
    message: "Click on 'Back one step' to define a different third sound or " +
             "'Restart' to begin again."
    transitions:
      pause2: true
      start: true

  # The third sound starts, realizing the first projection and suggesting a new
  # projection.
  sound3StartsRealized:
    comment: "The projection of the first interonset duration is realized. " +
             "Another projection (the rightmost arrow and dashed arc) can be " +
             "completed within the promised duration, so may enhance its " +
             "mensural determinacy. The emergence of a new beginning, shown " +
             "in parentheses, would clarify this."
    message: "Click anywhere to see an alternate interpretation."
    transitions:
      sound3StartsAltInterpretation: true
    skipPointCreation: true  # Don't create a new point on click
    clickHandler: -> "sound3StartsAltInterpretation"

  # A second interpretation of sound3StartsNewProjection.
  sound3StartsAltInterpretation:
    comment: "In this interpretation the accent symbolizes an unequivocal " +
             "second beginning that denies the projection of the first " +
             "interonset duration in order to realize a larger projective " +
             "potential, symbolized by the large arrow."
    message: "Click on 'Back one step' to define a different third sound or " +
             "'Restart' to begin again."
    transitions:
      pause2: true
      start: true

  # The third sound starts later than expected.
  sound3StartsSlightlyLate:
    comment: "The beginning of the third sound is slightly later than " +
             "projected. We hear a *deceleration* because we sense the " +
             "realization of the first projected duration even as we also " +
             "perceive the difference between the two durations."
    message: "Click on 'Back one step' to define a different third sound or " +
             "'Restart' to begin again."
    transitions:
      pause2: true
      start: true

  # The third sound starts slightly late and suggests a new projection.
  sound3StartsSlightlyLateNewProjection:
    comment: "The third sound begins somewhat later than projected. A new " +
             "projection, indicated by the lowest arrow and dashed arc, " +
             "emerges, breaking off from the emerging first projection. We " +
             "reject the relevance of the first projection to the mensural " +
             "determinacy of the second interonset duration."
    message: "Click on 'Back one step' to define a different third sound or " +
             "'Restart' to begin again."
    transitions:
      pause2: true
      start: true

# writeGraph outputs a GraphViz diagram to check the state machine.
# Generate the graph with dot -Tpdf -o meter.pdf. The output must be wrapped in
# a graph statement like `strict digraph Meter {` (and with a closing bracket at
# the end).
exports.writeGraph = (states) ->
  graph = ""
  for name of states
    for dest of states[name].transitions
      graph += "\n" if graph != ""
      graph += "  #{name} -> #{dest}"
  graph

# visit walks a states graph using depth-first search from the start node and
# applies the given function to each node.
exports.visit = (states, fn) ->
  visited = {}
  (visited[name] = false) for name of states

  visitHelper states, "start", visited, fn
  visited

# visitHelper keeps track of visited states as it traverses a graph.
visitHelper = (states, state, visited, fn) ->
  return if visited[state]
  visited[state] = true

  fn? state

  for neighbor of states[state].transitions
    visitHelper states, neighbor, visited, fn

# PointError is thrown for error cases that happen in methods of the Points
# class.
exports.PointError = class PointError extends Error
  name: "PointError"
  constructor: (@message) ->

# Points keeps track of the current point positions and the properties of these
# positions with respect to each other and with respect to determinacy.
exports.Points = class Points
  # These variables name positions in the @points array.
  @sound1First: 0
  @sound1Second: 1
  @sound2First: 2
  @sound2Second: 3
  @sound3First: 4
  @sound3Second: 5

  @maxPointCount: 6

  # These variables are the return values of the projective potential functions.
  @projectionOn: "Projection On"
  @projectionOff: "Projection Off"
  @projectionCurrent: "Projection Current"
  @projectionWeak: "Projection Weak"

  @projectionEarly: 1.75
  @projectionExact: 2
  @projectionSlightlyLate: 2.5
  
  constructor: (@maxDeterminateLen, points...) ->
    if points.length > Points.maxPointCount
      throw new PointError("too many points")
    @points = points
    @points[0] = 0 if points.length > 0

  # pushPoint puts a new point at the end of the points.
  pushPoint: (pos) ->
    if @points.length >= Points.maxPointCount
      throw new PointError("all points already defined")
    pos = 0 if @points.length == 0
    @points.push(pos)

  # popPoint removes and returns the last point in the array, if any.
  popPoint: ->
    if @points.length == 0
      throw new PointError("no points to remove")
    @points.pop()

  # isDeterminate checks to make sure that the difference between the first and
  # second points is less than the amount needed to be mensurally determinate.
  isDeterminate: (first, second) ->
    first < second and second - first <= @maxDeterminateLen

  # isWeakDeterminate is like isDeterminate, but it fails if second <= 2 *
  # first. In other words, it's the upper range of mensural determinacy.
  isWeakDeterminate: (first, second) ->
    @isDeterminate(first, second) and second > 2 * first

  # isAccel checks to see if the third onset is earlier than projected.
  isAccel: (first, second, end) ->
    @isDeterminate(first, end) and end > second and end < 1.75 * first

  # TODO(tmroeder): there's some confusion in the original source about the
  # details of these possibilities. Check them and correct them.
  # isRealized checks to see if the third onset is close to the projected
  # duration.
  isRealized: (start, end) ->
    @isDeterminate(start, end) and end > 1.75 * start and end < 2 * start

  # isExact checks to see if the third onset is exactly as projected.
  isExact: (start, end) ->
    @isDeterminate(start, end) and end == 2 * start

  # isSlightlyLate checks to see if a determinate start and end has its end
  # point within (2 * start, 2.5 * start).
  isSlightlyLate: (start, end) ->
    @isDeterminate(start, end) and end > 2 * start and end < 2.5 * start

  # isSlightlyLateNewProjection checks to see if a determinate start and end has
  # its end greater than 2.5 * start
  isSlightlyLateNewProjection: (start, end) ->
    @isDeterminate(start, end) and end >= 2.5 * start

  # isTooLate checks to see if the third onset occurs in a mensurally
  # indeterminate position after the second sound.
  isTooLate: (start, end) -> not @isDeterminate start, end

  # Whether or not this set of points is in the first sound.
  inFirstSound: -> @points.length == 1

  # Whether or not this set of points is in the second sound.
  inSecondSound: ->
    @points.length == 3

  # firstProjection describes the projective potential of the first inter-onset
  # duration.
  firstProjection: (cur) ->
    pointCount = @points.length
    if pointCount == 0
      return Points.projectionOff

    first = @points[Points.sound1First]
    determinate = @isDeterminate first, cur
    if pointCount == 1 or pointCount == 2
      if not determinate
        return Points.projectionOff
      return Points.projectionCurrent

    if pointCount > 2
      third = @points[Points.sound2First]
      return Points.projectionOn if @isDeterminate first, third

    Points.projectionOff

  # secondProjection describes the current projective potential of the second
  # sound.
  secondProjection: (cur) ->
    pointCount = @points.length
    return Points.projectionOff if pointCount < 3 or pointCount > 4

    first = @points[Points.sound2First]
    if pointCount == 3
      # Weak projection occurs if cur is the right amount beyond the first
      # sound.
      if @isWeakDeterminate(first, cur)
        return Points.projectionWeak
      if @isDeterminate(first, cur)
        return Points.projectionOn
      return Points.projectionOff

    # Projection occurs if there's no current point or it's between the first
    # and second points.
    second = @points[Points.sound2Second]
    return Points.projectionOff if not @isDeterminate first, second
    return Points.projectionOn if not cur? or cur < second

    # Projection also occurs if cur is a mensurally determinate distance past
    # the first sound.
    return Points.projectionOn if @isDeterminate(first, cur)
    Points.projectionOff
