import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { nominals } from '../data/nominals.js';
import { generateFakePerson } from './fakePerson.js';

const HIT_RATIO = 0.4;

function mapToApiPayload(person) {
  return {
    name: person.name,
    forename: person.forename,
    dateOfBirth: person.dob,
    idType: person.idType,
    idNumber: person.idNumber,
    idCountry: person.idCountry,
  };
}

export function buildSearchRequest() {
  const isHit = Math.random() < HIT_RATIO;
  if (isHit) {
    const nominal = nominals[randomIntBetween(0, nominals.length - 1)];
    return { payload: mapToApiPayload(nominal), hitOrNoHit: 'HIT' };
  }

  const fakePerson = generateFakePerson();
  return { payload: mapToApiPayload(fakePerson), hitOrNoHit: 'NO_HIT' };
}

export default buildSearchRequest;
