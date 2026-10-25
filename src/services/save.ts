// Zapis postępu w localStorage (działa w przeglądarce i w WebView Capacitora).
const KEY = 'shoo.save.v1';

interface SaveData {
  stars: Record<number, number>; // id poziomu -> najlepsza liczba gwiazdek (1–3)
  adsRemoved: boolean; // ustawiane po zakupie "usuń reklamy"
  levelsFinished: number; // licznik do częstotliwości reklam interstitial
}

const defaults = (): SaveData => ({ stars: {}, adsRemoved: false, levelsFinished: 0 });

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch {
    return defaults();
  }
}

function persist(d: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* tryb prywatny / brak miejsca – gra działa dalej bez zapisu */
  }
}

let data = load();

export const save = {
  starsFor: (id: number) => data.stars[id] ?? 0,
  /** Poziom 1 jest zawsze odblokowany, kolejny po ukończeniu poprzedniego. */
  isUnlocked: (id: number, index: number) => index === 0 || (data.stars[id - 1] ?? 0) > 0 || save.starsFor(id) > 0,
  totalStars: () => Object.values(data.stars).reduce((a, b) => a + b, 0),
  recordResult(id: number, stars: number) {
    if (stars > (data.stars[id] ?? 0)) data.stars[id] = stars;
    data.levelsFinished++;
    persist(data);
  },
  get levelsFinished() { return data.levelsFinished; },
  get adsRemoved() { return data.adsRemoved; },
  setAdsRemoved(v: boolean) { data.adsRemoved = v; persist(data); },
  reset() { data = defaults(); persist(data); },
};
