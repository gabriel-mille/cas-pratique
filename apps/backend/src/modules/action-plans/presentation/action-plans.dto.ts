import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { DESCRIPTION_MAX_LENGTH, REASON_MAX_LENGTH, TITLE_MAX_LENGTH } from '../../../shared/domain/text';
import { ActionStatus } from '../domain/action-status';

// Format seulement (types, valeurs permises) ; obligations et longueurs sont vérifiées par le domaine (D11).
const STATUSES = Object.values(ActionStatus);

/** Corps commun d'un plan et d'une action : titre obligatoire, description facultative (D6). */
export class TitledRequest {
  @ApiProperty({ maxLength: TITLE_MAX_LENGTH })
  @IsString()
  title!: string;

  @ApiProperty({ maxLength: DESCRIPTION_MAX_LENGTH, required: false, nullable: true, type: String })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class ChangeStatusRequest {
  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  to!: ActionStatus;
}

export class RejectionRequest {
  @ApiProperty({ maxLength: REASON_MAX_LENGTH })
  @IsString()
  reason!: string;
}

export class ActionPlanResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty({ description: 'Aussi rendue dans l’en-tête ETag, à renvoyer en If-Match (D14)' })
  version!: number;
}

export class ActionResponse extends ActionPlanResponse {
  @ApiProperty({ format: 'uuid' })
  planId!: string;

  @ApiProperty({ enum: STATUSES })
  status!: ActionStatus;
}

export class AuthorResponse {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ nullable: true, type: String })
  name!: string | null;
}

export class StatusChangeResponse {
  @ApiProperty({ enum: STATUSES })
  from!: ActionStatus;

  @ApiProperty({ enum: STATUSES })
  to!: ActionStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  at!: Date;

  @ApiProperty({ nullable: true, type: String })
  reason!: string | null;

  @ApiProperty({ type: AuthorResponse })
  author!: AuthorResponse;
}

export class ActionDetailResponse extends ActionResponse {
  @ApiProperty({ type: [StatusChangeResponse] })
  history!: StatusChangeResponse[];
}
