import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ObjectIdColumn } from 'typeorm';

@ObjectType()
@Entity()
export class AttendancePeriod extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  _id!: ObjectId;

  @Field(() => ID)
  @Column()
  organizationId!: ObjectId;

  @Field()
  @Column()
  name!: string;

  @Field(() => [ Date ])
  @Column()
  dates!: Date[];
}
