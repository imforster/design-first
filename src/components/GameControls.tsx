export interface GameControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
  onNewGame: () => void;
  onPause: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function GameControls({
  onUndo,
  onRedo,
  onHint,
  onNewGame,
  onPause,
  canUndo,
  canRedo,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        className="btn btn-sm btn-warning"
        onClick={onUndo}
        disabled={!canUndo}
      >
        Undo
      </button>
      <button
        className="btn btn-sm btn-warning"
        onClick={onRedo}
        disabled={!canRedo}
      >
        Redo
      </button>
      <button className="btn btn-sm btn-info" onClick={onHint}>
        Hint
      </button>
      <button className="btn btn-sm btn-success" onClick={onNewGame}>
        New Game
      </button>
      <button className="btn btn-sm" onClick={onPause}>
        Pause
      </button>
    </div>
  );
}
