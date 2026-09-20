import { Construction } from "lucide-react";

export default function ComingSoonPage({ title }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gold-50 dark:bg-gold-950/30 border border-gold-200/40 flex items-center justify-center">
        <Construction className="h-8 w-8 text-gold-500" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-navy-900 dark:text-cream-50 font-display">
          {title ?? "Coming Soon"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          This module is under active development and will be available in the next phase.
        </p>
      </div>
    </div>
  );
}
