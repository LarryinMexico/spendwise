import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SignOut() {
  return (
    <SignOutButton>
      <Button variant="ghost">Sign Out</Button>
    </SignOutButton>
  );
}
