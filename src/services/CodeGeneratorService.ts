export class CodeGeneratorService {
  private readonly characters: string;

  constructor(charactersWhitelist: string) {
    this.characters = charactersWhitelist || '0123456789';
  }

  generateCode(length: number): string {
    if (isNaN(length)) throw new TypeError('Length must be a number');
    if (length < 1) throw new RangeError('Length must be at least 1');

    let code = '';
    for (let i = 0; i < length; i++) {
      code += this.getCharacterAtRandomPosition();
    }
    return code.trim();
  }

  private getCharacterAtRandomPosition(): string {
    return this.characters.charAt(
      Math.floor(Math.random() * this.characters.length)
    );
  }
}
