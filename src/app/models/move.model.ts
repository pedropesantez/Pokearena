export interface Move {
  name: string;
  power: number | null;
  accuracy: number | null;
  type: { name: string };
}