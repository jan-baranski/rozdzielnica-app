export interface ValidationDoc {
  id: string;
  title: string;
  issueCodes: string[];
  description: string;
  examples: string[];
  rulesSummary: string[];
  limitations: string[];
}

export const validationDocs: ValidationDoc[] = [
  {
    id: "cable-sizing",
    title: "Dobór przewodów do zabezpieczeń",
    issueCodes: ["CABLE_UNDERSIZED", "CABLE_UNDERSIZED_B16"],
    description:
      "Aplikacja sprawdza, czy przekrój przewodu jest dopasowany do zabezpieczenia nadprądowego. Zbyt mały przewód może się przegrzewać zanim zabezpieczenie zadziała.",
    examples: ["Przewód 2.5 mm² + B16 -> OK", "Przewód 1.5 mm² + B20 -> Błąd"],
    rulesSummary: [
      "B10 lub C10 -> minimum 1.5 mm²",
      "B16 lub C16 -> minimum 2.5 mm² w tej aplikacji",
      "B20 lub C20 -> minimum 2.5 mm²",
      "B25 lub C25 -> minimum 4 mm²"
    ],
    limitations: [
      "To są uproszczone reguły.",
      "W rzeczywistości zależy to od sposobu ułożenia przewodu, temperatury, długości i zaleceń producenta."
    ]
  },
  {
    id: "breaker-grouping",
    title: "Obciążenie grupy obwodów",
    issueCodes: ["BREAKER_GROUP_OVERLOAD"],
    description:
      "Aplikacja sprawdza, czy jedno zabezpieczenie, na przykład RCD lub wyłącznik główny, nie jest obciążone przez zbyt wiele obwodów za nim.",
    examples: [
      "2 obwody B16 -> nie liczymy 32A, tylko około 25.6A",
      "6 obwodów B16 -> 6 x 16A = 96A -> 96 x 0.6 = 57.6A",
      "Jeśli zabezpieczenie nadrzędne ma 40A, taka grupa może być przeciążona."
    ],
    rulesSummary: [
      "2-3 obwody -> współczynnik 0.8",
      "4-5 obwodów -> współczynnik 0.7",
      "6-9 obwodów -> współczynnik 0.6",
      "10+ obwodów -> współczynnik 0.5"
    ],
    limitations: [
      "To bardzo uproszczony współczynnik jednoczesności.",
      "Aplikacja nie zna realnych odbiorników, sposobu użytkowania ani mocy urządzeń."
    ]
  },
  {
    id: "layout-bounds",
    title: "Elementy poza obszarem rozdzielnicy",
    issueCodes: ["LAYOUT_OUT_OF_BOUNDS", "FREE_LAYOUT_OUT_OF_BOUNDS"],
    description:
      "Aplikacja sprawdza, czy aparaty DIN i elementy pomocnicze mieszczą się w dostępnym obszarze rozdzielnicy.",
    examples: ["Aparat zaczyna się za ostatnim modułem -> Błąd", "Gniazdo pomocnicze poza obrysem pola pracy -> Błąd"],
    rulesSummary: ["Element DIN musi mieścić się w rzędzie.", "Element wolny musi mieścić się w obrysie rozdzielnicy."],
    limitations: ["To kontrola geometrii w edytorze, nie kontrola fizycznej obudowy konkretnego producenta."]
  },
  {
    id: "overlap",
    title: "Nakładanie się elementów",
    issueCodes: ["LAYOUT_OVERLAP", "FREE_LAYOUT_OVERLAP"],
    description: "Aplikacja sprawdza, czy dwa elementy nie zajmują tego samego miejsca.",
    examples: ["Dwa aparaty w tym samym module DIN -> Błąd", "Dwie listwy w tym samym miejscu -> Błąd"],
    rulesSummary: ["Jeden moduł DIN może być zajęty tylko przez jeden aparat.", "Elementy wolne nie powinny na siebie nachodzić."],
    limitations: ["Aplikacja nie sprawdza zapasu miejsca na prowadzenie przewodów wewnątrz obudowy."]
  },
  {
    id: "terminal-compatibility",
    title: "Zgodność połączeń zacisków",
    issueCodes: ["TERMINAL_INCOMPATIBLE", "WIRE_MISSING_TERMINAL"],
    description:
      "Aplikacja sprawdza podstawowy sens połączenia: czy nie łączysz ze sobą dwóch wyjść, dwóch wejść albo zacisków o niepasujących rolach.",
    examples: ["Wyjście aparatu -> wejście kolejnego aparatu -> OK", "Wyjście -> wyjście -> Błąd"],
    rulesSummary: ["Połączenie powinno prowadzić od źródła lub wyjścia do wejścia.", "Rola zacisku powinna pasować do drugiej strony połączenia."],
    limitations: ["To prosta kontrola logiczna, nie pełna analiza schematu elektrycznego."]
  },
  {
    id: "pe-neutral",
    title: "Połączenia PE i N",
    issueCodes: ["PE_CONNECTED_TO_NON_EARTH", "PE_TO_NON_EARTH", "N_CONNECTED_TO_NON_NEUTRAL"],
    description:
      "Aplikacja pilnuje, żeby zacisk ochronny PE trafiał tylko na zaciski ochronne, a zacisk neutralny N nie był mieszany z innymi biegunami.",
    examples: ["PE -> PE -> OK", "PE -> L1 -> Błąd", "N -> L1 -> Ostrzeżenie"],
    rulesSummary: ["PE powinien łączyć się tylko z PE.", "N powinien łączyć się tylko z N."],
    limitations: ["Aplikacja nie rozpoznaje wszystkich układów sieci ani szczególnych przypadków rozdziału PEN."]
  },
  {
    id: "missing-input",
    title: "Brak połączenia wejściowego",
    issueCodes: ["MISSING_INPUT"],
    description: "Aplikacja sprawdza, czy aparat wymagający zasilania ma podłączone wejście.",
    examples: ["MCB bez przewodu na wejściu -> Ostrzeżenie", "RCD bez wejścia L/N -> Ostrzeżenie"],
    rulesSummary: ["Jeśli element ma oznaczone wejście i wymaga zasilania, wejście nie powinno być puste."],
    limitations: ["Aplikacja nie wie, czy element jest celowo zostawiony jako zapas."]
  },
  {
    id: "load-poles",
    title: "Niepełne podłączenie odbiornika",
    issueCodes: ["LOAD_PARTIAL_CONNECTION"],
    description: "Aplikacja sprawdza, czy odbiornik ma wszystkie wymagane tory, na przykład L, N i PE.",
    examples: ["Gniazdo ma L i N, ale brak PE -> Błąd", "Punkt oświetleniowy ma L i N -> OK"],
    rulesSummary: ["Odbiornik z wymaganymi torami powinien mieć podłączony każdy z nich."],
    limitations: ["Aplikacja nie zna konkretnego typu urządzenia poza prostym szablonem z katalogu."]
  },
  {
    id: "main-switch",
    title: "Rozłącznik główny",
    issueCodes: ["MISSING_MAIN_SWITCH"],
    description: "Aplikacja ostrzega, jeśli w projekcie nie ma elementu oznaczonego jako rozłącznik główny.",
    examples: ["Brak rozłącznika głównego -> Ostrzeżenie", "Dodany main switch 4P -> OK"],
    rulesSummary: ["W projekcie powinien być jeden element pełniący rolę rozłącznika głównego."],
    limitations: ["Aplikacja nie sprawdza, czy rozłącznik ma właściwe parametry dla realnego zasilania."]
  },
  {
    id: "supply-busbars",
    title: "Zasilanie oraz listwy N/PE",
    issueCodes: ["BOARD_SUPPLY_UNUSED", "MISSING_N_BUSBAR", "MISSING_PE_BUSBAR"],
    description:
      "Aplikacja sprawdza, czy użyto zacisków zasilania oraz czy w projekcie są listwy N i PE, gdy są potrzebne.",
    examples: ["Żaden zacisk zasilania nie jest podłączony -> Ostrzeżenie", "Są zaciski N, ale brak listwy N -> Ostrzeżenie"],
    rulesSummary: ["Zasilanie rozdzielnicy powinno być połączone z pierwszymi aparatami lub listwami.", "Projekt powinien mieć listwę PE, a przy torach N również listwę N."],
    limitations: ["To podpowiedź porządkowa, nie pełna kontrola topologii zasilania."]
  },
  {
    id: "board-occupancy",
    title: "Zajętość rozdzielnicy",
    issueCodes: ["HIGH_BOARD_OCCUPANCY"],
    description: "Aplikacja ostrzega, gdy rozdzielnica jest prawie pełna.",
    examples: ["Zajętość powyżej 85% -> Ostrzeżenie", "Zostawione wolne moduły -> OK"],
    rulesSummary: ["Po przekroczeniu 85% zajętości pojawia się ostrzeżenie."],
    limitations: ["Aplikacja nie uwzględnia realnej wygody prowadzenia przewodów ani miejsca na akcesoria."]
  }
];

export const validationSeverityDocs = [
  {
    label: "ERROR",
    description: "To bardzo prawdopodobny błąd. Instalacja może być niebezpieczna."
  },
  {
    label: "WARNING",
    description: "Może być OK, ale zależy od warunków. Warto sprawdzić dokładniej."
  },
  {
    label: "INFO",
    description: "Brakuje danych, żeby to ocenić. Obecna aplikacja nie pokazuje jeszcze osobnych komunikatów INFO."
  }
];

export const validationGlobalLimitations = [
  "długości przewodów",
  "spadków napięcia",
  "sposobu ułożenia kabli",
  "temperatury",
  "selektywności zabezpieczeń",
  "dokładnych norm i tabel producentów"
];

export function findValidationDocByIssueCode(code: string): ValidationDoc | undefined {
  return validationDocs.find((doc) => doc.issueCodes.includes(code));
}
