import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discount, DiscountDocument } from './schemas/discount.schema';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  ValidateDiscountDto,
  DiscountResponseDto,
  ValidateDiscountResponseDto,
} from './dto/discount.dto';

@Injectable()
export class DiscountsService {
  private readonly logger = new Logger(DiscountsService.name);

  constructor(
    @InjectModel(Discount.name)
    private discountModel: Model<DiscountDocument>,
  ) {}

  /**
   * Create a new discount code
   */
  async create(createDto: CreateDiscountDto): Promise<DiscountResponseDto> {
    try {
      // Normalize code to uppercase
      const code = createDto.code.toUpperCase().trim();

      // Check if code already exists
      const existing = await this.discountModel.findOne({ code }).exec();
      if (existing) {
        throw new BadRequestException(`Discount code "${code}" already exists`);
      }

      const discount = new this.discountModel({
        ...createDto,
        code,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : undefined,
      });

      await discount.save();
      this.logger.log(`Created discount code: ${code}`);

      return this.mapToDto(discount);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create discount: ${error.message}`);
      throw new BadRequestException(`Failed to create discount: ${error.message}`);
    }
  }

  /**
   * Get all discounts
   */
  async findAll(activeOnly = false): Promise<DiscountResponseDto[]> {
    try {
      const query = activeOnly ? { active: true } : {};
      const discounts = await this.discountModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec();

      return discounts.map((d) => this.mapToDto(d));
    } catch (error) {
      this.logger.error(`Failed to fetch discounts: ${error.message}`);
      throw new BadRequestException(`Failed to fetch discounts: ${error.message}`);
    }
  }

  /**
   * Get a single discount by ID
   */
  async findOne(id: string): Promise<DiscountResponseDto> {
    try {
      const discount = await this.discountModel.findById(id).exec();
      if (!discount) {
        throw new NotFoundException(`Discount not found: ${id}`);
      }
      return this.mapToDto(discount);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch discount: ${error.message}`);
      throw new BadRequestException(`Failed to fetch discount: ${error.message}`);
    }
  }

  /**
   * Update a discount
   */
  async update(id: string, updateDto: UpdateDiscountDto): Promise<DiscountResponseDto> {
    try {
      const updateData: any = { ...updateDto };
      if (updateDto.expiresAt) {
        updateData.expiresAt = new Date(updateDto.expiresAt);
      }

      const discount = await this.discountModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      if (!discount) {
        throw new NotFoundException(`Discount not found: ${id}`);
      }

      this.logger.log(`Updated discount: ${discount.code}`);
      return this.mapToDto(discount);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update discount: ${error.message}`);
      throw new BadRequestException(`Failed to update discount: ${error.message}`);
    }
  }

  /**
   * Delete a discount
   */
  async remove(id: string): Promise<void> {
    try {
      const result = await this.discountModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Discount not found: ${id}`);
      }
      this.logger.log(`Deleted discount: ${result.code}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete discount: ${error.message}`);
      throw new BadRequestException(`Failed to delete discount: ${error.message}`);
    }
  }

  /**
   * Validate a discount code for checkout
   */
  async validate(validateDto: ValidateDiscountDto): Promise<ValidateDiscountResponseDto> {
    try {
      const code = validateDto.code.toUpperCase().trim();
      const discount = await this.discountModel.findOne({ code }).exec();

      // Check if discount exists
      if (!discount) {
        return {
          valid: false,
          error: 'Invalid discount code',
        };
      }

      // Check if active
      if (!discount.active) {
        return {
          valid: false,
          error: 'This discount code is no longer active',
        };
      }

      // Check expiration
      if (discount.expiresAt && new Date() > discount.expiresAt) {
        return {
          valid: false,
          error: 'This discount code has expired',
        };
      }

      // Check usage limit
      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        return {
          valid: false,
          error: 'This discount code has reached its usage limit',
        };
      }

      // Check minimum order amount
      if (validateDto.subtotal < discount.minOrderAmount) {
        return {
          valid: false,
          error: `Minimum order amount of $${discount.minOrderAmount.toFixed(2)} required`,
        };
      }

      // Calculate discount amount
      let discountAmount: number;
      if (discount.type === 'percentage') {
        discountAmount = (validateDto.subtotal * discount.value) / 100;
      } else {
        discountAmount = Math.min(discount.value, validateDto.subtotal);
      }

      return {
        valid: true,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discountAmount: Math.round(discountAmount * 100) / 100,
        description: discount.description,
      };
    } catch (error) {
      this.logger.error(`Failed to validate discount: ${error.message}`);
      return {
        valid: false,
        error: 'Failed to validate discount code',
      };
    }
  }

  /**
   * Increment usage count when discount is used
   */
  async incrementUsage(code: string): Promise<void> {
    try {
      const normalizedCode = code.toUpperCase().trim();
      await this.discountModel
        .findOneAndUpdate(
          { code: normalizedCode },
          { $inc: { usedCount: 1 } },
        )
        .exec();
      this.logger.log(`Incremented usage for discount: ${normalizedCode}`);
    } catch (error) {
      this.logger.error(`Failed to increment discount usage: ${error.message}`);
      // Don't throw - this shouldn't fail the order
    }
  }

  /**
   * Map document to DTO
   */
  private mapToDto(discount: DiscountDocument): DiscountResponseDto {
    return {
      id: (discount._id as any).toString(),
      code: discount.code,
      type: discount.type,
      value: discount.value,
      description: discount.description,
      minOrderAmount: discount.minOrderAmount,
      maxUses: discount.maxUses,
      usedCount: discount.usedCount,
      expiresAt: discount.expiresAt,
      active: discount.active,
      createdAt: (discount as any).createdAt,
      updatedAt: (discount as any).updatedAt,
    };
  }
}

