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
      sound2Starts: true

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

# TODO(tmroeder): pull out the test cases into proper tests, probably with the
# Mocha test framework.

# Output a GraphViz diagram to check the state machine.
# Generate the graph with the following command.
#     coffee meter_as_rhythm.coffee | dot -Tpdf -o meter.pdf
# TODO(tmroeder): one test should make sure this graph is connected.
console.log("strict digraph Meter {")
(console.log("\t#{name} -> #{dest}") for dest of States[name].transitions) for name of States
console.log("}")

