export default class FakeBootLoader {
  private booted: boolean;
  private booting: boolean;

  constructor(booted: boolean = false, booting: boolean = false) {
    this.booted = booted;
    this.booting = booting;
  }

  public hasBooted(): boolean {
    return this.booted;
  }

  public isBooting(): boolean {
    return this.booting;
  }
}
