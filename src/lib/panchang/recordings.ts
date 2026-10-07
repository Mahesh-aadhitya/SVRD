// Recitations of each Alwar's works and of the Acharyas' tanians and hymns,
// from two YouTube channels: Amutham Music (the complete Nalayira Divya
// Prabandham by K. Malola Kannan & N S Ranganathan, and Sanskrit stotras)
// and STD Pathasala (Swami Sriramabharati's devaganam / araiyar sevai).
// They are embedded with YouTube's player, never copied, so plays and
// credit stay with the channels.
import type { Named } from "./names";

export type RecordingChannel = "amutham" | "std";

export type Recording = {
  /** YouTube video id. */
  id: string;
  title: Named;
  channel: RecordingChannel;
  /** Performers, when the channel names them. */
  artist?: string;
};

export const CHANNELS: Record<RecordingChannel, { name: string; url: string }> = {
  amutham: { name: "Amutham Music", url: "https://www.youtube.com/@AmuthamMusic" },
  std: { name: "STD Pathasala", url: "https://www.youtube.com/channel/UCAYgGOV4a0tx4uM4A5deO3w" },
};

const n = (en: string, kn: string): Named => ({ en, kn });
const MK = "K. Malola Kannan & N S Ranganathan";
const amutham = (id: string, title: Named, artist = MK): Recording => ({ id, title, channel: "amutham", artist });
const std = (id: string, title: Named): Recording => ({ id, title, channel: "std", artist: "Swami Sriramabharati & STD Pathasala" });

// The tanians of all the Acharyas, in order (Mudaliyandan Swami Thirumaaligai).
const GURUPARAMPARA = amutham(
  "uL6kXwX-u8o",
  n("Guruparampara tanians", "ಗುರುಪರಂಪರಾ ತನಿಯನ್‌ಗಳು"),
  "Sri Mudaliyandan Swami Thirumaaligai nityanusandhanam",
);

/** Recordings for each Alwar/Acharya, by slug — their own works first. */
export const RECORDINGS: Record<string, Recording[]> = {
  "poigai-alwar": [amutham("YSu0HH3EUG8", n("Mudhal Tiruvandhadhi — complete", "ಮುದಲ್ ತಿರುವಂದಾದಿ — ಸಂಪೂರ್ಣ"))],
  bhoothathalwar: [amutham("YZhTqvRo5Vc", n("Irandam Tiruvandhadhi — complete", "ಇರಂಡಾಮ್ ತಿರುವಂದಾದಿ — ಸಂಪೂರ್ಣ"))],
  peyalwar: [amutham("XFwf4931fDQ", n("Moondram Tiruvandhadhi — complete", "ಮೂನ್ರಾಮ್ ತಿರುವಂದಾದಿ — ಸಂಪೂರ್ಣ"))],
  "tirumazhisai-alwar": [
    amutham("2NMkv4Bh-cA", n("Naanmugan Tiruvandhadhi — complete", "ನಾನ್ಮುಗನ್ ತಿರುವಂದಾದಿ — ಸಂಪೂರ್ಣ")),
    amutham("zJHLGyZWFaQ", n("Tiruchanda Viruttam — complete", "ತಿರುಚ್ಚಂದ ವಿರುತ್ತಂ — ಸಂಪೂರ್ಣ")),
    std("1q2BXcUG7DY", n("Tiruchanda Viruttam — devaganam", "ತಿರುಚ್ಚಂದ ವಿರುತ್ತಂ — ದೇವಗಾನ")),
  ],
  nammalwar: [
    amutham("u7_NKhPDFHo", n("Tiruvaimozhi — first decad", "ತಿರುವಾಯ್ಮೊಳಿ — ಮೊದಲ ಪತ್ತು")),
    amutham("G_k8HufTROo", n("Tiruviruttam — complete", "ತಿರುವಿರುತ್ತಂ — ಸಂಪೂರ್ಣ")),
    amutham("dQ-BZN9rWQI", n("Tiruvasiriyam — complete", "ತಿರುವಾಸಿರಿಯಂ — ಸಂಪೂರ್ಣ")),
    amutham("NOckKvo74g0", n("Periya Tiruvandhadhi — complete", "ಪೆರಿಯ ತಿರುವಂದಾದಿ — ಸಂಪೂರ್ಣ")),
    std("iIvAatENavI", n("Tiruvaimozhi tanians — devaganam", "ತಿರುವಾಯ್ಮೊಳಿ ತನಿಯನ್‌ಗಳು — ದೇವಗಾನ")),
    std("ivSwsZzIpzw", n("Tiruvaimozhi 1.10 \"Porumaneel padai\" — devaganam", "ತಿರುವಾಯ್ಮೊಳಿ 1.10 \"ಪೊರುಮಾನೀಳ್ ಪಡೈ\" — ದೇವಗಾನ")),
  ],
  "madhurakavi-alwar": [
    amutham("6HYT_a9UjPY", n("Kanninun Siruthambu — complete", "ಕಣ್ಣಿನುಣ್ ಸಿರುತ್ತಾಂಬು — ಸಂಪೂರ್ಣ")),
    std("kpUU0QQvYJs", n("Kanninun Siruthambu — devaganam", "ಕಣ್ಣಿನುಣ್ ಸಿರುತ್ತಾಂಬು — ದೇವಗಾನ")),
  ],
  "kulasekhara-alwar": [amutham("cYoXRhg2hFs", n("Perumal Tirumozhi — complete", "ಪೆರುಮಾಳ್ ತಿರುಮೊಳಿ — ಸಂಪೂರ್ಣ"))],
  periyalwar: [
    amutham("F59cDHRO_bE", n("Tiruppallandu", "ತಿರುಪ್ಪಲ್ಲಾಂಡು")),
    amutham("-5N6_4IrFGA", n("Periyalwar Tirumozhi — first decad", "ಪೆರಿಯಾಳ್ವಾರ್ ತಿರುಮೊಳಿ — ಮೊದಲ ಪತ್ತು")),
    std("GLujjOUGRZM", n("Tiruppallandu — devaganam", "ತಿರುಪ್ಪಲ್ಲಾಂಡು — ದೇವಗಾನ")),
  ],
  andal: [
    amutham("W8Rvh87SJnE", n("Tiruppavai — complete", "ತಿರುಪ್ಪಾವೈ — ಸಂಪೂರ್ಣ")),
    amutham("mb9sBxneC_U", n("Nachiyar Tirumozhi — complete", "ನಾಚ್ಚಿಯಾರ್ ತಿರುಮೊಳಿ — ಸಂಪೂರ್ಣ")),
    std("fXFqdDqJk68", n("Tiruppavai — Devagana Utsavam 2024", "ತಿರುಪ್ಪಾವೈ — ದೇವಗಾನ ಉತ್ಸವ 2024")),
    std("p7RxjeV7XPo", n("Nachiyar Tirumozhi tanians — devaganam", "ನಾಚ್ಚಿಯಾರ್ ತಿರುಮೊಳಿ ತನಿಯನ್‌ಗಳು — ದೇವಗಾನ")),
  ],
  "thondaradippodi-alwar": [
    amutham("-y8__0dy_Tc", n("Tirumalai — complete", "ತಿರುಮಾಲೈ — ಸಂಪೂರ್ಣ")),
    amutham("MC9hbPRW0pc", n("Tiruppalliyezhuchi — complete", "ತಿರುಪ್ಪಳ್ಳಿಯೆಳುಚ್ಚಿ — ಸಂಪೂರ್ಣ")),
    std("JwXWYjZzvKc", n("Amalanadhipiran & Tirumalai — araiyar sevai at Uraiyur", "ಅಮಲನಾದಿಪಿರಾನ್ ಮತ್ತು ತಿರುಮಾಲೈ — ಉರೈಯೂರಿನಲ್ಲಿ ಅರೈಯರ್ ಸೇವೆ")),
  ],
  tiruppanalwar: [
    amutham("GkYdvFzUWOk", n("Amalanadhipiran — complete", "ಅಮಲನಾದಿಪಿರಾನ್ — ಸಂಪೂರ್ಣ")),
    std("JwXWYjZzvKc", n("Amalanadhipiran & Tirumalai — araiyar sevai at Uraiyur", "ಅಮಲನಾದಿಪಿರಾನ್ ಮತ್ತು ತಿರುಮಾಲೈ — ಉರೈಯೂರಿನಲ್ಲಿ ಅರೈಯರ್ ಸೇವೆ")),
  ],
  "tirumangai-alwar": [
    amutham("9uDQrKmiGls", n("Periya Tirumozhi — first decad", "ಪೆರಿಯ ತಿರುಮೊಳಿ — ಮೊದಲ ಪತ್ತು")),
    amutham("e-HVfIEMCsg", n("Tirukkurunthandakam — complete", "ತಿರುಕ್ಕುರುಂದಾಂಡಕಂ — ಸಂಪೂರ್ಣ")),
    amutham("EKMWU6iLlfI", n("Tiruvezhukkootrirukkai — complete", "ತಿರುವೆಳುಕ್ಕೂಟ್ರಿರುಕ್ಕೈ — ಸಂಪೂರ್ಣ")),
    amutham("q2oMVN3v2RE", n("Siriya Tirumadal — complete", "ಸಿರಿಯ ತಿರುಮಡಲ್ — ಸಂಪೂರ್ಣ")),
    amutham("nL1i43VQJWY", n("Periya Tirumadal — complete", "ಪೆರಿಯ ತಿರುಮಡಲ್ — ಸಂಪೂರ್ಣ")),
    std("TXBaM1H7m18", n("Periya Tirumozhi tanians — devaganam", "ಪೆರಿಯ ತಿರುಮೊಳಿ ತನಿಯನ್‌ಗಳು — ದೇವಗಾನ")),
    std("CY7d4x_Z33A", n("Periya Tirumozhi — Devagana Utsavam 2026", "ಪೆರಿಯ ತಿರುಮೊಳಿ — ದೇವಗಾನ ಉತ್ಸವ 2026")),
  ],

  nathamuni: [GURUPARAMPARA],
  alavandar: [amutham("6X2pzg5gjEA", n("Stotra Ratnam", "ಸ್ತೋತ್ರರತ್ನ"), "K. Malola Kannan"), GURUPARAMPARA],
  "periya-nambi": [GURUPARAMPARA],
  "tirukkachi-nambi": [GURUPARAMPARA],
  ramanuja: [amutham("-PkD67xhHf0", n("Ramanusa Nootrandhadhi — complete", "ರಾಮಾನುಜ ನೂಟ್ರಂದಾದಿ — ಸಂಪೂರ್ಣ")), GURUPARAMPARA],
  mudaliyandan: [GURUPARAMPARA],
  kurathalwan: [
    amutham("IM74A3E0ws8", n("Varadaraja Stavam — excerpt", "ವರದರಾಜಸ್ತವ — ಭಾಗ"), "Dr. Nirmala Sundarrajan"),
    GURUPARAMPARA,
  ],
  embar: [GURUPARAMPARA],
  "parashara-bhattar": [
    amutham("rFWr3mwv2jY", n("Sri Rangaraja Stavam", "ಶ್ರೀ ರಂಗರಾಜಸ್ತವ"), "Sri Prativadi Bhayankaram Annangaracharya Swami"),
    GURUPARAMPARA,
  ],
  "pillai-lokacharya": [GURUPARAMPARA],
  "vedanta-desikar": [
    amutham("0zhWV393WPY", n("Sri Vedanta Desika Mangalam", "ಶ್ರೀ ವೇದಾಂತ ದೇಶಿಕ ಮಂಗಳಂ")),
    amutham("QeWokGVczT0", n("Desika Stotrams", "ದೇಶಿಕ ಸ್ತೋತ್ರಗಳು")),
    GURUPARAMPARA,
  ],
  "manavala-mamunigal": [
    amutham("fcCe6QJiFaQ", n("Upadesa Ratnamalai & Tiruvaimozhi Nootrandhadhi", "ಉಪದೇಶರತ್ನಮಾಲೈ ಮತ್ತು ತಿರುವಾಯ್ಮೊಳಿ ನೂಟ್ರಂದಾದಿ"), "M.A. Venkatakrishnan"),
    GURUPARAMPARA,
  ],
  chakrathalwar: [
    amutham("4Ll68NMbWYY", n("Sudarshana Ashtakam (Desikar)", "ಸುದರ್ಶನಾಷ್ಟಕ (ದೇಶಿಕರ್)"), "Nagai Veeraraghavachariyar"),
    amutham("VFGj8Y-oTDU", n("Shodashayudha Stotram", "ಷೋಡಶಾಯುಧ ಸ್ತೋತ್ರ"), "K. Malola Kannan"),
  ],
  garudalwar: [
    amutham("PbMEpDOMrRQ", n("Garuda Dandakam (Desikar)", "ಗರುಡದಂಡಕ (ದೇಶಿಕರ್)"), "Nagai Veeraraghavachariyar"),
    amutham("6csilDp2gJE", n("Garuda Panchashat (Desikar)", "ಗರುಡಪಂಚಾಶತ್ (ದೇಶಿಕರ್)"), "U.Ve. Anantha Padmanabachar"),
  ],
};

/** The tanians recited before the Divya Prabandham, for the index page. */
export const PRABANDHAM_TANIANS: Recording[] = [
  std("JKJjzN_EZHg", n("Tanians — devaganam", "ತನಿಯನ್‌ಗಳು — ದೇವಗಾನ")),
  amutham("FyV4ECQHEfc", n("Divya Prabandha tanians", "ದಿವ್ಯ ಪ್ರಬಂಧ ತನಿಯನ್‌ಗಳು"), "M.V. Ananta Padmanabachar & group"),
  GURUPARAMPARA,
];
