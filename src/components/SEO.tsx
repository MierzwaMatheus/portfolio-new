import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({
  title,
  description,
  image,
  url,
  type = "website",
}: SEOProps) {
  const siteTitle =
    "Matheus Mierzwa | Desenvolvedor Front-end Sênior & Tech Lead React";
  const defaultDescription =
    "Desenvolvedor Front-end Sênior e Tech Lead especializado em React, TypeScript e arquitetura de software. Portfolio com projetos, artigos e serviços de desenvolvimento web.";
  const defaultImage =
    "https://i.postimg.cc/65bvTHHJ/og-image-port-math-100.jpg";
  const siteUrl = "https://www.mmlo.com.br";

  const fullTitle = title === siteTitle ? title : `${title} | Matheus Mierzwa`;
  const metaDescription = description || defaultDescription;
  const metaImage = image
    ? image.startsWith("http")
      ? image
      : `${siteUrl}${image}`
    : defaultImage;
  const metaUrl = url
    ? url.startsWith("http")
      ? url
      : `${siteUrl}${url}`
    : siteUrl;

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content="Matheus Mierzwa Portfolio" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={metaUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={metaImage} />
      <meta property="twitter:creator" content="@matheusmierzwa" />
    </Helmet>
  );
}
