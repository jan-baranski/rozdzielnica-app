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
    title: "Walidacja przekroju przewodu",
    issueCodes: ["CABLE_UNDERSIZED", "CABLE_UNDERSIZED_B16", "CABLE_UNDERSIZED_LOAD", "CIRCUIT_LOAD_EXCEEDS_BREAKER"],
    description:
      "Sprawdza przekrój przewodów na całej trasie zasilania od odbiornika do wejścia sieci. Obejmuje zarówno przewody końcowe za MCB/RCBO, jak i wcześniejsze przewody zasilające rozłącznik, RCD, bloki rozdzielcze i grupy zabezpieczeń.",
    examples: [
      "B16 + cała trasa 2.5 mm² -> OK",
      "B16 + wcześniejszy fragment zasilania 1.5 mm² -> Błąd",
      "B16 + odbiorniki 18 A poboru -> Błąd"
    ],
    rulesSummary: [
      "B10 lub C10 -> minimum 1.5 mm²",
      "B16 lub C16 -> minimum 2.5 mm² w tej aplikacji",
      "B20 lub C20 -> minimum 4 mm²",
      "B25 lub C25 -> minimum 6 mm²",
      "Przewody przed MCB są oceniane względem największego zabezpieczenia downstream, które mogą zasilać."
    ],
    limitations: [
      "To są uproszczone reguły.",
      "W rzeczywistości zależy to od sposobu ułożenia przewodu, temperatury, długości i zaleceń producenta."
    ]
  },
  {
    id: "circuit-load",
    title: "Walidacja obciążenia obwodu",
    issueCodes: ["CIRCUIT_LOAD_EXCEEDS_BREAKER", "CABLE_UNDERSIZED_LOAD"],
    description:
      "Sprawdza, czy suma prądów odbiorników nie przekracza wartości zabezpieczenia oraz czy przekrój przewodów jest odpowiedni dla zadeklarowanego obciążenia.",
    examples: ["B16 + odbiornik 10 A -> OK", "B16 + odbiorniki 10 A i 8 A -> Błąd"],
    rulesSummary: [
      "Sumowany jest tylko realny pobór currentA/loadA, a nie ratingA/maxA elementu.",
      "Prądy odbiorników za tym samym MCB/RCBO są sumowane.",
      "Przewody są sprawdzane także względem obciążenia odbiorników, nie tylko względem zabezpieczenia."
    ],
    limitations: [
      "To uproszczona walidacja hobbystyczna.",
      "Aplikacja nie uwzględnia charakteru odbiornika, rozruchu ani warunków ułożenia przewodów."
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
      "Aplikacja sprawdza, czy moduły DIN i elementy pomocnicze mieszczą się w dostępnym obszarze rozdzielnicy.",
    examples: ["Moduł zaczyna się za ostatnim modułem -> Błąd", "Gniazdo pomocnicze poza obrysem pola pracy -> Błąd"],
    rulesSummary: ["Element DIN musi mieścić się w rzędzie.", "Element wolny musi mieścić się w obrysie rozdzielnicy."],
    limitations: ["To kontrola geometrii w edytorze, nie kontrola fizycznej obudowy konkretnego producenta."]
  },
  {
    id: "overlap",
    title: "Nakładanie się elementów",
    issueCodes: ["LAYOUT_OVERLAP", "FREE_LAYOUT_OVERLAP"],
    description: "Aplikacja sprawdza, czy dwa elementy nie zajmują tego samego miejsca.",
    examples: ["Dwa moduły w tym samym module DIN -> Błąd", "Dwie listwy w tym samym miejscu -> Błąd"],
    rulesSummary: ["Jeden moduł DIN może być zajęty tylko przez jeden moduł.", "Elementy wolne nie powinny na siebie nachodzić."],
    limitations: ["Aplikacja nie sprawdza zapasu miejsca na prowadzenie przewodów wewnątrz obudowy."]
  },
  {
    id: "terminal-compatibility",
    title: "Zgodność połączeń zacisków",
    issueCodes: ["TERMINAL_INCOMPATIBLE", "WIRE_MISSING_TERMINAL"],
    description:
      "Aplikacja sprawdza podstawowy sens połączenia: czy nie łączysz ze sobą dwóch wyjść, dwóch wejść albo zacisków o niepasujących rolach.",
    examples: ["Wyjście modułu -> wejście kolejnego modułu -> OK", "Wyjście -> wyjście -> Błąd"],
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
    id: "neutral-rcd-circuits",
    title: "Walidacja przewodu N",
    issueCodes: [
      "N_BUS_SHARED_BY_RCDS",
      "N_BUS_BYPASSES_RCD",
      "N_BUS_MIXES_RCD_AND_SUPPLY",
      "LOAD_NEUTRAL_MISSING",
      "LOAD_NEUTRAL_CIRCUIT_MISMATCH",
      "N_CONNECTED_BEFORE_RCD",
      "N_RCD_MISMATCH"
    ],
    description:
      "Sprawdza, czy przewód neutralny N należy do właściwego obwodu, przechodzi przez odpowiedni RCD oraz czy różne RCD nie współdzielą jednej listwy N.",
    examples: [
      "Faza za RCD i N na listwie tego samego RCD -> OK",
      "Faza za RCD A, a N za RCD B -> Błąd",
      "Listwa N podłączona jednocześnie do zasilania i wyjścia N RCD -> Błąd",
      "Dwa RCD podłączone do jednej listwy N -> Błąd"
    ],
    rulesSummary: [
      "Obwód za RCD powinien mieć N za tym samym RCD albo na listwie N przypisanej do niego.",
      "Listwa N używana przez obwody za RCD nie może być zasilana bezpośrednio z wejścia N.",
      "Kilka RCD powinno mieć oddzielne listwy N po stronie wyjściowej.",
      "Odbiornik z podłączoną fazą powinien mieć przypisany właściwy przewód N."
    ],
    limitations: [
      "To analiza topologii połączeń w edytorze, nie profesjonalna weryfikacja instalacji.",
      "Przy niekompletnych połączeniach aplikacja może pokazać ostrzeżenie albo pominąć ocenę."
    ]
  },
  {
    id: "circuit-completeness",
    title: "Walidacja kompletności obwodu",
    issueCodes: [
      "CIRCUIT_L_CONTINUITY",
      "CIRCUIT_N_CONTINUITY",
      "CIRCUIT_PE_CONTINUITY",
      "CIRCUIT_MISSING_BREAKER",
      "CIRCUIT_MISSING_RCD",
      "CIRCUIT_RCD_MISMATCH",
      "CIRCUIT_L_MULTIPLE_PATHS"
    ],
    description:
      "Sprawdza, czy odbiorniki mają poprawny tor L, N i PE, czy L przechodzi przez zabezpieczenie nadprądowe oraz czy L i N są chronione tym samym RCD/RCBO.",
    examples: [
      "Odbiornik L/N/PE za RCD i MCB -> OK",
      "Odbiornik podłączony bez MCB/RCBO -> Błąd",
      "Odbiornik z dodatkowym L bezpośrednio z zasilania -> Błąd",
      "L za RCD A, a N za RCD B -> Błąd"
    ],
    rulesSummary: [
      "Tor L musi mieć ciągłość do zasilania i przechodzić przez MCB/RCBO.",
      "Każda ścieżka L do zasilania musi przechodzić przez ten sam MCB/RCBO i RCD/RCBO.",
      "Tor L zwykłego obwodu końcowego musi przechodzić przez RCD/RCBO.",
      "Tor N musi mieć ciągłość do zasilania i przechodzić przez ten sam RCD co L.",
      "Tor PE jest wymagany tylko dla odbiorników, które deklarują PE."
    ],
    limitations: [
      "To analiza grafu połączeń w edytorze, nie profesjonalna weryfikacja instalacji.",
      "Niekompletne, jeszcze nietknięte odbiorniki bez połączeń są pomijane."
    ]
  },
  {
    id: "missing-input",
    title: "Brak połączenia wejściowego",
    issueCodes: ["MISSING_INPUT"],
    description: "Aplikacja sprawdza, czy moduł wymagający zasilania ma podłączone wejście.",
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
    rulesSummary: ["Zasilanie rozdzielnicy powinno być połączone z pierwszymi modułami lub listwami.", "Projekt powinien mieć listwę PE, a przy torach N również listwę N."],
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
