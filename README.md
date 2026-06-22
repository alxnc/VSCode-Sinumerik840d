Sinumerik 840D Edycja — Pomocnik Programisty CNC

Rozszerzenie do edytora Visual Studio Code stworzone z myślą o programistach maszyn CNC pracujących z systemem sterowania Sinumerik 840D (i pokrewnymi). 
Ułatwia ono szybkie formatowanie, reorganizację oraz zarządzanie numeracją linii i etykiet (labeli) w kodzie maszynowym (G-kodzie).

🚀 Główne funkcje rozszerzenia

Rozszerzenie udostępnia menu szybkiego wyboru z trzema kluczowymi operacjami:

1. Przenumerowanie linii programu (N / :)

Funkcja służy do automatycznej re-numeracji bloków kodu rozpoczynających się od znaków N lub : (np. N345, :20).

Działanie inteligentne: * Jeśli masz zaznaczony tekst, operacja zostanie wykonana tylko wewnątrz zaznaczonego obszaru.

Jeśli nie masz zaznaczenia, przenumerowany zostanie cały dokument.

Parametryzacja: Przed uruchomieniem rozszerzenie zapyta Cię o:

Numer początkowy (domyślnie: 5).

Krok/Increment o jaki ma rosnąć każdy kolejny blok (domyślnie: 5).

Bezpieczeństwo: Zmianie ulega wyłącznie pierwszy wyraz w linii (jeśli pasuje do formatu). Komentarze, współrzędne oraz parametry technologiczne pozostają nienaruszone.

2. Odwrócenie kolejności linii (Reverse Lines)

Służy do szybkiej zmiany kierunku obróbki (np. przy przepisywaniu przejść wykańczających lub cofaniu ścieżki narzędzia).

Działanie: Kopiuje zaznaczony fragment tekstu, odwraca kolejność linii (ostatnia staje się pierwszą, przedostatnia drugą itd.) i wkleja tak przygotowany blok bezpośrednio poniżej Twojego aktualnego zaznaczenia.

Bezpieczeństwo: Oryginalne zaznaczenie nie ulega zmianie, dzięki czemu masz pełną kontrolę i podgląd na obie wersje ścieżki.

3. Przenumerowanie etykiet (Labeli)

Umożliwia błyskawiczne uporządkowanie nazw etykiet skoków oraz podprogramów wewnątrz zaznaczonego bloku tekstu.

Działanie: Wykrywa wszystkie etykiety kończące się dwukropkiem, posiadające numer na końcu nazwy (np. OT_1:, KROK112:, Baza10:). Następnie nadaje im nową, spójną numerację rosnącą od 1 wzwyż (OT_1:, OT_2:, OT_3: itd.).

Precyzja: Rozszerzenie jest odporne na błędy i nie dokleja sztucznych cyfr. Precyzyjnie oddziela tekstową nazwę etykiety od jej starego numeru porządkowego i podmienia wyłącznie samą końcówkę numeryczną.

📦 Jak wygenerować plik instalacyjny (.vsix) i zainstalować w zwykłym VS Code

Aby zainstalować rozszerzenie na stałe w swoim głównym programie VS Code, należy zbudować paczkę .vsix. Nie potrzebujesz do tego żadnych skomplikowanych narzędzi kompilacji – wystarczy standardowe środowisko Node.js.

Krok 1: Przygotowanie środowiska (jednorazowo)

Upewnij się, że masz zainstalowany program Node.js na swoim komputerze. Jeśli go nie masz, pobierz go i zainstaluj z oficjalnej strony nodejs.org.

Krok 2: Generowanie pliku .vsix

Otwórz zwykły terminal (np. PowerShell, Bash lub wbudowany terminal w VS Code) w głównym folderze swojego projektu (tam, gdzie znajduje się plik package.json).

Uruchom następujące polecenie, które pobierze oficjalne narzędzie Microsoftu i automatycznie spakuje rozszerzenie:

npx @vscode/vsce package


Uwaga: Narzędzie może wyświetlić ostrzeżenie dotyczące braku licencji lub ikony, a także zapytać: Do you want to continue?. Wpisz y (tak) i naciśnij Enter.

Po zakończeniu operacji w Twoim folderze projektowym pojawi się nowy plik, np.:
manipulator-linii-etykiet-1.0.0.vsix (lub o podobnej nazwie zdefiniowanej w package.json).

Krok 3: Instalacja w Twoim "normalnym" VS Code

Możesz teraz zainstalować ten plik bezpośrednio w swoim edytorze na dwa sposoby:

Sposób graficzny (najprostszy):

Otwórz swoje normalne okno VS Code.

Przejdź do zakładki Rozszerzenia (skrót Ctrl+Shift+X lub ikona klocków po lewej stronie).

Kliknij ikonę trzech kropek (...) w prawym górnym rogu panelu rozszerzeń.

Wybierz opcję Zainstaluj z pliku VSIX... (Install from VSIX...).

Wskaż wygenerowany plik .vsix na swoim dysku.

Sposób z linii poleceń:
Wpisz w terminalu systemowym:

code --install-extension nazwa_pliku.vsix


Od tej chwili rozszerzenie będzie zainstalowane na stałe i dostępne przy każdym uruchomieniu VS Code pod nazwą komendy: Manipulator Linii i Etykiet: Wykonaj operację.

🛠️ Instalacja i konfiguracja lokalna (do celów programistycznych)

Jeśli rozwijasz to rozszerzenie lokalnie lub chcesz je przetestować w trybie deweloperskim, upewnij się, że struktura Twojego folderu wygląda następująco:

twój-folder-projektu/
├── .vscode/
│     └── launch.json     # Konfiguracja środowiska uruchomieniowego VS Code
├── package.json          # Manifest rozszerzenia (metadane i komendy)
├── extension.js          # Główny kod źródłowy (logika rozszerzenia)
└── README.md             # Ta instrukcja obsługi


Krok po kroku:

Otwórz główny folder projektu bezpośrednio w programie Visual Studio Code (opcja: Plik -> Otwórz folder i wskaż katalog zawierający plik package.json).

Naciśnij klawisz F5 lub przejdź do sekcji Uruchom i debuguj (Ctrl+Shift+D) i kliknij zielony przycisk odtwarzania ("Uruchom Rozszerzenie").

VS Code otworzy nowe okno o nazwie [Extension Development Host]. To w nim zainstalowane i aktywne jest Twoje rozszerzenie.

📖 Instrukcja użycia (Jak uruchomić narzędzie?)

Aby skorzystać z rozszerzenia w oknie testowym lub po zainstalowaniu wersji .vsix:

Otwórz lub utwórz dowolny plik z kodem programu (np. z rozszerzeniem .MPF, .SPF lub zwykły plik .txt).

Wprowadź tekst testowy, na przykład:

N345 OT_1: M00
N350 OT_12: U_ON
N355 OT_13: D1
N360 G0 X=1320


(Opcjonalnie) Zaznacz linie, które chcesz zmodyfikować.

Otwórz paletę komend za pomocą skrótu klawiszowego:

Windows/Linux: Ctrl + Shift + P

macOS: Cmd + Shift + P

Wpisz i wybierz komendę:
Manipulator Linii i Etykiet: Wykonaj operację

Na górze ekranu pojawi się menu wyboru. Wybierz odpowiednią opcję (1, 2 lub 3) i postępuj zgodnie z instrukcjami na ekranie (np. podając numer początkowy i krok w przypadku opcji pierwszej).

⚠️ Rozwiązywanie problemów

VS Code nie widzi komendy w palecie:
Upewnij się, że poprawnie zainstalowałeś plik .vsix lub pracujesz w oknie oznaczonym jako [Extension Development Host] podczas testów deweloperskich.

Komenda "Przenumeruj etykiety" lub "Odwróć kolejność" nie działa:
Upewnij się, że przed wywołaniem tych opcji zaznaczyłeś tekst w edytorze. Te dwie funkcje wymagają aktywnego zaznaczenia fragmentu kodu.
