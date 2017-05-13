// Copyright 2017 Tom Roeder (tmroeder@gmail.com)
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

import {
  ArgumentError,
  Duration,
  FailedPreconditionError,
  ProjectivePotential,
  ProjectedPotential,
  Attributes,
  Sound
} from "../src/duration.js";

import * as chai from "chai";

let expect = chai.expect;
let should = chai.should();

describe("The Attributes class", () => {
  it("should accept all its attributes", () => {
    Attributes.isAttribute(Attributes.none).should.be.true;
    Attributes.isAttribute(Attributes.accel).should.be.true;
    Attributes.isAttribute(Attributes.rall).should.be.true;
    Attributes.isAttribute(Attributes.accent).should.be.true;
    Attributes.isAttribute(Attributes.hiatus).should.be.true;
    Attributes.isAttribute(Attributes.parens).should.be.true;
    Attributes.isAttribute(Attributes.last_attribute).should.be.true;
  });
  it("should not accept an integer outside its range", () => {
    Attributes.isAttribute(Attributes.none - 1).should.be.false;
    Attributes.isAttribute(Attributes.last_attribute + 1).should.be.false;
  });
  it("should not accept non-integers as attributes", () => {
    Attributes.isAttribute("This is not an attribute").should.be.false;
    Attributes.isAttribute(new Object()).should.be.false;
  });
});

describe("The Duration class constructor", () => {
  it("should not work with 0 arguments", () => {
    expect(() => {
      new Duration();
    }).to.throw(/Must supply a length/);
  });
  it("should work with 1 argument", () => {
    expect(() => {
      new Duration(10);
    }).to.not.throw;
  });
  it("should work with 2 arguments", () => {
    expect(() => {
      new Duration(10, 0);
    }).to.not.throw;
  });
  it("should work with 3 arguments", () => {
    expect(() => {
      new Duration(10, 0, 1);
    }).to.not.throw;
  });
  it("should not work with more than 3 arguments", () => {
    expect(() => {
      new Duration(10, 0, 1, 5);
    }).to.throw(/At most 3/);
  });
});

describe("The Duration class state", () => {
  it("should accept a start value", () => {
    expect(() => {
      let d = new Duration(10);
      d.start = 0;
    }).to.not.throw;
  });
  it("should return the same value for start as was set", () => {
    let d = new Duration(10);
    d.start = 0;
    d.start.should.equal(0);

    let d2 = new Duration(10, 1);
    d2.start.should.equal(1);
  });
  it("should not accept start twice", () => {
    expect(() => {
      let d = new Duration(10);
      d.start = 0;
      d.start = 0;
    }).to.throw(/Cannot set start after it has been set once/);

    expect(() => {
      let d = new Duration(10, 1);
      d.start = 1;
    }).to.throw(/Cannot set start after it has been set once/);
  });
  it("should accept a cur value after its start value", () => {
    expect(() => {
      let d = new Duration(10);
      d.start = 0;
      d.cur = 1;
    }).to.not.throw;

    expect(() => {
      let d = new Duration(10, 1);
      d.cur = 2;
    }).to.not.throw;
  });
  it("should get the same value of cur as was set", () => {
    let d = new Duration(10);
    d.start = 0;
    d.cur = 1;
    d.cur.should.equal(1);
  });
  it("should not accept a cur value before its start value", () => {
    expect(() => {
      let d = new Duration(10);
      d.cur = 1;
    }).to.throw(/no start value/);
  });
  it("should accept an end value after start and cur", () => {
    expect(() => {
      let d = new Duration(10);
      d.start = 0;
      d.cur = 1;
      d.end = 5;
    }).to.not.throw;

    expect(() => {
      let d = new Duration(10, 0);
      d.cur = 1;
      d.end = 5;
    }).to.not.throw;
  });
  it("should get the same value of end as was set", () => {
    let d = new Duration(10);
    d.start = 0;
    d.cur = 1;
    d.end = 5;
    d.end.should.equal(5);

    let d2 = new Duration(20, 1, 6);
    d2.cur.should.equal(6);
    d2.end.should.equal(6);
  });
  it("should accept an end value before cur", () => {
    expect(() => {
      let d = new Duration(10);
      d.start = 0;
      d.end = 5;
      // Setting end without cur sets cur.
      d.cur.should.equal(5);
    }).to.not.throw;
  });
  it("should not accept a cur value after end", () => {
    expect(() => {
      let d = new Duration(10);
      d.start = 0;
      d.cur = 1;
      d.end = 5;
      d.cur = 6;
    }).to.throw(/complete event/);
  });
  it("should not accept end twice", () => {
    expect(() => {
      let d = new Duration(10, 1);
      d.end = 5;
      d.end = 10;
    }).to.throw(/complete event/);

    expect(() => {
      let d = new Duration(10, 1, 6);
      d.end = 10;
    }).to.throw(/complete event/);
  });
});

describe("The Duration class properties", () => {
  it("should be defined when start and cur are set", () => {
    let d = new Duration(10, 5);
    d.defined.should.be.true;

    let d2 = new Duration(10);
    d2.defined.should.be.false;
  });
  it("should only be complete when end is set", () => {
    let d = new Duration(10);
    d.complete.should.be.false;

    let d2 = new Duration(10, 5);
    d2.complete.should.be.false;

    let d3 = new Duration(10, 0, 10);
    d3.complete.should.be.true;
  });
  it("should be mensurally determinate when start to cur is in bounds", () => {
    let d = new Duration(10, 0);
    d.cur = -1;
    d.isMensurallyDeterminate.should.be.false;

    d.cur = 0;
    d.isMensurallyDeterminate.should.be.false;

    d.cur = 1;
    d.isMensurallyDeterminate.should.be.true;

    d.cur = 11;
    d.isMensurallyDeterminate.should.be.false;
  });
});
