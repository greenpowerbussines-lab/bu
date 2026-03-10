/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@buhai/ai'],
    images: {
        domains: ['localhost'],
    },
    async rewrites() {
        return [
            {
                source: '/api/backend/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
