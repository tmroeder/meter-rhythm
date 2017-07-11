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

'use strict';

// The starting state in the state machine.
export const StartState = "start";

// The States object holds the state machine for the simulation. It consists of
// a set of named states (like "start"), each with a comment and a message. The
// comment provides an interpretation of the current state, and the message
// suggests actions to take in the current state.
export const States = {
  // The starting state of the program.
  start: {
    comment: 'This demonstrates the concepts in Chapter 7 of Christopher ' +
      'Hasty\'s \'Meter as Rhythm\'. Imagine time 0 as an instant that ' +
      'is a potential beginning of a sound, yet prior to and ' +
      'independent of it.',
    message: 'You may perform graphically up to three successive sounds by ' +
      'clicking and moving. The first click sets the beginning of the sound ' +
      'at time 0. Click but don\'t move.',
    clicks: 'sound1Starts'
  },

  //
  // Sound 1
  //

  // The beginning of the first sound.
  sound1Starts: {
    comment: 'The first sound begins, but time 0 will not be a beginning ' +
      'until it is past.',
    message: 'Perform the first sound by moving to the right.',
    moves: 'sound1Continues'
  },

  // The first sound continues and isn't too long.
  sound1Continues: {
    comment: 'The first sound is becoming. Time 0 becomes its beginning. ' +
      '\'Projective potential\'--the potential of a duration to be ' +
      'reproduced by a successive duration--accumulates, as indicated ' +
      'by the solid arc.',
    message: 'End the first sound by clicking.',
    moves: {
      indeterminate: 'sound1ContinuesTooLong',
      determinate: 'sound1Continues'
    },
    clicks: 'sound1Ends'
  },

  // The first sound is too long.
  sound1ContinuesTooLong: {
    comment: 'The first sound\'s duration is so long that it is \'mensurally ' +
      'indeterminate\'--it has lost its projective potential to be ' +
      'reproduced.',
    message: 'To make the first sound\'s duration determinate, move back to ' +
      'the left. Or click to end the sound.',
    moves: {
      indeterminate: 'sound1ContinuesTooLong',
      determinate: 'sound1Continues'
    },
    clicks: 'sound1EndsTooLong'
  },

  // The first sound ends with a length that isn't too long.
  sound1Ends: {
    comment: 'The first sound ends. Its duration is \'mensurally ' +
      'determinate\' because it has the potential for being precisely ' +
      'reproduced.',
    message: 'To begin the second sound, click.',
    moves: 'pause1'
  },

  // The first sound ends with a length that exceeds kMaxSoundLen.
  sound1EndsTooLong: {
    comment: 'The first sound ends; it is too long to have projective ' +
      'potential.',
    message: 'Reload to try again.',
  },

  //
  // Pause 1
  //

  // There is a pause between the first and second sounds.
  pause1: {
    comment: 'There is a pause between the first two sounds. Its duration is ' +
      'relatively indeterminate, if our attention is focused on the ' +
      'beginning of sounds. The growing arc indicates that the ' +
      'duration of the first sound *plus* the following silence ' +
      'itself has the \'projective potential\' to be reproduced.',
    message: 'Click to begin the second sound.',
    moves: {
      determinate: 'pause1'
      indeterminate: 'pause1TooLong'
    },
    clicks: {
      determinateSilence: 'sound2Starts',
      indeterminate: 'sound2StartsTooLong'
    }
  },

  // The length of the sound and pause together is not mensurally determinate.
  pause1TooLong: {
    comment: 'The time since the beginning of the first sound is mensurally ' +
      'indeterminate, having no projective potential to be reproduced.',
    message: 'Click to begin the second sound (earlier if you want a ' +
      'projection).',
    moves: {
      determinate: 'pause1',
      indeterminate: 'pause1TooLong'
    }
    clicks: 'sound2StartsTooLong'
  },

  //
  // Sound 2
  //

  // The beginning of the second sound.
  sound2Starts: {
    comment: 'This beginning of the second sound \'realizes\' the projective ' +
      'potential of the duration begun by the first event\'s attack. ' +
      'The new arc represents this projective potential. The ' +
      'event now beginning has the potential to reproduce this past ' +
      'duration. The dashed arc, extending for this duration into the ' +
      'future, symbolizes this \'projected potential\'.',
    message: 'Perform the second sound by moving to the right.',
    moves: {
      indeterminate: 'sound2ContinuesTooLong'
      determinate: {
        unrealized: 'sound2ContinuesWithoutProjection',
        _: 'sound2Continues'
      }
    }
  },

  // The beginning of the second sound after too long a duration since the first
  // sound started.
  sound2StartsTooLong: {
    comment: 'The second sound begins. It is so long since the beginning of ' +
      'the first event that the interonset duration is mensurally ' +
      'indeterminate--it has no potential to be reproduced--so there ' +
      'is no projection.',
    message: 'Reload to try again.',
  },

  // The second sound continues and is not too long.
  sound2Continues: {
    comment: 'The accumulating duration of the second sound is realizing the ' +
      'projected potential of the first interonset duration. ' +
      'Simultaneously the present event accumulates its own projective ' +
      'potential (represented by the second solid arc) to be realized by ' +
      'the onset of a third event.',
    message: 'Click to end the second sound.',
    moves: {
      indeterminate: 'sound2ContinuesTooLong',
      determinate: {
        unrealized: 'sound2ContinuesWithoutProjection',
        _: 'sound2Continues'
      }
    },
    clicks: 'sound2Ends'
  },

  // TODO(tmroeder): Need X through the projection.
  // TODO(tmroeder): Arcs need to be open, not complete. It comes up and goes
  // straight and only closes the curve when it becomes a real projective
  // potential.
  // The second sound continues too long to realize its projection.
  sound2ContinuesWithoutProjection: {
    comment: 'The second sound exceeds the duration projected at its onset; ' +
      'the projection is not clearly realized, as indicated by the X ' +
      'through the dashed arc.',
    message: 'Move to the left to shorten the second sound, or ' +
      'click to end it.',
    moves: {
      indeterminate: 'sound2ContinuesTooLong',
      determinate: {
        unrealized: 'sound2ContinuesWithoutProjection',
        _: 'sound2Continues'
      }
    },
    clicks: 'sound2EndsWithoutProjection'
  },

  // The second sound continues too long to be mensurally determinate.
  sound2ContinuesTooLong: {
    comment: 'The second sound is so long that it is mensurally ' +
      'indeterminate. (The projection of the first interonset ' +
      'duration is not realized.)',
    message: 'Move to the left to shorten the second sound, or ' +
      'click to end it.',
    moves: {
      indeterminate: 'sound2ContinuesTooLong',
      determinate: {
        unrealized: 'sound2ContinuesWithoutProjection',
        _: 'sound2Continues'
      }
    },
    clicks: 'sound2EndsTooLong'
  },

  // The second sound ends, realizing the first projection.
  sound2Ends: {
    comment: 'The second sound ends. Its duration is \'mensurally ' +
      'determinate\' because it has the potential for being precisely ' +
      'reproduced. But it does not affect the projection of the first ' +
      'interonset duration, as shown.',
    message: 'Click to begin the third sound.',
    moves: 'pause2'
  },

  // The second sound ends without realizing its projection.
  sound2EndsWithoutProjection: {
    comment: 'The second sound exceeds the duration projected at its onset. ' +
      'The projection is not clearly realized, as indicated by the X ' +
      'through the dashed arc.',
    message: 'Reload to try again.',
  },

  // The second sound ends but is too long.
  sound2EndsTooLong: {
    comment: 'The second sound is so long that it is mensurally ' +
      'indeterminate.  Since the projected potential of the first ' +
      'interonset duration is denied there is no projection at all.',
    message: 'Reload to try again.',
  },

  //
  // Pause 2
  //

  // The second pause begins.
  pause2: {
    comment: 'The silence between the second and third sounds is relatively ' +
      'indeterminate if our attention is focused on the sounds\' ' +
      'beginnings. The growing projection indicates that the duration from ' +
      'the beginning of the second sound up to now, including the ' +
      'silence, has \'projective potential\' to be reproduced.',
    message: 'Click to begin the third sound.',
    moves: {
      determinate: 'pause2',
      indeterminate: 'pause2TooLong'
    },
    clicks: {
      determinate: {
        accel: 'sound3StartsAccel',
        realized: 'sound3StartsRealized',
        exact: 'sound3StartsExactly',
        rall: 'sound3StartsSlightlyLate',
        unrealized: 'sound3StartsSlightlyLateNewProjection'
      },
      indeterminate: 'sound3StartsTooLate'
    }
    clickHandler: (points, x) => {
      let first = points.points[PointConstants.sound2First];
      let second = points.points[PointConstants.sound2Second];
      if (points.isAccel(first, second, x)) {
        return 'sound3StartsAccel';
      }
      if (points.isExact(first, x)) {
        return 'sound3StartsExactly';
      }
      if (points.isRealized(first, x)) {
        return 'sound3StartsRealized';
      }
      if (points.isSlightlyLate(first, x)) {
        return 'sound3StartsSlightlyLate';
      }
      if (points.isSlightlyLateNewProjection(first, x)) {
        return 'sound3StartsSlightlyLateNewProjection';
      }

      // This should not be possible to reach, but if it somehow is reached,
      // then ignore the click and stay in pause2.
      return 'pause2';
    }
  },

  // The second pause is negative
  pause2Negative: {
    comment: '',
    message: 'Click at the end of the second sound or later.',
    transitions: {
      pause2: true,
      pause2Negative: true
    },
    moveHandler: function(points, x) {
      if (x < points.points[PointConstants.sound2Second]) {
        return 'pause2Negative';
      }
      return 'pause2';
    }
  },

  // The pause has lasted too long to be mensurally determinate.
  pause2TooLong: {
    comment: 'The time since the beginning of the second sound is mensurally ' +
      'indeterminate, having no projective potential to be reproduced.',
    message: 'Click to begin the third sound (earlier if you want a ' +
      'projection).',
    transitions: {
      pause2: true,
      pause2TooLong: true,
      sound3StartsTooLate: true
    },
    moveHandler: (points, x) => {
      if (!points.isDeterminate(
          points.points[PointConstants.sound2Second], x)) {
        return 'pause2TooLong';
      }
      return 'pause2';
    },
    clickHandler: () => 'sound3StartsTooLate'
  },

  //
  // Sound 3
  //

  // The third sound starts earlier than expected.
  sound3StartsAccel: {
    comment: 'The beginning of the third sound is earlier than projected. ' +
      'The second interonset duration is shorter than, but at least ' +
      'three-fourths of the first interonset duration. We feel an ' +
      '*acceleration* because we sense the realization of the first ' +
      'projected duration even as we also perceive the difference ' +
      'between the two durations.',
    message: 'Reload to try again.',
    transitions: {
      pause2: true,
      start: true
    }
  },

  // TODO(tmroeder): Need a parameter to give slack. This is 10% in the
  // original.
  // TODO(tmroeder): The arcs need to be below the sounds.
  // TODO(tmroeder): The second arc needs to be separated from the dashed arc
  // and below it.
  // TODO(tmroeder): The hiatus needs to be between the two sounds.
  sound3StartsExactly: {
    comment: 'Since the third sound begins close to the end of the ' +
      'projected duration (the dashed arc), the projected ' +
      'duration is \'realized\'. A new projection is created, ' +
      'conditioned by the first, in which the second interonset ' +
      'duration has the projective potential (the lower solid arc) to be ' +
      'reproduced.',
    message: 'Reload to try again.',
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts too late to be mensurally determinate.
  sound3StartsTooLate: {
    comment: 'The projective potential of the first interonset duration (the ' +
      'dashed arc) is realized, but the projective potential of the ' +
      'second interonset duration is not, since it is mensurally ' +
      'indeterminate. Because the third sound begins much later than ' +
      'projected, we may come to feel \'hiatus\' (symbolized by the ' +
      'double bar)--a break between the realization of projected ' +
      'potential and a new beginning. A new and relatively ' +
      'unconditioned potential emerges from the beginning of the ' +
      'third sound.',
    message: 'Reload to try again.',
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts, realizing the first projection and suggesting a
  // new projection.
  // TODO(tmroeder): See the photo of the two interpretations. This needs
  // revision.
  sound3StartsRealized: {
    comment: 'The projection of the first interonset duration is realized. ' +
      'As shown, another projection can be completed within the promised ' +
      'duration, so may enhance its mensural determinacy. The emergence of ' +
      'a new beginning, shown in parentheses, would clarify this.',
    message: 'Click anywhere to see an alternate interpretation.',
    transitions: {
      sound3StartsAltInterpretation: true
    },
    skipPointCreation: true,
    clickHandler: () => 'sound3StartsAltInterpretation'
  },

  sound3StartsAltInterpretation: {
    comment: 'In this interpretation, the accent symbolizes an unequivocal ' +
      'second beginning that denies the projection of the first ' +
      'interonset duration in order to realize a larger projective ' +
      'potential.',
    message: 'Reload to try again',
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts later than expected.
  // TODO(tmroeder): change decel to rall.
  // TODO(tmroeder): Look up this book in the UBC Library: Hasty Meter Rhythm.
  // Part II, Chapter 7.
  sound3StartsSlightlyLate: {
    comment: 'The beginning of the third sound is slightly later than ' +
      'projected. We hear a *deceleration* because we sense the ' +
      'realization of the first projected duration even as we also ' +
      'perceive the difference between the two durations.',
    message: 'Reload to try again.',
    transitions: {
      pause2: true,
      start: true
    }
  },

  // The third sound starts slightly late and suggests a new projection.
  sound3StartsSlightlyLateNewProjection: {
    comment: 'The third sound begins somewhat later than projected. A new ' +
      'projection, indicated by the second solid arc and new dashed arc, ' +
      'emerges, breaking off from the emerging first projection. We ' +
      'reject the relevance of the first projection to the mensural ' +
      'determinacy of the second interonset duration.',
    message: 'Reload to try again.',
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
export function writeGraph(states) {
  let graph = '';
  for (let name in states) {
    for (let dest in states[name].transitions) {
      if (graph !== '') {
        graph += '\n';
      }
      graph += '  ' + name + ' -> ' + dest;
    }
  }
  return graph;
};

// visitHelper keeps track of visited states as it traverses a graph.
function visitHelper(states, state, visited, fn) {
  if (visited[state]) {
    return;
  }
  visited[state] = true;
  if (typeof fn === 'function') {
    fn(state);
  }
  let results = [];
  for (let neighbor in states[state].transitions) {
    results.push(visitHelper(states, neighbor, visited, fn));
  }
  return results;
};

export function visit(states, fn) {
  let visited = {};
  for (let name in states) {
    visited[name] = false;
  }
  visitHelper(states, 'start', visited, fn);
  return visited;
};

// PointError is thrown for error cases that happen in methods of the Points
// class.
export class PointError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = 'PointError';
  }

  toString() {
    return this.message;
  }
}

// These constants name positions in the point array, give identifiers for
// different kinds of projections, and give bounds on different types of
// realization of projections.
export const PointConstants = {
  sound1First: 0,
  sound1Second: 1,
  sound2First: 2,
  sound2Second: 3,
  sound3First: 4,
  sound3Second: 5,
  maxPointCount: 6,
  projectionOn: 'Projection On',
  projectionOff: 'Projection Off',
  projectionCurrent: 'Projection Current',
  projectionWeak: 'Projection Weak',
  projectionEarly: 1.75,
  projectionExact: 2,
  projectionSlightlyLate: 2.5
};

// Points keeps track of the current point positions and the properties of these
// positions with respect to each other and with respect to determinacy.
export class Points {
  constructor(maxDeterminateLen, ...points) {
    this.maxDeterminateLen = maxDeterminateLen;
    if (points.length > PointConstants.maxPointCount) {
      throw new PointError('too many points');
    }
    this.points = points;
    if (points.length > 0) {
      this.points[0] = 0;
    }
  }

  // pushPoint puts a new point at the end of the points.
  pushPoint(pos) {
    if (this.points.length >= PointConstants.maxPointCount) {
      throw new PointError('all points already defined');
    }
    if (this.points.length === 0) {
      pos = 0;
    }
    return this.points.push(pos);
  }

  // popPoint removes and returns the last point in the array, if any.
  popPoint() {
    if (this.points.length === 0) {
      throw new PointError('no points to remove');
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
      let third = this.points[PointConstants.sound2First];
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
