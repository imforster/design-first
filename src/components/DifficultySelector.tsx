import { Difficulty } from "../types";

export interface DifficultySelectorProps {
  onSelect: (difficulty: Difficulty) => void;
}

export function DifficultySelector({ onSelect }: DifficultySelectorProps) {
  return (
    <select
      className="select select-bordered"
      defaultValue=""
      onChange={(e) => onSelect(e.target.value as Difficulty)}
    >
      <option value="" disabled>
        Select Difficulty
      </option>
      <option value={Difficulty.Easy}>Easy</option>
      <option value={Difficulty.Medium}>Medium</option>
      <option value={Difficulty.Hard}>Hard</option>
      <option value={Difficulty.Expert}>Expert</option>
    </select>
  );
}
