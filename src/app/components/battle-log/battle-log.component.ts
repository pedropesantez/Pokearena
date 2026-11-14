import { Component, ElementRef, computed, effect, input, viewChild } from '@angular/core';
import { LogEntry } from '../../models/battle.model';

@Component({
  selector: 'app-battle-log',
  templateUrl: './battle-log.component.html',
  styleUrl: './battle-log.component.css'
})
export class BattleLogComponent {
  entries = input<LogEntry[]>([]);
  hasEntries = computed(() => this.entries().length > 0);
  private box = viewChild<ElementRef<HTMLElement>>('box');

  constructor() {
    // Baja automáticamente al último mensaje
    effect(() => {
      this.entries();
      setTimeout(() => {
        const el = this.box()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }
}