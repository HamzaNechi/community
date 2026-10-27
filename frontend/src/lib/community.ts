const LEVELS = [
  { minimum: 0, name: 'Nouveau venu' },
  { minimum: 25, name: 'Membre' },
  { minimum: 100, name: 'Contributeur' },
  { minimum: 300, name: 'Contributeur averti' },
  { minimum: 750, name: 'Pilier de la communauté' },
];

export function getCommunityLevel(points: number) {
  const index = LEVELS.reduce(
    (current, level, levelIndex) => (points >= level.minimum ? levelIndex : current),
    0,
  );
  const current = LEVELS[index];
  const next = LEVELS[index + 1];
  const progress = next
    ? Math.round(((points - current.minimum) / (next.minimum - current.minimum)) * 100)
    : 100;

  return {
    name: current.name,
    nextName: next?.name ?? null,
    pointsToNext: next ? Math.max(0, next.minimum - points) : 0,
    progress: Math.min(100, progress),
  };
}
