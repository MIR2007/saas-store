// Optional R2 binding. The Worker uses R2 when it is available, and falls back
// to the UPLOADS_KV namespace while R2 is not enabled on the account.
interface CloudflareEnv {
  UPLOADS?: R2Bucket;
}
