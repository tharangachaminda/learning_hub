import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SubCategoriesService } from './subcategories.service';
import { SubCategory } from './schemas/subcategory.schema';
import { Question } from '../questions/schemas/question.schema';

describe('SubCategoriesService', () => {
  let service: SubCategoriesService;
  let subCategoryModel: {
    create: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };
  let questionModel: { exists: jest.Mock };

  const mockSort = jest.fn();
  const mockSubCategory = {
    _id: 'sc-001',
    category: 'number-operations',
    difficulty: 'medium',
    name: 'Skip Counting',
    slug: 'skip-counting',
    createdBy: 'teacher@example.com',
  };

  beforeEach(async () => {
    subCategoryModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: mockSort.mockReturnValue({ exec: jest.fn() }),
      }),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
    };
    questionModel = {
      exists: jest.fn().mockReturnValue({ exec: jest.fn() }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubCategoriesService,
        { provide: getModelToken(SubCategory.name), useValue: subCategoryModel },
        { provide: getModelToken(Question.name), useValue: questionModel },
      ],
    }).compile();

    service = module.get<SubCategoriesService>(SubCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a sub-category with a derived slug', async () => {
      subCategoryModel.create.mockResolvedValue(mockSubCategory);

      const result = await service.create(
        {
          category: 'number-operations',
          difficulty: 'medium',
          name: 'Skip Counting',
        },
        'teacher@example.com'
      );

      expect(subCategoryModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'number-operations',
          difficulty: 'medium',
          name: 'Skip Counting',
          slug: 'skip-counting',
          createdBy: 'teacher@example.com',
        })
      );
      expect(result).toEqual(mockSubCategory);
    });

    it('rejects an unknown category', async () => {
      await expect(
        service.create(
          { category: 'not-a-real-category', difficulty: 'medium', name: 'X' },
          'teacher@example.com'
        )
      ).rejects.toThrow(BadRequestException);
      expect(subCategoryModel.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate sub-category within the same category+difficulty', async () => {
      subCategoryModel.create.mockRejectedValue({ code: 11000 });

      await expect(
        service.create(
          {
            category: 'number-operations',
            difficulty: 'medium',
            name: 'Skip Counting',
          },
          'teacher@example.com'
        )
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('list', () => {
    it('lists sub-categories for a category+difficulty pair', async () => {
      const exec = jest.fn().mockResolvedValue([mockSubCategory]);
      mockSort.mockReturnValue({ exec });

      const result = await service.list('number-operations', 'medium');

      expect(subCategoryModel.find).toHaveBeenCalledWith({
        category: 'number-operations',
        difficulty: 'medium',
      });
      expect(result).toEqual([mockSubCategory]);
    });

    it('returns an empty array when none are defined yet', async () => {
      const exec = jest.fn().mockResolvedValue([]);
      mockSort.mockReturnValue({ exec });

      const result = await service.list('number-operations', 'hard');

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when the sub-category does not exist', async () => {
      subCategoryModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('missing-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('blocks deletion while a question still references the sub-category', async () => {
      subCategoryModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubCategory),
      });
      questionModel.exists.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'q-1' }),
      });

      await expect(service.delete('sc-001')).rejects.toThrow(
        ConflictException
      );
      expect(subCategoryModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('deletes the sub-category once no question references it', async () => {
      subCategoryModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubCategory),
      });
      questionModel.exists.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await service.delete('sc-001');

      expect(subCategoryModel.findByIdAndDelete).toHaveBeenCalledWith(
        'sc-001'
      );
    });
  });
});
