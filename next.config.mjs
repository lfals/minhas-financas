import { readFileSync } from 'fs';

// Lê a versão do package.json para injetar como env var no build
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const buildTimestamp = Date.now().toString(36);
const appVersion = `${pkg.version}+${buildTimestamp}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_APP_VERSION: appVersion,
    },
};

export default nextConfig;
