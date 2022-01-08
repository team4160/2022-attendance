import { ObjectId } from 'mongodb';
import { Arg, Mutation, Resolver } from 'type-graphql';
import { Member } from '@entity/Member';
import { MemberIdentification } from '@entity/MemberIdentification';
import { Organization } from '@entity/Organization';
import { getSheet, updateSheet } from 'sheets';
import { toCapitalCase } from 'utils';
import { RegisterAttendanceMemberInput } from './register/RegisterInput';
import { addToTrie } from './trie';

@Resolver()
export class RegisterResolver {
  @Mutation(() => Member)
  async registerAttendanceMember(
    @Arg('data') {
      organizationId,
      firstName,
      lastName,
      rolesIds,
      identifications
    }: RegisterAttendanceMemberInput
  ): Promise<Member> {
    firstName = toCapitalCase(firstName);
    lastName = toCapitalCase(lastName);

    const organization = await Organization.findOne({
      where: {
        _id: new ObjectId(organizationId)
      }
    });
    if (!organization) throw new Error();
    const member = await Member.create({
      organizationId,
      firstName,
      lastName,
      rolesIds,
      uniqueIndex: organization.uniqueIndexCounter
    }).save();

    await MemberIdentification.create({
      memberId: member._id,
      identifications
    }).save();

    const trie = JSON.parse(organization.memberIdentificationTrieJSON);
    for (const identification of identifications) {
      addToTrie(trie, identification, member._id.toString());
    }
    Organization.update({ _id: organization._id }, {
      uniqueIndexCounter: organization.uniqueIndexCounter + 1,
      memberIdentificationTrieJSON: JSON.stringify(trie)
    });
    const range = 'Identities!A1:C500';
    const currentValues = await getSheet(range);
    const identifierPack = [
      member.uniqueIndex,
      member.firstName.toLowerCase(),
      member.lastName.toLowerCase()
    ];
    currentValues.push([
      identifierPack.toString(),
      `${member.firstName} ${member.lastName}`,
      identifications.toString()
    ]);
    updateSheet(range, currentValues);
    return member;
  }
}
