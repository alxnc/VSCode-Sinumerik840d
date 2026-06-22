// Importujemy moduł VS Code API
const vscode = require('vscode');

/**
 * Metoda aktywująca rozszerzenie. Wywoływana przy pierwszym użyciu komendy.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Rejestrujemy naszą główną komendę
    let disposable = vscode.commands.registerCommand('sinumerik-840d-edycja.uruchom', async function () {
        // Pobieramy aktywny edytor tekstu
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Brak aktywnego edytora tekstu!');
            return;
        }

        // Przygotowujemy menu szybkiego wyboru (QuickPick) z 3 opcjami
        const opcje = [
            {
                label: '1. Przenumeruj linie programu (N / :)',
                description: 'Numeruje linie zaczynające się od ":" i "N" (działa na zaznaczeniu lub całym pliku)'
            },
            {
                label: '2. Odwróć kolejność linii',
                description: 'Kopiuje zaznaczenie, odwraca kolejność linii i wkleja poniżej zaznaczenia'
            },
            {
                label: '3. Przenumeruj etykiety',
                description: 'Numeruje od 1 wzwyż napotkane etykiety (np. tekstXX:)'
            }
        ];

        // Wyświetlamy menu użytkownikowi
        const wybor = await vscode.window.showQuickPick(opcje, {
            placeHolder: 'Wybierz operację do wykonania'
        });

        // Jeśli użytkownik anulował wybór (np. nacisnął Esc)
        if (!wybor) {
            return;
        }

        // Pobieramy zaznaczenie i tekst tylko dla opcji, które tego wymagają
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        // Obsługa wybranej opcji
        if (wybor.label.startsWith('1')) {
            // OPCJA 1: Przenumerowanie linii programu (zaczynających się od N lub :)

            // 1. Pytamy o numer początkowy
            const startInput = await vscode.window.showInputBox({
                prompt: 'Podaj numer początkowy dla linii programu',
                value: '5',
                validateInput: text => {
                    const num = parseInt(text, 10);
                    return (isNaN(num) || num < 0) ? 'Wprowadź liczbę całkowitą nieujemną' : null;
                }
            });
            if (startInput === undefined) return; // Anulowano
            const startValue = parseInt(startInput, 10);

            // 2. Pytamy o krok numeracji
            const stepInput = await vscode.window.showInputBox({
                prompt: 'Podaj krok (increment) dla kolejnych linii',
                value: '5',
                validateInput: text => {
                    const num = parseInt(text, 10);
                    return (isNaN(num) || num <= 0) ? 'Wprowadź liczbę całkowitą większą od 0' : null;
                }
            });
            if (stepInput === undefined) return; // Anulowano
            const stepValue = parseInt(stepInput, 10);

            // Pobieramy pełną zawartość dokumentu
            const dokument = editor.document;
            const pelnyTekst = dokument.getText();
            const linie = pelnyTekst.split(/\r?\n/);

            let aktualnyNumer = startValue;

            // Ustalamy zakres linii do modyfikacji (cały plik lub samo zaznaczenie)
            const hasSelection = !selection.isEmpty;
            let startLineIdx = 0;
            let endLineIdx = linie.length - 1;

            if (hasSelection) {
                startLineIdx = selection.start.line;
                endLineIdx = selection.end.line;

                // Jeśli zaznaczenie kończy się na początku nowej linii (częste przy zaznaczaniu całych wierszy),
                // ignorujemy tę pustą linię końcową, aby nie modyfikować wiersza poniżej zaznaczenia.
                if (selection.end.character === 0 && endLineIdx > startLineIdx) {
                    endLineIdx--;
                }
            }

            // Przetwarzamy linię po linii
            const przetworzoneLinie = linie.map((linia, index) => {
                // Modyfikujemy tylko linie mieszczące się w wyznaczonym zakresie
                if (index >= startLineIdx && index <= endLineIdx) {
                    // Wyrażenie regularne dopasowujące początek linii:
                    // Grupa 1: (\s*) -> ewentualne białe znaki na początku linii
                    // Grupa 2: ([N:]) -> znak N lub :
                    // Grupa 3: (\d+) -> ciąg cyfr bezpośrednio po znaku
                    const regexPoczatkuLinii = /^(\s*)([N:])(\d+)/;
                    const dopasowanie = linia.match(regexPoczatkuLinii);

                    if (dopasowanie) {
                        const bialeZnaki = dopasowanie[1];
                        const znak = dopasowanie[2];
                        // Zastępujemy stary numer nowym z licznika i doklejamy resztę linii
                        const resztaLinii = linia.substring(dopasowanie[0].length);
                        const nowaLinia = `${bialeZnaki}${znak}${aktualnyNumer}${resztaLinii}`;
                        aktualnyNumer += stepValue;
                        return nowaLinia;
                    }
                }
                return linia; // Jeśli poza zakresem lub nie pasuje do schematu, zostawiamy bez zmian
            });

            // Łączymy linie z powrotem
            const znakKoncaLinii = dokument.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
            const nowyTekstCalosci = przetworzoneLinie.join(znakKoncaLinii);

            // Zastępujemy cały dokument nowym tekstem
            const pelnyZakres = new vscode.Range(
                dokument.positionAt(0),
                dokument.positionAt(pelnyTekst.length)
            );

            await editor.edit(editBuilder => {
                editBuilder.replace(pelnyZakres, nowyTekstCalosci);
            });

            // Informujemy użytkownika o zakresie wykonanej operacji
            const komunikatSukcesu = hasSelection
                ? `Przenumerowano linie w obszarze zaznaczenia (linie od ${startLineIdx + 1} do ${endLineIdx + 1}). Ostatnia wartość: ${aktualnyNumer - stepValue}.`
                : `Przenumerowano linie w całym dokumencie. Ostatnia wartość: ${aktualnyNumer - stepValue}.`;

            vscode.window.showInformationMessage(komunikatSukcesu);

        } else if (wybor.label.startsWith('2')) {
            // OPCJA 2: Odwrócenie kolejności linii i wklejenie poniżej
            if (!selectedText) {
                vscode.window.showWarningMessage('Ta opcja wymaga zaznaczenia tekstu w edytorze!');
                return;
            }

            // Dzielimy tekst na linie
            const linie = selectedText.split(/\r?\n/);
            const odwróconeLinie = [...linie].reverse();

            const znakKoncaLinii = editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
            const odwróconyTekst = odwróconeLinie.join(znakKoncaLinii);

            editor.edit(editBuilder => {
                const pozycjaWklejenia = selection.end;
                editBuilder.insert(pozycjaWklejenia, znakKoncaLinii + odwróconyTekst);
            });

            vscode.window.showInformationMessage('Pomyślnie odwrócono kolejność linii i wklejono poniżej.');

        } else if (wybor.label.startsWith('3')) {
            // OPCJA 3: Przenumerowanie etykiet (tekstXX: gdzie XX to liczba)
            if (!selectedText) {
                vscode.window.showWarningMessage('Ta opcja wymaga zaznaczenia tekstu w edytorze!');
                return;
            }

            let licznik = 1;
            const regexEtykietyCalosci = /(\b[a-zA-Z_][a-zA-Z0-9_-]*)(:)/g;

            const przetworzonyTekst = selectedText.replace(regexEtykietyCalosci, (match, pelnaNazwaEtykiety, sufiks) => {
                const numerNaKoncuRegex = /(\d+)$/;
                const wynikDopasowaniaNumeru = pelnaNazwaEtykiety.match(numerNaKoncuRegex);

                let prefix = pelnaNazwaEtykiety;

                if (wynikDopasowaniaNumeru) {
                    const znalezionyNumerString = wynikDopasowaniaNumeru[1];
                    const indexPoczatkuNumeru = pelnaNazwaEtykiety.lastIndexOf(znalezionyNumerString);
                    prefix = pelnaNazwaEtykiety.substring(0, indexPoczatkuNumeru);
                }

                const nowaEtykieta = `${prefix}${licznik}${sufiks}`;
                licznik++;
                return nowaEtykieta;
            });

            editor.edit(editBuilder => {
                editBuilder.replace(selection, przetworzonyTekst);
            });

            vscode.window.showInformationMessage(`Przenumerowano etykiety. Ostatni użyty numer: ${licznik - 1}.`);
        }
    });

    context.subscriptions.push(disposable);
}

// Metoda wywoływana przy dezaktywacji rozszerzenia
function deactivate() {}

module.exports = {
    activate,
    deactivate
};