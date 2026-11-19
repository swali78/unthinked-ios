import { Suspense } from "react";
import { AccountScreen } from "@/components/unthinked/account-screen";

export default function Page() {
  return (
    <Suspense>
      <AccountScreen />
    </Suspense>
  );
}
