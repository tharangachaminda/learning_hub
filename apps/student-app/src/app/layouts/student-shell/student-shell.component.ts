import { Component } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NgFor } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-shell',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './student-shell.component.html',
  styleUrl: './student-shell.component.scss',
})
export class StudentShellComponent {
  protected readonly navItems = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Practice', route: '/practice/generate' },
    { label: 'Performance', route: '/performance' },
    { label: 'Achievements', route: '/achievements' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
