export interface NamedResource {
  name: string;
  url: string;
}

export interface PokeType {
  name: string;
  damage_relations: {
    double_damage_from: NamedResource[];
    double_damage_to: NamedResource[];
    half_damage_from: NamedResource[];
    half_damage_to: NamedResource[];
    no_damage_from: NamedResource[];
    no_damage_to: NamedResource[];
  };
}