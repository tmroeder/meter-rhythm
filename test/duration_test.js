import {
  ArgumentError,
  Duration,
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
  it("should work with 4 arguments", () => {
    expect(() => {
      new Duration(10, 0, 1, 5);
    }).to.not.throw;
  });
  it("should not work with more than 4 arguments", () => {
    expect(() => {
      new Duration(10, 0, 1, 5, 6);
    }).to.throw(/At most 4/);
  });
});
