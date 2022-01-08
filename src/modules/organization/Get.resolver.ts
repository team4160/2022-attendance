import { Arg, Query, Resolver } from 'type-graphql';
import { Organization } from '@entity/Organization';
import { GetErrorMessages } from './register/errors';
import { GetInput } from './register/GetInput';

@Resolver()
export class GetResolver {
  @Query(() => Organization)
  async registerAttendanceMember(
    @Arg('data') {
      teamNumber
    }: GetInput
  ): Promise<Organization> {
    const organization = await Organization.findOne({
      where: {
        teamNumber
      }
    });

    if (!organization) throw new Error(GetErrorMessages.NOT_FOUND);
    return organization;
  }
}
