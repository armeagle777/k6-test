import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const countries = [
  'USA',
  'CAN',
  'GBR',
  'FRA',
  'DEU',
  'ITA',
  'ESP',
  'ARG',
  'BRA',
  'ZAF',
  'AUS',
  'JPN',
  'IND',
  'MEX',
  'KOR',
];

const documentTypes = ['PAS', 'DIP', 'SEP', 'IDC', 'VSA', 'NAP'];
const dinPrefixes = ['AA', 'BD', 'CX', 'DF', 'EG', 'HZ', 'KM', 'NP', 'QR', 'TZ'];

function pickRandom(items) {
  return items[randomIntBetween(0, items.length - 1)];
}

function buildRandomDin() {
  const prefix = pickRandom(dinPrefixes);
  const numeric = String(randomIntBetween(10000, 99999));
  return `${prefix}${numeric}`;
}

export function generateFakeSltdDocument() {
  return {
    din: buildRandomDin(),
    countryOfRegistration: pickRandom(countries),
    typeOfDocument: pickRandom(documentTypes),
  };
}

export default generateFakeSltdDocument;
