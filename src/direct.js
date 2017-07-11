"use strict";

var parseArgs = require('minimist');

// The expected arguments are a list of numbers:
//   limit end1 start2 end2 start3
// Any prefix is also accepted. If the last entry is to be interpreted as the
// current location (rather than a point), then pass the flag --cur. The
// starting point of the first sound is always present and is always 0.
var opts = {
  boolean: ['cur'],
  default: {
    cur: false
  }
};
var argv = parseArgs(process.argv.slice(2));
console.dir(argv);

if (argv._.length > 5) {
  console.log('Too many entries');
  process.exit(1);
}

if (argv._.length < 2) {
  console.log('Too few entries');
  process.exit(1);
}

// Sanity checks:
// - values are in increasing order.

var cur = argv.cur === undefined ? false : argv.cur;

var limit = argv._[0];
var points = argv._.slice(1);

var value = 0;
for (var i = 0; i < points.length; i++) {
  if (points[i] < value) {
    console.log('Invalid sequence: ' + points[i] + ' < ' + value);
    process.exit(1);
  }

  value = points[i];
}

var curValue;
if (cur) {
  curValue = points.splice(points.length - 1, 1);
}

// At this point, we have an increasing list of points, with cur taking place
// after the last point, if there is a cur.
console.log(points);

sounds = {
  first: {
    start: 0,
    end: null,
    potentialEnd: null,
    complete: null
  },
  second: {
    start: null,
    end: null,
    potentialEnd: null,
    complete: false,
  },
  third {
    start: null,
    state: null
  }
};

function isDeterminate(start, end, limit) {
  return (end - start) <= limit;
}

function fillSound1Cur(sounds, limit, cur) {
  sounds.first.end = cur;
  sounds.complete = false;
  if (isDeterminate(sounds.first.start, cur, limit)) {
    sounds.first.potentialEnd = cur;
  }
}

function fillSound1EndCur(sounds, limit, end, cur) {
  sounds.first.end = end;
  sounds.complete = true;
  if (isDeterminate(sounds.first.start, cur, limit)) {
    sounds.first.potentialEnd = cur;
  }
}

function fillSound1End(sounds, limit, end) {
  sounds.first.end = end;
  sounds.complete = true;
  if (isDeterminate(sounds.first.start, end, limit)) {
    sounds.first.potentialEnd = end;
  }
}

function fillSound2Cur(sounds, limit, firstEnd, secondStart, cur) {
  fillSound2Start(sounds, limit, firstEnd, secondStart);
  if (isDeterminate(sounds.second.start, cur, limit)) {
    sounds.second.potentialEnd = cur;
  }
}

function fillSound2Start(sounds, limit, firstEnd, secondStart) {
  // The first sound behaves as if its cur stopped at the beginning of the
  // second sound.
  fillSound1EndCur(sounds, limit, firstEnd, secondStart);
  if (sounds.first.potentialEnd == null) {
    throw 'Second start follows indeterminate first sound';
  }

  sounds.second.start = secondStart;
}

function fillSound2End(sounds, limit, firstEnd, secondStart, secondEnd) {
  fillSound2Start(sounds, limit, firstEnd, secondStart);
  if (isDeterminate(sounds.second.start, secondEnd, limit)) {
    sounds.second.potentialEnd = secondEnd;
  }
  sounds.second.end = secondEnd;
  sounds.second.complete = true;
}

function fillSound2EndCur(sounds, limit, firstEnd, secondStart, secondEnd, curValue) {
  fillSound2End(sounds, limit, firstEnd, secondStart, secondEnd);
  if (isDeterminate(sounds.second.start, curValue, limit)) {
    sounds.second.potentialEnd = curValue;
  }
}

function fillSound3(sounds, limit, firstEnd, secondStart, secondEnd, thirdStart) {
  fillSound2EndCur(sounds, limit, firstEnd, secondStart, secondEnd, thirdStart);
  computeThirdState(sounds, limit, sounds.second.start, sounds.third.start);
}

function computeThirdState(sounds, limit, secondStart, thirdStart) {
  if (!isDeterminate(secondStart, thirdStart, limit)) {
    sounds.third.state = 'indeterminate';
    return;
  }

  if (thirdStart < 1.75 * secondStart) {
    sounds.third.state = 'accel';
  } else if (thirdStart >= 1.75 * secondStart && thirdStart < 2 * secondStart) {
    sounds.third.state = 'realized';
  } else if (thirdStart == 2 * secondStart) {
    sounds.third.state = 'exact';
  } else if (thirdStart > 2 * secondStart && thirdStart <= 2.25 * secondStart) {
    sounds.third.state = 'realized';
  } else if (thirdStart >= 2.25 * secondStart && thirdStart < 2.5 * secondStart) {
    sounds.third.state = 'rall';
  } else { // if (thirdStart >= 2.5 * secondStart)
    sounds.third.state = 'separate';
  }
}


eventCount = points.length;
switch (eventCount) {
  case 0:
    // Cur must be set.
    fillSound1Cur(sounds, limit, curValue);
    break;
  case 1:
    if (cur) {
      fillSound1EndCur(sounds, limit, points[0], curValue);
      break;
    }
    fillSound1End(sounds, limit, points[0]);
    break;
  case 2:
    if (cur) {
      fillSound2Cur(sounds, limit, points[0], points[1], curValue);
      break;
    }
    fillSound2Start(sounds, limit, points[0], points[1]);
    break;
  case 3:
    if (cur) {
      fillSound2EndCur(sounds, limit, points[0], points[1], points[2], curValue);
      break;
    }
    fillSound2End(sounds, limit, points[0], points[1], points[2]);
    break;
  case 4:
    // Cur cannot be set.
    fillSound3(sounds, limit, points[0], points[1], points[2], points[3]);
    break;
}
