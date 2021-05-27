import { IsBoolean, IsDefined, IsNumberString, IsString, Length } from 'class-validator';

export class SendVoteRequest {
    @IsDefined()
    @IsNumberString()
    @Length(18, 20)
    bot: string;

    @IsDefined()
    @IsNumberString()
    @Length(18, 20)
    user: string;

    @IsDefined()
    @IsString()
    type: string;

    @IsDefined()
    @IsBoolean()
    isWeekend: boolean;

    @IsString()
    query?: string;
}
