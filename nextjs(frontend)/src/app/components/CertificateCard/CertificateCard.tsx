type CertificateCardProps = {
  logo: string
  company: string
  link?: string
  className?: string
}

const CertificateCard = ({
  logo,
  company,
  // link = '#',
  className = '',
}: CertificateCardProps) => {

  console.log("loggooooo: ", logo);

  return (
    <div
      // href={link}
      className={`pocket-certificate-card ${className}`}
      aria-label={`${company} certification`}
    >
      {/* STATIC CARD SHELL */}
      <img
        src="/assets/images/certificate-card-shell.webp"
        alt=""
        className="card-shell"
        aria-hidden
      />

      {/* 🔥 DYNAMIC LOGO ONLY */}
      <img
        src={logo}
        alt={`${company} logo`}
        className="card-logo shell-card-logo"
      />
    </div>
  )
}

export default CertificateCard
