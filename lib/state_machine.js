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

// The states object holds the state machine for the simulation. It consists of
// a set of named states (like "start"), each with a comment and a message. The
// comment provides an interpretation of the current state, and the message
// suggests actions to take in the current state.
// TODO(tmroeder): Add the comments back from the CoffeeScript version.
exports.states = {
  // The starting state of the program.
  start: {
    comment: "This demonstrates the concepts in Chapter 7 of Christopher " +
      "Hasty's 'Meter as Rhythm'. Imagine time 0 as an instant that " +
      "is a potential beginning of a sound, yet prior to and " +
      "independent of it.",
    message: "You may perform graphically up to three successive sounds by " +
      "clicking and moving. The first click sets the beginning of the sound " +
      "at time 0. Click but don't move.",
    transitions: {
      sound1Starts: true
    },
    clickHandler: () => "sound1Starts"
  },

  //
  // Sound 1
  //

  // The beginning of the first sound.
  sound1Starts: {
    comment: "The first sound begins, but time 0 will not be a beginning " +
      "until it is past.",
    message: "Perform the first sound by moving to the right.",
    transitions: {
      sound1Continues: true
    },
    moveHandler: () => "sound1Continues"
  },

  // The first sound continues and isn't too long.
  sound1Continues: {
    comment: "The first sound is becoming. Time 0 becomes its beginning. " +
      "'Projective potential'--the potential of a duration to be " +
      "reproduced by a successive duration--accumulates, as indicated " +
      "by the solid arc.",
    message: "End the first sound by clicking.",
    transitions: {
      sound1Continues: true,
      sound1ContinuesTooLong: true,
      sound1Ends: true
    },
    moveHandler: (points, x) => {
      let startPoint = points.points[PointConstants.sound1First];
      if (startPoint < x && !points.isDeterminate(startPoint, x)) {
        return "sound1ContinuesTooLong";
      }
      return "sound1Continues";
    },
    clickHandler: () => "sound1Ends"
  },

  // The first sound is too long.
  sound1ContinuesTooLong: {
    comment: "The first sound's duration is so long that it is 'mensurally " +
      "indeterminate'--it has lost its projective potential to be " +
      "reproduced.",
    message: "To make the first sound's duration determinate, move back to " +
      "the left. Or click to end the sound.",
    transitions: {
      sound1Continues: true,
      sound1ContinuesTooLong: true,
      sound1EndsTooLong: true
    },
    moveHandler: (points, x) => {
      if (!points.isDeterminate(points.points[PointConstants.sound1First], x)) {
        return "sound1ContinuesTooLong";
      }
      return "sound1Continues";
    },
    clickHandler: () => "sound1EndsTooLong"
  },

  // The first sound ends with a length that isn't too long.
  sound1Ends: {
    comment: "The first sound ends. Its duration is 'mensurally determinate' " +
      "because it has the potential for being precisely reproduced.",
    message: "To begin the second sound, click.",
    transitions: {
      pause1: true,
      pause1Negative: true
    },
    moveHandler: (points, x) => {
      if (x < points.points[PointConstants.sound1Second]) {
        return "pause1Negative";
      }
      return "pause1";
    }
  },

  // The first sound ends with a length that exceeds kMaxSoundLen.
  sound1EndsTooLong: {
    comment: "The first sound ends; it is too long to have projective " +
      "potential.",
    message: "Restart to try again.",
    transitions: {
      start: true
    }
  },

  //
  // Pause 1
  //

  // There is a pause between the first and second sounds.
  pause1: {
    comment: "There is a pause between the first two sounds. Its duration is " +
      "relatively indeterminate, if our attention is focused on the " +
      "beginning of sounds. The growing line indicates that the " +
      "duration of the first sound *plus* the following silence " +
      "itself has the 'projective potential' to be reproduced.",
    message: "Click to begin the second sound.",
    transitions: {
      pause1: true,
      pause1Negative: true,
      sound2Starts: true,
      sound2StartsTooLong: true
    },
    moveHandler: (points, x) => {
      if (points.points[PointConstants.sound1Second] > x) {
        return "pause1Negative";
      }
      return "pause1";
    },
    clickHandler: function(points, x) {
      if (!points.isDeterminate(points.points[PointConstants.sound1First], x)) {
        return "sound2StartsTooLong";
      }
      return "sound2Starts";
    }
  },

  // The pause between sounds can't be negative.
  pause1Negative: {
    comment: "",
    message: "Click at the end of the first sound or later.",
    transitions: {
      pause1: true,
      pause1Negative: true
    },
    moveHandler: (points, x) => {
      if (x < points.points[PointConstants.sound1Second]) {
        return "pause1Negative";
      }
      return "pause1";
    }
  },

  //
  // Sound 2
  //

  // The beginning of the second sound.
  sound2Starts: {
    comment: "This beginning of the second sound 'realizes' the projective " +
      "potential of the duration begun by the first event's attack. " +
      "The new line represents this projective potential. The " +
      "event now beginning has the potential to reproduce this past " +
      "duration. The new projection, extending for this duration into the " +
      "future, symbolizes this 'projected potential'.",
    message: "Perform the second sound by moving to the right.",
    transitions: {
      sound2Continues: true
    },
    moveHandler: (points, x) => {
      let start = points.points[PointConstants.sound2First];
      if (points.isWeakDeterminate(start, x)) {
        return "sound2ContinuesWithoutProjection";
      } else if (points.isDeterminate(start, x)) {
        return "sound2Continues";
      }
      return "sound2ContinuesTooLong";
    }
  },

  // the beginning of the second sound after too long a duration since the first
  // sound started.
  sound2StartsTooLong: {
    comment: "The second sound begins. It is so long since the beginning of " +
      "the first event that the interonset duration is mensurally " +
      "indeterminate--it has no potential to be reproduced--so there " +
      "is no projection.",
    message: "Restart to try again.",
    transitions: {
      pause1: true,
      start: true
    }
  },

  // the second sound continues and is not too long.
  sound2Continues: {
    comment: "The accumulating duration of the second sound is realizing the " +
      "expected projected potential of the first interonset duration. " +
      "Simultaneously the present event accumulates its own projective " +
      "potential (represented by the growing projection) to be reproduced by " +
      "a successive, third event.",
    message: "Click to end the second sound.",
    transitions: {
      sound2Continues: true,
      sound2ContinuesNegative: true,
      sound2ContinuesWithoutProjection: true,
      sound2Ends: true
    },
    moveHandler: (points, x) => {
      let start = points.points[PointConstants.sound2First];
      if (start > x) {
        return "sound2ContinuesNegative";
      } else if (points.isWeakDeterminate(start, x)) {
        return "sound2ContinuesWithoutProjection";
      } else if (points.isDeterminate(start, x)) {
        return "sound2Continues";
      }
      return "sound2ContinuesTooLong";
    },
    clickHandler: () => "sound2Ends"
  },

  // The second sound has a negative duration.
  sound2ContinuesNegative: {
    comment: "",
    message: "Move to the right to perform the second sound.",
    transitions: {
      sound2ContinuesNegative: true,
      sound2Continues: true
    },
    moveHandler: (points, x) => {
      let start = points.points[PointConstants.sound2First];
      if (start <= x) {
        return "sound2Continues";
      }
      return "sound2ContinuesNegative";
    }
  },

  // The second sound continues too long to realize its projection.
  sound2ContinuesWithoutProjection: {
    comment: "The second sound exceeds the duration projected at its onset; " +
      "the projection is not clearly realized, as indicated by the change in " +
      "the projection.",
    message: "Move to the left to shorten the second sound, or " +
      "click to end it.",
    transitions: {
      sound2Continues: true,
      sound2ContinuesWithoutProjection: true,
      sound2ContinuesTooLong: true,
      sound2EndsWithoutProjection: true
    },
    moveHandler: (points, x) => {
      let start = points.points[PointConstants.sound2First];
      if (points.isWeakDeterminate(start, x)) {
        return "sound2ContinuesWithoutProjection";
      } else if (points.isDeterminate(start, x)) {
        return "sound2Continues";
      }
      return "sound2ContinuesTooLong";
    },
    clickHandler: () => "sound2EndsWithoutProjection"
  },

  // the second sound continues too long to be mensurally determinate.
  sound2ContinuesTooLong: {
    comment: "The second sound is so long that it is mensurally " +
      "indeterminate. (The projection of the first interonset " +
      "duration is not realized.)",
    message: "Move to the left to shorten the second sound, or " +
      "click to end it.",
    transitions: {
      sound2ContinuesWithoutProjection: true,
      sound2ContinuesTooLong: true,
      sound2EndsTooLong: true
    },
    moveHandler: (points, x) => {
      let start = points.points[PointConstants.sound2First];
      if (points.isWeakDeterminate(start, x)) {
        return "sound2ContinuesWithoutProjection";
      } else if (points.isDeterminate(start, x)) {
        return "sound2Continues";
      }
      return "sound2ContinuesTooLong";
    },
    clickHandler: () => "sound2EndsTooLong"
  },

  // The second sound ends, realizing its projection.
  sound2Ends: {
    comment: "The second sound ends. Its duration is 'mensurally " +
      "determinate' because it has the potential for being precisely " +
      "reproduced. But it does not affect the projection of the first " +
      "interonset duration, as shown.",
    message: "Click to begin the third sound.",
    transitions: {
      pause2: true,
      pause2Negative: true
    },
    moveHandler: (points, x) => {
      let start = points.points[PointConstants.sound2Second];
      if (x < start) {
        return "pause2Negative";
      }
      return "pause2";
    }
  },

  // The second sound ends without realizing its projection.
  sound2EndsWithoutProjection: {
    comment: "The second sound exceeds the duration projected at its onset.  " +
      "The projection is not clearly realized, as indicated by the changed " +
      "projection.",
    message: "Restart to try again.",
    transitions: {
      start: true
    }
  },

  // The second sound ends but is too long.
  sound2EndsTooLong: {
    comment: "The second sound is so long that it is mensurally " +
      "indeterminate.  Since the projected potential of the first " +
      "interonset duration is denied there is no projection at all.",
    message: "Restart to try again.",
    transitions: {
      start: true
    }
  },

  //
  // Pause 2
  //
  
  // The second pause begins.
  pause2: {
    comment: "The silence between the second and third sounds is relatively " +
      "indeterminate if our attention is focused on the sounds' " +
      "beginnings. The growing projection indicates that the duration from " +
      "the beginning of the second sound up to now, including the " +
      "silence, has 'projective potential' to be reproduced.",
    message: "Click to begin the third sound.",
    transitions: {
      pause2: true,
      pause2Negative: true,
      pause2TooLong: true,
      sound3StartsAccel: true,
      sound3StartsRealized: true,
      sound3StartsExactly: true,
      sound3StartsSlightlyLate: true,
      sound3StartsSlightlyLateNewProjection: true
    },
    moveHandler: (points, x) => {
      let start = points.points[PointConstants.sound2Second];
      if (x < start) {
        return "pause2Negative";
      }
      if (!points.isDeterminate(start, x)) {
        return "pause2TooLong";
      }
      return "pause2";
    },
    clickHandler: (points, x) => {
      let first = points.points[PointConstants.sound2First];
      let second = points.points[PointConstants.sound2Second];
      if (points.isAccel(first, second, x)) {
        return "sound3StartsAccel";
      }
      if (points.isExact(first, x)) {
        return "sound3StartsExactly";
      }
      if (points.isRealized(first, x)) {
        return "sound3StartsRealized";
      }
      if (points.isSlightlyLate(first, x)) {
        return "sound3StartsSlightlyLate";
      }
      if (points.isSlightlyLateNewProjection(first, x)) {
        return "sound3StartsSlightlyLateNewProjection";
      }

      // This should not be possible to reach, but if it somehow is reached,
      // then ignore the click and stay in pause2.
      return "pause2";
    }
  },

  // The second pause is negative
  pause2Negative: {
    comment: "",
    message: "Click at the end of the second sound or later.",
    transitions: {
      pause2: true,
      pause2Negative: true
    },
    moveHandler: function(points, x) {
      if (x < points.points[PointConstants.sound2Second]) {
        return "pause2Negative";
      }
      return "pause2";
    }
  },

  // The pause has lasted too long to be mensurally determinate.
  pause2TooLong: {
    comment: "The time since the beginning of the second sound is mensurally " +
      "indeterminate, having no projective potential to be reproduced.",
    message: "Click to begin the third sound (earlier if you want a " +
      "projection).",
    transitions: {
      pause2: true,
      pause2TooLong: true,
      sound3StartsTooLate: true
    },
    moveHandler: (points, x) => {
      if (!points.isDeterminate(
            points.points[PointConstants.sound2Second], x)) {
        return "pause2TooLong";
      }
      return "pause2";
    },
    clickHandler: () => "sound3StartsTooLate"
  },

  //
  // Sound 3
  //

  // The third sound starts earlier than expected.
  sound3StartsAccel: {
    comment: "The beginning of the third sound is earlier than projected. " +
      "The second interonset duration is shorter than, but at least " +
      "three-fourths of the first interonset duration. We feel an " +
      "*acceleration* because we sense the realization of the first " +
      "projected duration even as we also perceive the difference " +
      "between the two durations.",
    message: "Restart to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  },

  sound3StartsExactly: {
    comment: "Since the third sound begins exactly at the end of the " +
      "projected duration (the upper dashed arc), the projected " +
      "duration is 'realized'. A new projection is created, " +
      "conditioned by the first, in which the second interonset " +
      "duration has the projective potential (the lower arrow) to be " +
      "reproduced.",
    message: "Restart to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts too late to be mensurally determinate.
  sound3StartsTooLate: {
    comment: "The projective potential of the first interonset duration (the " +
      "dashed arc) is realized, but the projective potential of the " +
      "second interonset duration is not, since it is mensurally " +
      "indeterminate. Because the third sound begins much later than " +
      "projected, we may come to feel 'hiatus' (symbolized by the " +
      "double bar)--a break between the realization of projected " +
      "potential and a new beginning. A new and relatively " +
      "unconditioned potential emerges from the beginning of the " +
      "third sound.",
    message: "Restart to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts, realizing the first projection and suggesting a
  // new projection.
  sound3StartsRealized: {
    comment: "The projection of the first interonset duration is realized. " +
      "As show, another projection can be completed within the promised " +
      "duration, so may enhance its mensural determinacy. The emergence of " +
      "a new beginning, shown in parentheses, would clarify this.",
    message: "Click anywhere to see an alternate interpretation.",
    transitions: {
      sound3StartsAltInterpretation: true
    },
    skipPointCreation: true,
    clickHandler: () => "sound3StartsAltInterpretation"
  },

  sound3StartsAltInterpretation: {
    comment: "In this interpretation, the accent symbolizes an unequivocal " +
      "second beginning that denies the projection of the first " +
      "interonset duration in order to realize a larger projective " +
      "potential.",
    message: "Restart to try again",
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts later than expected.
  sound3StartsSlightlyLate: {
    comment: "The beginning of the third sound is slightly later than " +
      "projected. We hear a *deceleration* because we sense the " +
      "realization of the first projected duration even as we also " +
      "perceive the difference between the two durations.",
    message: "Restart to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts slightly late and suggests a new projection.
  sound3StartsSlightlyLateNewProjection: {
    comment: "The third sound begins somewhat later than projected. A new " +
      "projection, indicated by the lowest arrow and dashed arc, " +
      "emerges, breaking off from the emerging first projection. We " +
      "reject the relevance of the first projection to the mensural " +
      "determinacy of the second interonset duration.",
    message: "Restart to try again.",
    transitions: {
      pause2: true,
      start: true
    }
  }
};

// writeGraph outputs a GraphViz diagram to check the state machine.
// Generate the graph with the test/graph script. The output of this function
// must be wrapped in a graph statement like `strict digraph Meter{` (and with
// a closing bracket at the end).
exports.writeGraph = (states) => {
  let graph = "";
  for (let name in states) {
    for (let dest in states[name].transitions) {
      if (graph !== "") {
        graph += "\n";
      }
      graph += "  " + name + " -> " + dest;
    }
  }
  return graph;
};

// visitHelper keeps track of visited states as it traverses a graph.
let visitHelper = (states, state, visited, fn) => {
  if (visited[state]) {
    return;
  }
  visited[state] = true;
  if (typeof fn === "function") {
    fn(state);
  }
  let results = [];
  for (let neighbor in states[state].transitions) {
    results.push(visitHelper(states, neighbor, visited, fn));
  }
  return results;
};

exports.visit = (states, fn) => {
  let visited = {};
  for (let name in states) {
    visited[name] = false;
  }
  visitHelper(states, "start", visited, fn);
  return visited;
};

// PointError is thrown for error cases that happen in methods of the Points
// class.
class PointError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = "PointError";
  }
}
exports.PointError = PointError;

// These constants name positions in the point array, give identifiers for
// different kinds of projections, and give bounds on different types of
// realization of projections.
const PointConstants = {
  sound1First: 0,
  sound1Second: 1,
  sound2First: 2,
  sound2Second: 3,
  sound3First: 4,
  sound3Second: 5,
  maxPointCount: 6,
  projectionOn: "Projection On",
  projectionOff: "Projection Off",
  projectionCurrent: "Projection Current",
  projectionWeak: "Projection Weak",
  projectionEarly: 1.75,
  projectionExact: 2,
  projectionSlightlyLate: 2.5
};
exports.PointConstants = PointConstants;

// Points keeps track of the current point positions and the properties of these
// positions with respect to each other and with respect to determinacy.
class Points {
  constructor(maxDeterminateLen, ...points) {
    this.maxDeterminateLen = maxDeterminateLen;
    if (points.length > PointConstants.maxPointCount) {
      throw new PointError("too many points");
    }
    this.points = points;
    if (points.length > 0) {
      this.points[0] = 0;
    }
  }

  // pushPoint puts a new point at the end of the points.
  pushPoint(pos) {
    if (this.points.length >= PointConstants.maxPointCount) {
      throw new PointError("all points already defined");
    }
    if (this.points.length === 0) {
      pos = 0;
    }
    return this.points.push(pos);
  }

  // popPoint removes and returns the last point in the array, if any.
  popPoint() {
    if (this.points.length === 0) {
      throw new PointError("no points to remove");
    }
    return this.points.pop();
  }

  // isDeterminate checks to make sure that the difference between the first and
  // second points is less than the amount needed to be mensurally determinate.
  isDeterminate(first, second) {
    return first < second && second - first <= this.maxDeterminateLen;
  }

  // isWeakDeterminate is like isDeterminate, but it fails if second <= 2 *
  // first. In other words, it's the upper range of mensural determinacy.
  isWeakDeterminate(first, second) {
    return this.isDeterminate(first, second) && second > 2 * first;
  }

  // isAccel checks to see if the third onset is earlier than projected.
  isAccel(first, second, end) {
    return this.isDeterminate(first, end) && end > second && end < 1.75 * first;
  }

  // TODO(tmroeder): there's some confusion in the original source about the
  // details of these possibilities. Check them and correct them.
  // isRealized checks to see if the third onset is close to the projected
  // duration.
  isRealized(start, end) {
    return this.isDeterminate(start, end) && end > 1.75 * start &&
        end < 2 * start;
  }

  // isExact checks to see if the third onset is exactly as projected.
  isExact(start, end) {
    return this.isDeterminate(start, end) && end === 2 * start;
  }

  // isSlightlyLate checks to see if a determinate start and end has its end
  // point within (2 * start, 2.5 * start).
  isSlightlyLate(start, end) {
    return this.isDeterminate(start, end) && end > 2 * start &&
        end < 2.5 * start;
  }

  // isSlightlyLateNewProjection checks to see if a determinate start and end
  // has its end greater than 2.5 * start.
  isSlightlyLateNewProjection(start, end) {
    return this.isDeterminate(start, end) && end >= 2.5 * start;
  }

  // isTooLate checks to see if the third onset occurs in a mensurally
  // indeterminate position after the second sound.
  isTooLate(start, end) {
    return !this.isDeterminate(start, end);
  }

  // Whether or not this set of points is in the first sound.
  inFirstSound() {
    return this.points.length === 1;
  }

  // Whether or not this set of points is in the second sound.
  inSecondSound() {
    return this.points.length === 3;
  }

  // firstProjection describes the projective potential of the first inter-onset
  // duration.
  firstProjection(cur) {
    let pointCount = this.points.length;
    if (pointCount === 0) {
      return PointConstants.projectionOff;
    }

    let first = this.points[PointConstants.sound1First];
    let determinate = this.isDeterminate(first, cur);
    if (pointCount === 1 || pointCount === 2) {
      if (!determinate) {
        return PointConstants.projectionOff;
      }
      return PointConstants.projectionCurrent;
    }

    if (pointCount > 2) {
      third = this.points[PointConstants.sound2First];
      if (this.isDeterminate(first, third)) {
        return PointConstants.projectionOn;
      }
    }
    return PointConstants.projectionOff;
  }

  // secondProjection describes the current projective potential of the second
  // sound.
  secondProjection(cur) {
    let pointCount = this.points.length;
    if (pointCount < 3 || pointCount > 4) {
      return PointConstants.projectionOff;
    }

    let first = this.points[PointConstants.sound2First];
    if (pointCount === 3) {
      // Weak projection occurs if cur is the right amount beyond the first
      // sound.
      if (this.isWeakDeterminate(first, cur)) {
        return PointConstants.projectionWeak;
      }
      if (this.isDeterminate(first, cur)) {
        return PointConstants.projectionOn;
      }
      return PointConstants.projectionOff;
    }

    // Projection occurs if there's no current point or it's between the first
    // and second points.
    let second = this.points[PointConstants.sound2Second];
    if (!this.isDeterminate(first, second)) {
      return PointConstants.projectionOff;
    }
    if ((cur == null) || cur < second) {
      return PointConstants.projectionOn;
    }

    // Projection also occurs if cur is a mensurally determinate distance past
    // the first sound.
    if (this.isDeterminate(first, cur)) {
      return PointConstants.projectionOn;
    }
    return PointConstants.projectionOff;
  }
}
exports.Points = Points;
