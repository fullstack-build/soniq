export async function bootWithTimeoutMock(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 1000);
  });
}
