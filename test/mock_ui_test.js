// Copyright 2015 Tom Roeder (tmroeder@gmail.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

const mu = require("./mock_ui.js");
const MockInput = mu.MockInput;
const chai = require("chai");
const expect = chai.expect;
const should = chai.should();

describe("The MockInput class", () => {
  it("should send movement events", () => {
    let latestX = 0;
    let latestY = 0;
    const fn = (x, y) => {
      latestX = x;
      latestY = y;
    };
    let m = new MockInput();
    m.registerMove(fn);
    m.move(1, 1);
    expect(latestX).to.equal(1);
    expect(latestY).to.equal(1);
  });
  it("should send click events", () => {
    let latestX = 0;
    let latestY = 0;
    const fn = (x, y) => {
      latestX = x;
      latestY = y;
    };
    let m = new MockInput();
    m.registerClick(fn);
    m.click(2, 2);
    expect(latestX).to.equal(2);
    expect(latestY).to.equal(2);
  });
});