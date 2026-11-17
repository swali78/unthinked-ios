import { Suspense } from "react";
import { WalletScreen } from "@/components/unthinked/wallet-screen";

export default function Page() {
  return (
    <Suspense>
      <WalletScreen />
    </Suspense>
  );
}
