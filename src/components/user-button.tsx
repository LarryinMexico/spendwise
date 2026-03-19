import { UserButton } from "@clerk/nextjs";

export function UserButtonComponent() {
  return (
    <div className="flex items-center gap-2">
      <UserButton />
    </div>
  );
}
