import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, QuestionStats } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  stats: QuestionStats | null = null;
  isLoading = true;
  error: string | null = null;
  userName = '';
  userRole = '';
  isAdmin = false;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userName = user?.name ?? 'Admin';
    this.userRole = user?.role ?? '';
    this.isAdmin = this.authService.isAdmin();

    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    this.authService.getQuestionStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load question statistics.';
        this.isLoading = false;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
