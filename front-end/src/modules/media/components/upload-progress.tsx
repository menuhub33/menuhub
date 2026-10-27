export function UploadProgress({ value }: { value: number }) {
  return (
    <div className="grid gap-1">
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-teal-700 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500">جارٍ الرفع {Math.round(value)}%</p>
    </div>
  );
}
