export class Encoder {
  private alphabet: string;
  private hexChars: number;
  private strChars: number;

  constructor(alphabet: string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", hexChars: number = 10, strChars: number = 7) {
    this.alphabet = alphabet;
    this.hexChars = hexChars;
    this.strChars = strChars;
  }

  public charToNumber(character: string): number {
    return this.alphabet.indexOf(character);
  }
  public numberToChar(number: number): string {
    if (this.alphabet[number] == null) {
      throw new Error(`Number out of range: ${number}`);
    }
    return this.alphabet[number];
  }

  public numberToString(number: number, minLength: number = this.strChars): string {
    let currentNumber = number;
    let str = "";

    while (currentNumber > 0) {
      const modulo = currentNumber % this.alphabet.length;
      str = this.numberToChar(modulo) + str;
      currentNumber = (currentNumber - modulo) / this.alphabet.length;
    }

    while (str.length < minLength) {
      str = `${this.alphabet[0]}${str}`;
    }

    return str;
  }

  public stringToNumber(str: string): number {
    const stringArray = str.split("");
    let number = 0;
    let factor = 1;

    while (stringArray.length > 0) {
      const char = this.charToNumber(stringArray.pop());
      number += char * factor;
      factor = factor * this.alphabet.length;
    }

    return number;
  }

  public hexToString(hex: string): string {
    const hexArray = hex.split("");
    let str = "";

    let leadingZeros = 0;

    while (hexArray[0] === this.alphabet[0]) {
      // tslint:disable-next-line:no-increment-decrement This rule sucks
      leadingZeros++;
      hexArray.shift();
    }

    if (leadingZeros > this.alphabet.length) {
      throw new Error(`To many leading zeros. Max is ${this.alphabet.length}.`);
    }

    while (hexArray.length > 0) {
      const substrArray = hexArray.splice(-this.hexChars);
      const number = parseInt(substrArray.join(""), 16);
      str = this.numberToString(number, hexArray.length > 0 ? this.strChars : 0) + str;
    }

    str = `${this.numberToChar(leadingZeros)}${str}`;

    return str;
  }

  public stringToHex(str: string): string {
    const strArray = str.split("");
    let hex = "";
    let leadingZeros = this.charToNumber(strArray.shift());

    while (strArray.length > 0) {
      const substrArray = strArray.splice(-this.strChars);
      let hexStr = this.stringToNumber(substrArray.join("")).toString(16);

      while (hexStr.length < this.hexChars && strArray.length > 0) {
        hexStr = `${this.alphabet[0]}${hexStr}`;
      }

      hex = `${hexStr}${hex}`;
    }

    while (leadingZeros > 0) {
      // tslint:disable-next-line:no-increment-decrement This rule sucks
      leadingZeros--;
      hex = `${this.alphabet[0]}${hex}`;
    }

    return hex;
  }
}
