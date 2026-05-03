import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterOutlet],
  templateUrl: './auth-shell.component.html',
  styleUrl: './auth-shell.component.scss',
})
export class AuthShellComponent {
  protected readonly showHeader$;

  constructor(private readonly router: Router) {
    this.showHeader$ = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => !this.router.url.startsWith('/login'))
    );
  }
}
