export type Side = 'left' | 'right';

export interface LogEntry {
  text: string;
  kind: 'start' | 'hit' | 'super' | 'weak' | 'immune' | 'miss' | 'end';
}

export interface Turn {
  hp1: number;
  hp2: number;
  target: Side | null; 
  entry: LogEntry;
}