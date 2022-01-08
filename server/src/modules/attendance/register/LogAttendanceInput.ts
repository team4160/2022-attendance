import { ObjectId } from 'mongodb';
import { Field, ID, InputType } from 'type-graphql';

@InputType()
export class LogAttendanceInput {
  @Field()
  identifier!: string;

  @Field(() => ID)
  attendancePeriodId!: ObjectId;
}
