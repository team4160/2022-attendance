import { Field, InputType } from 'type-graphql';

@InputType()
export class GetInput {
  @Field()
  teamNumber!: number;
}
