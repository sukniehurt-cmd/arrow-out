import type { LevelDef } from './sim';

/** Serializacja z jednym ptakiem na linię – czytelne diffy w gicie. */
export function formatLevel(l: LevelDef): string {
  const birds = l.birds
    .map((b) => `    { "x": ${b.x}, "y": ${b.y}, "dir": "${b.dir}"${b.type && b.type !== 'bird' ? `, "type": "${b.type}"` : ''} }`)
    .join(',\n');
  return `{
  "id": ${l.id},
  "name": ${JSON.stringify(l.name)},
  "cols": ${l.cols},
  "rows": ${l.rows},
  "maxMoves": ${l.maxMoves},
  "par": ${l.par ?? 'null'},
  "birds": [
${birds}
  ]
}
`;
}
