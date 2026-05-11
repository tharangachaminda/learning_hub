import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { App } from './app';
import { appRoutes } from './app.routes';
import { CelebrationModalComponent } from './features/achievements/components/celebration-modal/celebration-modal.component';
import { authInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes),
    CelebrationModalComponent, // Standalone component
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
