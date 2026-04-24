import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Polityka prywatności serwisu rozdzielnica.app"
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#edf1f4] px-4 py-6 text-[#172033] sm:px-6 sm:py-10">
      <article className="mx-auto max-w-3xl rounded border border-[#c8d1dc] bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <header className="mb-8 border-b border-[#d4dce7] pb-5">
          <Link
            href="/"
            className="text-sm font-semibold text-[#2563eb] transition hover:text-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2"
          >
            Wróć do aplikacji
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-[#172033]">Polityka prywatności</h1>
        </header>

        <div className="space-y-8 text-base leading-7 text-[#344054]">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#172033]">1. Informacje ogólne</h2>
            <p>
              Niniejsza strona (rozdzielnica.app) jest projektem hobbystycznym służącym do wizualnego
              szkicowania rozdzielnic elektrycznych.
            </p>
            <p>
              Szanuję prywatność użytkowników i nie zbieram danych osobowych w sposób aktywny, np. poprzez
              formularze, rejestrację czy konta użytkowników.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#172033]">2. Jakie dane mogą być przetwarzane</h2>
            <p>Podczas korzystania ze strony mogą być przetwarzane następujące dane techniczne:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>adres IP</li>
              <li>podstawowe informacje o przeglądarce i urządzeniu</li>
              <li>dane dotyczące ruchu sieciowego</li>
            </ul>
            <p>Dane te nie są przeze mnie wykorzystywane do identyfikacji użytkownika.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#172033]">3. Zewnętrzne usługi - Cloudflare</h2>
            <p>
              Strona korzysta z usług Cloudflare, Inc., która pełni rolę dostawcy infrastruktury sieciowej, CDN
              oraz zabezpieczeń.
            </p>
            <p>Cloudflare może przetwarzać dane techniczne użytkowników, w tym adres IP, w celu:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>zapewnienia bezpieczeństwa, np. ochrony przed botami i atakami</li>
              <li>optymalizacji dostarczania treści</li>
              <li>obsługi ruchu sieciowego</li>
            </ul>
            <p>
              Więcej informacji znajduje się w polityce prywatności Cloudflare:{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#2563eb] underline underline-offset-4 transition hover:text-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2"
              >
                https://www.cloudflare.com/privacypolicy/
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#172033]">4. Cookies</h2>
            <p>
              Strona może wykorzystywać techniczne pliki cookies związane z działaniem usług Cloudflare, np.
              zabezpieczeniem i filtrowaniem ruchu.
            </p>
            <p>Cookies te:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>nie służą do śledzenia użytkownika</li>
              <li>są wykorzystywane wyłącznie w celach technicznych i bezpieczeństwa</li>
              <li>są niezbędne do prawidłowego działania strony</li>
            </ul>
            <p>Strona nie wykorzystuje cookies do celów marketingowych ani analitycznych.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#172033]">5. Przechowywanie danych projektu</h2>
            <p>
              Aplikacja może zapisywać dane projektu lokalnie w przeglądarce użytkownika, np. w localStorage.
            </p>
            <p>Dane te:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>nie są przesyłane na serwer aplikacji</li>
              <li>pozostają wyłącznie na urządzeniu użytkownika</li>
              <li>mogą zostać usunięte przez użytkownika poprzez wyczyszczenie danych przeglądarki</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#172033]">6. Prawa użytkownika</h2>
            <p>Zgodnie z przepisami o ochronie danych osobowych użytkownik ma prawo do:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>dostępu do danych</li>
              <li>ich sprostowania</li>
              <li>ograniczenia przetwarzania</li>
              <li>wniesienia sprzeciwu</li>
              <li>usunięcia danych, o ile ma to zastosowanie</li>
            </ul>
            <p>
              Ponieważ strona nie gromadzi danych osobowych w sposób bezpośredni, realizacja niektórych praw może
              być ograniczona do danych technicznych przetwarzanych przez dostawców infrastruktury.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#172033]">7. Kontakt</h2>
            <p>
              W sprawach związanych z prywatnością oraz działaniem aplikacji można skontaktować się pod adresem
              e-mail:
            </p>
            <p>
              <a
                href="mailto:admin@rozdzielnica.app"
                className="font-semibold text-[#2563eb] underline underline-offset-4 transition hover:text-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2"
              >
                admin@rozdzielnica.app
              </a>
            </p>
            <p>Administrator dokłada starań, aby odpowiedzieć na wiadomości w rozsądnym czasie.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#172033]">8. Zmiany polityki prywatności</h2>
            <p>
              Polityka prywatności może być aktualizowana w przyszłości, np. w przypadku rozwoju aplikacji,
              dodania nowych funkcji lub zmiany przepisów.
            </p>
            <p>Data ostatniej aktualizacji: 25.04.2026</p>
          </section>
        </div>
      </article>
    </main>
  );
}
