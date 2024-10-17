"use client";
import { useState } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage("Lütfen bir dosya seçin.");
      return;
    }

    const formData = new FormData();
    formData.append("mydoc", selectedFile);

    try {
      // Dosya yükleme isteği
      const response = await fetch(
        "https://api.docanalyzer.ai/api/v1/doc/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_DOCANALYZER_API_KEY}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const docId = data.data[0]; // docid'yi alıyoruz
        setMessage(`Dosya başarıyla yüklendi. Chat Kodu: ${docId}`);

        // Chat isteği gönderme
        const chatResponse = await fetch(
          `https://api.docanalyzer.ai/api/v1/doc/${docId}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_DOCANALYZER_API_KEY}`,
            },
            body: JSON.stringify({
              prompt: "Makalaenin adı nedir?",
            }),
          }
        );

        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          console.log("gelen yanıt: ", chatData);
          setChatResponse(`Sohbet yanıtı: ${chatData.answer}`);
        } else {
          const chatError = await chatResponse.json();
          setChatResponse(`Sohbet hatası: ${chatError.error}`);
        }
      } else {
        const errorData = await response.json();
        setMessage(`Dosya yüklenirken bir hata oluştu: ${errorData.error}`);
      }
    } catch (error) {
      setMessage(`Bir hata oluştu: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Dosya Yükleme Formu</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600"
        >
          Yükle
        </button>
      </form>
      {message && <p className="mt-4 text-red-500">{message}</p>}
      {chatResponse && <p className="mt-4 text-green-500">{chatResponse}</p>}
    </div>
  );
}
