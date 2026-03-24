import { SimulatorCard } from "@/components/simulator/simulator-card";

export default function SimulatorPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Spending Simulator</h1>
        <p className="text-muted-foreground">
          Adjust category expense and preview long-term impact on your finances
        </p>
      </div>

      <SimulatorCard />
    </div>
  );
}
