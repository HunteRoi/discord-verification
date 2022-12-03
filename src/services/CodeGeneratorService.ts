/**
 * The service handling the code generation.
 *
 * @export
 * @class CodeGeneratorService
 */
export class CodeGeneratorService {
  readonly #characters: string;

  /**
   * Creates an instance of CodeGeneratorService.
   * @param {string} charactersWhitelist default = '0123456789'
   * @memberof CodeGeneratorService
   */
  constructor(charactersWhitelist?: string) {
    this.#characters = charactersWhitelist || '0123456789';
  }

  /**
   * Generates a code of {length} characters based on the whitelist.
   *
   * @param {number} length
   * @return {string} the code
   * @memberof CodeGeneratorService
   */
  generateCode(length: number): string {
    if (isNaN(length)) throw new TypeError('Length must be a number');
    if (length < 1) throw new RangeError('Length must be at least 1');

    let code = '';
    for (let i = 0; i < length; i++) {
      code += this.#getCharacterAtRandomPosition();
    }
    return code.trim();
  }

  #getCharacterAtRandomPosition(): string {
    return this.#characters.charAt(
      Math.floor(Math.random() * this.#characters.length)
    );
  }
}
