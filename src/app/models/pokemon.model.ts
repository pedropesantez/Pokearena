export interface PokemonStat {
  base_stat: number;
  stat: { name: string };
}

export interface PokemonTypeSlot {
  slot: number;
  type: { name: string; url: string };
}

export interface PokemonMoveSlot {
  move: { name: string; url: string };
}

export interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: { front_default: string | null };
    };
  };
  stats: PokemonStat[];
  types: PokemonTypeSlot[];
  moves: PokemonMoveSlot[];
}