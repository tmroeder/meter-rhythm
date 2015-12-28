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

# The Driver class executes the state machine, taking input, running
# transitions, keeping state, and writing to the UI.
exports.Driver = class Driver
  constructor: (maxLen, states, input, ui) ->
    @cur = "start"
    @states = states
    @points = new Points maxLen

    input.registerMove(@handleMove)
    input.registerClick(@handleClick)

    @ui = ui
    @ui.draw @points, @cur, @states

  handleMove: (x, y) =>
    handler = @states[@cur].moveHandler
    if handler?
      @cur = handler @points, x
      @ui.draw @points, @cur, @states, x

  handleClick: (x, y) =>
    handler = @states[@cur].clickHandler
    if handler?
      skipPointCreation = @states[@cur].skipPointCreation
      skipPoint = skipPointCreation? and skipPointCreation
      @cur = handler @points, x

      if not skipPoint
        @points.pushPoint x
      @ui.draw @points, @cur, @states, x
