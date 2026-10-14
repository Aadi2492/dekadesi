import { IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutItemDto {
  @IsString() @Length(1, 100) variantId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
}

export class ShippingAddressDto {
  @IsString() @Length(1, 100) fullName!: string;
  @IsString() @Length(7, 20) phone!: string;
  @IsString() @Length(1, 200) line1!: string;
  @IsOptional() @IsString() @Length(0, 200) line2?: string;
  @IsString() @Length(1, 80) city!: string;
  @IsString() @Length(1, 80) state!: string;
  @IsString() @Length(6, 10) postalCode!: string;
  @IsOptional() @IsString() @Length(0, 2) country?: string;
}

export class CheckoutDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => CheckoutItemDto) items!: CheckoutItemDto[];
  @ValidateNested() @Type(() => ShippingAddressDto) shippingAddress!: ShippingAddressDto;
  @IsOptional() @IsEmail() customerEmail?: string;
  @IsOptional() @IsString() @Length(0, 500) notes?: string;
  @IsIn(['RAZORPAY', 'COD']) paymentMethod!: 'RAZORPAY' | 'COD';
}

export class VerifyPaymentDto {
  @IsString() razorpay_order_id!: string;
  @IsString() razorpay_payment_id!: string;
  @IsString() razorpay_signature!: string;
}

export class RefundDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) amountPaise?: number;
  @IsOptional() @IsString() @Length(1, 200) reason?: string;
}
