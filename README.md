# NAVI // PARTITION.SYS
*Cyberpunkowy Symulator Partycjonowania Dysków & Survivalu Domowego w Stylu Pixel-Art*
*Inspirowany klimatem Serial Experiments Lain, Uplink oraz grami typu Tycoon / Life-Sim*

---

## 🎮 O Grze
Wcielasz się w samotnego technika i architekta danych, który w swoim małym pokoju buduje coraz bardziej rozbudowaną i potężną stację komputerową **NAVI**. Twoim zadaniem jest zarządzanie fizycznymi nośnikami danych, odpowiednie partycjonowanie, dobór systemów plików i rozmiarów klastrów oraz zasilanie usług sieci **The Wired** i czarnego rynku (DarkNet).

Jednocześnie musisz dbać o swoje mieszkanie i przetrwanie: opłacać czynsz, pilnować poboru prądu, by nie wywaliło bezpieczników, chłodzić pokój i unikać nalotów cyberpolicji!

---

## 🕹️ Sterowanie & Interfejs
- **Spacja** lub przycisk **"🖥️ PULPIT NAVI" / "🛏️ POKÓJ"**: Błyskawiczne przełączanie między animowanym pokojem 2D a retro pulpitem Copland OS.
- **Kliknięcie na stanowisko komputerowe w pokoju**: Usiądź przed monitorami.
- **Kliknięcie na skrzynkę bezpieczników**: Reset wyłącznika w przypadku przeciążenia sieci (przekroczenia watów).
- **Kliknięcie na okno**: Otwarcie/zamknięcie okna (wietrzenie i chłodzenie pokoju).
- **Kliknięcie na materac**: Sen i regeneracja energii (przewinięcie czasu).
- **Kliknięcie na lodówkę**: Zamówienie jedzenia i napojów energetycznych (-25 PLN).
- **Przyciski prędkości (⏸, 1x, 2x, 5x)**: Kontrola tempa symulacji.
- **Przycisk 📺**: Włączanie/wyłączanie retro filtra CRT (scanlines, poświata).
- **Przycisk 🔊**: Wyciszanie/włączanie dźwięków.

---

## 💾 Mechaniki Partycjonowania & Nośników
1. **Tablice Partycji**:
   - **MBR (Master Boot Record)**: Maksymalnie 4 partycje podstawowe, dyski do 2 TB (2048 GB).
   - **GPT (GUID Partition Table)**: Dowolna liczba partycji, wsparcie dla ogromnych macierzy.
2. **Systemy Plików**:
   - **FAT16/FAT32**: Klasyczny, mały narzut pamięciowy, lekki dla starych węzłów P2P.
   - **NTFS**: Bezpieczny, kompresja i prawa dostępu, wymagany dla archiwów.
   - **EXT4**: Standard The Wired i systemów linuksowych, wysoka wydajność I/O dla baz danych.
   - **ZFS**: Korporacyjny system z odpornością na korupcję danych i sumami kontrolnymi.
   - **LUKS (Linux Unified Key Setup)**: Szyfrowanie wojskowe – niezbędne do ukrycia nielegalnego hostingu DarkNetu przed nalotem policji!
   - **SWAP**: Pamięć wirtualna odciążająca system.
3. **Rozmiary Klastrów (Allocation Unit Size)**:
   - **512B – 1KB**: Minimalizuje tzw. *slack space* przy milionach malutkich plików (np. boty scrapingowe, logi).
   - **4KB**: Uniwersalny standard dla większości stron i węzłów.
   - **16KB – 64KB**: Maksymalny transfer sekwencyjny dla baz danych wideo, blockchaina i wielkich archiwów.
4. **S.M.A.R.T. i Bad Sectory**:
   - Stare dyski ze złomu i giełdy mogą posiadać uszkodzone sektory (bad sectors).
   - Wykonuj skany powierzchni i remapuj sektory do puli rezerwowej.
   - Przegrzanie pokoju (>45°C) powoduje przyspieszoną degradację głowic dysków!
5. **Panika: Zerowanie /dev/zero**:
   - Gdy policja cybernetyczna zbliża się do poziomu 100%, możesz błyskawicznie wyzerować dysk, niszcząc dowody i unikając więzienia/grzywny.

---

## ⚡ Ekonomia & Dom
- **Pobór mocy (W)**: Każdy dysk, usługa i pompa chłodzenia pobiera prąd. Przekroczenie limitu bezpiecznika (np. 400W przy B16) natychmiast wyłącza prąd w całym mieszkaniu!
- **Klimat & Chłodzenie**: Gorące dyski podgrzewają temperaturę w pokoju. Otwieraj okno lub kupuj wentylatory i zestawy chłodzenia cieczą (zbiornik z błękitnym płynem na podłodze).
- **Zlecenia & Giełda**: Kupuj nośniki IDE, SATA, SCSI, NVMe na Giełdzie Wolumen, przyjmuj kontrakty i wymieniaj WiredCoin (Ⓦ) na PLN w banku.
- **Czynsz**: Pamiętaj, aby co 7 dni opłacić 500 PLN czynszu w oknie Banku!

---

## 🚀 Jak Uruchomić?
Wystarczy otworzyć plik `index.html` w dowolnej nowoczesnej przeglądarce (Chrome, Edge, Firefox, Safari). Nie wymaga instalowania żadnych serwerów ani zewnętrznych zależności.
