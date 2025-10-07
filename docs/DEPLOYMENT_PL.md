# HelloCeloToken - Instrukcja Wdrożenia

## Wymagania

- MetaMask z wybraną siecią: **Celo Mainnet**
  - RPC: https://forno.celo.org
  - ChainID: 42220
- CELO na opłaty transakcyjne (gas)
- Remix IDE: https://remix.ethereum.org

---

## Wdrożenie kontraktu

1. W Remix utwórz plik `contracts/HelloCelo.sol`.
2. Wklej do niego kod smart kontraktu.
3. Skompiluj kontrakt używając Solidity `0.8.20`.
4. Wdróż kontrakt:
   - Środowisko: **Injected Provider - MetaMask**
   - Parametry konstruktora: brak
   - Potwierdź transakcję w MetaMask.
5. Po wdrożeniu zanotuj adres kontraktu.

**Adres wdrożonego kontraktu na Mainnet:**  
`0x12b6e1f30cb714e8129F6101a7825a910a9982F2`

---

## Weryfikacja po wdrożeniu

- Upewnij się, że kontrakt został pomyślnie wdrożony na Celo Mainnet.
- Sprawdź kontrakt na [Celo Blockscout](https://celo.blockscout.com/address/0x12b6e1f30cb714e8129F6101a7825a910a9982F2).

---

## Uwagi bezpieczeństwa

- Parametry tokena (`REWARD_PER_MESSAGE`, `MAX_SUPPLY`) są niezmienne.
- Limit nagród: 10 dziennie na jedno konto.
- Właściciel może wstrzymywać/wznawiać działanie kontraktu.
- Nagrody mogą otrzymywać tylko konta EOA (ochrona przed botami).

---

## Testowanie funkcji

- `sendMessage("Hello Celo!")` → wysyła wiadomość i otrzymuje 1 HC.
- `balanceOf(address)` → sprawdza saldo tokenów.
- `remainingRewards(address)` → pozostałe nagrody do wykorzystania w bieżącym dniu (maks. 10).
- `getMessageCount()` → liczba wysłanych wiadomości.
- `getAllMessages()` → lista wszystkich wiadomości.
