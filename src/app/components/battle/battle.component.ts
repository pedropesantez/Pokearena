import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, catchError, forkJoin, map, of, take, timer } from 'rxjs';

import { PokeApiService } from '../../services/poke-api';
import { Pokemon } from '../../models/pokemon.model';
import { Move } from '../../models/move.model';
import { NamedResource, PokeType } from '../../models/type.model';
import { LogEntry, Side, Turn } from '../../models/battle.model';
import { capitalize } from '../../utils/format';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card.component';
import { BattleLogComponent } from '../battle-log/battle-log.component';

type Slot = 1 | 2;
interface Message { text: string; kind: '' | 'loading' | 'error' | 'ok'; }
interface Fighter { side: Side; pokemon: Pokemon; types: PokeType[]; moves: Move[]; }
interface BattleData { typesA: PokeType[]; typesB: PokeType[]; movesA: Move[]; movesB: Move[]; }

const FALLBACK_MOVE: Move = { name: 'tackle', power: 40, accuracy: 100, type: { name: 'normal' } };

@Component({
  selector: 'app-battle',
  imports: [FormsModule, PokemonCardComponent, BattleLogComponent],
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.css'
})
export class BattleComponent implements OnDestroy {
  private api = inject(PokeApiService);
  private playback?: Subscription;

  name1 = '';
  name2 = '';

  p1 = signal<Pokemon | null>(null);
  p2 = signal<Pokemon | null>(null);
  hp1 = signal(0);
  hp2 = signal(0);
  max1 = signal(1);
  max2 = signal(1);
  hit1 = signal(false);
  hit2 = signal(false);

  log = signal<LogEntry[]>([]);
  winner = signal<Side | null>(null);
  busy = signal(false);
  message = signal<Message>({ text: '', kind: '' });

  canFight = computed(() => !!this.p1() && !!this.p2() && !this.busy());

  winnerText = computed(() => {
    const w = this.winner();
    const p = w === 'left' ? this.p1() : w === 'right' ? this.p2() : null;
    return p ? `Gana ${capitalize(p.name)}` : '';
  });

  /* ---------- Búsqueda ---------- */

  search(slot: Slot): void {
    const name = (slot === 1 ? this.name1 : this.name2).trim();
    if (!name) {
      this.setMessage('Escribe el nombre de un Pokémon.', 'error');
      return;
    }

    this.softReset();
    this.busy.set(true);
    this.setMessage(`Buscando "${name}"...`, 'loading');

    this.api.getPokemon(name).subscribe({
      next: p => {
        const maxHp = this.stat(p, 'hp') * 3;
        if (slot === 1) {
          this.p1.set(p); this.max1.set(maxHp); this.hp1.set(maxHp);
        } else {
          this.p2.set(p); this.max2.set(maxHp); this.hp2.set(maxHp);
        }
        this.busy.set(false);
        this.setMessage(`${capitalize(p.name)} está listo para combatir.`, 'ok');
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.setMessage(
          e.status === 404
            ? `No existe ningún Pokémon llamado "${name}".`
            : 'No se pudo conectar con PokéAPI. Intenta de nuevo.',
          'error'
        );
      }
    });
  }

  /* ---------- Combate ---------- */

  fight(): void {
    const a = this.p1();
    const b = this.p2();
    if (!a || !b) return;

    this.softReset();
    this.busy.set(true);
    this.setMessage('Preparando el combate...', 'loading');

    forkJoin({
      typesA: this.loadTypes(a),
      typesB: this.loadTypes(b),
      movesA: this.loadMoves(a),
      movesB: this.loadMoves(b)
    }).subscribe({
      next: data => this.play(this.simulate(a, b, data), a, b),
      error: () => {
        this.busy.set(false);
        this.setMessage('Error al cargar los datos del combate.', 'error');
      }
    });
  }

  reset(): void {
    this.softReset();
    this.p1.set(null);
    this.p2.set(null);
    this.name1 = '';
    this.name2 = '';
    this.busy.set(false);
    this.setMessage('', '');
  }

  ngOnDestroy(): void {
    this.playback?.unsubscribe();
  }

  /* ---------- Carga de datos (endpoints /type y /move) ---------- */

  private loadTypes(p: Pokemon): Observable<PokeType[]> {
    return forkJoin(p.types.map(t => this.api.getType(t.type.name)));
  }

  private loadMoves(p: Pokemon): Observable<Move[]> {
    const names = this.shuffle(p.moves.map(m => m.move.name)).slice(0, 8);
    if (names.length === 0) return of([FALLBACK_MOVE]);

    return forkJoin(
      names.map(n => this.api.getMove(n).pipe(catchError(() => of(null))))
    ).pipe(
      map(list => list.filter((m): m is Move => !!m && m.power !== null).slice(0, 4)),
      map(list => (list.length ? list : [FALLBACK_MOVE]))
    );
  }

  /* ---------- Reglas de combate (propias) ---------- */

  private simulate(a: Pokemon, b: Pokemon, d: BattleData): Turn[] {
    const left: Fighter = { side: 'left', pokemon: a, types: d.typesA, moves: d.movesA };
    const right: Fighter = { side: 'right', pokemon: b, types: d.typesB, moves: d.movesB };
    const hp = { left: this.max1(), right: this.max2() };

    // El más rápido ataca primero
    const order = this.stat(a, 'speed') >= this.stat(b, 'speed') ? [left, right] : [right, left];

    const turns: Turn[] = [{
      hp1: hp.left, hp2: hp.right, target: null,
      entry: { kind: 'start', text: `${capitalize(order[0].pokemon.name)} es más rápido y ataca primero.` }
    }];

    let i = 0;
    while (hp.left > 0 && hp.right > 0 && i < 60) {
      const att = order[i % 2];
      const def = order[(i + 1) % 2];
      const { damage, entry } = this.strike(att, def);

      hp[def.side] = Math.max(0, hp[def.side] - damage);
      turns.push({ hp1: hp.left, hp2: hp.right, target: damage > 0 ? def.side : null, entry });
      i++;
    }
    return turns;
  }

  private strike(att: Fighter, def: Fighter): { damage: number; entry: LogEntry } {
    const move = att.moves[Math.floor(Math.random() * att.moves.length)];
    const who = capitalize(att.pokemon.name);
    const target = capitalize(def.pokemon.name);
    const moveName = move.name.replace(/-/g, ' ');

    if (Math.random() * 100 > (move.accuracy ?? 100)) {
      return { damage: 0, entry: { kind: 'miss', text: `${who} usó ${moveName}, pero falló.` } };
    }

    const mult = this.multiplier(move.type.name, def.types);
    if (mult === 0) {
      return { damage: 0, entry: { kind: 'immune', text: `${who} usó ${moveName}, pero no afecta a ${target}.` } };
    }

    const raw = (this.stat(att.pokemon, 'attack') / this.stat(def.pokemon, 'defense')) * (move.power ?? 40) * 0.4 + 2;
    const damage = Math.max(1, Math.round(raw * mult * (0.85 + Math.random() * 0.15)));

    const kind: LogEntry['kind'] = mult > 1 ? 'super' : mult < 1 ? 'weak' : 'hit';
    const note = { super: ' ¡Es muy eficaz!', weak: ' No es muy eficaz...', hit: '' }[kind as 'super' | 'weak' | 'hit'];

    return {
      damage,
      entry: { kind, text: `${who} usó ${moveName} (${move.type.name}) y causó ${damage} de daño.${note}` }
    };
  }

  private multiplier(moveType: string, defenderTypes: PokeType[]): number {
    return defenderTypes.reduce((acc, t) => acc * this.factor(moveType, t), 1);
  }

  private factor(moveType: string, t: PokeType): number {
    const r = t.damage_relations;
    const has = (list: NamedResource[]) => list.some(x => x.name === moveType);
    if (has(r.no_damage_from)) return 0;
    if (has(r.double_damage_from)) return 2;
    if (has(r.half_damage_from)) return 0.5;
    return 1;
  }

  /* ---------- Reproducción animada ---------- */

  private play(turns: Turn[], a: Pokemon, b: Pokemon): void {
    this.setMessage('¡Comienza el combate!', 'ok');

    this.playback = timer(0, 1100).pipe(take(turns.length)).subscribe({
      next: i => this.applyTurn(turns[i]),
      complete: () => this.finish(a, b)
    });
  }

  private applyTurn(t: Turn): void {
    this.hp1.set(t.hp1);
    this.hp2.set(t.hp2);
    this.log.update(l => [...l, t.entry]);

    if (t.target) {
      const flag = t.target === 'left' ? this.hit1 : this.hit2;
      flag.set(true);
      setTimeout(() => flag.set(false), 500);
    }
  }

  private finish(a: Pokemon, b: Pokemon): void {
    const leftWins = this.hp1() / this.max1() >= this.hp2() / this.max2();
    const champion = leftWins ? a : b;

    this.winner.set(leftWins ? 'left' : 'right');
    this.log.update(l => [...l, { kind: 'end', text: `¡${capitalize(champion.name)} gana el combate!` }]);
    this.busy.set(false);
    this.setMessage('Combate terminado. Puedes pelear de nuevo o cambiar de Pokémon.', 'ok');
  }

  /* ---------- Utilidades ---------- */

  private softReset(): void {
    this.playback?.unsubscribe();
    this.hp1.set(this.max1());
    this.hp2.set(this.max2());
    this.hit1.set(false);
    this.hit2.set(false);
    this.log.set([]);
    this.winner.set(null);
  }

  private setMessage(text: string, kind: Message['kind']): void {
    this.message.set({ text, kind });
  }

  private stat(p: Pokemon, name: string): number {
    return p.stats.find(s => s.stat.name === name)?.base_stat ?? 50;
  }

  private shuffle<T>(list: T[]): T[] {
    return [...list].sort(() => Math.random() - 0.5);
  }
}