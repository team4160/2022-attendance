import { ObjectId } from 'mongodb';
import { Arg, Mutation, Resolver } from 'type-graphql';
import { AttendancePeriod } from '@entity/AttendancePeriod';
import { Member } from '@entity/Member';
import {
  MemberAttendanceData,
  DataDatePair
} from '@entity/MemberAttendanceData';
import { Organization } from '@entity/Organization';
import { getSheet, updateSheet } from 'sheets';
import { toCapitalCase } from 'utils';
import { LogAttendanceInput } from './register/LogAttendanceInput';
import { findInTrie } from './trie';

@Resolver()
export class LogAttendanceResolver {
  @Mutation(() => Boolean)
  async logAttendance(
    @Arg('data') {
      identifier,
      attendancePeriodId
    }: LogAttendanceInput
  ): Promise<boolean> {
    const attendancePeriod = await AttendancePeriod.findOne({
      where: {
        _id: new ObjectId(attendancePeriodId)
      }
    });
    const organization = await Organization.findOne({
      where: {
        _id: attendancePeriod?.organizationId
      }
    });
    if (!attendancePeriod) return false;
    if (!organization) return false;

    // Add attendace date to attendace period
    const beginningOfToday = new Date().setHours(0, 0, 0, 0);
    if (new Date(
      attendancePeriod.dates[
        attendancePeriod.dates.length - 1
      ]
    ).getTime() !== beginningOfToday) {
      await AttendancePeriod.update({ _id: attendancePeriod._id }, {
        dates: [ ...attendancePeriod.dates, beginningOfToday ]
      });

      const existingData = await getSheet('RawData!A1:AAA1');
      if (
        beginningOfToday !==
        new Date(
          existingData[ 0 ][ existingData[ 0 ].length - 1 ]
        ).setHours(0, 0, 0, 0)
      ) {
        const today = new Date();
        existingData[ 0 ].push(`${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`);
        await updateSheet('RawData!A1:AAA1', existingData);
      }
    }

    // Update member attendance data
    const memberIdentifier = findInTrie(
      JSON.parse(organization.memberIdentificationTrieJSON), identifier
    );
    if (memberIdentifier === null) return false;
    const memberId = new ObjectId(memberIdentifier);
    let existingMemberAttendanceData = await MemberAttendanceData.findOne({
      where: {
        memberId
      }
    });
    if (!existingMemberAttendanceData) {
      existingMemberAttendanceData = await MemberAttendanceData.create({
        attendancePeriodId: attendancePeriod._id,
        memberId,
        attendanceData: []
      }).save();
    }
    const member = await Member.findOne({
      where: {
        _id: memberId
      }
    });
    if (!member) return false;

    // Sign if it is first run of the day, else sign out
    const lastRecordedAttendance = new Date(
      existingMemberAttendanceData.attendanceData[
        existingMemberAttendanceData.attendanceData.length - 1
      ]?.signIn
    ).setHours(0, 0, 0, 0);
    const now = DataDatePair.now();
    // If last recorded attendance is today
    if (lastRecordedAttendance !== beginningOfToday) {
      existingMemberAttendanceData.attendanceData = [
        ...existingMemberAttendanceData.attendanceData,
        now
      ];
    }
    else {
      existingMemberAttendanceData.attendanceData[
        existingMemberAttendanceData.attendanceData.length - 1
      ].signOut = now.signIn;
    }

    await MemberAttendanceData.update({
      _id: existingMemberAttendanceData._id
    }, {
      attendanceData: existingMemberAttendanceData.attendanceData
    });

    const attendanceData = await getSheet('RawData!A1:AAA500');
    let horizontalIndex = -1;
    for (let i = 0; i < attendanceData[ 0 ].length; ++i) {
      if (
        beginningOfToday ===
          new Date(attendanceData[ 0 ][ i ]).setHours(0, 0, 0, 0)
      ) {
        horizontalIndex = i;
      }
    }
    const lastDatePair = existingMemberAttendanceData.attendanceData[
      existingMemberAttendanceData.attendanceData.length - 1
    ];
    for (let i = 0; i < attendanceData.length; ++i) {
      if (attendanceData[ i ][ 0 ] === toCapitalCase(member.firstName)) {
        const signIn = new Date(lastDatePair.signIn);
        const signOut = new Date(lastDatePair.signOut);

        const signInTime =
          `${signIn.getHours()}:${String(signIn.getMinutes()).padStart(2, '0')}`;
        const signOutTime =
          `${signOut.getHours()}:${String(signOut.getMinutes()).padStart(2, '0')}`;

        attendanceData[ i ][ horizontalIndex ] = `${signInTime},${signOutTime}`;
        break;
      }
      if (i === attendanceData.length - 1) {
        const newMemberData = Array(attendanceData[ 0 ].length - 1).fill('');
        attendanceData.push([member.firstName, ...newMemberData]);
      }
    }
    await updateSheet('RawData!A1:AAA500', attendanceData);

    return true;
  }
}
