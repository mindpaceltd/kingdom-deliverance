/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the Next.js dev/build server to connect to the self-hosted Supabase
  // instance which uses a self-signed TLS certificate.
  // Remove this once a valid certificate (e.g. Let's Encrypt) is installed on the VPS.
  env: {
    NODE_TLS_REJECT_UNAUTHORIZED: '0',
  },
};

export default nextConfig;
