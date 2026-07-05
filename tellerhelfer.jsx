// =====================================================================
// TellerHelfer – Rezept-Entscheidungshilfe (Prototyp, eine Datei)
// ---------------------------------------------------------------------
// Zweck: Menschen, die sich nicht entscheiden können, was sie essen
// sollen, bekommen über klickbare Kriterien, einen Sport-Modus und
// einen "Überrasch mich!"-Würfel schnell einen konkreten Vorschlag.
// Alle Daten liegen als Array im Code (kein Backend, kein Login).
// Favoriten werden nur im Speicher gehalten (React-State).
// =====================================================================

import { useMemo, useState } from "react";
import {
  ArrowLeft, Clock, Dices, Heart, Minus, Plus, RotateCcw, Search, Users, X,
} from "lucide-react";

// ---------------------------------------------------------------------
// Design-Tokens ("Marktstand"-Look: warm, satt, verspielt)
// Papier: Aprikose · Tinte: Kakao · Primär: Paprika · Grün: Basilikum
// Signatur: Sticker-Karten mit hartem Versatz-Schatten + Würfel-Button
// ---------------------------------------------------------------------
const T = {
  papier: "#FFF2E0",
  karte: "#FFFDF8",
  tinte: "#38211C",
  weich: "#7C6257",
  primaer: "#E2431F",
  primaerTief: "#B92F10",
  gruen: "#4F7A28",
  safran: "#F5A623",
};

// Pastellige Hintergründe für die Emoji-"Fotos" je Küche
const KUECHEN_FARBEN = {
  italienisch: "#FFD9CE",
  asiatisch: "#FFE9B8",
  deutsch: "#E3ECCB",
  mexikanisch: "#F7C6A3",
  orientalisch: "#E8D5EE",
};

// Zentrales Stylesheet: Schriften, Sticker-Optik, Hover/Fokus, Motion.
// Layout/Abstände macht Tailwind – "Haut" und Interaktion macht dieses CSS.
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');

  .th-root { font-family: 'Nunito Sans', system-ui, sans-serif; color: ${T.tinte}; }
  .th-display { font-family: 'Baloo 2', 'Nunito Sans', system-ui, sans-serif; }

  /* Sticker-Karte: fester Rand + harter Versatz-Schatten */
  .th-card {
    background: ${T.karte};
    border: 2px solid ${T.tinte};
    border-radius: 18px;
    box-shadow: 5px 5px 0 ${T.tinte};
  }
  .th-card--hover { transition: transform .15s ease, box-shadow .15s ease; }
  .th-card--hover:hover { transform: translate(-2px,-2px); box-shadow: 8px 8px 0 ${T.tinte}; }

  /* Buttons mit "Druck"-Gefühl */
  .th-btn {
    border: 2px solid ${T.tinte};
    border-radius: 14px;
    box-shadow: 4px 4px 0 ${T.tinte};
    transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
    font-weight: 800;
    cursor: pointer;
  }
  .th-btn:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 ${T.tinte}; }
  .th-btn:active { transform: translate(3px,3px); box-shadow: 0 0 0 ${T.tinte}; }
  .th-btn--primary { background: ${T.primaer}; color: #fff; }
  .th-btn--primary:hover { background: ${T.primaerTief}; }
  .th-btn--ghost { background: ${T.karte}; color: ${T.tinte}; }

  /* Filter-Chips */
  .th-chip {
    border: 2px solid ${T.tinte};
    border-radius: 999px;
    background: ${T.karte};
    color: ${T.tinte};
    font-weight: 700;
    font-size: 13px;
    padding: 6px 14px;
    cursor: pointer;
    transition: transform .12s ease, box-shadow .12s ease, background .12s ease, color .12s ease;
  }
  .th-chip:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 ${T.tinte}; }
  .th-chip--on {
    background: ${T.primaer};
    color: #fff;
    box-shadow: 3px 3px 0 ${T.tinte};
  }
  .th-chip--gruen.th-chip--on { background: ${T.gruen}; }
  .th-chip:focus-visible, .th-btn:focus-visible, .th-icon-btn:focus-visible {
    outline: 3px solid ${T.safran};
    outline-offset: 2px;
  }

  .th-icon-btn {
    border: 2px solid ${T.tinte};
    border-radius: 999px;
    background: ${T.karte};
    cursor: pointer;
    transition: transform .12s ease;
  }
  .th-icon-btn:hover { transform: scale(1.08); }

  .th-input {
    border: 2px solid ${T.tinte};
    border-radius: 14px;
    background: ${T.karte};
    box-shadow: 3px 3px 0 ${T.tinte};
  }
  .th-input:focus-within { box-shadow: 3px 3px 0 ${T.primaer}; }
  .th-input input { background: transparent; outline: none; }

  /* Marker-Unterstreichung im Hero */
  .th-marker {
    background: linear-gradient(transparent 55%, ${T.safran} 55%, ${T.safran} 92%, transparent 92%);
    padding: 0 4px;
  }

  /* Würfel-Animationen */
  @keyframes th-wiggle {
    0%,100% { transform: rotate(0deg); }
    25% { transform: rotate(-14deg) scale(1.05); }
    75% { transform: rotate(12deg) scale(1.05); }
  }
  .th-dice:hover .th-dice-icon { animation: th-wiggle .5s ease-in-out; }
  @keyframes th-pop {
    0% { transform: scale(.85); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  .th-pop { animation: th-pop .25s ease-out; }

  /* Zwei Zeilen Beschreibung auf Karten */
  .th-clamp2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .th-btn, .th-chip, .th-card--hover, .th-icon-btn { transition: none; }
    .th-dice:hover .th-dice-icon, .th-pop { animation: none; }
  }
`;

// ---------------------------------------------------------------------
// Filter-Kategorien (Chips). "high protein" wird aus den Nährwerten
// abgeleitet (>= 44 g Protein pro Portion), nicht als Tag gepflegt.
// ---------------------------------------------------------------------
const GESCHMAECKER = ["herzhaft", "süß", "scharf", "frisch/leicht", "cremig"];
const ZUTATEN_TAGS = ["Tofu", "Hähnchen", "Nudeln", "Reis", "Kartoffeln", "Gemüse", "Fisch", "Ei", "Käse"];
const KUECHEN = ["italienisch", "asiatisch", "deutsch", "mexikanisch", "orientalisch"];
const ZEITEN = [
  { label: "unter 15 Min", max: 15 },
  { label: "unter 30 Min", max: 30 },
  { label: "unter 60 Min", max: 60 },
];
const ERNAEHRUNGEN = ["vegetarisch", "vegan", "glutenfrei", "high protein"];

const istHighProtein = (r) => r.n.protein >= 44;

// ---------------------------------------------------------------------
// Sport-Modus: Regeln, Sortierung und Begründungstexte je Aktivität.
// Gym -> proteinreich · Laufen -> kohlenhydratreich · Ballsport -> ausgewogen
// ---------------------------------------------------------------------
const AKTIVITAETEN = [
  {
    id: "gym",
    emoji: "🏋️",
    label: "Krafttraining / Gym",
    regel: "mind. 44 g Protein pro Portion, sortiert nach Proteingehalt",
    passt: (r) => r.n.protein >= 44,
    sortWert: (r) => -r.n.protein,
    grund: (r) => `${r.n.protein} g Protein pro Portion – ideal für Muskelaufbau und Regeneration.`,
  },
  {
    id: "laufen",
    emoji: "🏃",
    label: "Laufen / Ausdauer",
    regel: "mind. 50 g Kohlenhydrate pro Portion, sortiert nach Kohlenhydraten",
    passt: (r) => r.n.kh >= 50,
    sortWert: (r) => -r.n.kh,
    grund: (r) => `${r.n.kh} g Kohlenhydrate füllen deine Glykogenspeicher für den nächsten Lauf.`,
  },
  {
    id: "ballsport",
    emoji: "🏓",
    label: "Tischtennis / Ballsport",
    regel: "ausgewogene Makro-Verteilung (Protein, Kohlenhydrate, Fett)",
    passt: (r) => r.n.protein >= 15 && r.n.kh >= 30 && r.n.fett <= 30,
    // Abweichung von einer ausgewogenen Kalorienverteilung (~30/40/30)
    sortWert: (r) => {
      const kcal = r.n.protein * 4 + r.n.kh * 4 + r.n.fett * 9;
      return (
        Math.abs((r.n.protein * 4) / kcal - 0.3) +
        Math.abs((r.n.kh * 4) / kcal - 0.4) +
        Math.abs((r.n.fett * 9) / kcal - 0.3)
      );
    },
    grund: () => "Ausgewogene Makros für schnelle Energie und volle Konzentration am Tisch.",
  },
];

const TIMINGS = [
  {
    id: "vor",
    label: "Vor dem Training",
    regel: "leicht verdaulich (max. 18 g Fett)",
    passt: (r) => r.n.fett <= 18,
    zusatz: "Leicht verdaulich – liegt vor dem Training nicht schwer im Magen.",
  },
  {
    id: "nach",
    label: "Nach dem Training",
    regel: "proteinreich (mind. 44 g Protein)",
    passt: (r) => r.n.protein >= 44,
    zusatz: "Genug Protein für die Regeneration direkt nach der Einheit.",
  },
];

// ---------------------------------------------------------------------
// 39 Beispielrezepte – jedes liefert mind. 40 g Protein pro Portion.
// Nährwerte (n) gelten PRO PORTION und sind
// realistische Richtwerte. Zutatenformat: [Menge, Einheit, Name]
// (Menge null = "nach Geschmack"). Mengen beziehen sich auf die
// angegebene Basis-Portionszahl und skalieren im Umrechner mit.
// ---------------------------------------------------------------------
const REZEPTE = [
  {
    id: 1, name: "Knuspriger Tofu-Reis", emoji: "🍚", kueche: "asiatisch", zeit: 20, portionen: 2,
    beschreibung: "Goldbraun gebratener Tofu auf Jasminreis mit Edamame, Karotte und Sesam-Sojasauce.",
    geschmack: ["herzhaft"], zutatenTags: ["Tofu", "Reis", "Gemüse"], ernaehrung: ["vegan", "glutenfrei"],
    n: { kcal: 640, protein: 46, kh: 58, fett: 26 },
    zutaten: [[400, "g", "fester Tofu"], [150, "g", "Jasminreis"], [250, "g", "Edamame (TK)"], [1, "Stück", "Karotte"], [3, "EL", "Tamari (glutenfreie Sojasauce)"], [1, "EL", "Sesamöl"], [1, "EL", "Sesam"], [null, "", "Frühlingszwiebeln"]],
    schritte: ["Reis nach Packungsanleitung kochen.", "Tofu trocken tupfen, würfeln und in Sesamöl 6–8 Min knusprig braten.", "Karotte in feine Stifte schneiden, mit Edamame 3 Min mitbraten.", "Mit Tamari ablöschen und kurz karamellisieren lassen.", "Auf dem Reis anrichten, mit Sesam und Frühlingszwiebeln toppen."],
  },
  {
    id: 2, name: "Teriyaki-Hähnchen-Bowl", emoji: "🥢", kueche: "asiatisch", zeit: 25, portionen: 2,
    beschreibung: "Saftiges Hähnchen in glänzender Teriyaki-Glasur mit Reis, Brokkoli und Gurke.",
    geschmack: ["herzhaft", "süß"], zutatenTags: ["Hähnchen", "Reis", "Gemüse"], ernaehrung: ["glutenfrei"],
    n: { kcal: 580, protein: 42, kh: 65, fett: 14 },
    zutaten: [[400, "g", "Hähnchenbrust"], [150, "g", "Reis"], [300, "g", "Brokkoli"], [4, "EL", "Tamari"], [2, "EL", "Honig"], [1, "TL", "geriebener Ingwer"], [0.5, "Stück", "Gurke"], [1, "EL", "Sesam"]],
    schritte: ["Reis kochen, Brokkoli darin die letzten 5 Min mitdämpfen.", "Hähnchen in Streifen schneiden und scharf anbraten.", "Tamari, Honig und Ingwer zugeben, sirupartig einkochen.", "Bowl mit Reis, Brokkoli, Gurke und Hähnchen anrichten, Sesam darüber."],
  },
  {
    id: 3, name: "Scharfe Erdnuss-Nudeln", emoji: "🍜", kueche: "asiatisch", zeit: 15, portionen: 2,
    beschreibung: "Seidige Erdnusssauce mit Chili trifft auf Nudeln, Paprika und knusprigen Tofu.",
    geschmack: ["scharf", "cremig"], zutatenTags: ["Nudeln", "Gemüse", "Tofu"], ernaehrung: ["vegan"],
    n: { kcal: 680, protein: 44, kh: 58, fett: 28 },
    zutaten: [[220, "g", "Rote-Linsen-Nudeln"], [250, "g", "Tofu"], [1, "Stück", "rote Paprika"], [3, "EL", "Erdnussbutter"], [2, "EL", "Sojasauce"], [1, "EL", "Chiliflocken in Öl"], [1, "Stück", "Limette (Saft)"], [null, "", "Koriander"]],
    schritte: ["Nudeln kochen, etwas Nudelwasser aufheben.", "Tofu würfeln und knusprig braten, Paprikastreifen kurz mitbraten.", "Erdnussbutter, Sojasauce, Chiliöl und Limettensaft mit Nudelwasser glatt rühren.", "Alles vermengen und mit Koriander servieren."],
  },
  {
    id: 4, name: "Miso-Lachs mit Sesam-Brokkoli", emoji: "🐟", kueche: "asiatisch", zeit: 25, portionen: 2,
    beschreibung: "Karamellisierter Miso-Lachs aus dem Ofen, dazu Brokkoli mit Sesam und Knoblauch.",
    geschmack: ["herzhaft"], zutatenTags: ["Fisch", "Gemüse"], ernaehrung: ["glutenfrei"],
    n: { kcal: 540, protein: 44, kh: 18, fett: 32 },
    zutaten: [[2, "Stück", "Lachsfilets (à 220 g)"], [2, "EL", "Misopaste"], [1, "EL", "Ahornsirup"], [400, "g", "Brokkoli"], [1, "Zehe", "Knoblauch"], [1, "EL", "Sesamöl"], [1, "EL", "Sesam"]],
    schritte: ["Ofen auf 200 °C vorheizen.", "Miso und Ahornsirup verrühren, Lachs damit bestreichen.", "Lachs 12–14 Min backen, bis die Glasur karamellisiert.", "Brokkoli in Sesamöl mit Knoblauch braten, mit Sesam bestreuen."],
  },
  {
    id: 5, name: "Kokos-Curry mit Tofu", emoji: "🍛", kueche: "asiatisch", zeit: 30, portionen: 2,
    beschreibung: "Cremiges rotes Curry mit viel Tofu, Edamame und Süßkartoffel auf Duftreis.",
    geschmack: ["cremig", "scharf"], zutatenTags: ["Tofu", "Gemüse", "Reis"], ernaehrung: ["vegan", "glutenfrei"],
    n: { kcal: 640, protein: 43, kh: 60, fett: 26 },
    zutaten: [[400, "g", "Tofu"], [1, "Stück", "kleine Süßkartoffel"], [150, "g", "Zuckerschoten"], [150, "g", "Edamame"], [2, "EL", "rote Currypaste"], [300, "ml", "Kokosmilch light"], [150, "g", "Reis"], [1, "Stück", "Limette"], [null, "", "Thai-Basilikum"]],
    schritte: ["Reis kochen.", "Currypaste in etwas Öl anrösten, Kokosmilch angießen.", "Süßkartoffelwürfel 10 Min im Curry garen.", "Tofu, Edamame und Zuckerschoten zugeben, 5 Min ziehen lassen.", "Mit Limettensaft abschmecken und auf Reis servieren."],
  },
  {
    id: 6, name: "Linsen-Spaghetti Pomodoro", emoji: "🍝", kueche: "italienisch", zeit: 20, portionen: 2,
    beschreibung: "Der Klassiker mit Extra-Protein: Linsen-Spaghetti, weiße Bohnen, Tomaten und Basilikum.",
    geschmack: ["herzhaft", "frisch/leicht"], zutatenTags: ["Nudeln", "Gemüse"], ernaehrung: ["vegan", "glutenfrei"],
    n: { kcal: 560, protein: 40, kh: 68, fett: 12 },
    zutaten: [[250, "g", "Rote-Linsen-Spaghetti"], [500, "g", "passierte Tomaten"], [1, "Dose", "weiße Bohnen"], [2, "Zehen", "Knoblauch"], [3, "EL", "Olivenöl"], [1, "Prise", "Zucker"], [null, "", "frisches Basilikum"], [null, "", "Salz & Pfeffer"]],
    schritte: ["Spaghetti in Salzwasser al dente kochen.", "Knoblauch in Olivenöl sanft anschwitzen.", "Tomaten und Bohnen zugeben, 10 Min einkochen, würzen.", "Pasta mit etwas Nudelwasser in die Sauce geben und Basilikum unterheben."],
  },
  {
    id: 7, name: "Zitronen-Hähnchen-Piccata", emoji: "🍋", kueche: "italienisch", zeit: 30, portionen: 2,
    beschreibung: "Zarte Hähnchenschnitzel in Zitronen-Kapern-Butter – leicht, hell und aromatisch.",
    geschmack: ["frisch/leicht", "herzhaft"], zutatenTags: ["Hähnchen"], ernaehrung: ["glutenfrei"],
    n: { kcal: 450, protein: 40, kh: 12, fett: 24 },
    zutaten: [[400, "g", "Hähnchenbrust"], [1, "Stück", "Bio-Zitrone"], [2, "EL", "Kapern"], [2, "EL", "Butter"], [100, "ml", "Gemüsebrühe"], [2, "EL", "Maisstärke"], [null, "", "glatte Petersilie"]],
    schritte: ["Hähnchen flach klopfen, salzen und in Maisstärke wenden.", "In Butter goldbraun braten und warm stellen.", "Brühe, Zitronensaft und Kapern in der Pfanne einkochen.", "Hähnchen zurückgeben, mit Zitronenscheiben und Petersilie servieren."],
  },
  {
    id: 8, name: "Cremige Pilz-Polenta", emoji: "🍄", kueche: "italienisch", zeit: 30, portionen: 2,
    beschreibung: "Samtige Quark-Parmesan-Polenta mit geschmorten Pilzen, Thymian und pochiertem Ei.",
    geschmack: ["cremig", "herzhaft"], zutatenTags: ["Käse", "Gemüse"], ernaehrung: ["vegetarisch", "glutenfrei"],
    n: { kcal: 580, protein: 45, kh: 54, fett: 22 },
    zutaten: [[150, "g", "Polenta"], [600, "ml", "Gemüsebrühe"], [60, "g", "Parmesan"], [200, "g", "Magerquark"], [4, "Stück", "Eier"], [400, "g", "braune Champignons"], [1, "Stück", "Zwiebel"], [2, "EL", "Butter"], [null, "", "Thymian"]],
    schritte: ["Polenta in kochende Brühe einrühren und 10 Min quellen lassen.", "Parmesan, Quark und 1 EL Butter unterrühren.", "Pilze und Zwiebel in Butter kräftig braten, mit Thymian würzen.", "Eier pochieren und mit den Pilzen auf der Polenta anrichten."],
  },
  {
    id: 9, name: "Thunfisch-Zitronen-Pasta", emoji: "🐠", kueche: "italienisch", zeit: 15, portionen: 2,
    beschreibung: "Blitz-Pasta mit Thunfisch, Zitrone, Rucola und Chili – fertig, bevor der Hunger nervt.",
    geschmack: ["frisch/leicht"], zutatenTags: ["Fisch", "Nudeln"], ernaehrung: [],
    n: { kcal: 600, protein: 45, kh: 66, fett: 16 },
    zutaten: [[250, "g", "Penne"], [3, "Dosen", "Thunfisch (natur)"], [1, "Stück", "Bio-Zitrone"], [60, "g", "Rucola"], [1, "Zehe", "Knoblauch"], [2, "EL", "Olivenöl"], [1, "Prise", "Chiliflocken"]],
    schritte: ["Penne al dente kochen.", "Knoblauch in Olivenöl anschwitzen, Thunfisch zugeben.", "Zitronensaft, -abrieb und etwas Nudelwasser einrühren.", "Pasta und Rucola untermischen, mit Chili abschmecken."],
  },
  {
    id: 10, name: "Ofen-Gnocchi Caprese", emoji: "🍅", kueche: "italienisch", zeit: 35, portionen: 2,
    beschreibung: "Gnocchi, Kirschtomaten und Mozzarella backen zusammen zu einem blubbernden Blech.",
    geschmack: ["herzhaft"], zutatenTags: ["Kartoffeln", "Käse", "Gemüse"], ernaehrung: ["vegetarisch"],
    n: { kcal: 660, protein: 41, kh: 70, fett: 24 },
    zutaten: [[500, "g", "Gnocchi (Kühlregal)"], [300, "g", "Kirschtomaten"], [250, "g", "Mozzarella light"], [40, "g", "Parmesan"], [2, "EL", "Olivenöl"], [1, "TL", "getrockneter Oregano"], [null, "", "Basilikum"]],
    schritte: ["Ofen auf 220 °C vorheizen.", "Gnocchi und Tomaten mit Öl und Oregano auf einem Blech mischen.", "20 Min backen, bis die Tomaten aufplatzen.", "Mozzarella zerrupfen, mit dem Parmesan darauf verteilen und 5 Min gratinieren.", "Mit Basilikum servieren."],
  },
  {
    id: 11, name: "Ofenkartoffeln mit Kräuterquark", emoji: "🥔", kueche: "deutsch", zeit: 45, portionen: 2,
    beschreibung: "Rösch gebackene Kartoffelspalten mit buntem Ofengemüse und frischem Kräuterquark.",
    geschmack: ["herzhaft", "frisch/leicht"], zutatenTags: ["Kartoffeln", "Gemüse"], ernaehrung: ["vegetarisch", "glutenfrei"],
    n: { kcal: 520, protein: 43, kh: 60, fett: 12 },
    zutaten: [[600, "g", "Kartoffeln"], [1, "Stück", "Zucchini"], [1, "Stück", "Paprika"], [2, "EL", "Olivenöl"], [400, "g", "Magerquark"], [200, "g", "körniger Frischkäse"], [4, "EL", "Milch"], [null, "", "Schnittlauch & Petersilie"], [1, "TL", "Paprikapulver"]],
    schritte: ["Ofen auf 200 °C vorheizen.", "Kartoffelspalten mit Öl und Paprikapulver mischen, 25 Min backen.", "Gemüse zugeben und weitere 15 Min mitbacken.", "Quark mit Frischkäse, Milch und Kräutern glatt rühren, würzen und dazu servieren."],
  },
  {
    id: 12, name: "Bauernomelett mit Kartoffeln", emoji: "🍳", kueche: "deutsch", zeit: 20, portionen: 2,
    beschreibung: "Fluffiges Omelett über goldenen Bratkartoffeln mit Zwiebeln, Hüttenkäse und Schnittlauch.",
    geschmack: ["herzhaft"], zutatenTags: ["Ei", "Kartoffeln"], ernaehrung: ["vegetarisch", "glutenfrei"],
    n: { kcal: 590, protein: 41, kh: 38, fett: 30 },
    zutaten: [[400, "g", "gekochte Kartoffeln (vom Vortag)"], [7, "Stück", "Eier"], [1, "Stück", "Zwiebel"], [2, "EL", "Butterschmalz"], [50, "ml", "Milch"], [200, "g", "körniger Frischkäse"], [null, "", "Schnittlauch"], [null, "", "Salz & Pfeffer"]],
    schritte: ["Kartoffelscheiben in Butterschmalz knusprig braten.", "Zwiebelwürfel kurz mitbraten.", "Eier mit Milch verquirlen, würzen und darübergießen.", "Bei kleiner Hitze stocken lassen, Frischkäse daraufgeben und mit Schnittlauch servieren."],
  },
  {
    id: 13, name: "Linseneintopf mit Majoran", emoji: "🥣", kueche: "deutsch", zeit: 50, portionen: 4,
    beschreibung: "Omas Klassiker in vegan: Tellerlinsen, Räuchertofu, Wurzelgemüse, Kartoffeln und ein Schuss Essig.",
    geschmack: ["herzhaft"], zutatenTags: ["Gemüse", "Kartoffeln"], ernaehrung: ["vegan", "glutenfrei"],
    n: { kcal: 560, protein: 43, kh: 74, fett: 10 },
    zutaten: [[500, "g", "Tellerlinsen"], [400, "g", "Kartoffeln"], [2, "Stück", "Karotten"], [1, "Stange", "Lauch"], [200, "g", "Räuchertofu"], [1.5, "l", "Gemüsebrühe"], [2, "TL", "Majoran"], [2, "EL", "Apfelessig"]],
    schritte: ["Gemüse und Räuchertofu würfeln und in etwas Öl andünsten.", "Linsen und Brühe zugeben, 30 Min köcheln.", "Kartoffeln zugeben und weitere 15 Min garen.", "Mit Majoran, Essig, Salz und Pfeffer kräftig abschmecken."],
  },
  {
    id: 14, name: "Käsespätzle mit Röstzwiebeln", emoji: "🧀", kueche: "deutsch", zeit: 40, portionen: 2,
    beschreibung: "Schicht für Schicht Bergkäse und Spätzle, obendrauf ein Berg goldener Röstzwiebeln.",
    geschmack: ["herzhaft", "cremig"], zutatenTags: ["Nudeln", "Käse"], ernaehrung: ["vegetarisch"],
    n: { kcal: 900, protein: 40, kh: 74, fett: 50 },
    zutaten: [[400, "g", "Spätzle (frisch)"], [250, "g", "Bergkäse, gerieben"], [2, "Stück", "Zwiebeln"], [2, "EL", "Butter"], [50, "ml", "Milch"], [null, "", "Muskat & Pfeffer"], [null, "", "Schnittlauch"]],
    schritte: ["Zwiebelringe in Butter langsam goldbraun rösten.", "Spätzle in Butter schwenken und erhitzen.", "Abwechselnd mit Käse schichten, Milch angießen und schmelzen lassen.", "Mit Röstzwiebeln und Schnittlauch servieren."],
  },
  {
    id: 15, name: "Chili sin Carne", emoji: "🌶️", kueche: "mexikanisch", zeit: 40, portionen: 4,
    beschreibung: "Rauchiges Bohnen-Chili mit Sojagranulat, Mais und Paprika – wird am zweiten Tag noch besser.",
    geschmack: ["scharf", "herzhaft"], zutatenTags: ["Gemüse", "Reis"], ernaehrung: ["vegan", "glutenfrei"],
    n: { kcal: 580, protein: 41, kh: 76, fett: 12 },
    zutaten: [[3, "Dosen", "Kidneybohnen"], [150, "g", "Sojagranulat"], [1, "Dose", "Mais"], [2, "Dosen", "gehackte Tomaten"], [1, "Stück", "Paprika"], [1, "Stück", "Zwiebel"], [2, "TL", "geräuchertes Paprikapulver"], [1, "TL", "Kreuzkümmel"], [200, "g", "Reis"]],
    schritte: ["Zwiebel und Paprika anbraten, Gewürze kurz mitrösten.", "Tomaten, Bohnen, eingeweichtes Sojagranulat und Mais zugeben.", "25 Min offen köcheln lassen, abschmecken.", "Reis kochen und dazu servieren."],
  },
  {
    id: 16, name: "Hähnchen-Fajita-Pfanne", emoji: "🫑", kueche: "mexikanisch", zeit: 25, portionen: 2,
    beschreibung: "Brutzelnde Pfanne mit Hähnchenstreifen, bunter Paprika, Limette und Fajita-Gewürz.",
    geschmack: ["scharf"], zutatenTags: ["Hähnchen", "Gemüse"], ernaehrung: ["glutenfrei"],
    n: { kcal: 480, protein: 43, kh: 34, fett: 18 },
    zutaten: [[450, "g", "Hähnchenbrust"], [2, "Stück", "Paprika (rot & gelb)"], [1, "Stück", "rote Zwiebel"], [2, "TL", "Fajita-Gewürz"], [1, "Stück", "Limette"], [2, "EL", "Öl"], [4, "EL", "Guacamole"]],
    schritte: ["Hähnchenstreifen mit Gewürz mischen und scharf anbraten.", "Paprika- und Zwiebelstreifen zugeben und bissfest braten.", "Mit Limettensaft ablöschen.", "Mit Guacamole servieren (oder in Mais-Tortillas füllen)."],
  },
  {
    id: 17, name: "Süßkartoffel-Quesadillas", emoji: "🍠", kueche: "mexikanisch", zeit: 25, portionen: 2,
    beschreibung: "Knusprige Tortillas mit cremiger Süßkartoffel, schwarzen Bohnen und viel Käse.",
    geschmack: ["herzhaft"], zutatenTags: ["Kartoffeln", "Käse"], ernaehrung: ["vegetarisch"],
    n: { kcal: 680, protein: 44, kh: 64, fett: 28 },
    zutaten: [[1, "Stück", "große Süßkartoffel"], [1, "Dose", "schwarze Bohnen"], [4, "Stück", "Weizen-Tortillas"], [150, "g", "geriebener Käse"], [1, "TL", "Chipotle- oder Chilipulver"], [200, "g", "Skyr"], [null, "", "Salsa zum Dippen"]],
    schritte: ["Süßkartoffel weich garen und mit Chili zerdrücken.", "Tortillas mit Süßkartoffel, Bohnen und Käse belegen und zuklappen.", "In der Pfanne beidseitig goldbraun und knusprig braten.", "In Ecken schneiden und mit Skyr-Salsa-Dip servieren."],
  },
  {
    id: 18, name: "Fisch-Tacos Baja Style", emoji: "🌮", kueche: "mexikanisch", zeit: 30, portionen: 2,
    beschreibung: "Zarter Fisch, knackiger Krautsalat und Limetten-Crema in warmen Mais-Tortillas.",
    geschmack: ["frisch/leicht", "scharf"], zutatenTags: ["Fisch", "Gemüse"], ernaehrung: [],
    n: { kcal: 540, protein: 46, kh: 48, fett: 18 },
    zutaten: [[500, "g", "Kabeljaufilet"], [6, "Stück", "kleine Mais-Tortillas"], [200, "g", "Spitzkohl"], [4, "EL", "Joghurt"], [1, "Stück", "Limette"], [1, "TL", "Chilipulver"], [null, "", "Koriander"]],
    schritte: ["Fisch mit Chili würzen und in der Pfanne 6–8 Min braten.", "Spitzkohl fein hobeln, mit Limettensaft und Salz mischen.", "Joghurt mit Limettenabrieb zur Crema verrühren.", "Tortillas erwärmen und mit Kohl, Fisch und Crema füllen."],
  },
  {
    id: 19, name: "Shakshuka mit Feta", emoji: "🍲", kueche: "orientalisch", zeit: 25, portionen: 2,
    beschreibung: "Pochierte Eier in würziger Paprika-Tomaten-Sauce, mit Feta und Kreuzkümmel.",
    geschmack: ["herzhaft", "scharf"], zutatenTags: ["Ei", "Käse", "Gemüse"], ernaehrung: ["vegetarisch", "glutenfrei"],
    n: { kcal: 560, protein: 44, kh: 24, fett: 32 },
    zutaten: [[6, "Stück", "Eier"], [2, "Stück", "Paprika"], [1, "Dose", "gehackte Tomaten"], [1, "Stück", "Zwiebel"], [150, "g", "Feta"], [150, "g", "Skyr"], [1, "TL", "Kreuzkümmel"], [1, "TL", "Paprikapulver"], [null, "", "Petersilie"]],
    schritte: ["Zwiebel und Paprika weich dünsten, Gewürze mitrösten.", "Tomaten zugeben und 10 Min einkochen.", "Mulden formen, Eier hineinschlagen und zugedeckt stocken lassen.", "Feta und Skyr-Kleckse darübergeben, mit Petersilie servieren."],
  },
  {
    id: 20, name: "Falafel-Bowl mit Tahini", emoji: "🥗", kueche: "orientalisch", zeit: 35, portionen: 2,
    beschreibung: "Knusprige Falafel auf Salat, Tomate und Gurke mit cremigem Tahini-Zitronen-Dressing.",
    geschmack: ["herzhaft", "frisch/leicht"], zutatenTags: ["Gemüse"], ernaehrung: ["vegan"],
    n: { kcal: 760, protein: 42, kh: 70, fett: 36 },
    zutaten: [[300, "g", "Falafel (fertig oder selbst gemacht)"], [1, "Stück", "Salatherz"], [2, "Stück", "Tomaten"], [0.5, "Stück", "Gurke"], [3, "EL", "Tahini"], [150, "g", "Kichererbsen (geröstet)"], [4, "EL", "Hanfsamen"], [1, "Stück", "Zitrone"], [2, "Stück", "Fladenbrote"]],
    schritte: ["Falafel im Ofen oder in der Pfanne knusprig garen.", "Salat, Tomaten und Gurke schneiden und anrichten.", "Tahini mit Zitronensaft, Wasser und Salz cremig rühren.", "Falafel und geröstete Kichererbsen auf die Bowl setzen, Dressing und Hanfsamen darüber, Fladenbrot dazu."],
  },
  {
    id: 21, name: "Hähnchen-Schawarma-Teller", emoji: "🥙", kueche: "orientalisch", zeit: 30, portionen: 2,
    beschreibung: "Intensiv gewürztes Ofen-Hähnchen mit Joghurtsauce, Tomaten-Gurken-Salat und Reis.",
    geschmack: ["herzhaft"], zutatenTags: ["Hähnchen", "Gemüse"], ernaehrung: ["glutenfrei"],
    n: { kcal: 540, protein: 44, kh: 30, fett: 26 },
    zutaten: [[450, "g", "Hähnchenschenkel (ohne Knochen)"], [2, "TL", "Schawarma-Gewürz"], [3, "EL", "Joghurt"], [1, "Zehe", "Knoblauch"], [2, "Stück", "Tomaten"], [0.5, "Stück", "Gurke"], [100, "g", "Reis"]],
    schritte: ["Hähnchen mit Gewürz und 1 EL Joghurt marinieren.", "Bei 220 °C ca. 20 Min backen, dann in Streifen schneiden.", "Restlichen Joghurt mit Knoblauch verrühren.", "Mit Salat, Reis und Joghurtsauce anrichten."],
  },
  {
    id: 22, name: "Couscous-Salat mit Aubergine", emoji: "🍆", kueche: "orientalisch", zeit: 15, portionen: 2,
    beschreibung: "Fluffiger Couscous mit gerösteter Aubergine, Kichererbsen, Granatapfel und Soja-Crunch.",
    geschmack: ["frisch/leicht"], zutatenTags: ["Gemüse"], ernaehrung: ["vegan"],
    n: { kcal: 630, protein: 42, kh: 62, fett: 24 },
    zutaten: [[150, "g", "Couscous"], [1, "Stück", "Aubergine"], [3, "EL", "Olivenöl"], [0.5, "Stück", "Granatapfel (Kerne)"], [1, "Dose", "Kichererbsen"], [60, "g", "Soja-Crunch (geröstetes Sojagranulat)"], [4, "EL", "Kürbiskerne"], [1, "Stück", "Zitrone"], [null, "", "Minze & Petersilie"], [1, "TL", "Ras el Hanout"]],
    schritte: ["Couscous mit kochendem Wasser übergießen und quellen lassen.", "Auberginenwürfel in Öl mit Ras el Hanout rösten.", "Mit Kichererbsen, Soja-Crunch, Kürbiskernen, Zitronensaft, Kräutern und Granatapfelkernen mischen.", "Mit Salz abschmecken – lauwarm am besten."],
  },
  {
    id: 23, name: "Protein-Milchreis mit Zimt-Äpfeln", emoji: "🍎", kueche: "deutsch", zeit: 30, portionen: 2,
    beschreibung: "Cremiger Protein-Milchreis mit Skyr, dazu in Butter geschwenkte Zimt-Äpfel – süßes Soulfood.",
    geschmack: ["süß", "cremig"], zutatenTags: ["Reis"], ernaehrung: ["vegetarisch", "glutenfrei"],
    n: { kcal: 620, protein: 41, kh: 86, fett: 12 },
    zutaten: [[125, "g", "Milchreis"], [600, "ml", "Milch"], [2, "EL", "Zucker"], [1, "TL", "Vanillezucker"], [200, "g", "Skyr"], [40, "g", "Proteinpulver (Vanille)"], [2, "Stück", "Äpfel"], [1, "EL", "Butter"], [1, "TL", "Zimt"]],
    schritte: ["Milch mit Zucker aufkochen, Reis einrühren.", "Bei kleiner Hitze 25 Min quellen lassen, gelegentlich rühren.", "Apfelspalten in Butter mit Zimt goldig schwenken.", "Skyr und Proteinpulver unterrühren, mit den Zimt-Äpfeln anrichten."],
  },
  {
    id: 24, name: "Protein-Pancakes mit Beeren", emoji: "🥞", kueche: "deutsch", zeit: 15, portionen: 2,
    beschreibung: "Fluffige Quark-Pancakes mit Haferflocken, warmen Beeren und einem Hauch Ahornsirup.",
    geschmack: ["süß"], zutatenTags: ["Ei"], ernaehrung: ["vegetarisch"],
    n: { kcal: 540, protein: 43, kh: 54, fett: 16 },
    zutaten: [[400, "g", "Magerquark"], [4, "Stück", "Eier"], [80, "g", "zarte Haferflocken"], [1, "TL", "Backpulver"], [200, "g", "Beeren (TK)"], [2, "EL", "Ahornsirup"], [1, "Prise", "Zimt"]],
    schritte: ["Quark, Eier, Haferflocken und Backpulver zu einem Teig verrühren.", "Kleine Pancakes bei mittlerer Hitze beidseitig goldbraun backen.", "Beeren mit 1 EL Sirup erwärmen, bis sie saftig sind.", "Pancakes stapeln, Beeren und restlichen Sirup darüber."],
  },
  {
    id: 25, name: "Pad Thai mit Ei & Tofu", emoji: "🥡", kueche: "asiatisch", zeit: 25, portionen: 2,
    beschreibung: "Reisnudeln mit Ei, Tofu, Sojasprossen und Erdnüssen in süß-saurer Limettensauce.",
    geschmack: ["herzhaft", "frisch/leicht"], zutatenTags: ["Nudeln", "Ei", "Tofu", "Gemüse"], ernaehrung: ["vegetarisch", "glutenfrei"],
    n: { kcal: 680, protein: 42, kh: 68, fett: 26 },
    zutaten: [[200, "g", "Reisbandnudeln"], [250, "g", "Tofu"], [3, "Stück", "Eier"], [150, "g", "Sojasprossen"], [3, "EL", "Tamari"], [1, "EL", "Zucker"], [1, "Stück", "Limette"], [60, "g", "Erdnüsse, gehackt"]],
    schritte: ["Reisnudeln nach Packung einweichen.", "Tofuwürfel knusprig braten, an den Rand schieben.", "Eier in der Pfanne verrühren und stocken lassen.", "Nudeln, Sprossen und die Sauce aus Tamari, Zucker und Limette zugeben.", "Alles heiß durchschwenken und mit Erdnüssen servieren."],
  },
  {
    id: 26, name: "Lachs-Poke-Bowl", emoji: "🍣", kueche: "asiatisch", zeit: 20, portionen: 2,
    beschreibung: "Kühle Bowl mit mariniertem Lachs, Sushireis, Edamame, Gurke und Avocado.",
    geschmack: ["frisch/leicht"], zutatenTags: ["Fisch", "Reis", "Gemüse"], ernaehrung: ["glutenfrei"],
    n: { kcal: 620, protein: 43, kh: 62, fett: 22 },
    zutaten: [[300, "g", "Lachs (Sushi-Qualität)"], [150, "g", "Sushireis"], [150, "g", "Edamame"], [0.5, "Stück", "Gurke"], [0.5, "Stück", "Avocado"], [3, "EL", "Tamari"], [1, "TL", "Sesamöl"], [1, "EL", "Sesam"]],
    schritte: ["Sushireis kochen und lauwarm abkühlen lassen.", "Lachs würfeln und in Tamari und Sesamöl 10 Min marinieren.", "Gurke und Avocado in Scheiben schneiden.", "Alles auf dem Reis anrichten und mit Sesam bestreuen."],
  },
  {
    id: 27, name: "Kimchi-Fried-Rice mit Spiegelei", emoji: "🍙", kueche: "asiatisch", zeit: 15, portionen: 2,
    beschreibung: "Gebratener Reis vom Vortag mit würzigem Kimchi, obendrauf Spiegeleier mit weichem Kern.",
    geschmack: ["scharf", "herzhaft"], zutatenTags: ["Reis", "Ei", "Gemüse"], ernaehrung: ["vegetarisch", "glutenfrei"],
    n: { kcal: 700, protein: 42, kh: 70, fett: 28 },
    zutaten: [[400, "g", "gekochter Reis (vom Vortag)"], [150, "g", "Kimchi (vegetarisch)"], [250, "g", "Räuchertofu"], [4, "Stück", "Eier"], [2, "Stück", "Frühlingszwiebeln"], [2, "EL", "Tamari"], [1, "EL", "Sesamöl"], [1, "TL", "Gochujang oder Chilipaste"]],
    schritte: ["Kimchi und Räuchertofu-Würfel in Sesamöl anbraten.", "Reis zugeben und bei hoher Hitze krossbraten.", "Mit Tamari und Chilipaste abschmecken.", "Spiegeleier braten und auf den Reis setzen, Frühlingszwiebeln darüber."],
  },
  {
    id: 28, name: "Minestrone mit weißen Bohnen", emoji: "🫘", kueche: "italienisch", zeit: 40, portionen: 4,
    beschreibung: "Italienische Gemüsesuppe mit Bohnen, roten Linsen, Nudeln und viel frischem Basilikum.",
    geschmack: ["herzhaft", "frisch/leicht"], zutatenTags: ["Gemüse", "Nudeln"], ernaehrung: ["vegan"],
    n: { kcal: 560, protein: 41, kh: 82, fett: 8 },
    zutaten: [[2, "Dosen", "weiße Bohnen"], [300, "g", "rote Linsen"], [2, "Stück", "Karotten"], [2, "Stangen", "Staudensellerie"], [1, "Stück", "Zucchini"], [1, "Dose", "gehackte Tomaten"], [150, "g", "Kichererbsen-Nudeln"], [1.2, "l", "Gemüsebrühe"], [null, "", "Basilikum"]],
    schritte: ["Gemüse würfeln und in Olivenöl andünsten.", "Tomaten, Linsen und Brühe zugeben, 15 Min köcheln.", "Bohnen und Nudeln zugeben und gar ziehen lassen, bis alles weich ist.", "Mit Salz, Pfeffer und Basilikum abschmecken."],
  },
  {
    id: 29, name: "Zitronen-Risotto mit Erbsen", emoji: "🫛", kueche: "italienisch", zeit: 35, portionen: 2,
    beschreibung: "Cremig gerührtes Risotto mit Zitronenabrieb, süßen Erbsen und Parmesan.",
    geschmack: ["cremig", "frisch/leicht"], zutatenTags: ["Reis", "Käse", "Gemüse"], ernaehrung: ["vegetarisch", "glutenfrei"],
    n: { kcal: 650, protein: 41, kh: 76, fett: 20 },
    zutaten: [[180, "g", "Risottoreis"], [800, "ml", "Gemüsebrühe"], [250, "g", "Erbsen (TK)"], [1, "Stück", "Bio-Zitrone"], [100, "g", "Parmesan"], [150, "g", "Magerquark"], [1, "Stück", "Schalotte"], [1, "EL", "Butter"]],
    schritte: ["Schalotte in Butter glasig dünsten, Reis kurz mitrösten.", "Nach und nach heiße Brühe zugeben und rühren, ca. 20 Min.", "Erbsen die letzten 5 Min mitgaren.", "Zitronenabrieb, -saft, Parmesan und Quark unterrühren, kurz ruhen lassen."],
  },
  {
    id: 30, name: "Protein-Tiramisu im Glas", emoji: "🍰", kueche: "italienisch", zeit: 15, portionen: 2,
    beschreibung: "Schnelle Tiramisu-Becher mit Skyr-Mascarpone-Creme, Proteinpulver, Espresso und Kakao – ohne Backen.",
    geschmack: ["süß", "cremig"], zutatenTags: ["Käse"], ernaehrung: ["vegetarisch"],
    n: { kcal: 560, protein: 42, kh: 48, fett: 22 },
    zutaten: [[100, "g", "Mascarpone"], [400, "g", "Skyr"], [2, "EL", "Zucker"], [40, "g", "Proteinpulver (Vanille)"], [8, "Stück", "Löffelbiskuits"], [1, "Tasse", "Espresso, abgekühlt"], [1, "EL", "Kakaopulver"], [1, "TL", "Vanillezucker"]],
    schritte: ["Mascarpone, Skyr, Proteinpulver, Zucker und Vanillezucker glatt rühren.", "Löffelbiskuits kurz in Espresso tunken.", "Biskuits und Creme abwechselnd in Gläser schichten.", "Mit Kakao bestäuben und mindestens 1 Std kalt stellen."],
  },
  {
    id: 31, name: "Flammkuchen mit Lauch & Schmand", emoji: "🥧", kueche: "deutsch", zeit: 30, portionen: 2,
    beschreibung: "Hauchdünner, knuspriger Flammkuchen mit Schmand, Lauchringen und Bergkäse.",
    geschmack: ["herzhaft"], zutatenTags: ["Käse", "Gemüse"], ernaehrung: ["vegetarisch"],
    n: { kcal: 740, protein: 41, kh: 68, fett: 34 },
    zutaten: [[1, "Stück", "Flammkuchenteig (Kühlregal)"], [100, "g", "Schmand"], [200, "g", "Skyr"], [1, "Stange", "Lauch"], [160, "g", "Bergkäse, gerieben"], [1, "Prise", "Muskat"], [null, "", "Salz & Pfeffer"]],
    schritte: ["Ofen auf 230 °C Ober-/Unterhitze vorheizen.", "Teig ausrollen und mit der gewürzten Schmand-Skyr-Creme bestreichen.", "Feine Lauchringe und Käse darauf verteilen.", "12–15 Min knusprig backen und sofort servieren."],
  },
  {
    id: 32, name: "Kaiserschmarrn mit Apfelmus", emoji: "🧇", kueche: "deutsch", zeit: 30, portionen: 2,
    beschreibung: "Fluffig zerrissener Quark-Pfannkuchen mit Rosinen und Puderzucker, dazu Apfelmus.",
    geschmack: ["süß"], zutatenTags: ["Ei"], ernaehrung: ["vegetarisch"],
    n: { kcal: 700, protein: 41, kh: 76, fett: 26 },
    zutaten: [[6, "Stück", "Eier"], [150, "g", "Mehl"], [150, "ml", "Milch"], [250, "g", "Magerquark"], [2, "EL", "Zucker"], [2, "EL", "Rosinen"], [2, "EL", "Butter"], [200, "g", "Apfelmus"], [1, "EL", "Puderzucker"]],
    schritte: ["Eier trennen, Eiweiß steif schlagen.", "Eigelb, Quark, Mehl, Milch und Zucker verrühren, Eischnee unterheben.", "Teig in Butter stocken lassen, Rosinen darüberstreuen.", "In Stücke reißen, kurz karamellisieren und mit Puderzucker und Apfelmus servieren."],
  },
  {
    id: 33, name: "Schupfnudel-Sauerkraut-Pfanne", emoji: "🥬", kueche: "deutsch", zeit: 20, portionen: 2,
    beschreibung: "Goldbraune Schupfnudeln mit Räuchertofu, mildem Sauerkraut, Zwiebeln und einem Hauch Kümmel.",
    geschmack: ["herzhaft"], zutatenTags: ["Kartoffeln", "Gemüse"], ernaehrung: ["vegan"],
    n: { kcal: 700, protein: 42, kh: 72, fett: 28 },
    zutaten: [[400, "g", "Schupfnudeln (vegan)"], [350, "g", "Räuchertofu"], [300, "g", "Sauerkraut"], [1, "Stück", "Zwiebel"], [2, "EL", "Öl"], [1, "TL", "Kümmel"], [1, "TL", "Zucker"], [3, "EL", "Kürbiskerne"], [null, "", "Petersilie"]],
    schritte: ["Schupfnudeln und Räuchertofu-Würfel in Öl goldbraun braten.", "Zwiebelstreifen zugeben und mitbraten.", "Sauerkraut, Kümmel und Zucker einrühren und 5 Min erhitzen.", "Mit Pfeffer abschmecken, mit Kürbiskernen und Petersilie servieren."],
  },
  {
    id: 34, name: "Burrito-Bowl mit Hähnchen", emoji: "🌯", kueche: "mexikanisch", zeit: 25, portionen: 2,
    beschreibung: "Alles vom Burrito, nur ohne Wrap: Reis, würziges Hähnchen, Bohnen, Mais und Salsa.",
    geschmack: ["herzhaft"], zutatenTags: ["Hähnchen", "Reis", "Gemüse"], ernaehrung: ["glutenfrei"],
    n: { kcal: 590, protein: 40, kh: 58, fett: 18 },
    zutaten: [[350, "g", "Hähnchenbrust"], [150, "g", "Reis"], [1, "Dose", "schwarze Bohnen"], [0.5, "Dose", "Mais"], [2, "TL", "Taco-Gewürz"], [4, "EL", "Salsa"], [0.5, "Stück", "Avocado"], [1, "Stück", "Limette"]],
    schritte: ["Reis kochen.", "Hähnchenwürfel mit Taco-Gewürz scharf anbraten.", "Bohnen und Mais kurz erwärmen.", "Bowl schichten, mit Salsa, Avocado und Limette toppen."],
  },
  {
    id: 35, name: "Mais-Avocado-Bowl mit Räuchertofu", emoji: "🥑", kueche: "mexikanisch", zeit: 20, portionen: 2,
    beschreibung: "Sättigende Bowl aus geröstetem Mais, Räuchertofu, Edamame, Avocado und Koriander-Limetten-Dressing.",
    geschmack: ["frisch/leicht"], zutatenTags: ["Gemüse"], ernaehrung: ["vegan", "glutenfrei"],
    n: { kcal: 630, protein: 41, kh: 40, fett: 34 },
    zutaten: [[1, "Dose", "Mais"], [300, "g", "Räuchertofu"], [150, "g", "Edamame"], [1, "Stück", "Avocado"], [2, "Stück", "Tomaten"], [0.5, "Stück", "rote Zwiebel"], [1, "Stück", "Limette"], [2, "EL", "Olivenöl"], [null, "", "Koriander"], [1, "Prise", "Chiliflocken"]],
    schritte: ["Mais und Räuchertofu-Würfel in der Pfanne knusprig anrösten.", "Avocado, Tomaten und Zwiebel würfeln.", "Limettensaft, Öl, Salz und Chili zum Dressing verrühren.", "Mit Edamame mischen und mit Koriander servieren."],
  },
  {
    id: 36, name: "Enchiladas mit schwarzen Bohnen", emoji: "🫔", kueche: "mexikanisch", zeit: 45, portionen: 2,
    beschreibung: "Gefüllte, überbackene Tortillas mit Bohnen, Mais und würziger Tomatensauce.",
    geschmack: ["herzhaft", "scharf"], zutatenTags: ["Käse", "Gemüse"], ernaehrung: ["vegetarisch"],
    n: { kcal: 740, protein: 44, kh: 74, fett: 30 },
    zutaten: [[4, "Stück", "Weizen-Tortillas"], [1, "Dose", "schwarze Bohnen"], [0.5, "Dose", "Mais"], [100, "g", "Sojagranulat"], [400, "g", "passierte Tomaten"], [160, "g", "geriebener Käse"], [1, "TL", "Kreuzkümmel"], [1, "TL", "Chipotle-Pulver"], [1, "Stück", "Zwiebel"]],
    schritte: ["Ofen auf 200 °C vorheizen, Zwiebel anbraten.", "Bohnen, Mais, eingeweichtes Sojagranulat und die Hälfte der gewürzten Tomatensauce mischen.", "Tortillas füllen, rollen und in eine Form legen.", "Mit restlicher Sauce und Käse bedecken, 20 Min überbacken."],
  },
  {
    id: 37, name: "Hähnchen-Köfte mit Joghurt-Dip", emoji: "🧆", kueche: "orientalisch", zeit: 30, portionen: 2,
    beschreibung: "Saftige, würzige Hackbällchen aus Hähnchen mit kühlem Knoblauch-Joghurt und Salat.",
    geschmack: ["herzhaft", "scharf"], zutatenTags: ["Hähnchen"], ernaehrung: ["glutenfrei"],
    n: { kcal: 490, protein: 41, kh: 16, fett: 28 },
    zutaten: [[450, "g", "Hähnchenhack"], [1, "Stück", "Zwiebel, fein gerieben"], [2, "TL", "Kreuzkümmel & Paprika"], [0.5, "TL", "Chiliflocken"], [200, "g", "griechischer Joghurt"], [1, "Zehe", "Knoblauch"], [null, "", "Petersilie & Minze"], [1, "Stück", "Salatgurke"]],
    schritte: ["Hack mit Zwiebel, Gewürzen und gehackten Kräutern verkneten.", "Zu länglichen Köfte formen.", "Rundherum 10–12 Min goldbraun braten.", "Joghurt mit Knoblauch und Salz verrühren, mit Gurkenscheiben servieren."],
  },
  {
    id: 38, name: "Hummus-Bowl mit Ofengemüse", emoji: "🥘", kueche: "orientalisch", zeit: 30, portionen: 2,
    beschreibung: "Cremiger Hummus unter geröstetem Paprika-Zucchini-Gemüse, Kichererbsen und Fladenbrot.",
    geschmack: ["herzhaft", "frisch/leicht"], zutatenTags: ["Gemüse"], ernaehrung: ["vegan"],
    n: { kcal: 730, protein: 42, kh: 64, fett: 34 },
    zutaten: [[300, "g", "Hummus"], [1, "Stück", "Paprika"], [1, "Stück", "Zucchini"], [2, "Dosen", "Kichererbsen"], [2, "EL", "Olivenöl"], [1, "TL", "Ras el Hanout"], [4, "EL", "Hanfsamen"], [2, "Stück", "Fladenbrote"], [null, "", "Petersilie"]],
    schritte: ["Ofen auf 210 °C vorheizen.", "Gemüse und Kichererbsen mit Öl und Ras el Hanout mischen.", "20 Min rösten, bis alles leicht gebräunt ist.", "Hummus in Schalen streichen, Ofengemüse daraufsetzen, Hanfsamen darüber, mit Brot servieren."],
  },
  {
    id: 39, name: "Halloumi-Wraps mit Minzjoghurt", emoji: "🫓", kueche: "orientalisch", zeit: 20, portionen: 2,
    beschreibung: "Gebratener Halloumi mit knackigem Salat und Minz-Joghurt, eingerollt im warmen Fladen.",
    geschmack: ["herzhaft", "frisch/leicht"], zutatenTags: ["Käse", "Gemüse"], ernaehrung: ["vegetarisch"],
    n: { kcal: 700, protein: 42, kh: 48, fett: 38 },
    zutaten: [[250, "g", "Halloumi"], [2, "Stück", "große Wraps oder Fladenbrote"], [200, "g", "griechischer Joghurt"], [null, "", "frische Minze"], [2, "Stück", "Tomaten"], [0.25, "Stück", "Rotkohl, fein gehobelt"], [1, "TL", "Honig"], [1, "Prise", "Chiliflocken"]],
    schritte: ["Halloumi in Scheiben goldbraun braten, mit Honig und Chili glasieren.", "Joghurt mit gehackter Minze und Salz verrühren.", "Wraps kurz erwärmen.", "Mit Joghurt bestreichen, Salat und Halloumi einrollen."],
  },
];

// ---------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------

// Skaliert eine Zutatenmenge mit dem Portionsfaktor und formatiert sie
// deutsch (Komma, sinnvolle Rundung). null = "nach Geschmack" -> leer.
function formatMenge(menge, faktor) {
  if (menge === null) return "";
  const wert = menge * faktor;
  const gerundet = wert >= 10 ? Math.round(wert) : Math.round(wert * 10) / 10;
  return String(gerundet).replace(".", ",");
}

// Badges für eine Rezeptkarte (High Protein, unter 500 kcal, vegan/vegetarisch)
function badgesFuer(r) {
  const liste = [];
  if (istHighProtein(r)) liste.push({ text: "High Protein", bg: T.gruen, farbe: "#fff" });
  if (r.n.kcal < 500) liste.push({ text: "unter 500 kcal", bg: T.safran, farbe: T.tinte });
  if (r.ernaehrung.includes("vegan")) liste.push({ text: "vegan", bg: "#DCE9C8", farbe: T.tinte });
  else if (r.ernaehrung.includes("vegetarisch")) liste.push({ text: "vegetarisch", bg: "#DCE9C8", farbe: T.tinte });
  return liste;
}

// Zentrale Filterlogik. Wird auch für den "Filter lockern"-Hinweis mit
// überschriebenen Kriterien wiederverwendet.
// Logik: ODER innerhalb einer Kategorie, UND zwischen den Kategorien.
// Ausnahme Ernährungsform: UND (wer vegan + glutenfrei wählt, will beides).
function passtZuKriterien(r, o) {
  const f = o.filter;
  if (o.nurFavoriten && !o.favoriten.has(r.id)) return false;

  if (o.suche.trim()) {
    const s = o.suche.trim().toLowerCase();
    const text = (r.name + " " + r.beschreibung + " " + r.zutaten.map((z) => z[2]).join(" ")).toLowerCase();
    if (!text.includes(s)) return false;
  }
  if (f.geschmack.length && !f.geschmack.some((g) => r.geschmack.includes(g))) return false;
  if (f.zutat.length && !f.zutat.some((z) => r.zutatenTags.includes(z))) return false;
  if (f.kueche.length && !f.kueche.includes(r.kueche)) return false;
  if (f.zeit.length && !f.zeit.some((max) => r.zeit <= max)) return false;
  if (f.ernaehrung.length) {
    const ok = f.ernaehrung.every((e) =>
      e === "high protein" ? istHighProtein(r) : r.ernaehrung.includes(e)
    );
    if (!ok) return false;
  }
  if (o.aktivitaet) {
    const akt = AKTIVITAETEN.find((a) => a.id === o.aktivitaet);
    if (!akt.passt(r)) return false;
    if (o.timing) {
      const t = TIMINGS.find((x) => x.id === o.timing);
      if (!t.passt(r)) return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------
// Kleine UI-Bausteine
// ---------------------------------------------------------------------

function Chip({ label, aktiv, onClick, gruen }) {
  return (
    <button
      type="button"
      className={"th-chip" + (aktiv ? " th-chip--on" : "") + (gruen ? " th-chip--gruen" : "")}
      onClick={onClick}
      aria-pressed={aktiv}
    >
      {label}
    </button>
  );
}

function FilterGruppe({ titel, children }) {
  return (
    <div>
      <div className="text-xs font-extrabold uppercase tracking-wide mb-2" style={{ color: T.weich }}>
        {titel}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// Kompakte Nährwert-Zeile: kcal · Protein · KH · Fett (pro Portion)
function MakroLeiste({ n }) {
  const teil = (wert, label) => (
    <span className="whitespace-nowrap">
      <b>{wert}</b> <span style={{ color: T.weich }}>{label}</span>
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
      {teil(n.kcal, "kcal")}
      {teil(n.protein + " g", "Protein")}
      {teil(n.kh + " g", "KH")}
      {teil(n.fett + " g", "Fett")}
    </div>
  );
}

function BadgeLeiste({ rezept }) {
  const badges = badgesFuer(rezept);
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b.text}
          className="px-2 py-0.5 text-xs font-extrabold rounded-full"
          style={{ background: b.bg, color: b.farbe, border: "2px solid " + T.tinte }}
        >
          {b.text}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Rezeptkarte im Grid
// ---------------------------------------------------------------------
function RezeptKarte({ rezept, istFavorit, onFavorit, onOeffnen, grund }) {
  return (
    <article className="th-card th-card--hover overflow-hidden cursor-pointer flex flex-col" onClick={onOeffnen}>
      {/* Emoji-"Foto" in der Küchenfarbe */}
      <div
        className="relative flex items-center justify-center"
        style={{ background: KUECHEN_FARBEN[rezept.kueche], height: 124, borderBottom: "2px solid " + T.tinte }}
      >
        <span style={{ fontSize: 54 }} role="img" aria-label={rezept.name}>{rezept.emoji}</span>
        <button
          type="button"
          className="th-icon-btn absolute top-2 right-2 p-2"
          onClick={(e) => { e.stopPropagation(); onFavorit(); }}
          aria-label={istFavorit ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
        >
          <Heart size={17} strokeWidth={2.5} color={istFavorit ? T.primaer : T.tinte} fill={istFavorit ? T.primaer : "none"} />
        </button>
        <span
          className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold rounded-full"
          style={{ background: T.karte, border: "2px solid " + T.tinte }}
        >
          <Clock size={12} /> {rezept.zeit} Min
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="text-xs font-extrabold uppercase tracking-wide" style={{ color: T.primaer }}>
          {rezept.kueche}
        </div>
        <h3 className="th-display text-lg font-extrabold leading-snug">{rezept.name}</h3>
        <p className="th-clamp2 text-sm font-semibold" style={{ color: T.weich }}>{rezept.beschreibung}</p>
        <BadgeLeiste rezept={rezept} />
        <MakroLeiste n={rezept.n} />
        {grund && (
          <p className="text-xs italic font-bold mt-1" style={{ color: T.gruen }}>💡 {grund}</p>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------
// Detailansicht mit Portionen-Umrechner, Nährwerttabelle und Schritten
// ---------------------------------------------------------------------
function DetailAnsicht({ rezept, portionen, setPortionen, istFavorit, onFavorit, onZurueck, grund }) {
  const faktor = portionen / rezept.portionen;
  const naehrwertZeilen = [
    ["Kalorien", rezept.n.kcal, "kcal"],
    ["Protein", rezept.n.protein, "g"],
    ["Kohlenhydrate", rezept.n.kh, "g"],
    ["Fett", rezept.n.fett, "g"],
  ];

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto" style={{ background: T.papier }} role="dialog" aria-modal="true">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Kopfzeile: zurück + Favorit */}
        <div className="flex items-center justify-between">
          <button type="button" className="th-btn th-btn--ghost flex items-center gap-2 px-4 py-2 text-sm" onClick={onZurueck}>
            <ArrowLeft size={16} /> Zurück zur Übersicht
          </button>
          <button
            type="button"
            className="th-icon-btn p-2.5"
            onClick={onFavorit}
            aria-label={istFavorit ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
          >
            <Heart size={20} strokeWidth={2.5} color={istFavorit ? T.primaer : T.tinte} fill={istFavorit ? T.primaer : "none"} />
          </button>
        </div>

        {/* Hero */}
        <div className="th-card overflow-hidden mt-4">
          <div
            className="flex items-center justify-center"
            style={{ background: KUECHEN_FARBEN[rezept.kueche], height: 150, borderBottom: "2px solid " + T.tinte }}
          >
            <span style={{ fontSize: 72 }} role="img" aria-label={rezept.name}>{rezept.emoji}</span>
          </div>
          <div className="p-5">
            <div className="text-xs font-extrabold uppercase tracking-wide" style={{ color: T.primaer }}>
              {rezept.kueche} · <Clock size={12} className="inline" /> {rezept.zeit} Min
            </div>
            <h1 className="th-display text-3xl font-extrabold mt-1">{rezept.name}</h1>
            <p className="mt-2 font-semibold" style={{ color: T.weich }}>{rezept.beschreibung}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[...rezept.geschmack, ...rezept.ernaehrung].map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ border: "2px solid " + T.tinte }}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-3"><BadgeLeiste rezept={rezept} /></div>
          </div>
        </div>

        {/* Sport-Begründung, falls Sport-Modus aktiv */}
        {grund && (
          <div className="th-card p-3 mt-4 flex items-start gap-2" style={{ background: "#ECF3DC" }}>
            <span>🏅</span>
            <p className="text-sm font-bold" style={{ color: T.gruen }}>Sport-Check: {grund}</p>
          </div>
        )}

        {/* Portionen-Umrechner */}
        <div className="th-card p-4 mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-extrabold"><Users size={18} /> Portionen</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="th-icon-btn p-2"
              onClick={() => setPortionen(Math.max(1, portionen - 1))}
              style={{ opacity: portionen <= 1 ? 0.4 : 1 }}
              aria-label="Eine Portion weniger"
            >
              <Minus size={16} />
            </button>
            <span className="th-display text-2xl font-extrabold" style={{ minWidth: 28, textAlign: "center" }}>{portionen}</span>
            <button
              type="button"
              className="th-icon-btn p-2"
              onClick={() => setPortionen(Math.min(12, portionen + 1))}
              style={{ opacity: portionen >= 12 ? 0.4 : 1 }}
              aria-label="Eine Portion mehr"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Zutaten + Nährwerte nebeneinander (mobil untereinander) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="th-card p-4">
            <h2 className="th-display text-lg font-extrabold">Zutaten</h2>
            <p className="text-xs font-semibold mb-2" style={{ color: T.weich }}>für {portionen} {portionen === 1 ? "Portion" : "Portionen"}</p>
            <ul>
              {rezept.zutaten.map((z, i) => (
                <li key={i} className="flex gap-3 py-1.5 border-b border-dashed last:border-0 text-sm" style={{ borderColor: "#E7D6C2" }}>
                  <span className="font-extrabold whitespace-nowrap" style={{ minWidth: 72 }}>
                    {z[0] === null ? "n. B." : formatMenge(z[0], faktor) + " " + z[1]}
                  </span>
                  <span className="font-semibold">{z[2]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="th-card p-4">
            <h2 className="th-display text-lg font-extrabold mb-2">Nährwerte</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase" style={{ color: T.weich }}>
                  <th className="text-left font-extrabold pb-1"> </th>
                  <th className="text-right font-extrabold pb-1">pro Portion</th>
                  <th className="text-right font-extrabold pb-1">gesamt ({portionen})</th>
                </tr>
              </thead>
              <tbody>
                {naehrwertZeilen.map(([label, wert, einheit]) => (
                  <tr key={label} className="border-t" style={{ borderColor: "#E7D6C2" }}>
                    <td className="py-1.5 font-semibold">{label}</td>
                    <td className="py-1.5 text-right font-extrabold">{wert} {einheit}</td>
                    <td className="py-1.5 text-right font-extrabold" style={{ color: T.primaer }}>
                      {Math.round(wert * portionen)} {einheit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs mt-2 font-semibold" style={{ color: T.weich }}>Richtwerte – je nach Zutaten leicht abweichend.</p>
          </div>
        </div>

        {/* Zubereitung */}
        <div className="th-card p-4 mt-4 mb-10">
          <h2 className="th-display text-lg font-extrabold mb-3">Zubereitung</h2>
          <ol className="flex flex-col gap-3">
            {rezept.schritte.map((schritt, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="flex items-center justify-center rounded-full text-sm font-extrabold"
                  style={{ width: 28, height: 28, background: T.primaer, color: "#fff", border: "2px solid " + T.tinte, flexShrink: 0 }}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-semibold pt-1">{schritt}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// "Überrasch mich!"-Modal: zeigt EIN zufälliges Rezept groß an
// ---------------------------------------------------------------------
function UeberraschungsModal({ rezept, onNochmal, onKochen, onSchliessen }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(56,33,28,.55)" }}
      onClick={onSchliessen}
      role="dialog"
      aria-modal="true"
    >
      <div className="th-card th-pop relative w-full max-w-md p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="th-icon-btn absolute top-3 right-3 p-1.5" onClick={onSchliessen} aria-label="Schließen">
          <X size={16} />
        </button>
        <div className="text-xs font-extrabold uppercase tracking-widest" style={{ color: T.primaer }}>
          🎲 Der Würfel hat entschieden
        </div>
        <div
          className="my-4 mx-auto flex items-center justify-center rounded-full"
          style={{ width: 108, height: 108, background: KUECHEN_FARBEN[rezept.kueche], border: "2px solid " + T.tinte, fontSize: 50 }}
          role="img"
          aria-label={rezept.name}
        >
          {rezept.emoji}
        </div>
        <h3 className="th-display text-2xl font-extrabold">{rezept.name}</h3>
        <p className="text-sm font-semibold mt-1" style={{ color: T.weich }}>{rezept.beschreibung}</p>
        <div className="flex justify-center mt-3"><MakroLeiste n={rezept.n} /></div>
        <div className="flex flex-col gap-2 mt-5">
          <button type="button" className="th-btn th-btn--primary px-4 py-3" onClick={onKochen}>
            Das koch ich! 🍳
          </button>
          <button type="button" className="th-btn th-btn--ghost flex items-center justify-center gap-2 px-4 py-2.5" onClick={onNochmal}>
            <Dices size={17} /> Nochmal würfeln
          </button>
          <button type="button" className="text-xs font-bold underline mt-1" style={{ color: T.weich }} onClick={onSchliessen}>
            Doch lieber selbst wählen
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Hauptkomponente
// ---------------------------------------------------------------------
const LEERE_FILTER = () => ({ geschmack: [], zutat: [], kueche: [], zeit: [], ernaehrung: [] });

export default function App() {
  // ---------------- State (alles nur im Speicher) ----------------
  const [suche, setSuche] = useState("");
  const [filter, setFilter] = useState(LEERE_FILTER());
  const [aktivitaet, setAktivitaet] = useState(null); // "gym" | "laufen" | "ballsport" | null
  const [timing, setTiming] = useState(null);         // "vor" | "nach" | null
  const [favoriten, setFavoriten] = useState(() => new Set());
  const [nurFavoriten, setNurFavoriten] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [portionen, setPortionen] = useState(2);
  const [ueberraschung, setUeberraschung] = useState(null);

  const aktObjekt = AKTIVITAETEN.find((a) => a.id === aktivitaet) || null;

  // Gefilterte (und im Sport-Modus sortierte) Treffer – neu berechnet
  // bei jeder Änderung der Kriterien (Live-Filter).
  const treffer = useMemo(() => {
    const kriterien = { filter, suche, aktivitaet, timing, nurFavoriten, favoriten };
    let liste = REZEPTE.filter((r) => passtZuKriterien(r, kriterien));
    if (aktObjekt) liste = [...liste].sort((a, b) => aktObjekt.sortWert(a) - aktObjekt.sortWert(b));
    return liste;
  }, [filter, suche, aktivitaet, timing, nurFavoriten, favoriten, aktObjekt]);

  // Hinweis bei 0 Treffern: welcher Filter würde – gelockert – am
  // meisten Rezepte freigeben?
  const hinweis = useMemo(() => {
    if (treffer.length > 0) return null;
    const basis = { filter, suche, aktivitaet, timing, nurFavoriten, favoriten };
    const zaehle = (aenderung) => REZEPTE.filter((r) => passtZuKriterien(r, { ...basis, ...aenderung })).length;

    const kandidaten = [];
    if (suche.trim()) kandidaten.push({ name: "Suche", anzahl: zaehle({ suche: "" }) });
    const namen = { geschmack: "Geschmacksrichtung", zutat: "Lust auf …", kueche: "Küche", zeit: "Zeit", ernaehrung: "Ernährungsform" };
    for (const kat of Object.keys(namen)) {
      if (filter[kat].length) kandidaten.push({ name: namen[kat], anzahl: zaehle({ filter: { ...filter, [kat]: [] } }) });
    }
    if (aktivitaet) kandidaten.push({ name: "Sport-Modus", anzahl: zaehle({ aktivitaet: null, timing: null }) });
    if (nurFavoriten) kandidaten.push({ name: "Nur Favoriten", anzahl: zaehle({ nurFavoriten: false }) });

    kandidaten.sort((a, b) => b.anzahl - a.anzahl);
    const beste = kandidaten.find((k) => k.anzahl > 0);
    return beste
      ? "Tipp: Lockere „" + beste.name + "“ – dann gäbe es " + beste.anzahl + " Treffer."
      : "Setz die Filter zurück und starte neu – etwas Leckeres findet sich immer.";
  }, [treffer.length, filter, suche, aktivitaet, timing, nurFavoriten, favoriten]);

  // ---------------- Aktionen ----------------
  const toggleListe = (kat, wert) =>
    setFilter((alt) => {
      const hat = alt[kat].includes(wert);
      return { ...alt, [kat]: hat ? alt[kat].filter((x) => x !== wert) : [...alt[kat], wert] };
    });

  const toggleFavorit = (id) =>
    setFavoriten((alt) => {
      const neu = new Set(alt);
      if (neu.has(id)) neu.delete(id);
      else neu.add(id);
      return neu;
    });

  const zuruecksetzen = () => {
    setFilter(LEERE_FILTER());
    setSuche("");
    setAktivitaet(null);
    setTiming(null);
    setNurFavoriten(false);
  };

  // Würfel: zufälliges Rezept aus den AKTUELLEN Treffern (nicht zweimal
  // hintereinander dasselbe, wenn es Alternativen gibt).
  const wuerfeln = () => {
    if (!treffer.length) return;
    let pool = treffer;
    if (ueberraschung && pool.length > 1) pool = pool.filter((r) => r.id !== ueberraschung.id);
    setUeberraschung(pool[Math.floor(Math.random() * pool.length)]);
  };

  const oeffneDetail = (rezept) => {
    setDetailId(rezept.id);
    setPortionen(rezept.portionen);
    setUeberraschung(null);
  };

  const grundFuer = (r) => {
    if (!aktObjekt) return null;
    const t = timing ? TIMINGS.find((x) => x.id === timing) : null;
    return aktObjekt.grund(r) + (t ? " " + t.zusatz : "");
  };

  const detailRezept = detailId ? REZEPTE.find((r) => r.id === detailId) : null;
  const aktiveAnzahl =
    Object.values(filter).reduce((s, a) => s + a.length, 0) +
    (suche.trim() ? 1 : 0) + (aktivitaet ? 1 : 0) + (nurFavoriten ? 1 : 0);

  // ---------------- Oberfläche ----------------
  return (
    <div className="th-root min-h-screen" style={{ background: T.papier }}>
      <style>{CSS}</style>

      {/* Kopfzeile mit Live-Suche */}
      <header className="sticky top-0 z-30 border-b-2" style={{ background: T.papier, borderColor: T.tinte }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="th-display text-xl sm:text-2xl font-extrabold whitespace-nowrap">🍽️ TellerHelfer</div>
          <div className="hidden lg:block text-sm font-semibold" style={{ color: T.weich }}>
            Nie wieder ratlos vor dem Kühlschrank.
          </div>
          <label className="th-input ml-auto flex items-center gap-2 px-3 py-2 w-full max-w-xs">
            <Search size={16} />
            <input
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Rezept oder Zutat …"
              className="w-full text-sm font-semibold"
              aria-label="Rezepte durchsuchen"
            />
            {suche && (
              <button type="button" onClick={() => setSuche("")} aria-label="Suche leeren">
                <X size={14} />
              </button>
            )}
          </label>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {/* Hero mit Würfel als Herzstück */}
        <section className="pt-8 sm:pt-10 pb-6 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="th-display font-extrabold leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3.3rem)" }}>
              Was soll ich <span className="th-marker">bloß essen</span>?
            </h1>
            <p className="mt-3 max-w-xl font-semibold" style={{ color: T.weich }}>
              Klick an, worauf du Lust hast – oder lass den Würfel entscheiden.
              Jedes Gericht liefert mind. 40 g Protein – mit Sport-Modus für Gym, Laufen und Tischtennis.
            </p>
          </div>
          <button
            type="button"
            className="th-btn th-btn--primary th-dice flex items-center gap-3 px-6 py-4 text-lg self-start"
            onClick={wuerfeln}
            style={{ opacity: treffer.length ? 1 : 0.5 }}
          >
            <Dices size={26} className="th-dice-icon" /> Überrasch mich!
          </button>
        </section>

        {/* Sport-Modus */}
        <section className="th-card p-4 sm:p-5 mb-5">
          <div className="flex flex-wrap items-baseline gap-2 mb-3">
            <h2 className="th-display text-lg font-extrabold">🏅 Sport-Modus</h2>
            <span className="text-xs font-semibold" style={{ color: T.weich }}>Vorschläge passend zu deinem Training</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {AKTIVITAETEN.map((a) => (
              <Chip
                key={a.id}
                gruen
                label={a.emoji + " " + a.label}
                aktiv={aktivitaet === a.id}
                onClick={() => {
                  const aus = aktivitaet === a.id;
                  setAktivitaet(aus ? null : a.id);
                  if (aus) setTiming(null);
                }}
              />
            ))}
          </div>
          {aktivitaet && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase" style={{ color: T.weich }}>Wann isst du?</span>
              {TIMINGS.map((t) => (
                <Chip key={t.id} gruen label={t.label} aktiv={timing === t.id} onClick={() => setTiming(timing === t.id ? null : t.id)} />
              ))}
            </div>
          )}
          {aktObjekt && (
            <p className="mt-3 text-xs font-bold" style={{ color: T.gruen }}>
              Aktiv: {aktObjekt.regel}
              {timing ? " · " + TIMINGS.find((t) => t.id === timing).regel : ""}
            </p>
          )}
        </section>

        {/* Kriterien-Filter */}
        <section className="th-card p-4 sm:p-5 mb-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="th-display text-lg font-extrabold">Worauf hast du Lust?</h2>
            {aktiveAnzahl > 0 && (
              <button type="button" className="th-btn th-btn--ghost flex items-center gap-1.5 px-3 py-1.5 text-xs" onClick={zuruecksetzen}>
                <RotateCcw size={13} /> Zurücksetzen
              </button>
            )}
          </div>
          <FilterGruppe titel="Geschmacksrichtung">
            {GESCHMAECKER.map((g) => (
              <Chip key={g} label={g} aktiv={filter.geschmack.includes(g)} onClick={() => toggleListe("geschmack", g)} />
            ))}
          </FilterGruppe>
          <FilterGruppe titel="Lust auf …">
            {ZUTATEN_TAGS.map((z) => (
              <Chip key={z} label={z} aktiv={filter.zutat.includes(z)} onClick={() => toggleListe("zutat", z)} />
            ))}
          </FilterGruppe>
          <FilterGruppe titel="Küche">
            {KUECHEN.map((k) => (
              <Chip key={k} label={k} aktiv={filter.kueche.includes(k)} onClick={() => toggleListe("kueche", k)} />
            ))}
          </FilterGruppe>
          <FilterGruppe titel="Zeit">
            {ZEITEN.map((z) => (
              <Chip key={z.max} label={z.label} aktiv={filter.zeit.includes(z.max)} onClick={() => toggleListe("zeit", z.max)} />
            ))}
          </FilterGruppe>
          <FilterGruppe titel="Ernährungsform">
            {ERNAEHRUNGEN.map((e) => (
              <Chip key={e} label={e} aktiv={filter.ernaehrung.includes(e)} onClick={() => toggleListe("ernaehrung", e)} />
            ))}
          </FilterGruppe>
        </section>

        {/* Trefferanzahl + Favoriten-Umschalter */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="th-display text-lg font-extrabold" aria-live="polite">
            {treffer.length} von {REZEPTE.length} Rezepten
          </div>
          <Chip
            label={"❤️ Nur Favoriten (" + favoriten.size + ")"}
            aktiv={nurFavoriten}
            onClick={() => setNurFavoriten(!nurFavoriten)}
          />
        </div>

        {/* Ergebnis-Grid oder Leerzustand mit Lockerungs-Tipp */}
        {treffer.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {treffer.map((r) => (
              <RezeptKarte
                key={r.id}
                rezept={r}
                istFavorit={favoriten.has(r.id)}
                onFavorit={() => toggleFavorit(r.id)}
                onOeffnen={() => oeffneDetail(r)}
                grund={grundFuer(r)}
              />
            ))}
          </div>
        ) : (
          <div className="th-card p-8 text-center flex flex-col items-center gap-3">
            <div style={{ fontSize: 46 }}>🤷</div>
            <h3 className="th-display text-xl font-extrabold">Kein Rezept passt zu allen Kriterien</h3>
            <p className="text-sm font-semibold max-w-md" style={{ color: T.weich }}>{hinweis}</p>
            <button type="button" className="th-btn th-btn--ghost flex items-center gap-2 px-4 py-2 text-sm" onClick={zuruecksetzen}>
              <RotateCcw size={15} /> Alle Filter zurücksetzen
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-xs font-semibold" style={{ color: T.weich }}>
          TellerHelfer · Prototyp · Nährwerte sind Richtwerte pro Portion.
        </p>
      </main>

      {/* Überlagerungen */}
      {ueberraschung && (
        <UeberraschungsModal
          rezept={ueberraschung}
          onNochmal={wuerfeln}
          onKochen={() => oeffneDetail(ueberraschung)}
          onSchliessen={() => setUeberraschung(null)}
        />
      )}
      {detailRezept && (
        <DetailAnsicht
          rezept={detailRezept}
          portionen={portionen}
          setPortionen={setPortionen}
          istFavorit={favoriten.has(detailRezept.id)}
          onFavorit={() => toggleFavorit(detailRezept.id)}
          onZurueck={() => setDetailId(null)}
          grund={grundFuer(detailRezept)}
        />
      )}
    </div>
  );
}
