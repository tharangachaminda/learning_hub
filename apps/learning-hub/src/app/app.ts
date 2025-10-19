import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MathQuestionsComponent } from './components/math-questions/math-questions.component';

@Component({
  imports: [RouterModule, HttpClientModule, MathQuestionsComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'learning-hub';
}
