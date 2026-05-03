import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface PageHeroAction {
  label: string;
  route: string;
  icon?: IconDefinition;
  iconPosition?: 'start' | 'end';
  variant?: 'primary' | 'secondary' | 'success';
}

export interface PageHeroStat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [RouterLink, FaIconComponent],
  templateUrl: './page-hero.component.html',
  styleUrl: './page-hero.component.scss',
})
export class PageHeroComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
  @Input() titleIcon?: IconDefinition;
  @Input() actions: PageHeroAction[] = [];
  @Input() stats: PageHeroStat[] = [];
  @Input() appearance: 'surface' | 'brand' = 'surface';
}
