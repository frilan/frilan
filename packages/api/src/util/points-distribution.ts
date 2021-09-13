/**
 * Returns the amount of points for a rank, distributed in an exponential way.
 * @param rank The current rank (starting from 1)
 * @param tiedTeams The number of tied team with the same rank
 * @param totalTeams The number of teams in total
 * @param points The number of points given per player
 * @param curve The distribution curve adjustment (recommended: 5)
 */
export function distributeExp(rank: number, tiedTeams: number, totalTeams: number, points: number, curve = 5): number {
    const ranksRange = Array.from(new Array(tiedTeams), (_, i) => i + rank)
    const score = ranksRange.reduce((acc, rank) => acc + totalTeams * points
        * (Math.exp((1 - rank) / totalTeams * curve) - Math.exp((-rank) / totalTeams * curve)), 0)
    return Math.round(score / tiedTeams)
}
