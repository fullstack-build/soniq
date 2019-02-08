export class FakeLoggerFactory {
  public create(name: string): { trace: (message: string) => void } {
    return {
      trace: (message: string) => {
        // print nothing
      }
    };
  }
}
