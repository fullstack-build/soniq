export class Encoder {
  private _alphabet: string;
  private _hexChars: number;
  private _strChars: number;

  public constructor(
    alphabet: string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    hexChars: number = 10,
    strChars: number = 7
  ) {
    this._alphabet = alphabet;
    this._hexChars = hexChars;
    this._strChars = strChars;
  }

  public charToNumber(character: string): number {
    return this._alphabet.indexOf(character);
  }
  public numberToChar(number: number): string {
    if (this._alphabet[number] == null) {
      throw new Error(`Number out of range: ${number}`);
    }
    return this._alphabet[number];
  }

  public numberToString(number: number, minLength: number = this._strChars): string {
    let currentNumber: number = number;
    let str: string = "";

    while (currentNumber > 0) {
      const modulo: number = currentNumber % this._alphabet.length;
      str = this.numberToChar(modulo) + str;
      currentNumber = (currentNumber - modulo) / this._alphabet.length;
    }

    while (str.length < minLength) {
      str = `${this._alphabet[0]}${str}`;
    }

    return str;
  }

  public stringToNumber(str: string): number {
    const stringArray: string[] = str.split("");
    let number: number = 0;
    let factor: number = 1;

    while (stringArray.length > 0) {
      //@ts-ignore TODO: @eugene While the length is bigger than 0 pop() will always return something
      const char: number = this.charToNumber(stringArray.pop());
      number += char * factor;
      factor = factor * this._alphabet.length;
    }

    return number;
  }

  public hexToString(hex: string): string {
    const hexArray: string[] = hex.split("");
    let str: string = "";

    let leadingZeros: number = 0;

    while (hexArray[0] === this._alphabet[0]) {
      // tslint:disable-next-line:no-increment-decrement This rule sucks
      leadingZeros++;
      hexArray.shift();
    }

    if (leadingZeros > this._alphabet.length) {
      throw new Error(`To many leading zeros. Max is ${this._alphabet.length}.`);
    }

    while (hexArray.length > 0) {
      const substrArray: string[] = hexArray.splice(-this._hexChars);
      const number: number = parseInt(substrArray.join(""), 16);
      str = this.numberToString(number, hexArray.length > 0 ? this._strChars : 0) + str;
    }

    str = `${this.numberToChar(leadingZeros)}${str}`;

    return str;
  }

  public stringToHex(str: string): string {
    const strArray: string[] = str.split("");
    let hex: string = "";

    const firstChar: string | null = strArray.shift() || null;
    if (firstChar == null) {
      throw new Error("The input string cannot be empty.");
    }
    let leadingZeros: number = this.charToNumber(firstChar);

    while (strArray.length > 0) {
      const substrArray: string[] = strArray.splice(-this._strChars);
      let hexStr: string = this.stringToNumber(substrArray.join("")).toString(16);

      while (hexStr.length < this._hexChars && strArray.length > 0) {
        hexStr = `${this._alphabet[0]}${hexStr}`;
      }

      hex = `${hexStr}${hex}`;
    }

    while (leadingZeros > 0) {
      leadingZeros--;
      hex = `${this._alphabet[0]}${hex}`;
    }

    return hex;
  }
}
