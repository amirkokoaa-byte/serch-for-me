/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AggregatedResult } from "./types";
import { ExternalLink, Store, AlertCircle, TrendingDown, Tag, Info } from "lucide-react";

export default function App() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AggregatedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingText, setLoadingText] = useState("جاري البحث في أمازون، نون، جوميا، بي تك، رنين، 2B، دريم 2000، العربي، تريد لاين، راية شوب، دبي فون والمزيد من المواقع... يرجى الانتظار.");

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      const texts = [
        "جاري البحث في أمازون، نون، جوميا، بي تك، رنين، 2B، دريم 2000، العربي، تريد لاين، راية شوب، دبي فون والمزيد من المواقع... يرجى الانتظار.",
        "جاري جلب ومقارنة الأسعار...",
        "جاري تجميع أفضل العروض...",
      ];
      let i = 0;
      setLoadingText(texts[0]);
      interval = setInterval(() => {
        i++;
        if (i < texts.length) {
          setLoadingText(texts[i]);
        }
      }, 2500) as unknown as number;
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`/api/compare?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء جلب النتائج");
      }
      const data = await response.json();
      
      let formattedResult: AggregatedResult | null = null;
      if (data && ((data.exactMatches && data.exactMatches.length > 0) || (data.suggestions && data.suggestions.length > 0))) {
         const exactMatches = data.exactMatches || [];
         const suggestions = data.suggestions || [];
         
         const offers = exactMatches.map((m: any) => ({
            store: m.storeName,
            title: m.title,
            price: parseInt(m.price.replace(/[^0-9]/g, '')) || 0,
            currency: "ج.م",
            url: m.productUrl,
            imageUrl: m.imageUrl
         })).sort((a: any, b: any) => a.price - b.price);

         const alternatives = suggestions.map((s: any) => ({
            store: s.storeName,
            title: s.title,
            price: parseInt(s.price.replace(/[^0-9]/g, '')) || 0,
            currency: "ج.م",
            url: s.productUrl,
            imageUrl: s.imageUrl
         }));

         formattedResult = {
            query: query,
            exactMatches: offers,
            alternatives: alternatives
         };
      }
      
      setResult(formattedResult);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء البحث.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <header className="bg-white p-8 text-center shadow-md">
        <h1 className="m-0 mb-4 text-3xl md:text-4xl text-blue-600 font-extrabold">مقارنة الأسعار الذكية</h1>
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2.5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن منتج (مثال: iPhone 15 أو سامسونج S24)..."
            className="flex-1 p-4 text-base font-sans border-2 border-slate-200 rounded-lg outline-none focus:border-blue-600 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-8 py-4 text-base font-sans font-semibold bg-blue-600 text-white border-none rounded-lg cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            بحث الآن
          </button>
        </form>
      </header>

      <main className="flex-1 p-8 w-full max-w-6xl mx-auto box-border">
        {isLoading && (
          <div className="text-center text-lg text-slate-500 py-10 animate-pulse">
            {loadingText}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center justify-center gap-3 shadow-sm mb-8">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !result && !error && (
          <div className="text-center text-lg text-slate-400 py-20">
            أدخل اسم المنتج في الأعلى للبدء في مقارنة الأسعار.
          </div>
        )}

        {!isLoading && result && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {result.exactMatches.length > 0 ? (
              <div>
                <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-200 pb-3">
                  <div className="bg-slate-200/50 p-2.5 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 m-0">أفضل الأسعار لنفس المنتج:</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {result.exactMatches.map((offer, i) => (
                    <a 
                      key={i} 
                      href={offer.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`bg-white rounded-xl shadow-sm border ${i === 0 ? 'border-green-400 shadow-md ring-2 ring-green-400/20' : 'border-slate-200'} overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 group flex flex-col h-full no-underline text-slate-900`}
                    >
                      <div className="h-56 p-6 flex items-center justify-center bg-white relative">
                        {offer.imageUrl ? (
                          <img src={offer.imageUrl} alt={offer.title} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-slate-300">بدون صورة</span>
                        )}
                        <div className="absolute top-3 end-3 bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5">
                          <Store className="w-3 h-3" />
                          {offer.store}
                        </div>
                        {i === 0 && (
                          <div className="absolute top-3 start-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                            أفضل سعر
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 flex flex-col flex-grow border-t border-slate-50 bg-slate-50/30">
                        <h4 className="font-medium text-slate-900 line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors leading-snug m-0" dir="ltr">
                          {offer.title}
                        </h4>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div dir="ltr" className="text-start">
                            <span className="text-xl font-bold text-slate-900 tracking-tight">
                              <bdi>{formatPrice(offer.price)}</bdi>
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <ExternalLink className="w-4 h-4 rtl:scale-x-[-1]" />
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-10 text-center text-amber-800 shadow-sm">
                <AlertCircle className="w-16 h-16 mx-auto mb-5 text-amber-500 opacity-80" />
                <h3 className="text-2xl font-bold mb-3 m-0">لم يتم العثور على تطابق دقيق</h3>
                <p className="text-lg text-amber-700/80 max-w-lg mx-auto m-0">
                  لم نتمكن من العثور على تطابق دقيق لـ "<span className="font-semibold">{result.query}</span>" في متاجرنا الأساسية. تحقق من البدائل المقترحة أدناه.
                </p>
              </div>
            )}

            {result.alternatives.length > 0 && (
              <div className="pt-8">
                <div className="flex items-center gap-3 mb-6 border-b-2 border-slate-200 pb-3">
                  <div className="bg-slate-200/50 p-2.5 rounded-lg">
                    <Tag className="w-6 h-6 text-slate-600"/>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 m-0">
                    مقترحات وبدائل أخرى ({result.alternatives.length} منتجات)
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {result.alternatives.map((alt, i) => (
                    <a 
                      key={i} 
                      href={alt.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 group flex flex-col h-full no-underline text-slate-900"
                    >
                      <div className="h-56 p-6 flex items-center justify-center bg-white relative">
                        {alt.imageUrl ? (
                          <img src={alt.imageUrl} alt={alt.title} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-slate-300">بدون صورة</span>
                        )}
                        <div className="absolute top-3 end-3 bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5">
                          <Store className="w-3 h-3" />
                          {alt.store}
                        </div>
                      </div>
                      
                      <div className="p-5 flex flex-col flex-grow border-t border-slate-50 bg-slate-50/30">
                        <h4 className="font-medium text-slate-900 line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors leading-snug m-0" dir="ltr">
                          {alt.title}
                        </h4>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div dir="ltr" className="text-start">
                            <span className="text-xl font-bold text-slate-900 tracking-tight">
                              <bdi>{formatPrice(alt.price)}</bdi>
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <ExternalLink className="w-4 h-4 rtl:scale-x-[-1]" />
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-300 text-center p-6 text-base mt-auto">
        تم التطوير بكل فخر | مع تحيات المطور <span className="text-sky-400 font-extrabold tracking-wide text-lg">Amir Lamay</span>
      </footer>
    </div>
  );
}

