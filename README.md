# Shoo!

Mobilna gra logiczna: na drutach siedzą ptaki, każdy patrzy w jedną stronę. Tapnij ptaka – odleci
w swoim kierunku i spłoszy każdego, kogo mijał; ci odlecą w SWOIM kierunku (reakcja łańcuchowa).
Wyczyść planszę w limicie tapnięć. 1–3 gwiazdki zależnie od liczby ruchów.

Stack: Phaser 3 + TypeScript + Vite, pakowane Capacitorem (Android, później iOS).

## Uruchomienie lokalnie

Wymagania: Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173 (dostępne też z telefonu w tej samej sieci)
npm run build      # typecheck + produkcyjny build do dist/
npm test           # testy reguł gry
```

Grę najlepiej oglądać w trybie urządzenia mobilnego (DevTools → Toggle device toolbar).
Rozdzielczość logiczna to 720×1280, skalowana do ekranu (`Scale.FIT`).

## Budowanie APK (Android)

Wymagania: JDK 17+, Android Studio lub samo Android SDK (`ANDROID_HOME`).

```bash
npm run android:apk
# = build webowy → cap sync → ./gradlew assembleDebug
# wynik: android/app/build/outputs/apk/debug/app-debug.apk
```

Albo przez Android Studio: `npm run cap:sync && npm run android:open`, potem Build → Build APK(s).

Wydanie (podpisane APK/AAB) – w Android Studio: Build → Generate Signed Bundle / APK.
Przed publikacją zmień `appId` w `capacitor.config.ts` (obecnie `com.example.shoo`) – a jeśli
zmieniasz go po wygenerowaniu projektu, popraw też `applicationId`/`namespace` w
`android/app/build.gradle` i pakiet w `android/app/src/main/java`.
Orientacja pionowa jest wymuszona w `AndroidManifest.xml`.

> iOS (później): `npm i @capacitor/ios && npx cap add ios`, potem `npm run build && npx cap sync ios`.

## Struktura

```
src/
  core/        czysta logika bez Phasera: sim.ts (reguły), solver.ts (BFS), levelFormat.ts
  levels/      poziomy JSON (level-01.json …) – ładowane automatycznie
  scenes/      Menu, LevelSelect, Game, Result
  services/    save.ts (localStorage), ads.ts (AdMob – stub), iap.ts ("usuń reklamy" – stub)
  birdArt.ts   grafika placeholder (kształty rysowane kodem)
scripts/       solve.ts, generate.ts, test-sim.ts
android/       projekt Capacitora
```

## Reguły (jak je liczy `src/core/sim.ts`)

- Tap na ptaka: leci w swoim kierunku do krawędzi planszy i płoszy **każdego** ptaka na swoim torze.
  Spłoszony ptak od razu leci w SWOIM kierunku i płoszy kolejnych (kolejka FIFO, deterministycznie).
  W jednym tapnięciu każdy ptak może zostać uruchomiony najwyżej raz.
- Typy specjalne (są w danych i w solverze/grafice; żaden z 10 poziomów ich jeszcze nie używa):
  - `owl` (sowa) – nie da się jej spłoszyć ani tapnąć, blokuje lot: ptak, który ją trafi, wraca na miejsce,
    a ruch przepada (ptaki trafione wcześniej na torze i tak są spłoszone). Sowy nie trzeba usuwać.
  - `crow` (wrona) – przy odlocie płoszy też 4 sąsiadów (góra/dół/lewo/prawo).
  - `caged` (klatka) – 1. spłoszenie (lub tap) tylko otwiera klatkę, 2. spłoszenie to normalny odlot.
- Wygrana: wszystkie ptaki (poza sowami) odleciały. Porażka: limit `maxMoves` wyczerpany, a ptaki zostały.
- Gwiazdki: 3 = `moves ≤ par`, 2 = `moves ≤ par+1`, 1 = w limicie. `par` to minimum z solvera.

## Format poziomu

`src/levels/level-XX.json` – wystarczy dodać plik, gra wczyta go sama (kolejność wg `id`):

```json
{
  "id": 1,
  "name": "Pierwszy lot",
  "cols": 3,
  "rows": 2,
  "maxMoves": 6,
  "par": 4,
  "birds": [
    { "x": 0, "y": 0, "dir": "up" },
    { "x": 1, "y": 0, "dir": "right" },
    { "x": 2, "y": 1, "dir": "left", "type": "owl" }
  ]
}
```

`rows` = liczba drutów, `y` = numer drutu, `x` = kolumna, `dir` ∈ `up|down|left|right`,
`type` ∈ `bird|owl|crow|caged` (domyślnie `bird`).

## Solver i generator poziomów

```bash
npm run solve                    # sprawdza WSZYSTKIE poziomy: rozwiązywalność + zgodność par/maxMoves
npm run solve -- --write         # wpisuje wyliczone par do plików
npm run solve -- --solution      # pokazuje optymalną kolejność tapnięć
```
Solver to BFS po stanach planszy, więc `par` jest dokładnym minimum. Kończy się kodem 1 przy błędzie
(można użyć w CI).

```bash
npm run generate -- --difficulty 6 --count 3            # trudność 1–10, nowe pliki na końcu listy
npm run generate -- --difficulty 8 --seed 42 --start-id 11
npm run generate -- --difficulty 5 --types              # z sowami, wronami i klatkami
npm run generate -- --difficulty 5 --dry                # tylko pokaż, nie zapisuj
# opcje: --cols --rows --birds --min-par --slack (maxMoves = par + slack, domyślnie 2) --force
```
Generator losuje plansze, odrzuca nierozwiązywalne i zbyt łatwe (par poniżej progu danej trudności),
a `par` i `maxMoves` wylicza solverem. Presety trudności są w `scripts/generate.ts` (`PRESETS`).
Wygenerowanym poziomom warto nadać nazwę (`name`). Pamiętaj: rozmiar planszy ogranicza solver
(duże plansze z wieloma ptakami = duża przestrzeń stanów).

## Miejsca pod reklamy i zakupy (bez implementacji)

- `src/services/ads.ts` – interfejs `AdService` (`showInterstitial`, `showRewarded`, `isRewardedReady`) + pusta
  implementacja. Wywołania są już w grze: interstitial co 3 ukończone poziomy (`ResultScene`, pomijany po
  zakupie), rewarded jako „+3 ruchy” po porażce (przycisk widoczny tylko gdy `isRewardedReady()`).
  Podpięcie AdMob = napisanie klasy implementującej `AdService` (np. na `@capacitor-community/admob`) i podmiana `ads`.
- `src/services/iap.ts` – interfejs `IapService` (`buyRemoveAds`, `restore`) + stub. Po udanym zakupie
  wywołaj `save.setAdsRemoved(true)`. Przycisk „Usuń reklamy” w menu pojawia się, gdy `isAvailable()` zwraca `true`.
- Menu zostawia dolny pas pod baner.

## Zapis postępu

`localStorage` (klucz `shoo.save.v1`): gwiazdki per poziom, flaga „reklamy usunięte”, licznik ukończonych
poziomów. Kolejny poziom odblokowuje się po ukończeniu poprzedniego.
