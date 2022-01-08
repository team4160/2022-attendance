import { Length } from 'class-validator';
import { ObjectId } from 'mongodb';
import { Field, ID, InputType } from 'type-graphql';

@InputType()
export class RegisterAttendanceMemberInput {
  @Field(() => ID)
  organizationId!: ObjectId;

  @Field()
  @Length(1, 255)
  firstName!: string;

  @Field()
  @Length(1, 255)
  lastName!: string;

  @Field(() => [ ID ])
  rolesIds!: ObjectId[];

  @Field(() => [ String ])
  identifications!: string[];
}
