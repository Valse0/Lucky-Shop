import { describe, it } from 'vitest';
import { evaluateGridOutcome, generateGrid } from '../slotEngine';

describe('Lucky Shop Economy Simulation', () => {
  it('runs 100,000 spin Monte Carlo simulation for Normal and Royal modes', () => {
    function simulate(royalMode: boolean, spins = 100000, seed = 123456789) {
      let s = seed;
      const lcg = () => {
        s = (1664525 * s + 1013904223) % 4294967296;
        return s / 4294967296;
      };

      const bet = 100;
      let totalBet = 0;
      let totalWon = 0;
      let winningSpins = 0;
      let bigWins = 0;
      let scatterWins = 0;
      let diamondBonuses = 0;

      for (let i = 0; i < spins; i++) {
        totalBet += bet;
        const grid = generateGrid(lcg, royalMode);
        const outcome = evaluateGridOutcome(grid, bet, 0, royalMode);
        totalWon += outcome.totalWin;
        if (outcome.totalWin > 0) winningSpins++;
        if (outcome.isBigWin) bigWins++;
        if (outcome.scatterWin) scatterWins++;
        if (outcome.gemsFound > (outcome.scatterWin ? 2 : 0)) diamondBonuses++;
      }

      const rtp = ((totalWon / totalBet) * 100).toFixed(2);
      const hitFreq = ((winningSpins / spins) * 100).toFixed(2);
      const avgWin = (totalWon / spins).toFixed(2);

      return { rtp, hitFreq, avgWin, bigWins, scatterWins, diamondBonuses, spins };
    }

    const normal = simulate(false, 50000);
    const royal = simulate(true, 50000);

    console.log('\n--- NORMAL MODE (Balanced) ---');
    console.log(`RTP: ${normal.rtp}% | Hit Freq: ${normal.hitFreq}% | Big Wins: ${normal.bigWins} | Scatters: ${normal.scatterWins}`);
    console.log('--- ROYAL MODE (Rewarding) ---');
    console.log(`RTP: ${royal.rtp}% | Hit Freq: ${royal.hitFreq}% | Big Wins: ${royal.bigWins} | Scatters: ${royal.scatterWins}\n`);
  });
});
