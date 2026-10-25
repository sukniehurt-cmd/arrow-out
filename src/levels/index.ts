import type { LevelDef } from '../core/sim';

// Każdy plik src/levels/*.json jest wczytywany automatycznie – wystarczy dodać plik.
const modules = import.meta.glob<LevelDef>('./*.json', { eager: true, import: 'default' });

export const LEVELS: LevelDef[] = Object.values(modules).sort((a, b) => a.id - b.id);
