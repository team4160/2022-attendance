import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ObjectIdColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Role extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  _id!: ObjectId;

  @Field(() => ID)
  @ObjectIdColumn()
  organizationId!: ObjectId;

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column()
  color!: string;
}
