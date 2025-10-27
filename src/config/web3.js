import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo } from 'wagmi/chains';
import { http } from 'wagmi';

const config = getDefaultConfig({
  appName: 'HUB Portal',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [celo],
  transports: {
    [celo.id]: http(import.meta.env.VITE_CELO_MAINNET_RPC_URL),
  },
  ssr: false,
});

export { config };