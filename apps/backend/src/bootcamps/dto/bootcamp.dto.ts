import { IsString, IsNotEmpty, IsInt, Min, IsDateString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { BootcampStatus } from '@prisma/client';

export class CreateBootcampDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  cityId: string;

  @IsString()
  @IsOptional()
  cityName?: string;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsInt()
  @Min(1)
  maxSeats: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @IsOptional()
  curriculum?: any[];
}

export class UpdateBootcampDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxSeats?: number;

  @IsEnum(BootcampStatus)
  @IsOptional()
  status?: BootcampStatus;

  @IsArray()
  @IsOptional()
  curriculum?: any[];
}
