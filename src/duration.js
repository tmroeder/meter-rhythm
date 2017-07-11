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
  States
} from "./state_machine.js";

// ArgumentError is thrown for argument errors.
export class ArgumentError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = "ArgumentError";
  }
}

// FailedPreconditionError is thrown when some precondition is not true.
export class FailedPreconditionError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = "FailedPreconditionError";
  }
}

// Duration is the base class for Sounds, ProjectivePotentials, and
// ProjectedPotentials. It represents something that has a duration, and it
// provides methods for evaluating this duration. It also encapsulates the
// notion of mensural determinacy.
export class Duration {
  constructor(mensuralDeterminacyLen, start, end) {
    if (arguments.length === 0) {
      throw new ArgumentError("Must supply a length for mensural determinacy");
    }
    if (arguments.length > 3) {
      throw new ArgumentError("At most 3 arguments can be supplied to the " +
        "Duration constructor");
    }
    this.mensuralDeterminacyLen = mensuralDeterminacyLen

    if (arguments.length === 1) {
      return;
    }

    this.startPos = start;
    if (arguments.length === 2) {
      this.curPos = start;
      return;
    }

    // If both start and end are set, then cur is at the end.
    this.curPos = end;
    this.endPos = end;
  }

  // Sets the start value if it has not been set. This method, along with setCur
  // and setEnd, maintains the class invariant that the only possible sets of
  // defined values are (start), (start, cur), and (start, cur, end). Also,
  // start and end can only be set once each.
  set start(value) {
    if (value === undefined) {
      throw new ArgumentError("Must supply a value to the start setter");
    }
    if (this.startPos !== undefined) {
      throw new FailedPreconditionError("Cannot set start after it has been " +
        "set once");
    }
    this.curPos = value;
    this.startPos = value;
  }

  // Gets the current position of start, but throws if start is undefined.
  get start() {
    if (this.startPos === undefined) {
      throw new FailedPreconditionError("Start is not defined");
    }
    return this.startPos;
  }

  // Sets the cur value if the Duration is not complete. Note that cur might be
  // a nonsensical value for a real Duration (like being before this.start), but
  // this is allowed, and the other methods of this class will handle it.
  set cur(value) {
    if (value === undefined) {
      throw new ArgumentError("Must supply a value to the cur setter");
    }
    if (this.complete) {
      throw new FailedPreconditionError("Cannot set cur for a complete event");
    }
    if (this.startPos === undefined) {
      throw new FailedPreconditionError("Cannot set cur when there is no " +
        "start value");
    }
    this.curPos = value;
  }

  // Gets the current position of cur, but throws if cur is undefined.
  get cur() {
    if (this.curPos === undefined) {
      throw new FailedPreconditionError("Cur is not defined");
    }
    return this.curPos;
  }

  // Sets the end of the Duration if the value for end satisfies the conditions:
  // - end has not already been set
  // - start is defined
  // - the supplied end value is >= start.
  set end(value) {
    if (value === undefined) {
      throw new ArgumentError("Must supply a value to the end setter");
    }
    if (this.complete) {
      throw new FailedPreconditionError("Cannot set end on a complete event");
    }
    if (this.startPos === undefined) {
      throw new FailedPreconditionError("Cannot set end on an event that " +
        "does not have start set");
    }
    if (value < this.startPos) {
      throw new FailedPreconditionError("Cannot set an end that is before " +
        "start");
    }
    // Setting end automatically sets cur to end.
    this.curPos = value;
    this.endPos = value;
  }

  // Gets the current position of end, but throws if end is undefined.
  get end() {
    if (this.endPos === undefined) {
      throw new FailedPreconditionError("End is not defined");
    }
    return this.endPos;
  }

  // A Duration is defined if it has started and has a current value.
  get defined() {
    return this.startPos !== undefined && this.curPos !== undefined;
  }

  // Returns true if there is an end point.
  get complete() {
    return this.endPos !== undefined;
  }

  // Checks the start and cur to see if their difference is less than the
  // maximum amount for mensurally determinate sounds.
  get isMensurallyDeterminate() {
    return this.isRelativelyMensurallyDeterminate(this.cur);
  }

  // Checks pos against the start to see if it is mensurally determinate.
  isRelativelyMensurallyDeterminate(pos) {
    // This condition could reasonably be <= rather than <. The current
    // implementation interprets events that have no duration as not being
    // mensurally determinate. Note that cur is always defined and is the same
    // as this.end if this.end is defined.
    return this.start < pos &&
      pos - this.start <= this.mensuralDeterminacyLen;
  }

  // The constant multiplicative factor for weak mensural determinacy.
  static get weaklyDeterminateFactor() {
    return 2;
  }

  // isWeaklyMensurallyDeterminate is like isMensurallyDeterminate, but it fails
  // if second <= 2 * first. In other words, it's the upper range of mensural
  // determinacy.
  get isWeaklyMensurallyDeterminate() {
    return this.isRelativelyWeaklyMensurallyDeterminate(this.cur);
  }

  // Checks pos against the start to see if it is weakly mensurally determinate.
  isRelativelyWeaklyMensurallyDeterminate(pos) {
    return this.isRelativelyMensurallyDeterminate(pos) &&
      pos > Duration.weaklyDeterminateFactor * this.start;
  }

}

// A set of constant-like values to return from functions that answer questions
// about determinacy.
export class DeterminacyType {
  static get negativeSound() {
    return 'negativeSound';
  }

  static get negativeSilence() {
    return 'negativeSilence';
  }

  static get indeterminate() {
    return 'indeterminate';
  }

  static get determinate() {
    return 'determinate';
  }

  static get determinateSilence() {
    return 'determinateSilence';
  }
}

// The following kinds of determinacy can only be created when there is not
// only a sound, but also a projection.
export class RealizationType {
  static get accel() {
    return 'accel';
  }

  static get realized() {
    return 'realized';
  }

  static get exact() {
    return 'exact';
  }

  static get rall() {
    return 'rall';
  }

  static get separate() {
    return 'separate';
  }
}

// A ProjectivePotential is tied to a Sound and represents the total duration
// that can be realized by another Sound.
export class ProjectivePotential extends Duration {
  constructor(mensuralDeterminacyLen, start, end) {
    super(mensuralDeterminacyLen, start, end);
  }
}

// A ProjectedPotential is tied to a Sound and represents the realization of a
// ProjectivePotential from another Sound.
export class ProjectedPotential extends Duration {
  constructor(mensuralDeterminacyLen, start, end) {
    super(mensuralDeterminacyLen, start, end);
    this.isRealized = true;
  }

  // The realized value can flip between true and false many times depending on
  // other factors.
  set realized(value) {
    if (value === undefined) {
      throw new ArgumentError("Must supply a value to the realized setter");
    }
    this.isRealized = value;
  }

  // Gets the current value of realized. It is a class invariant that realized
  // is always defined.
  get realized() {
    return this.isRealized;
  }
}

// Attributes describes the set of possible features a Sound can have in
// context.
export class Attributes {
  static get none() {
    return 0;
  }

  // The beginning of the Sound suggests acceleration.
  static get accel() {
    return 1;
  }

  // The beginning of the Sound suggests deceleration.
  static get rall() {
    return 2;
  }

  // The beginning of the Sound suggests an accent.
  static get accent() {
    return 3;
  }

  // The end of the Sound seems like a break.
  static get hiatus() {
    return 4;
  }

  // The sound is only suggested, not necessarily heard.
  static get parens() {
    return 5;
  }
  static get last_attribute() {
    return 5;
  }

  // Checks if the given value can be interpreted as an attribute.
  static isAttribute(value) {
    if (value === undefined) {
      return false;
    }
    return value >= Attributes.none && value <= Attributes.last_attribute;
  }
}

// A Sound is the central concept in an Example. It represents a perceived
// duration, and it has attributes and potentials associated with it.
export class Sound extends Duration {
  constructor(mensuralDeterminacyLen, start, end) {
    super(mensuralDeterminacyLen, start, end);

    // The projective potential generally extends beyond the duration of a
    // sound, so don't pass in the end, since that would close off the potential
    // from further extension.
    this.projectivePotential =
      new ProjectivePotential(mensuralDeterminacyLen, start);

    // The length of projected potential is not provided in the constructor, and
    // it needs to be set by another call.
    this.projectedPotential =
      new ProjectedPotential(mensuralDeterminacyLen);

    this.beforeAttribute = Attributes.none;
    this.afterAttribute = Attributes.none;
    this.aroundAttribute = Attributes.none;
  }

  // Adds a projected potential with a given duration.
  addProjectedPotential(duration) {
    // This call to the start getter will throw if startPos is not defined.
    this.projectedPotential.start = this.start;

    let endpoint = this.start + duration;
    this.projectedPotential.cur = endpoint;
    this.projectedPotential.end = endpoint;
  }

  // Because projected potential is defined in one stroke, a Sound has a
  // projected potential if their projected potential object is complete.
  get hasProjectedPotential() {
    return this.projectedPotential.complete;
  }

  // A sound has projective potential iff it plus the silence following it is
  // mensurally determinate. That is represented by the mensural determinacy of
  // the projectivePotential object.
  get hasProjectivePotential() {
    return this.projectivePotential.isMensurallyDeterminate;
  }

  // Performs the Duration set start operation and passes the operation to its
  // projective potential.
  set start(value) {
    super.start = value;
    this.projectivePotential.start = value;
  }

  // Performs the Duration set cur operation if the sound object is not
  // complete, and passes set cur to its projective potential either way.
  set cur(value) {
    if (!this.complete) {
      super.cur = value;
    }
    this.projectivePotential.cur = value;
  }

  // set end is not overriden, since the end of a sound does not mean the end of
  // its projective potential.

  // Sets the end of the projective potential.
  set projectivePotentialEnd(value) {
    this.projectivePotential.end = value;
  }

  // Gets the before attribute.
  get before() {
    return this.beforeAttribute;
  }

  // Sets the before attribute, making sure that this attribute was not already
  // set and that the value being passed in maps to an attribute.
  set before(value) {
    if (!Attributes.isAttribute(value)) {
      throw new ArgumentError("Cannot set an attribute to a non attribute");
    }
    if (this.beforeAttribute !== Attributes.none) {
      throw new ArgumentError("Cannot set an attribute twice");
    }
    this.beforeAttribute = value;
  }

  // Gets the around attribute.
  get around() {
    return this.aroundAttribute;
  }

  // Sets the around attribute, making sure that this attribute was not already
  // set and that the value being passed in maps to an attribute.
  set around(value) {
    if (!Attributes.isAttribute(value)) {
      throw new ArgumentError("Cannot set an attribute to a non attribute");
    }
    if (this.aroundAttribute !== Attributes.none) {
      throw new ArgumentError("Cannot set an attribute twice");
    }
    this.aroundAttribute = value;
  }

  // Gets the after attribute.
  get after() {
    return this.afterAttribute;
  }

  // Sets the aftere attribute, making sure that this attribute was not already
  // set and that the value being passed in maps to an attribute.
  set after(value) {
    if (!Attributes.isAttribute(value)) {
      throw new ArgumentError("Cannot set an attribute to a non attribute");
    }
    if (this.afterAttribute !== Attributes.none) {
      throw new ArgumentError("Cannot set an attribute twice");
    }
    this.afterAttribute = value;
  }
}
