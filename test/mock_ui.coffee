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

# StateDraw tracks the draw events that have been sent to it.
exports.StateDraw = class StateDraw extends Draw
  constructor: (@shortLength) ->
    super()

  shortSoundLength: -> @shortLength
