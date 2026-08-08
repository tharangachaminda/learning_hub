import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSubCategoryDto } from './create-subcategory.dto';
import { UpdateSubCategoryDto } from './update-subcategory.dto';

describe('CreateSubCategoryDto validation', () => {
  it('accepts a valid payload', async () => {
    const dto = plainToInstance(CreateSubCategoryDto, {
      category: 'number-operations',
      difficulty: 'medium',
      name: 'Skip Counting',
      description: 'Counting up or down in equal steps, e.g. 2s, 5s, 10s',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a missing description', async () => {
    const dto = plainToInstance(CreateSubCategoryDto, {
      category: 'number-operations',
      difficulty: 'medium',
      name: 'Skip Counting',
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });

  it('rejects an empty-string description', async () => {
    const dto = plainToInstance(CreateSubCategoryDto, {
      category: 'number-operations',
      difficulty: 'medium',
      name: 'Skip Counting',
      description: '',
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });
});

describe('UpdateSubCategoryDto validation', () => {
  it('accepts a valid payload', async () => {
    const dto = plainToInstance(UpdateSubCategoryDto, {
      description: 'Counting up or down in equal steps, e.g. 2s, 5s, 10s',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a missing description', async () => {
    const dto = plainToInstance(UpdateSubCategoryDto, {});

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });

  it('rejects an empty-string description', async () => {
    const dto = plainToInstance(UpdateSubCategoryDto, { description: '' });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });
});
