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

{Driver} = require "../src/driver.coffee"
{states} = require "../src/state_machine.coffee"
{TextDraw} = require "../src/ui.coffee"
{MockInput} = require "./mock_ui.coffee"

# simulationSetup creates and sets up mocks and a driver using those mocks.
exports.TextSimulator = class TextSimulator
  constructor: (@maxLen) ->
    @draw = new TextDraw()
    @input = new MockInput()
    @driver = new Driver @maxLen, states, @input, @draw
