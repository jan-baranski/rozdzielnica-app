# Projektant Rozdzielnicy DIN (DIN Board Designer)

Profesjonalne narzędzie MVP do projektowania domowych rozdzielnic elektrycznych na szynę DIN. Aplikacja łączy w sobie realistyczny edytor wizualny, silnik walidacji reguł technicznych oraz możliwość generowania schematów logicznych.

## Główne Funkcje (Features)

- **Interaktywna Szyna DIN**: Przeciągaj i upuszczaj (drag-and-drop) aparaty bezpośrednio na rzędy rozdzielnicy. System automatycznie wykrywa zajęte moduły i sugeruje wolne miejsca.
- **Obszerna Biblioteka Aparatów**: Dostęp do katalogu standardowych komponentów (nadmiarowoprądowe MCB, różnicowoprądowe RCD, ochronniki SPD, rozłączniki główne, gniazda i inne).
- **Zaawansowany System Okablowania**:
  - Tworzenie połączeń między zaciskami aparatów.
  - **Przenoszenie Przewodów**: Możliwość odłączenia jednego końca przewodu i przepięcia go do innego zacisku bez usuwania całego połączenia.
  - Automatyczne dobieranie kolorów izolacji na podstawie potencjału zacisku (L1, L2, L3, N, PE).
- **Inteligentna Walidacja (Live)**: Silnik reguł w czasie rzeczywistym sprawdza błędy takie jak:
  - Przekroczenie pojemności rzędów.
  - Niekompatybilne połączenia (np. faza do PE).
  - Brak zabezpieczenia różnicowoprądowego dla obwodów odbiorczych.
  - Brak rozłącznika głównego.
- **Eksport i Import**: Możliwość zapisu projektu do formatu JSON oraz szybkiego przywracania stanu początkowego (przycisk Demo).

## Jak Korzystać (How to Use)

### 1. Budowa Rozdzielnicy
- Wybierz aparat z **Biblioteki aparatów** po lewej stronie.
- Przeciągnij go na wybrany rząd w centralnej części ekranu.
- Możesz dowolnie przesuwać ułożone już aparaty lub zmieniać rozmiar rozdzielnicy w **Panelu Właściwości** po prawej stronie.

### 2. Okablowanie
- Kliknij na wybrany zacisk aparatu (mały kolorowy okrąg). Zostanie on podświetlony jako punkt startowy.
- Kliknij na drugi zacisk, aby utworzyć połączenie.
- **Aby zmienić połączenie**: Wybierz istniejący przewód, kliknij jeden z podświetlonych końców, a następnie kliknij nowy zacisk docelowy.

### 3. Konfiguracja i Detale
- Kliknij na aparat lub przewód, aby zobaczyć i edytować jego szczegóły w **Panelu Właściwości**.
- Możesz tam zmienić nazwę aparatu (np. "Oświetlenie Salon") lub przekrój przewodu.

### 4. Sprawdzanie Błędów
- Panel na dole ekranu wyświetla listę wykrytych problemów.
- Kliknięcie w błąd podświetli komponenty, których dotyczy problem.

## Technologia (Stack)

- **Frontend**: Next.js (App Router), React, TypeScript.
- **Stan**: Zustand (zarządzanie stanem edytora).
- **Stylizacja**: Tailwind CSS.
- **Logika**: Zod (walidacja schematów), Vitest (testy domeny).

## Uruchomienie Lokalne

```bash
npm install
npm run dev
```
Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

---
**Uwaga**: Narzędzie ma charakter poglądowy i edukacyjny. Projekty i walidacje nie zastępują wiedzy i uprawnień profesjonalnego elektryka.
