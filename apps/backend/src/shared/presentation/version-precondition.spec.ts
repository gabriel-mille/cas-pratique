import { HttpProblem } from './http-problem';
import { etagOf, parseIfMatch } from './version-precondition';

describe('Version et préconditions (D14, RFC 9110 §13.1.1)', () => {
  it('représente la version par un ETag fort', () => {
    expect(etagOf(3)).toBe('"3"');
  });

  it('lit la version attendue dans If-Match', () => {
    expect(parseIfMatch('"3"')).toBe(3);
    expect(parseIfMatch(' "12" ')).toBe(12);
  });

  it.each([[undefined], [''], ['*']])('exige une version précise : 428 (%j)', (header) => {
    expect(() => parseIfMatch(header)).toThrow(expect.objectContaining({ status: 428, code: 'precondition-required' }));
  });

  // Un ETag faible ne passe jamais la comparaison forte qu'impose If-Match.
  it.each([['W/"3"'], ['3'], ['"abc"'], ['"1", "2"']])('rejette un ETag qui ne peut correspondre : 412 (%j)', (header) => {
    expect(() => parseIfMatch(header)).toThrow(HttpProblem);
    expect(() => parseIfMatch(header)).toThrow(expect.objectContaining({ status: 412, code: 'stale-version' }));
  });
});
