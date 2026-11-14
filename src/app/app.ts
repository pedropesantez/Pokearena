import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BattleComponent } from './components/battle/battle.component';


@Component({
  imports: [RouterOutlet, BattleComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('poke-arena');
}
