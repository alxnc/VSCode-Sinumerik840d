// Importujemy moduł VS Code API
const vscode = require('vscode');

/**
 * Metoda aktywująca rozszerzenie. Wywoływana przy pierwszym użyciu komendy.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    // 1. REJESTRACJA GŁÓWNEJ KOMENDY (MENU WYBORU)
    let disposableUruchom = vscode.commands.registerCommand('sinumerik-840d-edycja.uruchom', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Brak aktywnego edytora tekstu!');
            return;
        }

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

        const wybor = await vscode.window.showQuickPick(opcje, {
            placeHolder: 'Wybierz operację do wykonania'
        });

        if (!wybor) {
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (wybor.label.startsWith('1')) {
            // OPCJA 1: Interaktywne przenumerowanie linii programu
            
            // Pytamy o numer początkowy
            const startInput = await vscode.window.showInputBox({
                prompt: 'Podaj numer początkowy dla linii programu',
                value: '5',
                validateInput: text => {
                    const num = parseInt(text, 10);
                    return (isNaN(num) || num < 0) ? 'Wprowadź liczbę całkowitą nieujemną' : null;
                }
            });
            if (startInput === undefined) return;
            const startValue = parseInt(startInput, 10);

            // Pytamy o krok numeracji
            const stepInput = await vscode.window.showInputBox({
                prompt: 'Podaj krok (increment) dla kolejnych linii',
                value: '5',
                validateInput: text => {
                    const num = parseInt(text, 10);
                    return (isNaN(num) || num <= 0) ? 'Wprowadź liczbę całkowitą większą od 0' : null;
                }
            });
            if (stepInput === undefined) return;
            const stepValue = parseInt(stepInput, 10);

            // Wywołujemy wspólną funkcję re-numerującą
            await wykonajPrzenumerowanieLinii(editor, startValue, stepValue);

        } else if (wybor.label.startsWith('2')) {
            // OPCJA 2: Odwrócenie kolejności linii i wklejenie poniżej
            if (!selectedText) {
                vscode.window.showWarningMessage('Ta opcja wymaga zaznaczenia tekstu w edytorze!');
                return;
            }
            
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
            // OPCJA 3: Przenumerowanie etykiet
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

    // 2. REJESTRACJA NOWEJ KOMENDY (SZYBKA BEZ PYTAŃ - DEFAULTY 5, 5)
    let disposableSzybkieLinii = vscode.commands.registerCommand('sinumerik-840d-edycja.szybkieNumerowanieLinii', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Brak aktywnego edytora tekstu!');
            return;
        }

        // Natychmiastowe wywołanie z wartościami startowymi: 5 i krokiem: 5
        await wykonajPrzenumerowanieLinii(editor, 5, 5);
    });

    context.subscriptions.push(disposableUruchom);
    context.subscriptions.push(disposableSzybkieLinii);
}

/**
 * Wspólna funkcja pomocnicza realizująca fizyczne przenumerowanie linii w dokumencie.
 * @param {vscode.TextEditor} editor Aktywny edytor tekstu
 * @param {number} startValue Wartość startowa
 * @param {number} stepValue Krok numeracji
 */
async function wykonajPrzenumerowanieLinii(editor, startValue, stepValue) {
    const selection = editor.selection;
    const dokument = editor.document;
    const pelnyTekst = dokument.getText();
    const linie = pelnyTekst.split(/\r?\n/);
    
    let aktualnyNumer = startValue;
    
    const hasSelection = !selection.isEmpty;
    let startLineIdx = 0;
    let endLineIdx = linie.length - 1;

    if (hasSelection) {
        startLineIdx = selection.start.line;
        endLineIdx = selection.end.line;
        
        if (selection.end.character === 0 && endLineIdx > startLineIdx) {
            endLineIdx--;
        }
    }
    
    const przetworzoneLinie = linie.map((linia, index) => {
        if (index >= startLineIdx && index <= endLineIdx) {
            const regexPoczatkuLinii = /^(\s*)([N:])(\d+)/;
            const dopasowanie = linia.match(regexPoczatkuLinii);

            if (dopasowanie) {
                const bialeZnaki = dopasowanie[1];
                const znak = dopasowanie[2];
                const resztaLinii = linia.substring(dopasowanie[0].length);
                const nowaLinia = `${bialeZnaki}${znak}${aktualnyNumer}${resztaLinii}`;
                aktualnyNumer += stepValue;
                return nowaLinia;
            }
        }
        return linia;
    });

    const znakKoncaLinii = dokument.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
    const nowyTekstCalosci = przetworzoneLinie.join(znakKoncaLinii);

    const pelnyZakres = new vscode.Range(
        dokument.positionAt(0),
        dokument.positionAt(pelnyTekst.length)
    );

    await editor.edit(editBuilder => {
        editBuilder.replace(pelnyZakres, nowyTekstCalosci);
    });

    const komunikatSukcesu = hasSelection
        ? `Przenumerowano linie w obszarze zaznaczenia (linie od ${startLineIdx + 1} do ${endLineIdx + 1}). Ostatnia wartość: ${aktualnyNumer - stepValue}.`
        : `Przenumerowano linie w całym dokumencie. Ostatnia wartość: ${aktualnyNumer - stepValue}.`;

    vscode.window.showInformationMessage(komunikatSukcesu);
}

// Metoda wywoływana przy dezaktywacji rozszerzenia
function deactivate() {}

module.exports = {
    activate,
    deactivate
};