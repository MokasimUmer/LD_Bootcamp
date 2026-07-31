import { Controller, Get, Param } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('api/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('countries')
  async getCountries() {
    return this.locationsService.getAllCountries();
  }

  @Get('countries/:countryId/cities')
  async getCities(@Param('countryId') countryId: string) {
    return this.locationsService.getCitiesByCountry(countryId);
  }
}
