import { useState, useEffect, useCallback } from "react";
import type { Digit, Pos, GameSession } from "./types";
import { Difficulty } from "./types";
import { isGivenCell, clearCell } from "./engine/board-manager";
import { canUndo, canRedo, pushMove } from "./engine/history-manager";
import {
  newGame,
  makeMove,
  undoMove,
  redoMove,
  requestHint,
  togglePencilMark,
  checkCompletion,
} from "./engine/game-controller";
import { SudokuBoard } from "./components/SudokuBoard";
import { DigitPad } from "./components/DigitPad";
import { GameControls } from "./components/GameControls";
import { DifficultySelector } from "./components/DifficultySelector";
import { Timer } from "./components/Timer";
import { CompletionModal } from "./components/CompletionModal";

function App() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [selectedPos, setSelectedPos] = useState<Pos | null>(null);
  const [conflicts, setConflicts] = useState<[number, number][]>([]);
  const [pencilMode, setPencilMode] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [givenWarning, setGivenWarning] = useState(false);
  const [noHintWarning, setNoHintWarning] = useState(false);

  // Timer interval: ticks every second when playing and not paused
  useEffect(() => {
    if (!session || paused || completed) return;
    const id = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [session, paused, completed]);

  // Auto-dismiss given cell warning after 2 seconds
  useEffect(() => {
    if (!givenWarning) return;
    const id = setTimeout(() => setGivenWarning(false), 2000);
    return () => clearTimeout(id);
  }, [givenWarning]);

  // Auto-dismiss no hint warning after 2 seconds
  useEffect(() => {
    if (!noHintWarning) return;
    const id = setTimeout(() => setNoHintWarning(false), 2000);
    return () => clearTimeout(id);
  }, [noHintWarning]);

  const handleNewGame = useCallback((difficulty: Difficulty) => {
    const gameSession = newGame(difficulty);
    setSession(gameSession);
    setSelectedPos(null);
    setConflicts([]);
    setPencilMode(false);
    setPaused(false);
    setElapsed(0);
    setCompleted(false);
    setGivenWarning(false);
    setNoHintWarning(false);
  }, []);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!session || paused || completed) return;
      setSelectedPos({ row, col });
    },
    [session, paused, completed]
  );

  const handleDigit = useCallback(
    (digit: Digit) => {
      if (!session || !selectedPos || paused || completed) return;

      // Check if it's a given cell
      if (isGivenCell(session.current, selectedPos.row, selectedPos.col)) {
        setGivenWarning(true);
        return;
      }

      if (pencilMode) {
        const updated = togglePencilMark(
          session,
          selectedPos.row,
          selectedPos.col,
          digit
        );
        setSession(updated);
        return;
      }

      const { session: updated, validation } = makeMove(
        session,
        selectedPos.row,
        selectedPos.col,
        digit
      );
      setSession(updated);

      if (validation.kind === "conflict") {
        setConflicts(validation.conflicts);
      } else {
        setConflicts([]);
      }

      // Check for completion
      if (checkCompletion(updated)) {
        setCompleted(true);
      }
    },
    [session, selectedPos, paused, completed, pencilMode]
  );

  const handleClear = useCallback(() => {
    if (!session || !selectedPos || paused || completed) return;

    if (isGivenCell(session.current, selectedPos.row, selectedPos.col)) {
      setGivenWarning(true);
      return;
    }

    const cell = session.current[selectedPos.row][selectedPos.col];
    if (cell.value !== null) {
      const newBoard = clearCell(
        session.current,
        selectedPos.row,
        selectedPos.col
      );
      const newHistory = pushMove(session.history, {
        row: selectedPos.row,
        col: selectedPos.col,
        oldValue: cell.value,
        newValue: null,
        oldPencilMarks: new Set(cell.pencilMarks),
        newPencilMarks: new Set(),
      });
      setSession({ ...session, current: newBoard, history: newHistory });
      setConflicts([]);
    }
  }, [session, selectedPos, paused, completed]);

  const handleUndo = useCallback(() => {
    if (!session || paused || completed) return;
    const updated = undoMove(session);
    setSession(updated);
    setConflicts([]);
  }, [session, paused, completed]);

  const handleRedo = useCallback(() => {
    if (!session || paused || completed) return;
    const updated = redoMove(session);
    setSession(updated);
    setConflicts([]);
  }, [session, paused, completed]);

  const handleHint = useCallback(() => {
    if (!session || paused || completed) return;
    const { session: updated, hint } = requestHint(session);
    if (!hint) {
      setNoHintWarning(true);
      return;
    }
    setSession(updated);
    setSelectedPos({ row: hint.row, col: hint.col });
    setConflicts([]);

    if (checkCompletion(updated)) {
      setCompleted(true);
    }
  }, [session, paused, completed]);

  const handlePause = useCallback(() => {
    if (!session || completed) return;
    setPaused((prev) => !prev);
  }, [session, completed]);

  const handleBackToMenu = useCallback(() => {
    setSession(null);
    setSelectedPos(null);
    setConflicts([]);
    setPencilMode(false);
    setPaused(false);
    setElapsed(0);
    setCompleted(false);
  }, []);

  // Menu screen
  if (!session) {
    return (
      <div className="min-h-screen bg-base-200" data-theme="light">
        <div className="container mx-auto p-4">
          <div className="card bg-base-100 shadow-xl max-w-md mx-auto">
            <div className="card-body items-center text-center">
              <h1 className="card-title text-3xl">Sudoku Game</h1>
              <p className="text-base-content/70 mb-4">
                Select a difficulty to start a new game
              </p>
              <DifficultySelector onSelect={handleNewGame} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing / Completed screen
  return (
    <div className="min-h-screen bg-base-200" data-theme="light">
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Sudoku</h1>
            <Timer elapsed={elapsed} paused={paused} />
          </div>

          {/* Warning alerts */}
          {givenWarning && (
            <div className="alert alert-warning max-w-md" role="alert">
              <span>This cell is locked and cannot be modified.</span>
            </div>
          )}
          {noHintWarning && (
            <div className="alert alert-warning max-w-md" role="alert">
              <span>No hint available.</span>
            </div>
          )}

          {paused ? (
            <div className="card bg-base-100 shadow-xl max-w-md w-full">
              <div className="card-body items-center text-center">
                <h2 className="card-title">Game Paused</h2>
                <button className="btn btn-primary" onClick={handlePause}>
                  Resume
                </button>
              </div>
            </div>
          ) : (
            <SudokuBoard
              board={session.current}
              selectedPos={selectedPos}
              conflicts={conflicts}
              onCellClick={handleCellClick}
            />
          )}

          {!paused && (
            <DigitPad
              onDigit={handleDigit}
              onClear={handleClear}
              onPencilToggle={() => setPencilMode((prev) => !prev)}
              pencilMode={pencilMode}
            />
          )}

          <GameControls
            onUndo={handleUndo}
            onRedo={handleRedo}
            onHint={handleHint}
            onNewGame={handleBackToMenu}
            onPause={handlePause}
            canUndo={canUndo(session.history)}
            canRedo={canRedo(session.history)}
          />
        </div>
      </div>

      <CompletionModal
        open={completed}
        elapsed={elapsed}
        hintsUsed={session.hintsUsed}
        onNewGame={handleBackToMenu}
      />
    </div>
  );
}

export default App;
