"use client";
import { useState } from "react";

export default function ArticleParser() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [chatResponse, setChatResponse] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const prompts = {
    author: {
      prompt:
        "Başka hiçbir açıklama yapmadan makaleye ait istediğim bilgileri ver. Makalenin yazar bilgilerini düz metin formatında döndür.",
      key: "author",
    },
    abstract: {
      prompt: "Makalenin özetini düz metin formatında döndür.",
      key: "abstract",
    },
    keywords: {
      prompt: "Makalenin anahtar kelimelerini düz metin formatında döndür.",
      key: "keywords",
    },
    introduction: {
      prompt: "Makalenin giriş kısmını düz metin formatında döndür.",
      key: "introduction",
    },
    method: {
      prompt: "Makalenin metod kısmını düz metin formatında döndür.",
      key: "method",
    },
    discussion: {
      prompt: "Makalenin tartışma kısmını düz metin formatında döndür.",
      key: "discussion",
    },
    results: {
      prompt: "Makalenin sonuçlar kısmını düz metin formatında döndür.",
      key: "results",
    },
    references: {
      prompt: "Makalenin kaynakça kısmını düz metin formatında döndür.",
      key: "references",
    },
  };

  const getChatResponse = async (docId, prompt, key) => {
    try {
      const response = await fetch(
        `https://api.docanalyzer.ai/api/v1/doc/${docId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_DOCANALYZER_API_KEY}`,
          },
          body: JSON.stringify({
            prompt,
            model: "gpt-4o-mini",
            //model: "gemini-1.5-flash",
            page: false,
            ocap: 1024,
            lang: "Turkish",
          }),
        }
      );

      // Hatalı yanıt kontrolü
      if (!response.ok) {
        const chatError = await response.json();
        console.error("API Hatası:", chatError);
        throw new Error(`Sohbet hatası: ${chatError.error}`);
      }

      const chatData = await response.json();
      console.log("Chat Data:", chatData); // Yanıtı kontrol et

      // Düz metin formatında yanıtı almak için
      const plainTextResponse = chatData?.data?.answer || "";

      return (
        plainTextResponse ||
        `${key.charAt(0).toUpperCase() + key.slice(1)} bilgisi mevcut değil.`
      );
    } catch (error) {
      console.error("Hata:", error.message);
      throw error; // Hatanın üst katmana iletilmesi
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage("Lütfen bir dosya seçin.");
      return;
    }

    const formData = new FormData();
    formData.append("mydoc", selectedFile);

    setIsLoading(true);
    setMessage("");
    setChatResponse({});
    setIsAnalyzed(false);

    try {
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
        const docId = data.data[0];
        setMessage(`Dosya başarıyla yüklendi. Chat Kodu: ${docId}`);

        let isDocumentAnalyzed = false;
        let retryCount = 0;
        let delay = 3000; // Başlangıç bekleme süresi: 2 saniye

        while (!isDocumentAnalyzed) {
          await new Promise((resolve) => setTimeout(resolve, delay));

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

            if (checkData.data && checkData.data.ready) {
              isDocumentAnalyzed = true;
              setIsAnalyzed(true);
            } else {
              setMessage("Doküman analiz ediliyor, lütfen bekleyin...");
            }
          } else {
            console.error(
              "Analiz kontrolünde hata oluştu:",
              checkResponse.statusText
            );
            if (checkResponse.status === 401 || checkResponse.status === 429) {
              // Eğer 'Unauthorized' veya 'Too Many Requests' hatası alırsak bekleme süresini artır
              delay *= 2;
            } else {
              // Başka bir hata durumunda döngüyü sonlandır
              setMessage("Doküman kontrol edilirken bir hata oluştu.");
              break;
            }
          }

          // Belirli sayıda denemeden sonra döngüyü durdur
          if (++retryCount >= 10) {
            setMessage("Analiz işlemi çok uzun sürdü. Lütfen tekrar deneyin.");
            break;
          }
        }

        if (isDocumentAnalyzed) {
          try {
            // Her bölüm için ayrı ayrı sonuç alınıyor
            for (const [key, { prompt }] of Object.entries(prompts)) {
              console.log(`Prompt Gönderiliyor: ${prompt} için ${key}`); // Hangi prompt'un gönderildiğini kontrol et
              const response = await getChatResponse(docId, prompt, key);
              console.log(`Yanıt Alındı: ${key} için ${response}`); // Yanıtı kontrol et
              setChatResponse((prev) => ({
                ...prev,
                [key]: response,
              }));
            }

            setMessage("");
          } catch (error) {
            setChatResponse({ error: `Sohbet hatası: ${error.message}` });
          }
        }
      } else {
        const errorData = await response.json();
        setMessage(`Dosya yüklenirken bir hata oluştu: ${errorData.error}`);
      }
    } catch (error) {
      setMessage(`Bir hata oluştu: ${error.message}`);
    } finally {
      setIsLoading(false);
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
      {message && <p className="mt-4 text-amber-600">{message}</p>}

      {isAnalyzed && chatResponse && (
        <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6 mt-8">
          <CollapseSection
            title="Yazar Bilgileri"
            content={chatResponse.author}
          />
          <CollapseSection title="Özet" content={chatResponse.abstract} />
          <CollapseSection
            title="Anahtar Kelimeler"
            content={chatResponse.keywords}
          />
          <CollapseSection title="Giriş" content={chatResponse.introduction} />
          <CollapseSection title="Yöntem" content={chatResponse.method} />
          <CollapseSection title="Tartışma" content={chatResponse.discussion} />
          <CollapseSection title="Sonuçlar" content={chatResponse.results} />
          <CollapseSection title="Kaynakça" content={chatResponse.references} />
        </div>
      )}
    </div>
  );
}

function CollapseSection({ title, content }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 text-gray-700 font-semibold focus:outline-none"
      >
        <span className="flex items-center">
          {!content ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <span className="text-green-500 mr-2">✅</span>
          )}
          {title}
        </span>
        <span>{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen && <div className="p-4 bg-gray-50 text-gray-800">{content}</div>}
    </div>
  );
}
