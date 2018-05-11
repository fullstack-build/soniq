
export async function defaultVerifier(ctx) {
  try {
    const stats = await ctx.client.statObject(ctx.bucket, ctx.fileName);
  } catch (e) {
    if (e.message.toLowerCase().indexOf('not found') >= 0) {
      throw new Error('Please upload a file before verifying.');
    }
    throw e;
  }
}
