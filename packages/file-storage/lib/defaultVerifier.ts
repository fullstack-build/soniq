
export async function defaultVerifier(ctx) {
  try {
    const stat = await ctx.client.statObject(ctx.bucket, ctx.verifyFileName);
    return stat.etag;
  } catch (e) {
    if (e.message.toLowerCase().indexOf('not found') >= 0) {
      throw new Error('Please upload a file before verifying.');
    }
    throw e;
  }
}
