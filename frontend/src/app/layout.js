import "./globals.css";

export const metadata = {
  title: "Eye Disease Classifier — AI Fundus Analysis",
  description:
    "AI-powered fundus image analysis using a 5-model deep learning ensemble with Explainable AI (Grad-CAM) and LLM explanations.",
  keywords: [
    "eye disease",
    "fundus image",
    "deep learning",
    "cataract",
    "glaucoma",
    "diabetic retinopathy",
    "grad-cam",
    "explainable AI",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-mesh" />
        {children}
      </body>
    </html>
  );
}
