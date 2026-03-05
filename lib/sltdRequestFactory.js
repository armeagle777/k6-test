import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { sltdDocuments } from '../data/sltdDocuments.js';
import { generateFakeSltdDocument } from './fakeSltdDocument.js';

const HIT_RATIO = 0.4;

export function buildSltdSearchRequest() {
  const isHit = Math.random() < HIT_RATIO;
  if (isHit) {
    const record = sltdDocuments[randomIntBetween(0, sltdDocuments.length - 1)];
    return { payload: record, hitOrNoHit: 'HIT' };
  }

  return { payload: generateFakeSltdDocument(), hitOrNoHit: 'NO_HIT' };
}

export default buildSltdSearchRequest;
