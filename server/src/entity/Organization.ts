import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ObjectIdColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Organization extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  _id!: ObjectId;

  @Field()
  @Column()
  teamNumber!: number;

  @Field()
  @Column()
  name!: string;

  @Column('number', { default: 0 })
  uniqueIndexCounter = 0;

  @Field(() => [ ID ])
  @Column()
  activeMemberIds!: ObjectId[];

  @Field(() => [ ID ])
  @Column()
  archivedMemberIds!: ObjectId[];

  @Field()
  @Column()
  memberIdentificationTrieJSON!: string;
}
