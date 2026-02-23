import { CommonBar } from "@/components";
import { Button } from "@/components/ui";

export function DataSection() {
  return (
    <CommonBar className="flex-col items-start justify-center">
      <h2 className="mb-4 text-xl font-medium">Data</h2>
      <div className="space-y-4">
        <div className="flex gap-4">
          <Button variant="secondary">Export data</Button>
          <Button variant="secondary">Import data</Button>
        </div>
      </div>
    </CommonBar>
  );
}
