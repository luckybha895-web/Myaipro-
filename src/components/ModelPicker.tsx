import { Check, LockKeyhole } from "lucide-react";
import { BUILD_MODELS, type BuildModelId } from "@/lib/models";

type Props = {
  value: BuildModelId;
  onChange: (value: BuildModelId) => void;
};

export function ModelPicker({ value, onChange }: Props) {
  return (
    <section aria-label="Choose AI model" className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Build model</h2>
        <span className="text-xs text-muted-foreground">Used for this generation</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {BUILD_MODELS.map((model) => {
          const selected = value === model.id;
          return (
            <button
              key={model.id}
              type="button"
              disabled={!model.available}
              onClick={() => onChange(model.id)}
              className={`flex min-h-16 items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-55"
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                {model.available ? (
                  <Check
                    className={`size-4 ${selected ? "text-primary" : "text-muted-foreground"}`}
                  />
                ) : (
                  <LockKeyhole className="size-4 text-muted-foreground" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{model.label}</span>
                <span className="block text-xs text-muted-foreground">{model.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
