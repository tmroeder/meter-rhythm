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

// ArgumentError is throw for argument errors.
export class ArgumentError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = "ArgumentError";
  }
}

// Duration is the base class for Sounds, ProjectivePotentials, and
// ProjectedPotentials. It represents something that has a duration, and it
// provides methods for evaluating this duration. It also encapsulates the
// notion of mensural determinacy.
export class Duration {
  constructor(mensuralDeterminacyLen, start, cur, end) {
    if (arguments.length == 0) {
      throw new ArgumentError("Must supply a length for mensural determinacy");
    }
    if (arguments.length > 4) {
      throw new ArgumentError("At most 4 arguments can be supplied to the " +
        "Duration constructor");
    }
    this.mensuralDeterminacyLen = mensuralDeterminacyLen

    if (arguments.length == 1) {
      return;
    }

    this.start = start;
    if (arguments.length == 2) {
      this.cur = start;
      return;
    }

    this.cur = cur;
    if (arguments.length == 3) {
      return;
    }

    this.end = end;
  }



  // Sets the start value if it has not been set. This method, along with setCur
  // and setEnd, maintains the class invariant that the only possible sets of
  // defined values are (start), (start, cur), and (start, cur, end). Also,
  // start and end can only be set once each.
  setStart(start) {
    if (this.start !== undefined) {
      throw new ArgumentError("Cannot set start after it has been set once");
    }
    this.start = start;
  }

  getStart() {
    return this.start;
  }

  // Sets the cur value if the Duration is not complete. Note that cur might be
  // a nonsensical value for a real Duration (like being before this.start), but
  // this is allowed, and the other methods of this class will handle it.
  setCur(cur) {
    if (this.isComplete()) {
      throw new ArgumentError("Cannot set cur for a complete event");
    }
    if (this.start === undefined) {
      throw new ArgumentError("Cannot set cur when there is no start value");
    }
    this.cur = cur;
  }

  getCur() {
    return this.cur;
  }

  // Sets the end of the Duration if the value for end satisfies the conditions:
  // - end has not already been set
  // - start and cur are defined
  // - the supplied end value is >= start.
  setEnd(end) {
    if (this.isComplete()) {
      throw new ArgumentError("Cannot set end on a complete event");
    }
    if (this.start === undefined || this.cur === undefined) {
      throw new ArgumentError("Cannot set end on an event that does not have " +
        "both start and cur set");
    }
    if (end < this.start) {
      throw new ArgumentError("Cannot set an end that is before start");
    }
    this.end = end;
  }

  getEnd() {
    return this.end;
  }

  // A Duration is defined if it has started and has a current value.
  isDefined() {
    return this.start !== undefined && this.cur !== undefined;
  }

  // Returns true if there is an end point.
  isComplete() {
    return this.end !== undefined;
  }

  // Checks the start and cur (or end) to see if their difference is less than
  // the maximum amount for mensurally determinate sounds.
  isMensurallyDeterminate() {
    let endpoint = this.end === undefined ? this.cur : this.end;
    // This condition could reasonably be <= rather than <. The current
    // implementation interprets events that have no duration as not being
    // mensurally determinate.
    return this.start < endpoint &&
      endpoint - this.start <= this.mensuralDeterminacyLen;
  }

  // The constant multiplicative factor for weak mensural determinacy.
  static get weaklyDeterminateFactor() {
    return 2;
  }

  // isWeaklyMensurallyDeterminate is like isMensurallyDeterminate, but it fails
  // if second <= 2 * first. In other words, it's the upper range of mensural
  // determinacy.
  isWeaklyMensurallyDeterminate() {
    let endpoint = this.end === undefined ? this.cur : this.end;
    return this.isMensurallyDeterminate() &&
      endpoint > Duration.weaklyDeterminateFactor * this.start;
  }
}

// A ProjectivePotential is tied to a Sound and represents the total duration
// that can be realized by another Sound.
export class ProjectivePotential extends Duration {
  constructor(mensuralDeterminacyLen, start, cur, end) {
    super(mensuralDeterminacyLen, start, cur, end);
  }
}

// A ProjectedPotential is tied to a Sound and represents the realization of a
// ProjectivePotential from another Sound.
export class ProjectedPotential extends Duration {
  constructor(mensuralDeterminacyLen, start, cur, end) {
    super(mensuralDeterminacyLen, start, cur, end);
    this.isRealized = true;
  }

  // The realized value can flip between true and false many times depending on
  // other factors.
  set realized(value) {
    this.isRealized = value;
  }
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
    return value >= Attributes.none && value <= Attributes.last_attribute;
  }
}

// A Sound is the central concept in an Example. It represents a perceived
// duration, and it has attributes and potentials associated with it.
export class Sound extends Duration {
  constructor(mensuralDeterminacyLen, start, cur, end) {
    super(mensuralDeterminacyLen, start, cur, end);

    // The projective potential generally extends beyond the duration of a
    // sound, so don't pass in the end, since that would close off the potential
    // from further extension.
    this.projectivePotential =
      new ProjectivePotential(mensuralDeterminacyLen, start, cur);

    // The length of projected potential is not provided in the constructor, and
    // it needs to be set by another call.
    this.projectedPotential =
      new ProjectedPotential(mensuralDeterminacyLen);

    this.beforeAttribute = Attributes.none;
    this.afterAttribute = Attributes.none;
    this.aroundAttribute = Attributes.none;
  }

  // Adds a projected potential with a given duration.
  setProjectedPotential(duration) {
    if (this.start === undefined) {
      throw new ArgumentError("Cannot set a projected potential without " +
        "having already set start");
    }
    this.projectedPotential.setStart(this.start);
    let endpoint = this.start + duration;
    this.projectedPotential.setCur(endpoint);
    this.projectedPotential.setEnd(endpoint);
  }

  // Because projected potential is defined in one stroke, a Sound has a
  // projected potential if their projected potential object is complete.
  hasProjectedPotential() {
    return this.projectedPotential.isComplete();
  }

  // A sound has projective potential iff it plus the silence following it is
  // mensurally determinate. That is represented by the mensural determinacy of
  // the projectivePotential object.
  hasProjectivePotential() {
    return this.projectivePotential.isMensurallyDeterminate();
  }

  // Performs the Duration setStart operation and passes the operation to its
  // projective potential.
  setStart(start) {
    super.setStart(start);
    this.projectivePotential.setStart(start);
  }

  // Performs the Duration setCur operation if the sound object is not complete,
  // and passes setCur to its projective potential either way.
  setCur(cur) {
    if (!this.isComplete()) {
      super.setCur(cur);
    }
    this.projectivePotential.setCur(cur);
  }

  // setEnd is not overriden, since the end of a sound does not mean the end of
  // its projective potential.

  // Sets the end of the projective potential.
  setProjectivePotentialEnd(end) {
    this.projectivePotential(end);
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
