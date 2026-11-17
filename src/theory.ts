// Hasty's thresholds for metrical projection (Meter as Rhythm, ch. 7), in
// viewBox units along the timeline. The first sound always begins at 0, so
// the second onset's x is also the first interonset duration, the duration
// that the second onset projects.

/** Lim: the longest duration that is mensurally determinate, about two
 *  seconds. The timeline is three Lim long. */
export const LIM = Math.floor(400 / 3);

/** The last moment at which a duration begun at `t` is still mensurally
 *  determinate. A duration of exactly Lim is determinate; every comparison
 *  keeps to that. */
export function limFrom(t: number): number {
    return t + LIM;
}

/** Where the first interonset duration, projected from the second onset at
 *  `onset`, ends: an onset here realizes the projection exactly. */
export function projectedEnd(onset: number): number {
    return 2 * onset;
}

/** The earliest third onset still heard as an acceleration, the projection
 *  realized though early: a second interonset duration of at least
 *  three-fourths of the first. Earlier, a shorter projection emerges. */
export function accelerationStart(onset: number): number {
    return 1.75 * onset;
}

/** The latest third onset still heard as a deceleration, the projection
 *  realized though late: a second interonset duration of less than one and
 *  a half times the first. Later, the first projection is rejected. */
export function decelerationEnd(onset: number): number {
    return 2.5 * onset;
}
