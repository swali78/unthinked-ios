import { Suspense } from "react";
import { ProfileScreen } from "@/components/unthinked/profile-screen";

export default function Page() {
  return (
    <Suspense>
      <ProfileScreen />
    </Suspense>
  );
}
