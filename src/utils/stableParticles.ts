const palette = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

function stableUnit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function makeFloatingParticles(count: number, seed = 1) {
  return Array.from({ length: count }, (_, index) => {
    const nextSeed = seed + index * 17;

    return {
      id: index,
      left: `${stableUnit(nextSeed) * 100}%`,
      top: `${stableUnit(nextSeed + 1) * 100}%`,
      x: stableUnit(nextSeed + 2) * 100 - 50,
      smallX: stableUnit(nextSeed + 3) * 30 - 15,
      y: stableUnit(nextSeed + 4) * 100 - 50,
      duration: 2 + stableUnit(nextSeed + 5) * 6,
      delay: `${stableUnit(nextSeed + 6) * 0.5}s`,
      color: palette[Math.floor(stableUnit(nextSeed + 7) * palette.length)] ?? palette[0],
    };
  });
}
