"use client";
import { useState } from "react";

export default function ArticleParser() {
  const [file, setFile] = useState(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAnalyze = () => {
    // Dosya analizi için işlem başlat
    setIsAnalyzed(true); // Örnek olarak set et
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-700">
        Article Parser by Emrecoban
      </h1>

      {/* Dosya Yükleme Formu */}
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 mb-8">
        <input
          type="file"
          onChange={handleFileUpload}
          className="w-full mb-4 p-2 border rounded-lg"
        />
        <button
          onClick={handleAnalyze}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Analyze Document
        </button>
      </div>

      {/* Analiz Sonuçları */}
      {isAnalyzed && (
        <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6 space-y-4">
          {[
            "Yazar Bilgileri",
            "Özet ve Anahtar Kelimeler",
            "Giriş",
            "Metot",
            "Tartışma",
            "Sonuç",
            "Kaynakça",
          ].map((section, index) => (
            <CollapseSection key={index} title={section} />
          ))}
        </div>
      )}
    </div>
  );
}

// Collapse Component
function CollapseSection({ title }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 text-gray-700 font-semibold focus:outline-none"
      >
        {title}
        <span>{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 text-gray-600">
          {/* İçerik buraya eklenecek */}
          Bu bölüme analiz sonuçları yerleştirilecek.
        </div>
      )}
    </div>
  );
}
