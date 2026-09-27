export type LocalizedText = { en: string; kn: string };

export type Pooja = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  timing: string;
  isBookable: boolean;
  image: string;
};

export type Seva = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number; // 0 = free
  capacityPerSlot: number;
};

export type TempleEvent = {
  id: string;
  title: LocalizedText;
  date: string; // ISO date
  description: LocalizedText;
  image: string;
};

export type GalleryItem = {
  id: string;
  type: "photo" | "video";
  album: string;
  image: string;
  youtubeId?: string;
};

export type Song = {
  id: string;
  title: LocalizedText;
  category: string;
  duration: string;
};

export const poojas: Pooja[] = [
  {
    id: "suprabhata-seva",
    name: { en: "Suprabhata Seva", kn: "ಸುಪ್ರಭಾತ ಸೇವೆ" },
    description: {
      en: "The Lord is woken with sacred verses at the break of dawn.",
      kn: "ಮುಂಜಾನೆ ಪವಿತ್ರ ಶ್ಲೋಕಗಳೊಂದಿಗೆ ಸ್ವಾಮಿಯನ್ನು ಎಬ್ಬಿಸಲಾಗುತ್ತದೆ.",
    },
    timing: "5:30 AM",
    isBookable: false,
    image: "/images/placeholder-pooja-1.svg",
  },
  {
    id: "abhishekam",
    name: { en: "Abhishekam", kn: "ಅಭಿಷೇಕ" },
    description: {
      en: "Sacred bathing ritual of the deity with milk, curd, honey and holy water.",
      kn: "ಹಾಲು, ಮೊಸರು, ಜೇನುತುಪ್ಪ ಮತ್ತು ಪವಿತ್ರ ಜಲದಿಂದ ದೇವರಿಗೆ ಅಭಿಷೇಕ.",
    },
    timing: "6:30 AM",
    isBookable: true,
    image: "/images/placeholder-pooja-2.svg",
  },
  {
    id: "archana",
    name: { en: "Archana", kn: "ಅರ್ಚನೆ" },
    description: {
      en: "Chanting of the Lord's names offered with flowers on your behalf.",
      kn: "ನಿಮ್ಮ ಪರವಾಗಿ ಹೂವುಗಳೊಂದಿಗೆ ಸ್ವಾಮಿಯ ನಾಮಗಳ ಜಪ.",
    },
    timing: "8:00 AM – 12:00 PM",
    isBookable: true,
    image: "/images/placeholder-pooja-3.svg",
  },
  {
    id: "maha-arati",
    name: { en: "Maha Arati", kn: "ಮಹಾ ಆರತಿ" },
    description: {
      en: "The grand evening arati with lamps, music and chanting.",
      kn: "ದೀಪಗಳು, ಸಂಗೀತ ಮತ್ತು ಜಪದೊಂದಿಗೆ ಸಂಜೆಯ ಭವ್ಯ ಆರತಿ.",
    },
    timing: "7:00 PM",
    isBookable: true,
    image: "/images/placeholder-pooja-4.svg",
  },
  {
    id: "ekanta-seva",
    name: { en: "Ekanta Seva", kn: "ಏಕಾಂತ ಸೇವೆ" },
    description: {
      en: "The final, quiet seva of the day before the sanctum closes.",
      kn: "ಗರ್ಭಗುಡಿ ಮುಚ್ಚುವ ಮೊದಲು ದಿನದ ಕೊನೆಯ, ಶಾಂತ ಸೇವೆ.",
    },
    timing: "9:00 PM",
    isBookable: false,
    image: "/images/placeholder-pooja-5.svg",
  },
];

export const sevas: Seva[] = [
  {
    id: "abhishekam",
    name: { en: "Abhishekam", kn: "ಅಭಿಷೇಕ" },
    description: {
      en: "Book a special abhishekam performed in your family's name.",
      kn: "ನಿಮ್ಮ ಕುಟುಂಬದ ಹೆಸರಿನಲ್ಲಿ ವಿಶೇಷ ಅಭಿಷೇಕವನ್ನು ಕಾಯ್ದಿರಿಸಿ.",
    },
    price: 501,
    capacityPerSlot: 10,
  },
  {
    id: "archana",
    name: { en: "Archana", kn: "ಅರ್ಚನೆ" },
    description: {
      en: "A simple archana with flowers, offered in your name.",
      kn: "ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ಹೂವುಗಳೊಂದಿಗೆ ಸರಳ ಅರ್ಚನೆ.",
    },
    price: 0,
    capacityPerSlot: 50,
  },
  {
    id: "maha-arati",
    name: { en: "Maha Arati Sponsorship", kn: "ಮಹಾ ಆರತಿ ಪ್ರಾಯೋಜಕತ್ವ" },
    description: {
      en: "Sponsor the evening's grand arati and receive the first prasada.",
      kn: "ಸಂಜೆಯ ಭವ್ಯ ಆರತಿಯನ್ನು ಪ್ರಾಯೋಜಿಸಿ ಮತ್ತು ಮೊದಲ ಪ್ರಸಾದ ಪಡೆಯಿರಿ.",
    },
    price: 1116,
    capacityPerSlot: 1,
  },
  {
    id: "annadanam",
    name: { en: "Annadanam Seva", kn: "ಅನ್ನದಾನ ಸೇವೆ" },
    description: {
      en: "Contribute towards a day's free meals for devotees.",
      kn: "ಭಕ್ತರಿಗೆ ಒಂದು ದಿನದ ಉಚಿತ ಪ್ರಸಾದಕ್ಕೆ ಕೊಡುಗೆ ನೀಡಿ.",
    },
    price: 0,
    capacityPerSlot: 5,
  },
];

export const events: TempleEvent[] = [
  {
    id: "brahmotsavam",
    title: { en: "Brahmotsavam", kn: "ಬ್ರಹ್ಮೋತ್ಸವಂ" },
    date: "2026-10-12",
    description: {
      en: "Nine days of grand processions and special poojas.",
      kn: "ಒಂಬತ್ತು ದಿನಗಳ ಭವ್ಯ ಉತ್ಸವಗಳು ಮತ್ತು ವಿಶೇಷ ಪೂಜೆಗಳು.",
    },
    image: "/images/placeholder-event-1.svg",
  },
  {
    id: "vaikunta-ekadasi",
    title: { en: "Vaikunta Ekadasi", kn: "ವೈಕುಂಠ ಏಕಾದಶಿ" },
    date: "2026-12-19",
    description: {
      en: "Special darshan through the sacred Vaikunta Dwara.",
      kn: "ಪವಿತ್ರ ವೈಕುಂಠ ದ್ವಾರದ ಮೂಲಕ ವಿಶೇಷ ದರ್ಶನ.",
    },
    image: "/images/placeholder-event-2.svg",
  },
  {
    id: "ugadi",
    title: { en: "Ugadi Celebrations", kn: "ಯುಗಾದಿ ಆಚರಣೆ" },
    date: "2027-03-19",
    description: {
      en: "New year celebrations with panchanga shravanam.",
      kn: "ಪಂಚಾಂಗ ಶ್ರವಣದೊಂದಿಗೆ ಹೊಸ ವರ್ಷದ ಆಚರಣೆ.",
    },
    image: "/images/placeholder-event-3.svg",
  },
];

export const gallery: GalleryItem[] = [
  { id: "g1", type: "photo", album: "Temple", image: "/images/placeholder-gallery-1.svg" },
  { id: "g2", type: "photo", album: "Festivals", image: "/images/placeholder-gallery-2.svg" },
  { id: "g3", type: "photo", album: "Sevas", image: "/images/placeholder-gallery-3.svg" },
  { id: "g4", type: "video", album: "Festivals", image: "/images/placeholder-gallery-4.svg", youtubeId: "dQw4w9WgXcQ" },
  { id: "g5", type: "photo", album: "Temple", image: "/images/placeholder-gallery-5.svg" },
  { id: "g6", type: "photo", album: "Sevas", image: "/images/placeholder-gallery-6.svg" },
];

export const songs: Song[] = [
  { id: "s1", title: { en: "Venkateshwara Suprabhatam", kn: "ವೆಂಕಟೇಶ್ವರ ಸುಪ್ರಭಾತಂ" }, category: "Suprabhatam", duration: "12:40" },
  { id: "s2", title: { en: "Govinda Namalu", kn: "ಗೋವಿಂದ ನಾಮಾಲು" }, category: "Bhajan", duration: "6:15" },
  { id: "s3", title: { en: "Varadaraja Ashtakam", kn: "ವರದರಾಜ ಅಷ್ಟಕಂ" }, category: "Stotram", duration: "8:02" },
  { id: "s4", title: { en: "Evening Arati", kn: "ಸಂಜೆಯ ಆರತಿ" }, category: "Aarti", duration: "4:30" },
];

export const templeInfo = {
  name: "Sri Varadaraja Swamy Devasthaanam",
  addressLine1: "Temple Street, Near Main Bazaar",
  addressLine2: "Karnataka, India – 000000",
  phone: "+91 00000 00000",
  email: "info@varadarajaswamytemple.org",
  mapsQuery: "Sri Varadaraja Swamy Devasthaanam",
  timings: [
    { day: "Mon – Fri", hours: "5:30 AM – 9:00 PM" },
    { day: "Sat – Sun", hours: "5:00 AM – 9:30 PM" },
  ],
};

export const liveConfig = {
  isLive: false,
  youtubeId: "",
  scheduledAt: "Daily, 7:00 PM – Maha Arati",
  archive: [
    { id: "a1", title: { en: "Brahmotsavam Day 3", kn: "ಬ್ರಹ್ಮೋತ್ಸವಂ ದಿನ 3" }, youtubeId: "dQw4w9WgXcQ" },
    { id: "a2", title: { en: "Vaikunta Ekadasi Darshan", kn: "ವೈಕುಂಠ ಏಕಾದಶಿ ದರ್ಶನ" }, youtubeId: "dQw4w9WgXcQ" },
  ],
};

export type Booking = {
  id: string;
  sevaId: string;
  date: string;
  devoteeName: string;
  phone: string;
  amount: number;
  status: "confirmed" | "pending" | "cancelled";
};

export const bookings: Booking[] = [
  { id: "b1", sevaId: "abhishekam", date: "2026-09-21", devoteeName: "Ramesh Iyer", phone: "+91 98765 43210", amount: 501, status: "confirmed" },
  { id: "b2", sevaId: "archana", date: "2026-09-21", devoteeName: "Lakshmi Rao", phone: "+91 91234 56789", amount: 0, status: "confirmed" },
  { id: "b3", sevaId: "maha-arati", date: "2026-09-22", devoteeName: "Suresh Gowda", phone: "+91 99887 66554", amount: 1116, status: "pending" },
  { id: "b4", sevaId: "annadanam", date: "2026-09-23", devoteeName: "Anitha Shetty", phone: "+91 90000 11122", amount: 0, status: "confirmed" },
];

export type AdminComment = {
  id: string;
  author: string;
  text: string;
  context: string;
  status: "pending" | "approved" | "hidden";
};

export const adminComments: AdminComment[] = [
  { id: "c1", author: "Devika S.", text: "Beautiful darshan today, thank you!", context: "Live – Maha Arati", status: "pending" },
  { id: "c2", author: "Krishna Murthy", text: "Could you share the Brahmotsavam schedule?", context: "Gallery – Festivals", status: "approved" },
  { id: "c3", author: "Anonymous", text: "Spam link removed by filter", context: "Live – Suprabhatam", status: "hidden" },
];
