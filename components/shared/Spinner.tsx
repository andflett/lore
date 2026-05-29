import { stoneSurface } from "@/lib/surfaces";

// Full-screen centred loading state.
export function Spinner({ label }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3"
      style={stoneSurface("mid")}
    >
      <div
        className="h-6 w-6 animate-spin border-2 border-gold-b2 border-t-gold"
        style={{ borderRadius: 0 }}
        aria-hidden
      />
      {label && (
        <span
          className="font-ui text-[10px] uppercase text-text-t0"
          style={{ letterSpacing: "0.15em" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
