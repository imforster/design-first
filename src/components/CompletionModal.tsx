export interface CompletionModalProps {
  open: boolean;
  elapsed: number; // seconds
  hintsUsed: number;
  onNewGame: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function CompletionModal({
  open,
  elapsed,
  hintsUsed,
  onNewGame,
}: CompletionModalProps) {
  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">🎉 Congratulations!</h3>
        <p className="py-4">You completed the puzzle!</p>
        <p>Time: {formatTime(elapsed)}</p>
        <p>Hints used: {hintsUsed}</p>
        <div className="modal-action">
          <button className="btn btn-primary" onClick={onNewGame}>
            New Game
          </button>
        </div>
      </div>
    </dialog>
  );
}
