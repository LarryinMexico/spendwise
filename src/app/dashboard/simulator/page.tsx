import { SimulatorCard } from "@/components/simulator/simulator-card";

export default function SimulatorPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">消費模擬器</h1>
        <p className="text-muted-foreground">
          調整類別支出，預覽對你財務的長期影響
        </p>
      </div>

      <SimulatorCard />
    </div>
  );
}
