// MIEJSCE POD ADMOB – na razie bez implementacji (stub).
//
// Jak podpiąć AdMob później: zainstaluj plugin Capacitor (np. @capacitor-community/admob),
// zaimplementuj interfejs AdService w nowej klasie i podmień `ads` na jej instancję.
// Reszta gry wywołuje tylko metody poniżej, więc nie trzeba jej zmieniać.
import { save } from './save';

export interface AdService {
  /** Czy reklama nagradzana jest gotowa (UI pokazuje przycisk tylko wtedy). */
  isRewardedReady(): boolean;
  /** Interstitial między poziomami. Pomijany, gdy użytkownik wykupił "usuń reklamy". */
  showInterstitial(): Promise<void>;
  /** Reklama nagradzana (np. +3 ruchy po porażce). Zwraca true, gdy gracz obejrzał ją do końca. */
  showRewarded(): Promise<boolean>;
}

class NoopAds implements AdService {
  isRewardedReady() { return false; }
  async showInterstitial() { /* TODO AdMob interstitial */ }
  async showRewarded() { /* TODO AdMob rewarded */ return false; }
}

export const ads: AdService = new NoopAds();

/** Co ile ukończonych poziomów pokazywać interstitial. */
export const INTERSTITIAL_EVERY = 3;

export function maybeShowInterstitial(): Promise<void> {
  if (save.adsRemoved) return Promise.resolve();
  if (save.levelsFinished % INTERSTITIAL_EVERY !== 0) return Promise.resolve();
  return ads.showInterstitial();
}
