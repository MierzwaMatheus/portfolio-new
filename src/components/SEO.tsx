import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

export function SEO({ title, description, image, url, type = 'website' }: SEOProps) {
    const siteTitle = 'Matheus Mierzwa | Desenvolvedor Full Stack';
    const defaultDescription = 'Desenvolvedor Full Stack especializado em React, Node.js e soluções modernas para web.';
    const defaultImage = '/og-image.png'; // We should ensure this image exists or use a placeholder
    const siteUrl = 'https://mmlo.com.br'; // Assuming this is the domain based on previous context

    const fullTitle = title === siteTitle ? title : `${title} | Matheus Mierzwa`;
    const metaDescription = description || defaultDescription;
    const metaImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}${defaultImage}`;
    const metaUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : siteUrl;

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={metaUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={metaUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={metaDescription} />
            <meta property="twitter:image" content={metaImage} />
        </Helmet>
    );
}
