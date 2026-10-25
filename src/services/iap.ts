// MIEJSCE POD ZAKUP "USUŃ REKLAMY" – na razie bez implementacji (stub).
//
// Później: podepnij plugin zakupów (np. RevenueCat / cordova-plugin-purchase),
// po udanym zakupie wywołaj save.setAdsRemoved(true).
import { save } from './save';

export interface IapService {
  /** Czy zakup jest dostępny na tej platformie (UI pokazuje przycisk tylko wtedy). */
  isAvailable(): boolean;
  /** Zakup "usuń reklamy". Zwraca true po sukcesie. */
  buyRemoveAds(): Promise<boolean>;
  /** Przywracanie zakupów (wymóg iOS). */
  restore(): Promise<boolean>;
}

class NoopIap implements IapService {
  isAvailable() { return false; }
  async buyRemoveAds() { /* TODO: zakup, potem save.setAdsRemoved(true) */ void save; return false; }
  async restore() { return false; }
}

export const iap: IapService = new NoopIap();
