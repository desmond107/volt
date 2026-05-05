export const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CNY: 7.24, INR: 83.1,
  CAD: 1.36, AUD: 1.53, CHF: 0.89, HKD: 7.82, SGD: 1.34, SEK: 10.42,
  NOK: 10.55, DKK: 6.88, NZD: 1.63, MXN: 17.15, BRL: 4.97, ZAR: 18.63,
  KES: 129.5, NGN: 1615, GHS: 12.7, UGX: 3760, TZS: 2540, ETB: 56.8,
  MAD: 10.02, EGP: 30.9, TND: 3.12, DZD: 134.5, XOF: 602, XAF: 602,
  AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.307, BHD: 0.376, OMR: 0.385,
  ILS: 3.65, TRY: 32.1, RUB: 90.2, PLN: 3.97, CZK: 22.7, HUF: 355,
  RON: 4.58, UAH: 38.9, PKR: 278, BDT: 109.5, LKR: 317, THB: 35.1,
  MYR: 4.72, IDR: 15780, PHP: 56.4, VND: 24350, KRW: 1325, TWD: 31.7,
  ARS: 877, CLP: 945, COP: 3950, PEN: 3.72, BOB: 6.91, UYU: 38.5,
  PYG: 7350, GTQ: 7.79, CRC: 528, DOP: 57.1, JMD: 155, TTD: 6.78,
  NAD: 18.63, BWP: 13.6, ZMW: 26.4, MZN: 63.9, MGA: 4480, RWF: 1285,
  MDL: 17.7, GEL: 2.65, AZN: 1.70, KZT: 450, AMD: 399, MNT: 3400,
  KHR: 4065, NPR: 133, ISK: 138, FJD: 2.25, NIO: 36.6, HNL: 24.7,
  PAB: 1.0, BBD: 2.0, XCD: 2.70, AWG: 1.79, SCR: 13.8, MUR: 45.2,
  BIF: 2855, GMD: 67.5, SLL: 22000, GNF: 8600, MWK: 1730, AOA: 840,
  CDF: 2745, DJF: 177.7, SOS: 571, MKD: 56.7, ALL: 101, BAM: 1.8,
  RSD: 108, BGN: 1.8, UZS: 12580, KGS: 89.1, TJS: 10.9, TMT: 3.51,
  LAK: 21250, MMK: 2098, AFN: 70.9, IQD: 1310, YER: 250, JOD: 0.709,
  PGK: 3.74, WST: 2.73, TOP: 2.36, VUV: 120, SBD: 8.42,
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen",
  CNY: "Chinese Yuan", INR: "Indian Rupee", CAD: "Canadian Dollar",
  AUD: "Australian Dollar", CHF: "Swiss Franc", HKD: "Hong Kong Dollar",
  SGD: "Singapore Dollar", SEK: "Swedish Krona", NOK: "Norwegian Krone",
  DKK: "Danish Krone", NZD: "New Zealand Dollar", MXN: "Mexican Peso",
  BRL: "Brazilian Real", ZAR: "South African Rand", KES: "Kenyan Shilling",
  NGN: "Nigerian Naira", GHS: "Ghanaian Cedi", UGX: "Ugandan Shilling",
  TZS: "Tanzanian Shilling", ETB: "Ethiopian Birr", MAD: "Moroccan Dirham",
  EGP: "Egyptian Pound", TND: "Tunisian Dinar", DZD: "Algerian Dinar",
  XOF: "West African CFA Franc", XAF: "Central African CFA Franc",
  AED: "UAE Dirham", SAR: "Saudi Riyal", QAR: "Qatari Riyal",
  KWD: "Kuwaiti Dinar", BHD: "Bahraini Dinar", OMR: "Omani Rial",
  ILS: "Israeli Shekel", TRY: "Turkish Lira", RUB: "Russian Ruble",
  PLN: "Polish Zloty", CZK: "Czech Koruna", HUF: "Hungarian Forint",
  RON: "Romanian Leu", UAH: "Ukrainian Hryvnia", PKR: "Pakistani Rupee",
  BDT: "Bangladeshi Taka", LKR: "Sri Lankan Rupee", THB: "Thai Baht",
  MYR: "Malaysian Ringgit", IDR: "Indonesian Rupiah", PHP: "Philippine Peso",
  VND: "Vietnamese Dong", KRW: "South Korean Won", TWD: "Taiwan Dollar",
  ARS: "Argentine Peso", CLP: "Chilean Peso", COP: "Colombian Peso",
  PEN: "Peruvian Sol", BOB: "Bolivian Boliviano", UYU: "Uruguayan Peso",
  PYG: "Paraguayan Guaraní", GTQ: "Guatemalan Quetzal", CRC: "Costa Rican Colón",
  DOP: "Dominican Peso", JMD: "Jamaican Dollar", TTD: "Trinidad Dollar",
  NAD: "Namibian Dollar", BWP: "Botswana Pula", ZMW: "Zambian Kwacha",
  MZN: "Mozambican Metical", MGA: "Malagasy Ariary", RWF: "Rwandan Franc",
  MDL: "Moldovan Leu", GEL: "Georgian Lari", AZN: "Azerbaijani Manat",
  KZT: "Kazakhstani Tenge", AMD: "Armenian Dram", MNT: "Mongolian Tögrög",
  KHR: "Cambodian Riel", NPR: "Nepalese Rupee", ISK: "Icelandic Króna",
  FJD: "Fijian Dollar", NIO: "Nicaraguan Córdoba", HNL: "Honduran Lempira",
  PAB: "Panamanian Balboa", BBD: "Barbadian Dollar", XCD: "East Caribbean Dollar",
  AWG: "Aruban Florin", SCR: "Seychellois Rupee", MUR: "Mauritian Rupee",
  BIF: "Burundian Franc", GMD: "Gambian Dalasi", SLL: "Sierra Leonean Leone",
  GNF: "Guinean Franc", MWK: "Malawian Kwacha", AOA: "Angolan Kwanza",
  CDF: "Congolese Franc", DJF: "Djiboutian Franc", SOS: "Somali Shilling",
  MKD: "Macedonian Denar", ALL: "Albanian Lek", BAM: "Bosnian Mark",
  RSD: "Serbian Dinar", BGN: "Bulgarian Lev", UZS: "Uzbekistani Som",
  KGS: "Kyrgyzstani Som", TJS: "Tajikistani Somoni", TMT: "Turkmenistani Manat",
  LAK: "Lao Kip", MMK: "Myanmar Kyat", AFN: "Afghan Afghani",
  IQD: "Iraqi Dinar", YER: "Yemeni Rial", JOD: "Jordanian Dinar",
  PGK: "Papua New Guinean Kina", WST: "Samoan Tālā", TOP: "Tongan Paʻanga",
  VUV: "Vanuatu Vatu", SBD: "Solomon Islands Dollar",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", INR: "₹",
  KES: "KSh", NGN: "₦", GHS: "₵", ZAR: "R", EGP: "£", ILS: "₪",
  TRY: "₺", RUB: "₽", PLN: "zł", HUF: "Ft", THB: "฿", KRW: "₩",
  VND: "₫", PHP: "₱", BDT: "৳", PKR: "₨", LKR: "₨", NPR: "₨",
  MYR: "RM", IDR: "Rp", ARS: "ARS", CLP: "CLP", COP: "COP",
  AED: "د.إ", SAR: "﷼", QAR: "﷼", KWD: "KD", BHD: "BD", OMR: "OMR",
};

let cachedRates: Record<string, number> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

export async function getRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && now - cacheTime < CACHE_TTL) return cachedRates;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        cachedRates = data.rates;
        cacheTime = now;
        return data.rates;
      }
    }
  } catch { /* fall through */ }
  return FALLBACK_RATES;
}

export function convertAmount(amount: number, from: string, to: string, rates: Record<string, number>): number {
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return (amount / fromRate) * toRate;
}
