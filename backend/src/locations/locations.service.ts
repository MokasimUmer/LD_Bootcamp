import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const AFRICAN_LOCATIONS_DATA: { [country: string]: string[] } = {
  Algeria: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida'],
  Angola: ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Cabinda'],
  Benin: ['Porto-Novo', 'Cotonou', 'Parakou', 'Djougou', 'Bohicon'],
  Botswana: ['Gaborone', 'Francistown', 'Molepolole', 'Maun', 'Serowe'],
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora'],
  Burundi: ['Gitega', 'Bujumbura', 'Ngozi', 'Rumonge', 'Kayanza'],
  'Cabo Verde': ['Praia', 'Mindelo', 'Santa Maria', 'Assomada', 'São Filipe'],
  Cameroon: ['Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Maroua'],
  'Central African Republic': ['Bangui', 'Bimbo', 'Berbérati', 'Carnot', 'Bambari'],
  Chad: ["N'Djamena", 'Moundou', 'Sarh', 'Abéché', 'Kélo'],
  Comoros: ['Moroni', 'Mutsamudu', 'Fomboni', 'Domoni'],
  Congo: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi'],
  'Congo (DRC)': ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani', 'Goma'],
  "Cote d'Ivoire": ['Yamoussoukro', 'Abidjan', 'Bouaké', 'Daloa', 'San-Pédro'],
  Djibouti: ['Djibouti', 'Ali Sabieh', 'Tadjoura', 'Obock', 'Dikhil'],
  Egypt: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor'],
  'Equatorial Guinea': ['Malabo', 'Bata', 'Ciudad de la Paz', 'Ebebiyín'],
  Eritrea: ['Asmara', 'Keren', 'Massawa', 'Assab', 'Mendefera'],
  Eswatini: ['Mbabane', 'Lobamba', 'Manzini', 'Big Bend'],
  Ethiopia: ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Hawassa', 'Bahir Dar'],
  Gabon: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem'],
  Gambia: ['Banjul', 'Serekunda', 'Brikama', 'Bakau'],
  Ghana: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Cape Coast'],
  Guinea: ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé'],
  'Guinea-Bissau': ['Bissau', 'Bafatá', 'Gabú', 'Bissora'],
  Kenya: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Malindi'],
  Lesotho: ['Maseru', 'Teyateyaneng', 'Mafeteng', 'Hlotse'],
  Liberia: ['Monrovia', 'Gbarnga', 'Kakata', 'Bensonville', 'Harper'],
  Libya: ['Tripoli', 'Benghazi', 'Misrata', 'Bayda', 'Zawiya'],
  Madagascar: ['Antananarivo', 'Toamasina', 'Antsirabe', 'Mahajanga', 'Fianarantsoa'],
  Malawi: ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba'],
  Mali: ['Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Gao', 'Timbuktu'],
  Mauritania: ['Nouakchott', 'Nouadhibou', 'Kiffa', 'Rosso'],
  Mauritius: ['Port Louis', 'Vacoas-Phoenix', 'Beau Bassin-Rose Hill', 'Curepipe'],
  Morocco: ['Rabat', 'Casablanca', 'Marrakesh', 'Fes', 'Tangier', 'Agadir'],
  Mozambique: ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio'],
  Namibia: ['Windhoek', 'Walvis Bay', 'Swakopmund', 'Rundu', 'Oshakati'],
  Niger: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua'],
  Nigeria: ['Abuja', 'Lagos', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Enugu'],
  Rwanda: ['Kigali', 'Butare', 'Gisenyi', 'Ruhengeri', 'Gitarama'],
  'Sao Tome and Principe': ['São Tomé', 'Trindade', 'Neves', 'Santo António'],
  Senegal: ['Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis'],
  Seychelles: ['Victoria', 'Anse Boileau', 'Beau Vallon'],
  'Sierra Leone': ['Freetown', 'Bo', 'Kenema', 'Makeni'],
  Somalia: ['Mogadishu', 'Hargeisa', 'Bosaso', 'Kismayo', 'Merca'],
  'South Africa': ['Pretoria', 'Cape Town', 'Johannesburg', 'Durban', 'Gqeberha', 'Bloemfontein'],
  'South Sudan': ['Juba', 'Wau', 'Malakal', 'Yei', 'Yambio'],
  Sudan: ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'Nyala'],
  Tanzania: ['Dodoma', 'Dar es Salaam', 'Mwanza', 'Arusha', 'Zanzibar City'],
  Togo: ['Lomé', 'Sokodé', 'Kara', 'Atakpamé'],
  Tunisia: ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan'],
  Uganda: ['Kampala', 'Nansana', 'Kira', 'Mbarara', 'Jinja', 'Gulu'],
  Zambia: ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola'],
  Zimbabwe: ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru'],
};

const COUNTRY_CODES: { [country: string]: string } = {
  Algeria: 'DZ', Angola: 'AO', Benin: 'BJ', Botswana: 'BW', 'Burkina Faso': 'BF',
  Burundi: 'BI', 'Cabo Verde': 'CV', Cameroon: 'CM', 'Central African Republic': 'CF',
  Chad: 'TD', Comoros: 'KM', Congo: 'CG', 'Congo (DRC)': 'CD', "Cote d'Ivoire": 'CI',
  Djibouti: 'DJ', Egypt: 'EG', 'Equatorial Guinea': 'GQ', Eritrea: 'ER', Eswatini: 'SZ',
  Ethiopia: 'ET', Gabon: 'GA', Gambia: 'GM', Ghana: 'GH', Guinea: 'GN',
  'Guinea-Bissau': 'GW', Kenya: 'KE', Lesotho: 'LS', Liberia: 'LR', Libya: 'LY',
  Madagascar: 'MG', Malawi: 'MW', Mali: 'ML', Mauritania: 'MR', Mauritius: 'MU',
  Morocco: 'MA', Mozambique: 'MZ', Namibia: 'NA', Niger: 'NE', Nigeria: 'NG',
  Rwanda: 'RW', 'Sao Tome and Principe': 'ST', Senegal: 'SN', Seychelles: 'SC',
  'Sierra Leone': 'SL', Somalia: 'SO', 'South Africa': 'ZA', 'South Sudan': 'SS',
  Sudan: 'SD', Tanzania: 'TZ', Togo: 'TG', Tunisia: 'TN', Uganda: 'UG',
  Zambia: 'ZM', Zimbabwe: 'ZW',
};

@Injectable()
export class LocationsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.seedAllAfricanLocations().catch((err) => {
      console.warn(`Location background seeding notice: ${err.message}`);
    });
  }

  async seedAllAfricanLocations() {
    for (const [countryName, cityList] of Object.entries(AFRICAN_LOCATIONS_DATA)) {
      const code = COUNTRY_CODES[countryName] || countryName.substring(0, 2).toUpperCase();

      const country = await this.prisma.country.upsert({
        where: { code },
        update: { name: countryName },
        create: {
          name: countryName,
          code,
        },
      });

      for (const cityName of cityList) {
        await this.prisma.city.upsert({
          where: {
            name_countryId: {
              name: cityName,
              countryId: country.id,
            },
          },
          update: {},
          create: {
            name: cityName,
            countryId: country.id,
          },
        });
      }
    }
  }

  async getAllCountries() {
    try {
      const countries = await this.prisma.country.findMany({
        include: {
          cities: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
      return countries;
    } catch (e) {
      console.error('Error fetching countries:', e);
      return [];
    }
  }

  async getCitiesByCountry(countryId: string) {
    try {
      return await this.prisma.city.findMany({
        where: { countryId },
        orderBy: { name: 'asc' },
      });
    } catch (e) {
      return [];
    }
  }
}
