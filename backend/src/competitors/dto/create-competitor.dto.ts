import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreateCompetitorDto {
  @IsNotEmpty()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: true }, {
    message: 'Competitor URL must be a valid public HTTP or HTTPS address with a valid domain name.',
  })
  url: string;
}
