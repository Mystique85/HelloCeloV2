# HelloCelo DApp

**HelloCelo** to innowacyjny projekt na blockchainie **Celo**, łączący **token ERC20 (HC)** z prostą **tablicą wiadomości**.  
Użytkownicy mogą wysyłać wiadomości i otrzymywać tokeny **HC** jako nagrodę.

---

## 🌟 Kluczowe Funkcje

- **Token:** HelloCelo (HC), standard ERC20  
- **Symbol:** HC  
- **Miejsca po przecinku:** 18 (`decimals = 18`)  
- **Nagroda za wiadomość:** 1 HC (`REWARD_PER_MESSAGE`)  
- **Maksymalna podaż:** 1,000,000 HC (`MAX_SUPPLY`)  
- **Limit dzienny:** 10 nagród dziennie na adres (`MAX_DAILY_REWARDS`)  
- **Bezpieczeństwo:**  
  - Ochrona przed spamem i botami  
  - Maksymalna długość wiadomości: 280 znaków  
  - Blokada wywołań przez kontrakty (tylko prawdziwe konta mogą wysyłać wiadomości)  
- **Przejrzystość:** wszystkie reguły enforce’owane on-chain  

---

## 🖥️ Jak korzystać z DApp

1. **Otwórz aplikację HelloCelo:**  
   [https://mystique85.github.io/HelloCelo.Project/](https://mystique85.github.io/HelloCelo.Project/)  

2. **Podłącz portfel Celo**  
   - Obsługiwane portfele: MetaMask, Rabby, Celo Extension Wallet  
   - Kliknij przycisk `Connect Wallet` w aplikacji  

3. **Wyślij wiadomość**  
   - Wpisz treść w polu tekstowym i kliknij `Send Message`  
   - Otrzymasz **1 HC** jako nagrodę, jeśli nie przekroczyłeś dziennego limitu  

4. **Sprawdź saldo HC**  
   - Saldo aktualizuje się automatycznie po wysłaniu wiadomości  

5. **Sprawdź pozostałe nagrody dziennie**  
   - Pole `Remaining Daily Rewards` pokazuje, ile nagród możesz jeszcze odebrać dziś  
   - Mechanizm: licznik resetuje się co UTC day  

6. **Przeglądaj wiadomości**  
   - Sekcja `Messages` pokazuje wszystkie wiadomości wysłane w DApp  
   - Wiadomości zawierają **adres nadawcy**, **treść** i **czas wysłania**  

---

### ℹ️ Mechanika tokena HC

- **ERC20 minimalny standard** – transfery, saldo, approve/allowance  
- **Minting:** 1 HC jest automatycznie mintowany do adresu użytkownika po wysłaniu wiadomości  
- **Max supply:** całkowita ilość HC nie może przekroczyć 1 000 000  
- **Limit dzienny:** maksymalnie 10 nagród na adres na każdy dzień UTC  
- **Reset licznika:** o północy UTC licznik dziennych nagród resetuje się  
- **Blokada dla kontraktów:** tylko prawdziwe konta mogą wysyłać wiadomości (zapobiega spamowi)  

---

### Kontrakt na Celo Mainnet

- **Adres kontraktu:** `0x12b6e1f30cb714e8129F6101a7825a910a9982F2`  
- Wszystkie powyższe zasady enforce’owane są on-chain  

---

## 📜 Licencja

Projekt udostępniony na **MIT License**.  

---

## 📖 Przydatne linki

- **Aplikacja DApp:** [https://mystique85.github.io/HelloCelo.Project/](https://mystique85.github.io/HelloCelo.Project/)  
- [Celo Docs](https://docs.celo.org/)  
- [Ethers.js Docs](https://docs.ethers.org/v5/)  
