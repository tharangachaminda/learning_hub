import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OllamaService } from './ollama.service';
import { VisualAssetRegistryService } from './visual-asset-registry.service';

/**
 * AI module providing LLM integration services for question generation.
 * Configures Ollama service with HTTP client and configuration dependencies.
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30 second timeout for AI operations
      maxRedirects: 0,
    }),
    ConfigModule,
  ],
  providers: [OllamaService, VisualAssetRegistryService],
  exports: [OllamaService, VisualAssetRegistryService],
})
export class AiModule {}
