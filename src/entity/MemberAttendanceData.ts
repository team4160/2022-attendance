import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ObjectIdColumn } from 'typeorm';

@ObjectType()
export class DataDatePair {
  @Field()
  signIn!: Date;

  @Field()
  signOut!: Date;

  constructor(signIn: Date, signOut: Date) {
    this.signIn = signIn;
    this.signOut = signOut;
  }

  static now(): DataDatePair {
    return new DataDatePair(new Date(), new Date());
  }
}

@ObjectType()
@Entity()
export class MemberAttendanceData extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  _id!: ObjectId;

  @Field(() => ID)
  @ObjectIdColumn()
  attendancePeriodId!: ObjectId;

  @Field(() => ID)
  @ObjectIdColumn()
  memberId!: ObjectId;

  @Field(() => [ DataDatePair ])
  @Column()
  attendanceData!: DataDatePair[];
}
