import StudyHallPrompt from "@/components/mathlab/StudyHallPrompt";

export const metadata = {
  title: "BRHS Math Lab",
  description: "Broad Run High School Math Lab tutoring queue and sessions.",
};

export default function MathLabLayout({ children }) {
  return (
    <>
      {children}
      <StudyHallPrompt />
    </>
  );
}
