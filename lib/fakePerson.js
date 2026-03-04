import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const firstNames = [
  'JAMES',
  'MARIA',
  'ALEX',
  'SOFIA',
  'DANIEL',
  'LINA',
  'PETER',
  'NORA',
  'IBRAHIM',
  'ANNA',
  'KARIM',
  'ELENA',
  'YUSUF',
  'MAYA',
  'GEORGE',
];

const lastNames = [
  'SMITH',
  'GARCIA',
  'PARK',
  'ALI',
  'PETROV',
  'RUIZ',
  'HASSAN',
  'IVANOVA',
  'BROWN',
  'MARTIN',
  'SINGH',
  'FISCHER',
  'KIM',
  'ROMERO',
  'SILVA',
];

const countries = [
  'Philippines',
  'Spain',
  'Jordan',
  'United Kingdom',
  'France',
  'Germany',
  'Italy',
  'Portugal',
  'Turkey',
  'United States',
  'Canada',
  'Australia',
  'India',
  'Japan',
  'Egypt',
];

function pickRandom(items) {
  return items[randomIntBetween(0, items.length - 1)];
}

function randomBirthdate() {
  const year = randomIntBetween(1950, 2010);
  const month = String(randomIntBetween(1, 12)).padStart(2, '0');
  const day = String(randomIntBetween(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function randomPassportNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefixA = letters[randomIntBetween(0, letters.length - 1)];
  const prefixB = letters[randomIntBetween(0, letters.length - 1)];
  const num = String(randomIntBetween(100000, 999999));
  return `${prefixA}${prefixB}${num}`;
}

export function generateFakePerson() {
  return {
    name: pickRandom(lastNames),
    forename: pickRandom(firstNames),
    dob: randomBirthdate(),
    idType: 'Passport',
    idNumber: randomPassportNumber(),
    idCountry: pickRandom(countries),
  };
}

export default generateFakePerson;
