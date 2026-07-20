/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
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
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("حدث خطأ أثناء جلب النتائج");
      }
      const data = await response.json();
      setResult(data.result || null);
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
            {result.mainProduct ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                  <TrendingDown className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900 m-0">مقارنة التطابق الدقيق</h2>
                </div>
                
                <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-10">
                  <div className="lg:w-1/3 shrink-0 flex flex-col">
                    <div className="aspect-square w-full bg-white rounded-xl border border-slate-100 p-6 flex items-center justify-center relative overflow-hidden mb-6 shadow-sm">
                      {result.mainProduct.imageUrl ? (
                        <img src={result.mainProduct.imageUrl} alt={result.mainProduct.title} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-slate-300 flex flex-col items-center gap-2">
                          <Tag className="w-8 h-8" />
                          لا توجد صورة
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2" dir="ltr">
                      {result.mainProduct.title}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 m-0">
                      <Info className="w-4 h-4"/> المنتج الأساسي المطابق
                    </p>
                  </div>
                  
                  <div className="lg:w-2/3 flex flex-col">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      متاح في <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{result.mainProduct.offers.length} متاجر</span>
                    </h4>
                    
                    <div className="space-y-4">
                      {result.mainProduct.offers.map((offer, index) => (
                        <div 
                          key={index}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border ${index === 0 ? 'border-green-500/30 bg-green-50/30 shadow-sm' : 'border-slate-200 bg-white'} hover:border-blue-300 hover:shadow-md transition-all group gap-4`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                              <Store className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                              <span className="block font-bold text-slate-900 text-lg">
                                {offer.store}
                              </span>
                              {index === 0 && (
                                <span className="text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-200/50 px-2 py-0.5 rounded-sm">أفضل سعر</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
                            <div className="text-right sm:text-start" dir="ltr">
                              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                                <bdi>{formatPrice(offer.price)}</bdi>
                              </div>
                            </div>
                            <a 
                              href={offer.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm no-underline"
                            >
                              اذهب للمتجر <ExternalLink className="w-4 h-4 transform rotate-0 rtl:scale-x-[-1]" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-slate-200/50 p-2.5 rounded-lg">
                    <Tag className="w-6 h-6 text-slate-600"/>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 m-0">
                    منتجات مشابهة مقترحة
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

