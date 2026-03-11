export interface TimerProps {
  elapsed: number; // seconds
  paused: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function Timer({ elapsed, paused }: TimerProps) {
  return (
    <span className="badge badge-lg">
      {formatTime(elapsed)}
      {paused && <span className="ml-1">⏸</span>}
    </span>
  );
}
