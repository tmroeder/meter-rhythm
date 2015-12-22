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

meterUI = require '../meter_rhythm_ui.coffee'
chai = require 'chai'
expect = chai.expect
should = chai.should()

##
## Test the MeterTextUI object.
##

describe 'The MeterTextUI object', ->
  it 'should succeed in its constructor', ->
    expect(meterUI.MeterTextUI.bind(null, 10, 20)).to.not.throw(Error)
    expect(meterUI.MeterTextUI.bind(null, 10, 20)).to.not.throw(undefined)
    expect(meterUI.MeterTextUI.bind(null, 10, 20)).to.not.throw(null)
    expect(meterUI.MeterTextUI.bind(null, 10, 20)).to.not.throw(meterUI.UIError)
