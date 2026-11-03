# NAVI // PARTITION.SYS 2.0 (Overhaul Edition)
*Cyberpunkowy Symulator Partycjonowania Dysków & Survivalu Domowego w Stylu Pixel-Art*
*Inspirowany klimatem Serial Experiments Lain, Uplink oraz grami typu Tycoon / Life-Sim*

🌐 **Graj online (GitHub Pages)**: [https://nnote1377.github.io/BigEldoSimulator/](https://nnote1377.github.io/BigEldoSimulator/)

---

## 🎮 O Grze
Wcielasz się w samotnego technika i architekta danych, który w swoim małym pokoju buduje coraz bardziej rozbudowaną i potężną stację komputerową **NAVI**. Twoim zadaniem jest zarządzanie fizycznymi nośnikami danych, odpowiednie partycjonowanie, dobór systemów plików i rozmiarów klastrów oraz zasilanie usług sieci **The Wired** i czarnego rynku (DarkNet).

Jednocześnie musisz dbać o swoje mieszkanie i przetrwanie: opłacać czynsz, pilnować poboru prądu, by nie wywaliło bezpieczników, chłodzić pokój i unikać nalotów cyberpolicji!

---

## 🚀 Nowości w Wersji 2.0 (Overhaul)
1. **Rebalans Ekonomii & Nowy Start (150 PLN)**:
   - Zlikwidowano pasywne bogacenie się. Początek jest surowy i wymaga przemyślanych decyzji.
2. **Finanse & Audyt P&L (`app-pnl`)**:
   - Dedykowane okno ze szczegółowym rozbiciem przychodów (usługi, dzierżawy, krypto, złom) i kosztów (prąd, amortyzacja, kary, mandaty).
   - Bilans dzienny dzisiaj oraz wynik wczorajszy.
3. **Kreator Macierzy RAID (`app-raid`)**:
   - Tworzenie programowych macierzy RAID 0 (Striping - 2x wydajność, bonus do koparki), RAID 1 (Mirroring - redundancja i bezpieczeństwo) oraz JBOD (łączenie wolumenów).
4. **Dzierżawa Wolumenów (Leasing SLA) & Kary za Zerwanie**:
   - Po wykonaniu zlecenia partycja zostaje oddana klientowi w dzierżawę generując stały dzienny czynsz.
   - Gracz może w każdej chwili usunąć lub sformatować wynajętą partycję, lecz skutkuje to zerwaniem umowy SLA, natychmiastową karą finansową i spadkiem reputacji.
5. **Dług Bankowy & Komornik**:
   - Gdy koszty lub kary przewyższają stan konta, gracz wpada w dług z dziennym lichwiarskim oprocentowaniem 5%.
   - Gracz ma 5 dni na spłatę długu – po tym czasie komornik wkracza do mieszkania i rekwiruje dyski lub zabezpiecza wszystkie środki.
6. **Data Forensics & Carving (`app-forensics`)**:
   - Tanie dyski ze złomu kryją zapomniane archiwa, klucze i wrażliwe bazy danych. Skanuj surowe klastry i sprzedawaj odzyskane pliki na czarnym rynku.
7. **Nowa Fizyka Ciepła, Pogoda & Klimatyzacja**:
   - Zlikwidowano naiwne chłodzenie oknem: w południe temperatura na zewnątrz sięga 35°C (otwarte okno nagrzewa pokój!).
   - Otwarte okno wpuszcza uliczny kurz i prowokuje skargi sąsiadów na hałas dysków (>28 dB).
   - Dostępny jest klimatyzator (AC 450W), wiatraki przemysłowe oraz sprężone powietrze do czyszczenia kurzu.
8. **Malware & Defender (`app-defender`)**:
   - Hosting nielegalnych danych przyciąga ataki ransomware i cryptojackerów.
   - Sprzętowy firewall NAVI-WALL oraz skaner kwarantanny.
9. **Limit Portów SATA & Karty Rozszerzeń PCIe**:
   - Płyta główna zaczyna z limitem 2 dysków. Aby zbudować farmę dyskową, dokup 2- lub 4-portowe kontrolery PCIe SATA/SAS.

---

## 🕹️ Sterowanie & Interfejs
- **Spacja** lub przycisk **"🖥️ PULPIT NAVI" / "🛏️ POKÓJ"**: Błyskawiczne przełączanie między animowanym pokojem 2D a retro pulpitem Copland OS.
- **Kliknięcie na stanowisko komputerowe w pokoju**: Usiądź przed monitorami.
- **Kliknięcie na skrzynkę bezpieczników**: Reset wyłącznika w przypadku przeciążenia sieci.
- **Kliknięcie na okno**: Otwarcie/zamknięcie okna (uważaj na upały w południe i kurz!).
- **Kliknięcie na klimatyzator**: Włączenie/wyłączenie aktywnego chłodzenia AC.
- **Kliknięcie na materac**: Sen i regeneracja energii.
- **Kliknięcie na lodówkę**: Zamówienie jedzenia i napojów (-25 PLN).
- **Przyciski prędkości (⏸, 1x, 2x, 5x)**: Kontrola tempa symulacji.
- **Przycisk 📺**: Włączanie/wyłączanie retro filtra CRT.
- **Przycisk 🔊**: Wyciszanie/włączanie dźwięków proceduralnych Web Audio.

---

## 💾 Systemy Plików & Klastry
- **MBR vs GPT**: MBR (do 4 partycji, maks 2TB) vs GPT (dowolna ilość, ogromne dyski).
- **FAT16/FAT32**: Lekki narzut, dobry dla P2P.
- **NTFS**: Bezpieczny, kompresja i uprawnienia dla archiwów komercyjnych.
- **EXT4**: Standard uniksowy The Wired, maksymalna wydajność baz danych.
- **ZFS**: Sumy kontrolne i odporność na uszkodzenia.
- **LUKS**: Szyfrowanie wojskowe – chroni przed nalotem cyberpolicji!
- **SWAP**: Pamięć wymiany.
- **Klastry 512B - 64KB**: Dopasowuj wielkość jednostki alokacji do charakteru usługi (małe pliki scrapera vs wielkie bloki wideo/krypto).

---

## 🚀 Jak Uruchomić?
Otwórz `index.html` lub w pełni samowystarczalny plik `game_standalone.html` w dowolnej przeglądarce internetowej.
Możesz również grać bezpośrednio na GitHub Pages: [https://nnote1377.github.io/BigEldoSimulator/](https://nnote1377.github.io/BigEldoSimulator/)
