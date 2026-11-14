import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pokemon } from '../models/pokemon.model';
import { PokeType } from '../models/type.model';
import { Move } from '../models/move.model';

@Injectable({ providedIn: 'root' })
export class PokeApiService {
  private http = inject(HttpClient);
  private readonly base = 'https://pokeapi.co/api/v2';

  getPokemon(name: string): Observable<Pokemon> {
    return this.http.get<Pokemon>(`${this.base}/pokemon/${name.toLowerCase().trim()}`);
  }

  getType(name: string): Observable<PokeType> {
    return this.http.get<PokeType>(`${this.base}/type/${name}`);
  }

  getMove(name: string): Observable<Move> {
    return this.http.get<Move>(`${this.base}/move/${name}`);
  }
}