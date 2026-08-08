import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SubCategoriesService } from './subcategories.service';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { FindSubCategoriesDto } from './dto/find-subcategories.dto';
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubCategoryDocument } from './schemas/subcategory.schema';

/**
 * REST API controller for sub-category taxonomy management.
 * All endpoints require an authenticated Admin or Teacher.
 *
 * @example
 * ```
 * GET    /api/subcategories?category=number-operations&difficulty=medium
 * POST   /api/subcategories  { category, difficulty, name, description }
 * PATCH  /api/subcategories/:id  { description }
 * DELETE /api/subcategories/:id
 * ```
 */
@Controller('subcategories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'teacher')
export class SubCategoriesController {
  constructor(private readonly subCategoriesService: SubCategoriesService) {}

  @Get()
  async list(
    @Query() dto: FindSubCategoriesDto
  ): Promise<SubCategoryDocument[]> {
    return this.subCategoriesService.list(dto.category, dto.difficulty);
  }

  @Post()
  async create(
    @Body() dto: CreateSubCategoryDto,
    @Request() req: { user?: { email?: string; userId?: string } }
  ): Promise<SubCategoryDocument> {
    const createdBy = req.user?.email || req.user?.userId || 'unknown';
    return this.subCategoriesService.create(dto, createdBy);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubCategoryDto
  ): Promise<SubCategoryDocument> {
    return this.subCategoriesService.update(id, dto.description);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ deleted: boolean }> {
    await this.subCategoriesService.delete(id);
    return { deleted: true };
  }
}
