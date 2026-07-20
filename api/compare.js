import axios from 'axios';
import * as cheerio from 'cheerio';

const cache = new Map();
const CACHE_TTL = 2 * 60 * 60 * 1000; 

const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
];

async function safeFetchHtml(url) {
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': randomUA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache'
            },
            timeout: 10000 
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch ${url}`);
    }
}

// تحديث دوال الاستخراج لجلب المنتج الرئيسي + 6 بدائل
const parsers = [
    {
        name: "Amazon EG",
        search: async (query) => {
            const url = `https://www.amazon.eg/s?k=${encodeURIComponent(query)}`;
            const html = await safeFetchHtml(url);
            const $ = cheerio.load(html);
            
            // 1. التطابق الدقيق (المنتج الأول)
            const firstProduct = $('div[data-component-type="s-search-result"]').first();
            let exactMatch = { isFound: false };
            if (firstProduct.length) {
                exactMatch = {
                    storeName: "Amazon EG",
                    title: firstProduct.find('h2 a span').text(),
                    price: `${firstProduct.find('span.a-price-whole').text().replace(/,/g, '')} ج.م`,
                    productUrl: `https://www.amazon.eg${firstProduct.find('h2 a').attr('href')}`,
                    imageUrl: firstProduct.find('img.s-image').attr('src'),
                    isFound: true
                };
            }

            // 2. استخراج 6 مقترحات بديلة (باستخدام slice من 1 إلى 7)
            const alternatives = [];
            $('div[data-component-type="s-search-result"]').slice(1, 7).each((i, el) => {
                const title = $(el).find('h2 a span').text();
                const price = $(el).find('span.a-price-whole').text().replace(/,/g, '');
                const link = $(el).find('h2 a').attr('href');
                const image = $(el).find('img.s-image').attr('src');
                if (title && price && link) {
                    alternatives.push({ storeName: "Amazon EG", title, price: `${price} ج.م`, productUrl: `https://www.amazon.eg${link}`, imageUrl: image, isFound: true });
                }
            });

            return { exactMatch, alternatives };
        }
    },
    {
        name: "Jumia EG",
        search: async (query) => {
            const url = `https://www.jumia.com.eg/ar/catalog/?q=${encodeURIComponent(query)}`;
            const html = await safeFetchHtml(url);
            const $ = cheerio.load(html);
            
            const firstProduct = $('article.prd._fb.col.c-prd').first();
            let exactMatch = { isFound: false };
            if (firstProduct.length) {
                exactMatch = {
                    storeName: "Jumia EG",
                    title: firstProduct.find('h3.name').text(),
                    price: firstProduct.find('div.prc').text(),
                    productUrl: `https://www.jumia.com.eg${firstProduct.find('a.core').attr('href')}`,
                    imageUrl: firstProduct.find('img.img').attr('data-src') || firstProduct.find('img.img').attr('src'),
                    isFound: true
                };
            }

            const alternatives = [];
            $('article.prd._fb.col.c-prd').slice(1, 7).each((i, el) => {
                const title = $(el).find('h3.name').text();
                const price = $(el).find('div.prc').text();
                const link = $(el).find('a.core').attr('href');
                const image = $(el).find('img.img').attr('data-src') || $(el).find('img.img').attr('src');
                if (title && link) {
                    alternatives.push({ storeName: "Jumia EG", title, price, productUrl: `https://www.jumia.com.eg${link}`, imageUrl: image, isFound: true });
                }
            });

            return { exactMatch, alternatives };
        }
    },
    {
        name: "Noon EG",
        search: async (query) => {
            const url = `https://www.noon.com/egypt-ar/search/?q=${encodeURIComponent(query)}`;
            const html = await safeFetchHtml(url);
            const $ = cheerio.load(html);
            
            // استخراج الـ JSON المخفي الخاص بـ Next.js
            const nextData = $('#__NEXT_DATA__').html();
            if (!nextData) throw new Error("Noon data structure not found");
            
            const jsonData = JSON.parse(nextData);
            // التوغل داخل شجرة الـ JSON للوصول إلى المنتجات
            const products = jsonData.props.pageProps.catalog.hits;
            
            if (!products || products.length === 0) throw new Error("Not found");

            // 1. التطابق الدقيق (أول منتج)
            const exact = products[0];
            let exactMatch = {
                storeName: "Noon EG",
                title: exact.name,
                price: `${exact.price} ج.م`,
                productUrl: `https://www.noon.com/egypt-ar/${exact.url}/p/`,
                imageUrl: `https://f.nooncdn.com/p/${exact.image_key}.jpg`,
                isFound: true
            };

            // 2. استخراج البدائل (من المنتج الثاني حتى السابع)
            const alternatives = [];
            const altProducts = products.slice(1, 7);
            altProducts.forEach(prod => {
                alternatives.push({
                    storeName: "Noon EG",
                    title: prod.name,
                    price: `${prod.price} ج.م`,
                    productUrl: `https://www.noon.com/egypt-ar/${prod.url}/p/`,
                    imageUrl: `https://f.nooncdn.com/p/${prod.image_key}.jpg`,
                    isFound: true
                });
            });

            return { exactMatch, alternatives };
        }
    }
    // يمكن تطبيق نفس نمط الـ slice(1, 7) لباقي המتاجر (B.TECH, Noon, etc.)
];

function filterAccurateResults(query, rawResults) {
    const exclusionKeywords = ["جراب", "كفر", "غطاء", "سكرينة", "شاحن", "كابل", "cover", "case", "screen protector"];
    return rawResults.map(result => {
        if (!result.isFound) return result;
        const isAccessory = exclusionKeywords.some(kw => result.title.toLowerCase().includes(kw));
        if (!query.toLowerCase().includes("جراب") && !query.toLowerCase().includes("cover") && isAccessory) {
            return { ...result, isFound: false };
        }
        return result;
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "برجاء إدخال اسم المنتج" });

    const normalizedQuery = query.toLowerCase().trim();
    const now = Date.now();

    if (cache.has(normalizedQuery)) {
        const cachedData = cache.get(normalizedQuery);
        if (now - cachedData.timestamp < CACHE_TTL) {
            return res.status(200).json(cachedData.results);
        }
    }

    const searchPromises = parsers.map(parser => parser.search(query));
    const resultsSettled = await Promise.allSettled(searchPromises);

    // تجميع التطابقات الدقيقة
    let exactMatches = resultsSettled
        .filter(r => r.status === 'fulfilled' && r.value.exactMatch.isFound)
        .map(r => r.value.exactMatch);
    
    exactMatches = filterAccurateResults(query, exactMatches).filter(m => m.isFound);

    // تجميع كل البدائل واختيار أفضل 6 فقط
    let allAlternatives = [];
    resultsSettled.forEach(r => {
        if (r.status === 'fulfilled' && r.value.alternatives) {
            allAlternatives.push(...r.value.alternatives);
        }
    });
    allAlternatives = filterAccurateResults(query, allAlternatives).filter(a => a.isFound);
    
    // خلط البدائل للحصول على تنوع من المتاجر المختلفة، ثم اختيار 6
    const shuffledAlternatives = allAlternatives.sort(() => 0.5 - Math.random());
    const top6Suggestions = shuffledAlternatives.slice(0, 6);

    const finalResponse = {
        exactMatches,
        suggestions: top6Suggestions
    };

    cache.set(normalizedQuery, { results: finalResponse, timestamp: now });
    res.status(200).json(finalResponse);
};
