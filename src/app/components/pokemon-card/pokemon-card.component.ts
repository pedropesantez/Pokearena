import { Component, computed, input } from '@angular/core';
import { Pokemon } from '../../models/pokemon.model';
import { Side } from '../../models/battle.model';
import { typeColor } from '../../utils/type-colors';
import { capitalize } from '../../utils/format';

interface StatView { label: string; value: number; percent: number; }
interface TypeView { name: string; color: string; }

const STAT_LABELS: Record<string, string> = {
  hp: 'HP', attack: 'Ataque', defense: 'Defensa',
  'special-attack': 'At. Esp.', 'special-defense': 'Def. Esp.', speed: 'Velocidad'
};

@Component({
  selector: 'app-pokemon-card',
  templateUrl: './pokemon-card.component.html',
  styleUrl: './pokemon-card.component.css'
})
export class PokemonCardComponent {
  pokemon = input<Pokemon | null>(null);
  currentHp = input(0);
  maxHp = input(1);
  hit = input(false);
  winner = input(false);
  side = input<Side>('left');

  name = computed(() => capitalize(this.pokemon()?.name ?? ''));

  number = computed(() => {
    const id = this.pokemon()?.id;
    return id ? '#' + String(id).padStart(3, '0') : '';
  });

  image = computed(() => {
    const s = this.pokemon()?.sprites;
    return s?.other?.['official-artwork']?.front_default ?? s?.front_default ?? '';
  });

  types = computed<TypeView[]>(() =>
    this.pokemon()?.types.map(t => ({
      name: t.type.name,
      color: typeColor(t.type.name)
    })) ?? []
  );

  stats = computed<StatView[]>(() =>
    (this.pokemon()?.stats ?? []).map(s => ({
      label: STAT_LABELS[s.stat.name] ?? s.stat.name,
      value: s.base_stat,
      percent: Math.min(100, (s.base_stat / 200) * 100)
    }))
  );

  hpPercent = computed(() =>
    Math.max(0, Math.min(100, (this.currentHp() / this.maxHp()) * 100))
  );

  hpLabel = computed(() => `${Math.max(0, Math.round(this.currentHp()))} / ${this.maxHp()}`);

  hpLevel = computed(() => {
    const p = this.hpPercent();
    return p > 50 ? 'high' : p > 20 ? 'mid' : 'low';
  });

  fainted = computed(() => !!this.pokemon() && this.currentHp() <= 0);
}