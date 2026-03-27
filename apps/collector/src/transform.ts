import type { OAMeldung, OAMeldungDetail } from "@ordnungsamt/shared";

export interface TransformedMeldung {
  id: string;
  date: string;
  category: string;
  subcategory: string;
  district: string;
  status: string;
  description: string | null;
  lat: number;
  lng: number;
  reportNumber: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  locationNote: string | null;
  lastChanged: string | null;
  feedback: string | null;
}

/**
 * Fix mojibake: the API stores UTF-8 text but it was mis-decoded as Latin-1
 * somewhere server-side, so e.g. "ß" becomes "ÃŸ". We reverse this by treating
 * each character as a raw byte and re-decoding as UTF-8.
 */
function stripNullBytes(value: string): string {
  return value.replaceAll("\0", "");
}

function sanitizeText(str: string | null | undefined): string | null {
  if (str == null) return null;
  return stripNullBytes(str);
}

function fixEncoding(str: string | null | undefined): string | null {
  const sanitized = sanitizeText(str);
  if (!sanitized) return sanitized;
  try {
    const bytes = Uint8Array.from(
      { length: sanitized.length },
      (_, i) => sanitized.codePointAt(i) ?? 0,
    );
    const fixed = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return stripNullBytes(fixed);
  } catch {
    return sanitized;
  }
}

/**
 * Parse German date format "DD.MM.YYYY - HH:MM:SS" → ISO 8601
 */
function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min, ss] = match;
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+01:00`;
}

const SUBTOPICS_BY_MAIN: Record<string, readonly string[]> = {
  Abfall: [
    "aus Gewerbebetrieben",
    "Autowrack",
    "Bauabfälle, Bauschutt",
    "Bioabfälle",
    "Elektroschrott",
    "Müllablagerung",
    "Papierkörbe",
    "Privatfläche",
    "Schrottfahrräder",
    "Sonstiges",
    "Sperrmüll",
    "Tierkadaver/tote Tiere",
    "Unrat (Werbezettel)",
    "Weihnachtsbäume",
  ],
  Bauaufsicht: ["Bauruine, Grundstücksabsicherung", "Sonstiges"],
  Baumschutz: [
    "Anfragen",
    "fehlender Baumschnitt, loser Ast",
    "Parken auf Baumscheibe",
    "Sonstiges",
  ],
  Baustellen: ["fehlende, mangelnde Absicherung", "Sonstiges"],
  "Drogenutensilien (z.B. Spritze)": [
    "Grünanlage/Park",
    "öffentliches Straßenland",
    "Sonstiges",
    "Spielplätze",
  ],
  Feuerwerk: ["Anfragen", "Sonstiges", "Verkauf"],
  "Gesundheitsschutz/Hygiene": ["Sonstiges", "Ungeziefer (z. B. Ratten)"],
  "Gewerbe/Gaststätten": [
    "Anfragen",
    "Beschwerden",
    "Geldspielgeräte/Glücksspiel",
    "Mehrwegangebotspflicht",
    "Sonstiges",
  ],
  "Grünanlage/Park": [
    "Baden",
    "Beschädigung",
    "Campieren, Zelten",
    "Defekte Beleuchtung",
    "Fahrradfahren (unerlaubt)",
    "Grillen",
    "KFZ, Auto",
    "Müll, Verschmutzung",
    "Sonstiges",
    "unangeleinte Hunde",
    "Wildwuchs",
  ],
  Hund: [
    "Beaufsichtigungspflicht",
    "Biss-/Angriffsvorfall",
    "Gefährliche Hunde",
    "Hundekot (Beseitigungspflicht)",
    "ohne Leine",
    "ohne Maulkorb",
    "Sonstiges",
  ],
  Jugendschutz: [
    "Drogen",
    "Rauchen",
    "Sonstiges",
    "Trinken von Alkohol in der Öffentlichkeit",
    "verbotener Aufenthalt von Minderjährigen",
    "Verkauf von Alkohol und Tabak",
  ],
  Ladenöffnung: ["Sonn- und Feiertage", "Sonstiges"],
  Lärm: [
    "Baustelle",
    "Fahrzeug/Motor",
    "Feuerwerk",
    "Gaststätte",
    "Gewerbe",
    "Haus- und Nachbarschaftslärm indoor",
    "Haus- und Nachbarschaftslärm outdoor",
    "Sonstiges",
    "Straßenmusik",
    "Tierhaltung (z. B. Bellen)",
    "Veranstaltungen",
    "Verkehr",
  ],
  Naturschutzgebiet: ["Anfragen", "Sonstiges"],
  Nichtraucherschutz: ["Gaststätten", "Sonstiges"],
  Parkraumbewirtschaftung: [
    "Anwohner-, Gästevignetten",
    "Ausnahme, Betriebsvignetten",
    "Handy-, SMS-Parken",
    "Parkgebühren",
    "Parkscheinautomaten",
    "Sonstiges",
  ],
  Sondernutzung: [
    "Abfallcontainer",
    "Altkleidercontainer",
    "Bauschuttcontainer",
    "Herausstellen von Waren und Gegenständen",
    "Herausstellen von Werbetafeln",
    "Infostände, Stehtische",
    "Plakatierung",
    "Schankvorgärten (Tische und Stühle)",
    "Sonstiges",
  ],
  Sonstiges: ["allgemeine Anfrage und Auskunft", "Ordnungswidrigkeitsverfahren"],
  Straßenaufsicht: [
    "Defekte Ampel",
    "Defekte Parkscheinautomaten",
    "Defekte Straßenbeleuchtung",
    "Gehölzschnitt an Bäumen, Büschen auf öffentlichem Straßenland",
    "Mangelnde Straßenreinigung",
    "Radwegschäden",
    "Sonstiges",
    "Straßen- und Gehwegschäden",
    "Verkehrszeichen (beschädigt, defekt, etc.)",
    "Wildwuchs auf befestigtem Gehweg",
    "Wildwuchs von Privatgelände",
  ],
  "Straßenverkehrsrechtliche Anordnungen": [
    "Anfrage Schwerbehindertenparkplatz",
    "Baustellen",
    "Sonstiges",
    "Verkehrszeichen",
  ],
  Tierschutz: ["Sonstiges", "Tierhaltung", "Wildtiere"],
  Verkehr: ["Dauerparker an ungünstiger Stelle", "Hauptuntersuchung, TÜV", "Sonstiges"],
  Winterdienst: [
    "Befreiung",
    "Fahrbahn",
    "Gehwege",
    "Grünanlage",
    "Haltestellen",
    "Privatfläche",
    "Radwege",
    "Sonstiges",
    "Taumittel",
  ],
};

const STANDALONE_MAIN_TOPICS = new Set<string>([
  "Filmaufnahmen",
  "Friedhofsordnung",
  "Lebensmittelaufsicht",
  "Motorroller/Kleinkraftrad",
  "Regeneinläufe, Gully",
  "Spielplätze",
  "Veranstaltungen",
]);

const MAIN_TOPIC_BY_NORMALIZED = new Map<string, string>(
  [...Object.keys(SUBTOPICS_BY_MAIN), ...STANDALONE_MAIN_TOPICS].map(topic => [
    normalizeTopicToken(topic),
    topic,
  ]),
);

const SUBTOPIC_LOOKUPS: Record<string, Map<string, string>> = Object.fromEntries(
  Object.entries(SUBTOPICS_BY_MAIN).map(([main, subtopics]) => [
    main,
    new Map(subtopics.map(sub => [normalizeTopicToken(sub), sub])),
  ]),
);

const MAIN_TOPIC_ALIAS_RULES: Array<[RegExp, string]> = [
  [/\bstrassenverkehrsrechtliche\b/, "Straßenverkehrsrechtliche Anordnungen"],
  [
    /\bstrassenaufsicht\b|\bmangelnde strassenreinigung\b|\bstrassenreinigung\b|\bk1 fuss\b|\bk1 fusse\b|\bverkehrszeichen\b|\bverkehrsschilder\b|\bverkehrsschild\b|\bstrassenschild\b|\bzeichen 283\b|\bradwegschad|\bgehwegschad|\bschlagloch\b|\bstrassenbeleuchtung\b|\bampel\b|\bwildwuchs\b|\bweg zugewachsen\b|\bhausnummer\b|\bvermessungsamt\b|\bburgersteig\b|\bpoller\b|\bfahrbahnabsenkung\b|\bloose gehwegplatte\b|\bgehweghindernis\b|\bstrasse locher\b|\blocher in asphalt\b/,
    "Straßenaufsicht",
  ],
  [
    /\bparkraum\b|\bhalteverbot\b|\bpark und halt|\bfalschpark|\bparkverbot\b|\bparkverst|\bzugeparkt\b|\bgehwegparker\b|\bkennzeichen\b|\bkennzeiche\b|\bnummernschild\b|\bohne zulassung\b|\banhanger\b|\bhanger\b|\bparken\b|\bfeuerwehreinfahrt\b|\bfeuerwehrzufahrt\b|\bfeuerwehr zufahrt\b|\bladesaule\b|\bladezone\b|\bbehindertenparkplatz\b|\babgemeldeter pkw\b|\bhanger wird als lager\b|\bkreuzungsbereich\b|\bverkehrswidrig park\b|\bparkplatzblockade\b|\bblockade der einfahrt\b|\bblockiert meine einfahrt\b|\bzugeparkter\b|\bhalteverbotsschilder\b/,
    "Parkraumbewirtschaftung",
  ],
  [/\bbauaufsicht\b/, "Bauaufsicht"],
  [/\bbaumschutz\b|\bbaumscheibe\b|\bbaumschnitt\b/, "Baumschutz"],
  [
    /\bbaustell|\bbauzaun\b|\bbauabsicherung\b|\babsperrung|\bdauerbaustelle\b|\bstrassensperre\b|\bstrassenbaufirma\b/,
    "Baustellen",
  ],
  [/\bdrogenutensilien\b|\bspritze\b/, "Drogenutensilien (z.B. Spritze)"],
  [
    /\bgesundheitsschutz\b|\bhygiene\b|\bratten|\bungeziefer\b|\bkakerlak|\bschadlingsbefall\b|\bgeruchsbelastigung\b/,
    "Gesundheitsschutz/Hygiene",
  ],
  [
    /\bgewerbe\b|\bgaststatte\b|\bgaststaetten\b|\bgewerberecht\b|\bferienwohnung\b|\btrattoria\b|\bkiosk\b|\blottoladen\b/,
    "Gewerbe/Gaststätten",
  ],
  [/\bgrunanlage\b|\bspielplatz\b|\bdefekte spielgerate\b/, "Grünanlage/Park"],
  [/\bhund\b|\bhundekot\b/, "Hund"],
  [/\bjugendschutz\b/, "Jugendschutz"],
  [/\bladenoffnung\b/, "Ladenöffnung"],
  [/\blarm\b|\blaerm\b|\bruhestorung\b/, "Lärm"],
  [/\bnaturschutz/, "Naturschutzgebiet"],
  [/\bnichtraucher/, "Nichtraucherschutz"],
  [
    /\bsondernutzung\b|\bschankvorgarten\b|\bwerbeplakat\b|\bwerbung\b|\bwahlplakate\b|\bsammelcontainer\b|\bfahnchen\b/,
    "Sondernutzung",
  ],
  [/\btierschutz\b/, "Tierschutz"],
  [
    /\bwinterdienst\b|\bstreugut\b|\bglatte\b|\bstreusalz\b|\bsalz gestreut\b|\bschneebeseitigung\b|\bschnee raumung\b|\bschneeraumen\b/,
    "Winterdienst",
  ],
  [/\bfilmaufnahme/, "Filmaufnahmen"],
  [/\bfriedhof/, "Friedhofsordnung"],
  [/\blebensmittel/, "Lebensmittelaufsicht"],
  [/\bmotorroller\b|\bkleinkraftrad\b|\bmotorrad\b/, "Motorroller/Kleinkraftrad"],
  [/\bregeneinlauf|\bregenwassereinlauf|\bgully\b|\bschachtdeckel\b/, "Regeneinläufe, Gully"],
  [/\bveranstaltung/, "Veranstaltungen"],
  [
    /\bverkehrsbehinderung\b|\bverkehr\b|\bvekehr\b|\btaxi\b|\bbusspur\b|\bschulzone\b|\bverkehrsaufkommen\b|\belterntaxis\b|^pkw$|\btransporter\b|\bwohnmobil\b|\bwendekreis\b/,
    "Verkehr",
  ],
  [
    /\bkanister\b|\bbenzinkanister\b|\bfasser\b|\bflaschen\b|\baltolflaschen\b|\bkfz teile\b|\bgefahrliche abfalle\b|\belektroschrott\b|\belektromull\b|\bkuehlschrank\b|\bkuhlschrank\b|\bmullablager|\bmuellablager|\billegale ablagerung\b|\bumweltverschmutzung\b|\bverdreckt\b|\bdreck auf fusswegen\b|\bvermullung\b|\bfakalien\b|\bmull\b|\bmuell\b|\bsperrmull\b|\bspeermull\b|\bmadratzen\b|\bmatratzen\b|\bsperrmullablage\b|\bbioabf|\bpapierkorb|\bmulleimer\b|\bmulltonnen?\b|\bweihnachtsbaum|\btannenbaumabholung\b|\beinkaufswagen\b|\beinkaufwagen\b|\bbauabf|\bbauschutt\b|\bautowrack\b|\bschrottauto\b|\bschrottfahrzeug\b|\bschrottfahrrad|\bmetallschrott\b|\btierkadaver\b|\btoter fuchs\b|\bunrat\b|\bmullsack\b|\bsacke unbekannten\b|\babfall\b|\bautoreifen\b|\bsondermull\b|\basbest\b|\bhausrat\b|\bhausmull\b|\baltpapier\b|\bpapiermull\b|\bpappkartons?\b|\bmobel\b|\bbadewanne\b|\bbrandreste\b/,
    "Abfall",
  ],
];

const SUBTOPIC_ALIAS_RULES: Record<string, Array<[RegExp, string]>> = {
  Abfall: [
    [
      /\bsperrmull\b|\bspeermull\b|\bmadratze\b|\bmadratzen\b|\bmatratze\b|\bmatratzen\b|\bhausrat\b/,
      "Sperrmüll",
    ],
    [
      /\bmullablager|\bmuellablager|\billegale mull|\billegale ablagerung\b|\bmullentsorgung|\beinkaufswagen\b|\beinkaufwagen\b|\bvermullung\b|\bumweltverschmutzung\b|\bverdreckt\b|\bverdreckter\b|\bverdreckte\b|\bdreck auf fusswegen\b|\bschrott ablagerung\b|\bkleidung\b|\bpappe\b|\bpappkartons?\b|\baltpapier\b|\bpapiermull\b|\bmullhalde\b|\bfakalien\b|\bbaumscheiben als mullkippe\b|^mull$|^muell$/,
      "Müllablagerung",
    ],
    [/\belektroschrott\b|\belektromull\b|\bkuehlschrank\b|\bkuhlschrank\b/, "Elektroschrott"],
    [/\bbauabf|\bbauschutt\b|\bbaureste\b/, "Bauabfälle, Bauschutt"],
    [/\bschrottfahrrad/, "Schrottfahrräder"],
    [/\bweihnachtsbaum/, "Weihnachtsbäume"],
    [/\bpapierkorb|\bmulleimer\b|\bmulltonnen?\b|\bpapiermull nicht abgeholt\b/, "Papierkörbe"],
    [/\bbioabf/, "Bioabfälle"],
    [
      /\bautowrack\b|\bschrottauto\b|\bschrottfahrzeug\b|\bautowrackteile\b|\babgemeldeter pkw\b/,
      "Autowrack",
    ],
    [/\btierkadaver\b|\btote tiere\b|\btoter vogel\b|\btoter fuchs\b/, "Tierkadaver/tote Tiere"],
    [/\bunrat\b|\bwerbezettel\b/, "Unrat (Werbezettel)"],
    [/\bgewerbebetrieb\b/, "aus Gewerbebetrieben"],
  ],
  Straßenaufsicht: [
    [
      /\bverkehrszeichen\b|\bverkehrsschilder\b|\bverkehrsschild\b|\bstrassenschild\b/,
      "Verkehrszeichen (beschädigt, defekt, etc.)",
    ],
    [/\bradwegschad/, "Radwegschäden"],
    [
      /\bmangelnde strassenreinigung|\bstrassenreinigung\b|\breinigung\b/,
      "Mangelnde Straßenreinigung",
    ],
    [/\bdefekte ampel\b|\bampel\b/, "Defekte Ampel"],
    [/\bparkscheinautomat\b/, "Defekte Parkscheinautomaten"],
    [
      /\bstrassenbeleuchtung\b|\bbeleuchtung\b|\bhausnummer unbeleuchtet\b|\bhausnummer\b|\bvermessungsamt\b/,
      "Defekte Straßenbeleuchtung",
    ],
    [
      /\bgeholzschnitt\b|\bbaumschnitt\b/,
      "Gehölzschnitt an Bäumen, Büschen auf öffentlichem Straßenland",
    ],
    [/\bwildwuchs\b.*\bprivat/, "Wildwuchs von Privatgelände"],
    [/\bwildwuchs\b.*\bbefestigt|\bwildwuchs auf ober/, "Wildwuchs auf befestigtem Gehweg"],
    [
      /\bgehwegschad|\bstrassenschad|\bschlagloch\b|\bzwei schlaglocher\b|\bburgersteig\b|\bpoller\b|\bfahrbahnabsenkung\b|\bgefahrenstelle\b|\bloose gehwegplatte\b|\bstolperfalle\b|\bgehweghindernis\b|\bstrasse locher\b|\blocher in asphalt\b/,
      "Straßen- und Gehwegschäden",
    ],
    [/\bk1 fuss\b|\bk1 fusse\b/, "Mangelnde Straßenreinigung"],
    [/\bweg zugewachsen\b/, "Wildwuchs auf befestigtem Gehweg"],
  ],
  Parkraumbewirtschaftung: [
    [/\bparkgebuhr\b/, "Parkgebühren"],
    [/\bparkscheinautomat\b/, "Parkscheinautomaten"],
    [/\banwohner\b|\bgastevignette\b/, "Anwohner-, Gästevignetten"],
    [/\bausnahme\b|\bbetriebsvignette\b/, "Ausnahme, Betriebsvignetten"],
    [/\bhandy\b|\bsms\b/, "Handy-, SMS-Parken"],
  ],
  Baustellen: [
    [
      /\bfehlend|\bmangelnd|\babsicherung\b|\bbauzaun\b|\bbauabsicherung\b|\babsperrung/,
      "fehlende, mangelnde Absicherung",
    ],
  ],
  "Grünanlage/Park": [
    [/\bmull\b|\bmuell\b|\bverschmutzung\b|\babfall\b/, "Müll, Verschmutzung"],
    [/\bbeschadigung\b/, "Beschädigung"],
    [/\bcampier|\bzelten\b/, "Campieren, Zelten"],
    [/\bbeleuchtung\b/, "Defekte Beleuchtung"],
    [/\bfahrradfahren\b|\bfahrrad\b/, "Fahrradfahren (unerlaubt)"],
    [/\bgrillen\b/, "Grillen"],
    [/\bkfz\b|\bauto\b/, "KFZ, Auto"],
    [/\bunangeleinte hunde\b/, "unangeleinte Hunde"],
    [/\bwildwuchs\b/, "Wildwuchs"],
    [/\bbaden\b/, "Baden"],
  ],
  Lärm: [
    [/\bbaustell/, "Baustelle"],
    [/\bfahrzeug\b|\bmotor\b/, "Fahrzeug/Motor"],
    [/\bfeuerwerk\b/, "Feuerwerk"],
    [/\bgaststatte\b/, "Gaststätte"],
    [/\bgewerbe\b/, "Gewerbe"],
    [/\bindoor\b/, "Haus- und Nachbarschaftslärm indoor"],
    [/\boutdoor\b/, "Haus- und Nachbarschaftslärm outdoor"],
    [/\bstrassenmusik\b/, "Straßenmusik"],
    [/\btierhaltung\b|\bbellen\b/, "Tierhaltung (z. B. Bellen)"],
    [/\bveranstaltung/, "Veranstaltungen"],
    [/\bverkehr\b/, "Verkehr"],
  ],
  Sondernutzung: [
    [/\babfallcontainer\b|\bsammelcontainer\b|\bcontainer\b/, "Abfallcontainer"],
    [/\baltkleidercontainer\b/, "Altkleidercontainer"],
    [/\bglascontainer\b/, "Sonstiges"],
    [/\bbauschuttcontainer\b/, "Bauschuttcontainer"],
    [/\bwerbetafel\b|\bwerbeplakat\b/, "Herausstellen von Werbetafeln"],
    [/\bherausstellen\b.*\bwaren\b/, "Herausstellen von Waren und Gegenständen"],
    [/\binfostande\b|\bstehtische\b/, "Infostände, Stehtische"],
    [/\bplakat|\bwahlplakate\b|\bfahnchen\b/, "Plakatierung"],
    [/\bschankvorgarten\b|\btische und stuhle\b/, "Schankvorgärten (Tische und Stühle)"],
  ],
  "Straßenverkehrsrechtliche Anordnungen": [
    [
      /\bschwerbehindertenparkplatz\b|\bbehindertenparkplatz\b/,
      "Anfrage Schwerbehindertenparkplatz",
    ],
    [/\bbaustell/, "Baustellen"],
    [/\bverkehrszeichen\b|\bverkehrsschilder\b/, "Verkehrszeichen"],
  ],
  Baumschutz: [
    [/\banfrag/, "Anfragen"],
    [/\bbaumschnitt\b|\bloser ast\b/, "fehlender Baumschnitt, loser Ast"],
    [/\bparken\b|\bbaumscheibe\b/, "Parken auf Baumscheibe"],
  ],
  Winterdienst: [
    [/\bbefreiung\b/, "Befreiung"],
    [/\bfahrbahn\b/, "Fahrbahn"],
    [/\bgehweg\b/, "Gehwege"],
    [/\bgrunanlage\b/, "Grünanlage"],
    [/\bhaltestellen?\b/, "Haltestellen"],
    [/\bprivatflache\b/, "Privatfläche"],
    [/\bradweg/, "Radwege"],
    [
      /\btaumittel\b|\bstreugut\b|\bschneebeseitigung\b|\bschnee raumung\b|\bschneeraumen\b/,
      "Taumittel",
    ],
  ],
  Bauaufsicht: [[/\bbauruine\b|\bgrundstucksabsicherung\b/, "Bauruine, Grundstücksabsicherung"]],
  "Gewerbe/Gaststätten": [
    [/\banfrag/, "Anfragen"],
    [/\bbeschwerd/, "Beschwerden"],
    [/\bgeldspiel|\bglucksspiel\b/, "Geldspielgeräte/Glücksspiel"],
    [/\bmehrwegangebotspflicht\b/, "Mehrwegangebotspflicht"],
  ],
  "Gesundheitsschutz/Hygiene": [
    [
      /\bungeziefer\b|\bratten\b|\bkakerlak\b|\bschadlingsbefall\b|\bgeruchsbelastigung\b/,
      "Ungeziefer (z. B. Ratten)",
    ],
  ],
  "Drogenutensilien (z.B. Spritze)": [
    [/\bgrunanlage\b|\bgrunanlage park\b/, "Grünanlage/Park"],
    [/\boffentliches strassenland\b|\bstrassenland\b/, "öffentliches Straßenland"],
    [/\bspielplatz\b/, "Spielplätze"],
  ],
  Hund: [
    [/\bbeaufsichtigung\b/, "Beaufsichtigungspflicht"],
    [/\bbiss\b|\bangriff\b/, "Biss-/Angriffsvorfall"],
    [/\bgefahrlich\b/, "Gefährliche Hunde"],
    [/\bhundekot\b/, "Hundekot (Beseitigungspflicht)"],
    [/\bohne leine\b/, "ohne Leine"],
    [/\bohne maulkorb\b/, "ohne Maulkorb"],
  ],
  Jugendschutz: [
    [/\bdrogen\b/, "Drogen"],
    [/\brauchen\b/, "Rauchen"],
    [/\btrinken\b.*\balkohol\b/, "Trinken von Alkohol in der Öffentlichkeit"],
    [/\bverbotener aufenthalt\b/, "verbotener Aufenthalt von Minderjährigen"],
    [/\bverkauf\b.*\balkohol\b.*\btabak\b/, "Verkauf von Alkohol und Tabak"],
  ],
  Feuerwerk: [
    [/\banfrag/, "Anfragen"],
    [/\bverkauf\b/, "Verkauf"],
  ],
  Tierschutz: [
    [/\bwildtier\b/, "Wildtiere"],
    [/\btierhaltung\b/, "Tierhaltung"],
  ],
  Ladenöffnung: [[/\bsonn\b|\bfeiertag\b/, "Sonn- und Feiertage"]],
  Naturschutzgebiet: [[/\banfrag/, "Anfragen"]],
  Nichtraucherschutz: [[/\bgaststatte\b/, "Gaststätten"]],
  Sonstiges: [[/\bordnungswidrigkeitsverfahren\b/, "Ordnungswidrigkeitsverfahren"]],
  Verkehr: [
    [/\bhauptuntersuchung\b|\btuv\b/, "Hauptuntersuchung, TÜV"],
    [/\bdauerparker\b/, "Dauerparker an ungünstiger Stelle"],
    [/\btaxistand\b|\btaxi halte\b|\btaxihaltestelle\b|\bbusspur\b/, "Sonstiges"],
  ],
};

const MAIN_INFERENCE_ORDER: string[] = [
  "Abfall",
  "Straßenaufsicht",
  "Parkraumbewirtschaftung",
  "Baustellen",
  "Grünanlage/Park",
  "Lärm",
  "Sondernutzung",
  "Straßenverkehrsrechtliche Anordnungen",
  "Baumschutz",
  "Winterdienst",
  "Bauaufsicht",
  "Gewerbe/Gaststätten",
  "Gesundheitsschutz/Hygiene",
  "Drogenutensilien (z.B. Spritze)",
  "Hund",
  "Jugendschutz",
  "Tierschutz",
  "Ladenöffnung",
  "Naturschutzgebiet",
  "Nichtraucherschutz",
  "Feuerwerk",
  "Verkehr",
  "Sonstiges",
];

function normalizeTopicToken(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("ß", "ss")
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036F]/g, "")
    .replaceAll(/[^\da-z]+/g, " ")
    .trim();
}

function normalizeWhitespace(value: string): string {
  return value.replaceAll(/\s+/g, " ").trim();
}

function stripNoisePrefixes(value: string): string {
  let out = normalizeWhitespace(value);
  const noisyPrefix = /^(?:bsr|soko mull abfall|soko müll abfall)\s*-\s*/i;
  while (noisyPrefix.test(out)) {
    out = out.replace(noisyPrefix, "");
  }
  return out;
}

function canonicalizeMainTopic(rawMain: string): string | null {
  const normalized = normalizeTopicToken(rawMain);
  if (!normalized) return null;

  const direct = MAIN_TOPIC_BY_NORMALIZED.get(normalized);
  if (direct) return direct;

  for (const [pattern, canonical] of MAIN_TOPIC_ALIAS_RULES) {
    if (pattern.test(normalized)) return canonical;
  }

  return null;
}

function canonicalizeSubtopic(mainTopic: string, rawSubtopic: string): string {
  if (STANDALONE_MAIN_TOPICS.has(mainTopic)) return "Sonstiges";

  const normalized = normalizeTopicToken(rawSubtopic);
  if (!normalized) return "Sonstiges";

  const lookup = SUBTOPIC_LOOKUPS[mainTopic];
  const direct = lookup?.get(normalized);
  if (direct) return direct;

  const aliasRules = SUBTOPIC_ALIAS_RULES[mainTopic] ?? [];
  for (const [pattern, canonical] of aliasRules) {
    if (pattern.test(normalized)) return canonical;
  }

  if (normalized.includes("sonstig")) return "Sonstiges";
  return lookup?.get("sonstiges") ?? "Sonstiges";
}

function inferMainTopicFromSubtopicPatterns(raw: string): string | null {
  const normalized = normalizeTopicToken(raw);
  if (!normalized) return null;

  for (const mainTopic of MAIN_INFERENCE_ORDER) {
    const rules = SUBTOPIC_ALIAS_RULES[mainTopic] ?? [];
    if (rules.some(([pattern]) => pattern.test(normalized))) {
      return mainTopic;
    }
  }

  return null;
}

function deriveTopics(betreff: string): {
  mainTopic: string;
  subTopic: string;
} {
  const cleaned = stripNoisePrefixes(betreff);
  const split = cleaned.match(/^(.+?)(?:\s-\s|:\s+)(.+)$/);

  if (split) {
    const [, rawMain, rawSub] = split;
    const mainTopic = canonicalizeMainTopic(rawMain);
    if (mainTopic) {
      return {
        mainTopic,
        subTopic: canonicalizeSubtopic(mainTopic, rawSub),
      };
    }
  }

  const mainTopic =
    canonicalizeMainTopic(cleaned) ?? inferMainTopicFromSubtopicPatterns(cleaned) ?? "Sonstiges";
  const subTopic = canonicalizeSubtopic(mainTopic, cleaned);

  return { mainTopic, subTopic };
}

/**
 * Returns null if the detail has no real coordinates — those records are skipped.
 */
export function transformMeldung(
  item: OAMeldung,
  detail: OAMeldungDetail | null | undefined,
): TransformedMeldung | null {
  if (detail?.lat == null || detail?.lng == null) return null;
  const betreff = fixEncoding(item.betreff) ?? sanitizeText(item.betreff) ?? "Sonstiges";
  const { mainTopic, subTopic } = deriveTopics(betreff);

  return {
    id: String(item.id),
    date: parseDate(item.erstellungsDatum) ?? new Date().toISOString(),
    category: sanitizeText(mainTopic) ?? "Sonstiges",
    subcategory: sanitizeText(subTopic) ?? "Sonstiges",
    district: sanitizeText(item.bezirk) ?? "Unbekannt",
    status: sanitizeText(item.status) ?? "offen",
    description: fixEncoding(detail.sachverhalt ?? item.sachverhalt),
    lat: detail.lat,
    lng: detail.lng,
    reportNumber: sanitizeText(item.meldungsNummern[0]),
    street: fixEncoding(detail.strasse),
    houseNumber: sanitizeText(detail.hausNummer),
    postalCode: sanitizeText(detail.plz),
    locationNote: fixEncoding(detail.anmerkungZumOrt),
    lastChanged: parseDate(detail.letzteAenderungDatum),
    feedback: fixEncoding(detail.rueckMeldungAnBuerger),
  };
}
