# HelloCeloToken

HelloCeloToken to innowacyjny projekt na blockchainie **Celo**, łączący **ERC20 token HC** z **tablicą wiadomości (message board)**.  
Użytkownicy mogą publikować wiadomości i otrzymywać **HC tokens** jako nagrodę.

---

## Kluczowe Funkcje

- Token: **HelloCelo (HC)**, standard ERC20  
- Nagroda: **1 HC** za każdą wiadomość  
- Maksymalna podaż: **1,000,000 HC** (niezmienna)  
- Limit dzienny: **10 nagród na dzień na adres**  
- Bezpieczeństwo: anti-spam, anti-bot, niezmienne parametry tokena  
- Transparentność: wszystkie zasady egzekwowane on-chain  

---

## Jak korzystać

1. Wyślij wiadomość: `sendMessage("Twoja wiadomość")`  
2. Sprawdź saldo tokenów: `balanceOf(address)`  
3. Sprawdź pozostałe nagrody na dziś: `remainingRewards(address)`  
4. Sprawdź liczbę wszystkich wiadomości: `getMessageCount()`  
5. Pobierz wszystkie wiadomości (uwaga: może być kosztowne): `getAllMessages()`

---

## Deployment / Adres Kontraktu

Aktualnie wdrożony na **Celo Mainnet**:  

- **Adres kontraktu:** `0x12b6e1f30cb714e8129F6101a7825a910a9982F2`  
- Parametry (niezmienne):
  - `REWARD_PER_MESSAGE = 1 HC`
  - `MAX_SUPPLY = 1,000,000 HC`
  - `MAX_DAILY_REWARDS = 10`

Pełny przewodnik wdrożenia znajduje się w [`deploy-instructions.md`](deploy-instructions.md).

---

## Licencja

MIT License
