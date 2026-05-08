import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HomeostasisOrganInteraction } from '../../models/homeostasis';

@Component({
  selector: 'app-homeostasis-3d-map',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="metabolic-map" aria-label="Organlararo metabolik aloqa xaritasi">
      <div class="map-ring ring-one"></div>
      <div class="map-ring ring-two"></div>
      @for (node of nodes; track node.key) {
        <div class="metabolic-node" [style.left.%]="node.x" [style.top.%]="node.y" [ngClass]="node.color">
          <mat-icon>{{ node.icon }}</mat-icon>
          <span>{{ node.label }}</span>
        </div>
      }
      <div class="interaction-panel">
        @for (edge of interactions; track edge.labelUz) {
          <div class="interaction-row">
            <span>{{ edge.labelUz }}</span>
            <b>{{ edge.score }}%</b>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .metabolic-map { min-height: 520px; position: relative; overflow: hidden; border-radius: 2rem; border: 1px solid rgba(125,211,252,.25); background: radial-gradient(circle at 50% 35%, rgba(79,70,229,.24), rgba(15,23,42,.94) 70%); box-shadow: inset 0 0 60px rgba(14,165,233,.12); }
    .map-ring { position: absolute; inset: 0; margin: auto; border: 1px dashed rgba(125,211,252,.34); border-radius: 999px; animation: rotateMap 28s linear infinite; }
    .ring-one { width: 70%; height: 70%; }
    .ring-two { width: 46%; height: 46%; animation-direction: reverse; animation-duration: 18s; }
    .metabolic-node { position: absolute; transform: translate(-50%, -50%); z-index: 3; width: 6.4rem; height: 6.4rem; border-radius: 999px; display: grid; place-items: center; gap: .25rem; text-align: center; color: #0f172a; background: rgba(255,255,255,.92); border: 1px solid rgba(255,255,255,.35); font-size: .72rem; font-weight: 900; box-shadow: 0 20px 40px -25px rgba(125,211,252,.95); animation: floatNode 7s ease-in-out infinite; }
    .node-green { box-shadow: 0 20px 42px -24px rgba(16,185,129,.95); }
    .node-yellow { box-shadow: 0 20px 42px -24px rgba(245,158,11,.95); }
    .node-red { box-shadow: 0 20px 42px -24px rgba(239,68,68,.95); }
    .interaction-panel { position: absolute; left: 1rem; right: 1rem; bottom: 1rem; display: grid; gap: .5rem; z-index: 4; }
    .interaction-row { display: flex; justify-content: space-between; gap: 1rem; padding: .7rem .85rem; border-radius: 1rem; color: white; background: rgba(15,23,42,.66); border: 1px solid rgba(125,211,252,.18); backdrop-filter: blur(10px); font-size: .78rem; font-weight: 800; }
    @keyframes rotateMap { to { transform: rotate(360deg); } }
    @keyframes floatNode { 50% { translate: 0 -10px; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Homeostasis3DMapComponent {
  @Input() interactions: HomeostasisOrganInteraction[] = [];

  readonly nodes = [
    { key: 'brain', label: 'Miya/vegetativ', icon: 'psychology', x: 50, y: 12, color: 'node-yellow' },
    { key: 'heart', label: 'Yurak', icon: 'favorite', x: 26, y: 36, color: 'node-red' },
    { key: 'endocrine', label: 'Endokrin', icon: 'hub', x: 74, y: 36, color: 'node-yellow' },
    { key: 'kidney', label: 'Buyrak', icon: 'water_drop', x: 32, y: 68, color: 'node-green' },
    { key: 'liver', label: 'Jigar', icon: 'biotech', x: 68, y: 68, color: 'node-yellow' }
  ];
}
