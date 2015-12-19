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
   
States =
  # The starting state of the program.
  start:
    comment: "This demonstrates the concepts in Chapter 7 of Christopher " +
             "Hasty's 'Meter as Rhythm'. Imagine time 0 as an instant that " +
             " is a potential beginning of a sound, yet prior to and " +
             "independent of it."
    message: "You may perform graphically up to three successive sounds by " +
             "clicking and moving the mouse. First, click the mouse at time " +
             "0, the leftmost point, but don't move it."
    transitions:
      sound1Starts: true

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

  # The first sound has exceeded kMaxSoundLen.
  sound1ContinuesTooLong:
    comment: "The first sound's duration is so long that it is 'mensurally " +
             "indeterminate'--it has lost its projective potential to be " +
             "reproduced.";
    message: "To make the first sound's duration determinate, move the mouse " +
             "back to the left. Or click to end the sound."
    transitions:
      sound1Continues: true
      sound1ContinuesTooLong: true
      sound1EndsTooLong: true

  # The first sound ends with a length that isn't too long.
  sound1Ends:
    comment: "The first sound ends. Its duration is 'mensurally determinate' " +
             "because it has the potential for being precisely reproduced."
    message: "To begin the second sound, click the mouse."
    transitions:
      pause1: true
  
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
             "itself has the 'projective potential' to be reproduced.";
    message: "Click the mouse to begin the second sound."
    transitions:
      pause1: true
      pause1Negative: true
      sound2Starts: true
      sound2StartsTooLong: true

  # The pause between sounds can't be negative.
  pause1Negative:
    # The comment does not change from pause1.
    # TODO(tmroeder): Is this correct?
    comment: ""
    message: "Click the mouse at the end of the first sound or later."
    transitions:
      pause1: true
      pause1Negative: true

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

  # The beginning of the second sound after too long of a pause.
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
      sound2ContinuesWithoutProjection: true
      sound2Ends: true

  # The second sound continues too long to realize its projection.
  sound2ContinuesWithoutProjection:
    comment: "The second sound exceeds the duration projected at its onset; " +
             "the projection is not clearly realized, as indicated by the X " +
             "through the dashed arc."
    message: "Click the mouse to end the second sound."
    transitions:
      sound2Continues: true
      sound2ContinuesWithoutProjection: true
      sound2ContinuesTooLong: true
      sound2EndsWithoutProjection: true

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

  # The second sound ends, realizing its projection.
  sound2Ends:
    comment: "The second sound ends. Its duration is 'mensurally " +
             "determinate' because it has the potential for being precisely " +
             "reproduced. But it does not affect the projection of the first " +
             "interonset duration, shown by the arrow and dashed arc"
    message: "Click the mouse to begin the third sound."
    transitions:
      pause2: true

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
      sound3Starts: true

  # The second pause is negative.
  pause2Negative:
    # TODO(tmroeder): missing comment?
    comment: ""
    message: "Click the mouse at the end of the second sound or later."
    transitions:
      pause2: true

# TODO(tmroeder): pull out the test cases into proper tests, probably with the
# Mocha test framework.

# Output a GraphViz diagram to check the state machine.
# Generate the graph with the following command.
#     coffee meter_as_rhythm.coffee | dot -Tpdf -o meter.pdf
# TODO(tmroeder): one test should make sure this graph is connected.
console.log("strict digraph Meter {")
(console.log("\t#{name} -> #{dest}") for dest of States[name].transitions) for name of States
console.log("}")

