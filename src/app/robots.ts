import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/artist/', '/gig-maker/', '/login', '/register'],
    },
    sitemap: 'https://gigconnect.bw/sitemap.xml',
  };
}
