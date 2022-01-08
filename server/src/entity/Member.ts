import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ObjectIdColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Member extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  _id!: ObjectId;

  @Field(() => ID)
  @ObjectIdColumn()
  organizationId!: ObjectId;

  @Field(() => ID)
  @Column()
  uniqueIndex!: number;

  @Field()
  @Column()
  firstName!: string;

  @Field()
  @Column()
  lastName!: string;

  @Field(() => [ ID ])
  @Column()
  rolesIds!: ObjectId[];
}
