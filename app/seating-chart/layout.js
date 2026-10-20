const SEATING_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap";

export const metadata = {
  title: "Seating Chart",
  description: "Classroom seating chart tool for Broad Run teachers.",
};

export default function SeatingChartLayout({ children }) {
  return (
    <div
      className="min-h-screen"
      style={{
        "--font-seating-open": '"Open Sans", sans-serif',
        "--font-seating-lexend": '"Lexend Deca", sans-serif',
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={SEATING_FONTS_HREF} />
      {children}
    </div>
  );
}
