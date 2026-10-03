import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreateCompetitorDto {
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  url: string;
}
