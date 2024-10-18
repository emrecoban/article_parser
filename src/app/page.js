"use client";
import { useState } from "react";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Yüklenme durumu için ekledik

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

    setIsLoading(true); // Yüklenme başlıyor
    setMessage("");
    setChatResponse("");

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
        const docId = data.data[0]; // docId'yi alıyoruz
        setMessage(`Dosya başarıyla yüklendi. Chat Kodu: ${docId}`);

        // Dokümanın analiz edilip edilmediğini kontrol et
        let isAnalyzed = false;

        while (!isAnalyzed) {
          // 1 saniye bekle
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const checkResponse = await fetch(
            `https://api.docanalyzer.ai/api/v1/doc/${docId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_DOCANALYZER_API_KEY}`,
              },
            }
          );

          if (checkResponse.ok) {
            const checkData = await checkResponse.json();

            console.log("checkResponse: ", checkData);

            // Dokümanın analiz durumu kontrolü
            if (checkData.data && checkData.data.ready) {
              isAnalyzed = true; // Eğer 'ready' ise analiz tamamlanmış demektir
            } else {
              setMessage("Doküman henüz analiz edilmedi, lütfen bekleyin...");
            }
          } else {
            setMessage("Doküman kontrol edilirken bir hata oluştu.");
            break; // Eğer kontrol isteğinde bir hata varsa döngüyü kır
          }
        }

        // Doküman analiz edildiyse chat isteği gönderme
        const chatResponse = await fetch(
          `https://api.docanalyzer.ai/api/v1/doc/${docId}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_DOCANALYZER_API_KEY}`,
            },
            body: JSON.stringify({
              prompt:
                "Yazar bilgilerini getir. Abstract bilgisini getir. Keywords bilgisini getir. Bilgileri getirirken HTML etiketlerinden br ve b etiketlerini kullanabilirsin.",
              model: "gpt-4o-mini",
              page: true,
              ocap: 1024,
              lang: "Turkish",
            }),
          }
        );

        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          console.log("gelen yanıt:", chatData);
          setMessage("");
          setChatResponse(`Sohbet yanıtı: <br /> ${chatData.data.answer}`);
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
    } finally {
      setIsLoading(false); // Yüklenme sona erdi
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">
        Article Parser <span className="text-sm font-thin">by emrecoban</span>
      </h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="submit"
          className={`w-full bg-blue-500 text-white font-bold py-2 px-4 rounded ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Yükleniyor..." : "Yükle"}
        </button>
      </form>
      {isLoading && <p className="mt-4 text-gray-500">Lütfen bekleyin...</p>}
      {message && <p className="mt-4 text-red-500">{message}</p>}
      {chatResponse && (
        <p
          className="mt-4 text-green-500"
          dangerouslySetInnerHTML={{ __html: chatResponse }}
        />
      )}
    </div>
  );
}
