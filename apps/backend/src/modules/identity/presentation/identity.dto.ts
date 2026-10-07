import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { Role } from '../../../shared/domain/role';
import { NAME_MAX_LENGTH } from '../../../shared/domain/text';
import { EMAIL_MAX_LENGTH } from '../domain/email';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../domain/password-policy';

// Les DTO valident le format (types, valeurs permises) ; longueurs et règles métier sont dans le domaine.
const ROLES = Object.values(Role);

export class RegisterRequest {
  @ApiProperty({ maxLength: NAME_MAX_LENGTH, example: 'Clinique des Lilas' })
  @IsString()
  organizationName!: string;

  @ApiProperty({ maxLength: NAME_MAX_LENGTH, example: 'Alice Martin' })
  @IsString()
  name!: string;

  @ApiProperty({ maxLength: EMAIL_MAX_LENGTH, example: 'alice@lilas.fr' })
  @IsString()
  email!: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  password!: string;
}

export class LoginRequest {
  @ApiProperty({ example: 'alice@lilas.fr' })
  @IsString()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class ChangePasswordRequest {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  newPassword!: string;
}

export class SessionResponse {
  @ApiProperty({ description: 'Vrai avec un mot de passe temporaire : seul son changement est permis (D8)' })
  mustChangePassword!: boolean;
}

export class AddMemberRequest {
  @ApiProperty({ maxLength: EMAIL_MAX_LENGTH })
  @IsString()
  email!: string;

  @ApiProperty({ maxLength: NAME_MAX_LENGTH })
  @IsString()
  name!: string;

  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role!: Role;
}

export class AddedMemberResponse {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ description: 'Affiché une seule fois, à transmettre au membre (D8)' })
  temporaryPassword!: string;
}

export class ChangeRoleRequest {
  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role!: Role;
}

export class MemberResponse {
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ROLES })
  role!: Role;
}

export class CurrentMemberResponse extends MemberResponse {
  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty()
  organizationName!: string;

  @ApiProperty()
  mustChangePassword!: boolean;
}
