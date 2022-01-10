import {
  ApolloServerPluginLandingPageGraphQLPlayground
} from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import express from 'express';
import { ObjectId } from 'mongodb';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';
import { Server } from 'http';
import { AttendancePeriod } from '@entity/AttendancePeriod';
import { Member } from '@entity/Member';
import { DataDatePair, MemberAttendanceData } from '@entity/MemberAttendanceData';
import { Organization } from '@entity/Organization';
import { User } from '@entity/User';
import { addToTrie } from '@modules/attendance/trie';
import { redis, stopRedis } from 'redis';
import { getSheet } from 'sheets';
import { env } from './config';
import { toCapitalCase } from './utils';
import { createSchema } from './utils/createSchema';
import ormconfig from '~escape-src/ormconfig.json';
import testOrmconfig from '~escape-src/test-ormconfig.json';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

let connection: Connection;
let expressServer: Server;
let apolloServer: ApolloServer;
export let app: express.Express;

export const startServer =
  async (testMode = false, drop = false): Promise<void> => {
    let connectionOptions: ConnectionOptions = {
      'type': 'mongodb',
      'synchronize': drop,
      'dropSchema': true,
      'entities': [
        `${__dirname}/entity/*.*`
      ]
    };

    connectionOptions = testMode ?
      { ...connectionOptions, ...testOrmconfig }
      : { ...connectionOptions, ...ormconfig };

    connection = await createConnection(connectionOptions);
    const schema = await createSchema();

    const members = [];

    const identitiesRange = 'Identities!A1:C500';
    const identities = await getSheet(identitiesRange);
    for (let i = 1; i < identities.length; ++i) {
      const identifierPack = identities[ i ][ 0 ].split(',');
      members.push(
        await Member.create({
          uniqueIndex: parseInt(identifierPack[ 0 ]),
          firstName: toCapitalCase(identifierPack[ 1 ]),
          lastName: toCapitalCase(identifierPack[ 2 ])
        })
      );
    }
    const org = await Organization.create({
      name: 'FRC 4160',
      memberIdentificationTrieJSON: '{}',
      teamNumber: 4160,
      activeMemberIds: [ ]
    }).save();


    const range = `RawData!A1:AAA${members.length + 1}`;
    const attendanceHeaderData = await getSheet(range, 'COLUMNS');

    const dates = [];
    for (let i = 1; i < attendanceHeaderData.length; ++i) {
      const date = attendanceHeaderData[ i ][ 0 ];
      dates.push(new Date(date).setHours(0, 0, 0, 0));
    }

    const attendancePeriod = await AttendancePeriod.create({
      organizationId: org._id,
      name: '2022 Competition Season',
      dates
    }).save();

    const trie = {};
    for (let i = 0; i < members.length; ++i) {
      const member = members[ i ];
      member.organizationId = org._id;
      await member.save();
      const identifications = identities[ i + 1 ][ 2 ].split(',');
      for (const identification of identifications) {
        addToTrie(trie, identification.trim(), member._id.toString());
      }
    }
    await Organization.update({ _id: org._id }, {
      memberIdentificationTrieJSON: JSON.stringify(trie),
      uniqueIndexCounter: members.length
    });

    const attendanceData = await getSheet('RawData!A1:AAA500');
    for (let i = 1; i < attendanceData.length; ++i) {
      const name = attendanceData[ i ][ 0 ];
      const member = await Member.findOne({
        where: {
          firstName: name
        }
      }) as Member;

      const memberAttendanceData: DataDatePair[] = [];
      for (let j = 1; j < attendanceData[ 0 ].length; ++j) {
        const datePair = new DataDatePair(
          new Date(attendanceData[ 0 ][ j ]),
          new Date(attendanceData[ 0 ][ j ])
        );
        const dateData = attendanceData[ i ][ j ];
        if (typeof dateData === 'undefined' || dateData.trim() === '') { continue; }
        const signInDateData = dateData.split(',')[ 0 ];
        const signOutDateData = dateData.split(',')[ 1 ];
        const signInHours = signInDateData.split(':')[ 0 ];
        const signInMinutes = signInDateData.split(':')[ 1 ];
        const signOutHours = signOutDateData.split(':')[ 0 ];
        const signOutMinutes = signOutDateData.split(':')[ 1 ];
        datePair.signIn.setHours(signInHours);
        datePair.signIn.setMinutes(signInMinutes);
        datePair.signOut.setHours(signOutHours);
        datePair.signOut.setMinutes(signOutMinutes);
        memberAttendanceData.push(datePair);
      }
      await MemberAttendanceData.create({
        attendancePeriodId: attendancePeriod._id,
        memberId: member._id,
        attendanceData: memberAttendanceData
      }).save();
    }

    apolloServer = new ApolloServer({
      schema,
      introspection: env.NODE_ENV !== 'production',
      plugins: [ ApolloServerPluginLandingPageGraphQLPlayground ],
      context: ({ req }: {req: express.Request}) => ({ headers: req.headers })
    });
    await apolloServer.start();
    app = express();
    app.use(cors());



    app.get('/credentials', async (_, res) => {
      const org = await Organization.findOne({
        where: {
          teamNumber: 4160
        }
      }) as Organization;

      const attendancePeriod = await AttendancePeriod.findOne({
        where: {
          organizationId: org._id
        }
      }) as AttendancePeriod;
      res.status(200).send({
        orgId: org._id,
        attendancePeriodId: attendancePeriod._id
      });
    });
    app.get('/user/confirm/:confirmId', async (req, res) => {
      const { confirmId } = req.params;
      const userId = await redis.get(confirmId);
      if (!userId) {
        res.status(404).send('Invalid id');
        return;
      }

      await redis.del(confirmId);
      await User.update({ _id: new ObjectId(userId) }, { confirmed: true });
      res.status(200).send('OK');
    });
    apolloServer.applyMiddleware({ app });

    const port = testMode ? env.TEST_PORT : env.PORT;

    http
      .createServer(function (req, res) {
        res.writeHead(301, {Location: 'https://' + req.headers['host'] + req.url});
        res.end();
      })
      .listen(80);
      console.log(__dirname);
      app.use(express.static(path.join(__dirname, 'attendance')));
        app.use(express.static(__dirname));

        app.get('/', (req, res) => {
          res.send('OK');
        })


      const credentials = {
  key: fs.readFileSync("/etc/letsencrypt/live/attendance.matthewlin.dev/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/attendance.matthewlin.dev/cert.pem"),
  ca: fs.readFileSync("/etc/letsencrypt/live/attendance.matthewlin.dev/chain.pem"),
};

const server = https.createServer(credentials, app);

    expressServer = server.listen(port, () => {
      console.log(`App is listening on port ${port}`);
    });
  };

export const stopServer = async (): Promise<void> => {
  if (connection) await connection.close();
  if (expressServer) await expressServer.close();
  if (apolloServer) await apolloServer.stop();
  if (redis) await stopRedis();
};
