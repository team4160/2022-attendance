import { google } from 'googleapis';
import { env } from './config';

const auth = new google.auth.OAuth2({
  clientId: env.SHEETS_CLIENT_ID,
  clientSecret: env.SHEETS_CLIENT_SECRET
});
auth.setCredentials({ refresh_token: env.SHEETS_REFRESH_TOKEN });
const sheet = google.sheets({ version: 'v4', auth });
const spreadsheetId = '1K73ZVwalha5elAykKdgPTxbMzO_qCEp9WAscIdpcDcI';

export const getSheet = async (
  range: string,
  majorDimension: 'ROWS' | 'COLUMNS' = 'ROWS'
): Promise<any[][]> => {
  const values = await sheet.spreadsheets.values.get({
    spreadsheetId: '1K73ZVwalha5elAykKdgPTxbMzO_qCEp9WAscIdpcDcI',
    range,
    majorDimension
  });
  const toReturn = values.data.values;
  if (toReturn === null || typeof toReturn === 'undefined') return [ [] ];
  return values.data.values as any[][];
};

export const updateSheet = async (
  range: string,
  values: any[][],
  majorDimension: 'ROWS' | 'COLUMNS' = 'ROWS'
): Promise<void> => {
  await sheet.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      majorDimension,
      values
    }
  });
  return;
};
