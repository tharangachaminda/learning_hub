import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NgFor } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { StudentProfile } from '../../models/dashboard.model';

@Component({
  selector: 'app-student-shell',
  standalone: true,
  imports: [NgFor, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './student-shell.component.html',
  styleUrl: './student-shell.component.scss',
})
export class StudentShellComponent implements OnInit {
  protected readonly navItems = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Practice', route: '/practice/generate' },
    { label: 'Performance', route: '/performance' },
    { label: 'Achievements', route: '/achievements' },
  ];

  protected studentProfile: StudentProfile | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly dashboardService: DashboardService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const studentId = this.authService.getUserId();

    if (!studentId) {
      return;
    }

    this.dashboardService.getDashboardData(studentId).subscribe({
      next: (dashboardData) => {
        this.studentProfile = dashboardData.student;
      },
      error: () => {
        this.studentProfile = null;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
