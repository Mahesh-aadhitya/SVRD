// The day's verse for the panchangam: from the Bhagavad Gita, the Vishnu
// Sahasranama and the Nalayira Divya Prabandham, with its meaning in
// Kannada and English. Sanskrit is given in Kannada script and in IAST;
// the Alwars' Tamil in Tamil script, in Kannada script and romanised.
import type { Named } from "./names";
import type { Observance } from "./rules";

export type Verse = {
  id: string;
  source: Named;
  kn: string; // the verse in Kannada script
  roman: string;
  tamil?: string;
  meaning: Named;
};

const v = (id: string, source: Named, kn: string, roman: string, meaning: Named, tamil?: string): Verse => ({
  id,
  source,
  kn,
  roman,
  meaning,
  tamil,
});
const n = (en: string, kn: string): Named => ({ en, kn });

const GITA = (ch: number, verse: number) => n(`Bhagavad Gita ${ch}.${verse}`, `ಭಗವದ್ಗೀತೆ ${ch}.${verse}`);
const VS = (part: string, partKn: string) => n(`Sri Vishnu Sahasranama · ${part}`, `ಶ್ರೀ ವಿಷ್ಣು ಸಹಸ್ರನಾಮ · ${partKn}`);

export const VERSES: Verse[] = [
  // ── Bhagavad Gita ──
  v(
    "bg-2-47",
    GITA(2, 47),
    "ಕರ್ಮಣ್ಯೇವಾಧಿಕಾರಸ್ತೇ ಮಾ ಫಲೇಷು ಕದಾಚನ ।\nಮಾ ಕರ್ಮಫಲಹೇತುರ್ಭೂರ್ಮಾ ತೇ ಸಂಗೋಽಸ್ತ್ವಕರ್ಮಣಿ ॥",
    "karmaṇy evādhikāras te mā phaleṣu kadācana |\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi ||",
    n(
      "Your right is to the work alone, never to its fruits. Let the fruit of action not be your motive, nor let yourself cling to inaction.",
      "ಕರ್ಮ ಮಾಡುವುದರಲ್ಲಿ ಮಾತ್ರ ನಿನಗೆ ಅಧಿಕಾರ, ಅದರ ಫಲದಲ್ಲಿ ಎಂದಿಗೂ ಅಲ್ಲ. ಫಲದ ಆಸೆಯೇ ಕರ್ಮಕ್ಕೆ ಕಾರಣವಾಗದಿರಲಿ; ಕರ್ಮ ಮಾಡದಿರುವುದರಲ್ಲೂ ನಿನಗೆ ಆಸಕ್ತಿ ಬೇಡ.",
    ),
  ),
  v(
    "bg-4-7",
    GITA(4, 7),
    "ಯದಾ ಯದಾ ಹಿ ಧರ್ಮಸ್ಯ ಗ್ಲಾನಿರ್ಭವತಿ ಭಾರತ ।\nಅಭ್ಯುತ್ಥಾನಮಧರ್ಮಸ್ಯ ತದಾತ್ಮಾನಂ ಸೃಜಾಮ್ಯಹಮ್ ॥",
    "yadā yadā hi dharmasya glānir bhavati bhārata |\nabhyutthānam adharmasya tadātmānaṁ sṛjāmy aham ||",
    n(
      "Whenever dharma declines and adharma rises, O Bharata, then I bring Myself forth.",
      "ಓ ಭಾರತ, ಯಾವಾಗ ಯಾವಾಗ ಧರ್ಮಕ್ಕೆ ಹಾನಿಯಾಗಿ ಅಧರ್ಮ ತಲೆಯೆತ್ತುವುದೋ, ಆಗೆಲ್ಲಾ ನಾನು ಅವತರಿಸುತ್ತೇನೆ.",
    ),
  ),
  v(
    "bg-4-8",
    GITA(4, 8),
    "ಪರಿತ್ರಾಣಾಯ ಸಾಧೂನಾಂ ವಿನಾಶಾಯ ಚ ದುಷ್ಕೃತಾಮ್ ।\nಧರ್ಮಸಂಸ್ಥಾಪನಾರ್ಥಾಯ ಸಂಭವಾಮಿ ಯುಗೇ ಯುಗೇ ॥",
    "paritrāṇāya sādhūnāṁ vināśāya ca duṣkṛtām |\ndharma-saṁsthāpanārthāya sambhavāmi yuge yuge ||",
    n(
      "To protect the good, to destroy the wicked and to establish dharma firmly, I am born age after age.",
      "ಸಜ್ಜನರ ರಕ್ಷಣೆಗಾಗಿ, ದುಷ್ಟರ ವಿನಾಶಕ್ಕಾಗಿ ಮತ್ತು ಧರ್ಮವನ್ನು ನೆಲೆಗೊಳಿಸುವುದಕ್ಕಾಗಿ ನಾನು ಯುಗಯುಗದಲ್ಲೂ ಅವತರಿಸುತ್ತೇನೆ.",
    ),
  ),
  v(
    "bg-9-22",
    GITA(9, 22),
    "ಅನನ್ಯಾಶ್ಚಿಂತಯಂತೋ ಮಾಂ ಯೇ ಜನಾಃ ಪರ್ಯುಪಾಸತೇ ।\nತೇಷಾಂ ನಿತ್ಯಾಭಿಯುಕ್ತಾನಾಂ ಯೋಗಕ್ಷೇಮಂ ವಹಾಮ್ಯಹಮ್ ॥",
    "ananyāś cintayanto māṁ ye janāḥ paryupāsate |\nteṣāṁ nityābhiyuktānāṁ yoga-kṣemaṁ vahāmy aham ||",
    n(
      "Those who worship Me thinking of no other, ever united with Me — I Myself bring them what they lack and preserve what they have.",
      "ಬೇರೆ ಯಾವುದನ್ನೂ ಚಿಂತಿಸದೆ ನನ್ನನ್ನೇ ಉಪಾಸಿಸುವ, ಸದಾ ನನ್ನಲ್ಲಿ ನೆಲೆಸಿದ ಭಕ್ತರ ಯೋಗಕ್ಷೇಮವನ್ನು — ಇಲ್ಲದ್ದನ್ನು ಒದಗಿಸಿ ಇದ್ದುದನ್ನು ಕಾಪಾಡುವುದನ್ನು — ನಾನೇ ವಹಿಸಿಕೊಳ್ಳುತ್ತೇನೆ.",
    ),
  ),
  v(
    "bg-9-26",
    GITA(9, 26),
    "ಪತ್ರಂ ಪುಷ್ಪಂ ಫಲಂ ತೋಯಂ ಯೋ ಮೇ ಭಕ್ತ್ಯಾ ಪ್ರಯಚ್ಛತಿ ।\nತದಹಂ ಭಕ್ತ್ಯುಪಹೃತಮಶ್ನಾಮಿ ಪ್ರಯತಾತ್ಮನಃ ॥",
    "patraṁ puṣpaṁ phalaṁ toyaṁ yo me bhaktyā prayacchati |\ntad ahaṁ bhakty-upahṛtam aśnāmi prayatātmanaḥ ||",
    n(
      "Whoever offers Me with devotion a leaf, a flower, a fruit or a little water — that loving offering of the pure-hearted I gladly accept.",
      "ಭಕ್ತಿಯಿಂದ ಯಾರು ನನಗೆ ಎಲೆ, ಹೂವು, ಹಣ್ಣು ಅಥವಾ ನೀರನ್ನು ಅರ್ಪಿಸುತ್ತಾರೋ, ಶುದ್ಧ ಮನಸ್ಸಿನ ಅವರ ಆ ಭಕ್ತಿಯ ಕಾಣಿಕೆಯನ್ನು ನಾನು ಪ್ರೀತಿಯಿಂದ ಸ್ವೀಕರಿಸುತ್ತೇನೆ.",
    ),
  ),
  v(
    "bg-18-66",
    n("Bhagavad Gita 18.66 · Charama Shloka", "ಭಗವದ್ಗೀತೆ 18.66 · ಚರಮ ಶ್ಲೋಕ"),
    "ಸರ್ವಧರ್ಮಾನ್ಪರಿತ್ಯಜ್ಯ ಮಾಮೇಕಂ ಶರಣಂ ವ್ರಜ ।\nಅಹಂ ತ್ವಾ ಸರ್ವಪಾಪೇಭ್ಯೋ ಮೋಕ್ಷಯಿಷ್ಯಾಮಿ ಮಾ ಶುಚಃ ॥",
    "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja |\nahaṁ tvā sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ ||",
    n(
      "Giving up all other means, take refuge in Me alone. I shall release you from all sins — do not grieve.",
      "ಎಲ್ಲ ಧರ್ಮಗಳನ್ನೂ (ಉಪಾಯಗಳನ್ನೂ) ತೊರೆದು ನನ್ನೊಬ್ಬನನ್ನೇ ಶರಣು ಹೊಂದು. ನಾನು ನಿನ್ನನ್ನು ಎಲ್ಲ ಪಾಪಗಳಿಂದ ಬಿಡುಗಡೆ ಮಾಡುತ್ತೇನೆ; ದುಃಖಿಸಬೇಡ.",
    ),
  ),
  v(
    "bg-18-65",
    GITA(18, 65),
    "ಮನ್ಮನಾ ಭವ ಮದ್ಭಕ್ತೋ ಮದ್ಯಾಜೀ ಮಾಂ ನಮಸ್ಕುರು ।\nಮಾಮೇವೈಷ್ಯಸಿ ಸತ್ಯಂ ತೇ ಪ್ರತಿಜಾನೇ ಪ್ರಿಯೋಽಸಿ ಮೇ ॥",
    "man-manā bhava mad-bhakto mad-yājī māṁ namaskuru |\nmām evaiṣyasi satyaṁ te pratijāne priyo 'si me ||",
    n(
      "Fix your mind on Me, be devoted to Me, worship Me, bow to Me — and you shall come to Me. This I truly promise you, for you are dear to Me.",
      "ನನ್ನಲ್ಲೇ ಮನಸ್ಸಿಡು, ನನ್ನ ಭಕ್ತನಾಗು, ನನ್ನನ್ನು ಪೂಜಿಸು, ನನಗೆ ನಮಸ್ಕರಿಸು — ನೀನು ನನ್ನನ್ನೇ ಸೇರುವೆ. ನೀನು ನನಗೆ ಪ್ರಿಯನಾದ್ದರಿಂದ ಇದನ್ನು ಸತ್ಯವಾಗಿ ಪ್ರತಿಜ್ಞೆ ಮಾಡುತ್ತೇನೆ.",
    ),
  ),
  v(
    "bg-2-20",
    GITA(2, 20),
    "ನ ಜಾಯತೇ ಮ್ರಿಯತೇ ವಾ ಕದಾಚಿನ್ ನಾಯಂ ಭೂತ್ವಾ ಭವಿತಾ ವಾ ನ ಭೂಯಃ ।\nಅಜೋ ನಿತ್ಯಃ ಶಾಶ್ವತೋಽಯಂ ಪುರಾಣೋ ನ ಹನ್ಯತೇ ಹನ್ಯಮಾನೇ ಶರೀರೇ ॥",
    "na jāyate mriyate vā kadācin nāyaṁ bhūtvā bhavitā vā na bhūyaḥ |\najo nityaḥ śāśvato 'yaṁ purāṇo na hanyate hanyamāne śarīre ||",
    n(
      "The Self is never born and never dies; having been, it does not cease to be. Unborn, eternal, everlasting and ancient, it is not slain when the body is slain.",
      "ಆತ್ಮನು ಎಂದಿಗೂ ಹುಟ್ಟುವುದಿಲ್ಲ, ಸಾಯುವುದೂ ಇಲ್ಲ; ಇದ್ದು ಮತ್ತೆ ಇಲ್ಲವಾಗುವುದೂ ಇಲ್ಲ. ಜನ್ಮರಹಿತನೂ ನಿತ್ಯನೂ ಶಾಶ್ವತನೂ ಪುರಾತನನೂ ಆದ ಅವನು ದೇಹ ನಾಶವಾದರೂ ನಾಶವಾಗುವುದಿಲ್ಲ.",
    ),
  ),
  v(
    "bg-6-5",
    GITA(6, 5),
    "ಉದ್ಧರೇದಾತ್ಮನಾತ್ಮಾನಂ ನಾತ್ಮಾನಮವಸಾದಯೇತ್ ।\nಆತ್ಮೈವ ಹ್ಯಾತ್ಮನೋ ಬಂಧುರಾತ್ಮೈವ ರಿಪುರಾತ್ಮನಃ ॥",
    "uddhared ātmanātmānaṁ nātmānam avasādayet |\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ ||",
    n(
      "Lift yourself up by your own mind; never let yourself sink. The mind alone is one's friend, and the mind alone one's enemy.",
      "ತನ್ನನ್ನು ತಾನೇ ಮೇಲೆತ್ತಿಕೊಳ್ಳಬೇಕು, ತನ್ನನ್ನು ಕುಸಿಯಲು ಬಿಡಬಾರದು. ಮನಸ್ಸೇ ಮನುಷ್ಯನಿಗೆ ಬಂಧು, ಮನಸ್ಸೇ ಶತ್ರು.",
    ),
  ),
  v(
    "bg-6-30",
    GITA(6, 30),
    "ಯೋ ಮಾಂ ಪಶ್ಯತಿ ಸರ್ವತ್ರ ಸರ್ವಂ ಚ ಮಯಿ ಪಶ್ಯತಿ ।\nತಸ್ಯಾಹಂ ನ ಪ್ರಣಶ್ಯಾಮಿ ಸ ಚ ಮೇ ನ ಪ್ರಣಶ್ಯತಿ ॥",
    "yo māṁ paśyati sarvatra sarvaṁ ca mayi paśyati |\ntasyāhaṁ na praṇaśyāmi sa ca me na praṇaśyati ||",
    n(
      "One who sees Me everywhere and sees everything in Me — I am never lost to them, nor are they ever lost to Me.",
      "ಎಲ್ಲೆಡೆ ನನ್ನನ್ನು ಕಾಣುವ, ಎಲ್ಲವನ್ನೂ ನನ್ನಲ್ಲಿ ಕಾಣುವವನಿಗೆ ನಾನು ಎಂದಿಗೂ ದೂರವಾಗುವುದಿಲ್ಲ; ಅವನೂ ನನಗೆ ಎಂದಿಗೂ ದೂರವಾಗುವುದಿಲ್ಲ.",
    ),
  ),
  v(
    "bg-12-13",
    GITA(12, 13),
    "ಅದ್ವೇಷ್ಟಾ ಸರ್ವಭೂತಾನಾಂ ಮೈತ್ರಃ ಕರುಣ ಏವ ಚ ।\nನಿರ್ಮಮೋ ನಿರಹಂಕಾರಃ ಸಮದುಃಖಸುಖಃ ಕ್ಷಮೀ ॥",
    "adveṣṭā sarva-bhūtānāṁ maitraḥ karuṇa eva ca |\nnirmamo nirahaṅkāraḥ sama-duḥkha-sukhaḥ kṣamī ||",
    n(
      "One who bears ill will to no being, who is friendly and compassionate, free of 'mine' and of pride, even in sorrow and joy, and forgiving — such a devotee is dear to Me.",
      "ಯಾವ ಜೀವಿಯನ್ನೂ ದ್ವೇಷಿಸದ, ಎಲ್ಲರೊಡನೆ ಸ್ನೇಹ ಮತ್ತು ಕರುಣೆಯಿಂದಿರುವ, ಮಮಕಾರ ಹಾಗೂ ಅಹಂಕಾರವಿಲ್ಲದ, ಸುಖದುಃಖಗಳಲ್ಲಿ ಸಮನಾಗಿರುವ, ಕ್ಷಮಾಶೀಲನಾದ ಭಕ್ತನು ನನಗೆ ಪ್ರಿಯನು.",
    ),
  ),
  v(
    "bg-7-19",
    GITA(7, 19),
    "ಬಹೂನಾಂ ಜನ್ಮನಾಮಂತೇ ಜ್ಞಾನವಾನ್ಮಾಂ ಪ್ರಪದ್ಯತೇ ।\nವಾಸುದೇವಃ ಸರ್ವಮಿತಿ ಸ ಮಹಾತ್ಮಾ ಸುದುರ್ಲಭಃ ॥",
    "bahūnāṁ janmanām ante jñānavān māṁ prapadyate |\nvāsudevaḥ sarvam iti sa mahātmā sudurlabhaḥ ||",
    n(
      "At the end of many births the wise one takes refuge in Me, knowing \"Vasudeva is all\". Such a great soul is very rare.",
      "ಅನೇಕ ಜನ್ಮಗಳ ಕೊನೆಯಲ್ಲಿ ಜ್ಞಾನಿಯು \"ವಾಸುದೇವನೇ ಎಲ್ಲವೂ\" ಎಂದು ಅರಿತು ನನಗೆ ಶರಣಾಗುತ್ತಾನೆ. ಅಂತಹ ಮಹಾತ್ಮನು ಅತ್ಯಂತ ದುರ್ಲಭ.",
    ),
  ),
  v(
    "bg-3-21",
    GITA(3, 21),
    "ಯದ್ಯದಾಚರತಿ ಶ್ರೇಷ್ಠಸ್ತತ್ತದೇವೇತರೋ ಜನಃ ।\nಸ ಯತ್ಪ್ರಮಾಣಂ ಕುರುತೇ ಲೋಕಸ್ತದನುವರ್ತತೇ ॥",
    "yad yad ācarati śreṣṭhas tat tad evetaro janaḥ |\nsa yat pramāṇaṁ kurute lokas tad anuvartate ||",
    n(
      "Whatever the great do, others follow; whatever standard they set, the world pursues.",
      "ಶ್ರೇಷ್ಠರು ಏನನ್ನು ಆಚರಿಸುತ್ತಾರೋ ಉಳಿದವರೂ ಅದನ್ನೇ ಅನುಸರಿಸುತ್ತಾರೆ; ಅವರು ಹಾಕಿಕೊಟ್ಟ ಮಾದರಿಯನ್ನೇ ಲೋಕ ಹಿಂಬಾಲಿಸುತ್ತದೆ.",
    ),
  ),
  v(
    "bg-2-14",
    GITA(2, 14),
    "ಮಾತ್ರಾಸ್ಪರ್ಶಾಸ್ತು ಕೌಂತೇಯ ಶೀತೋಷ್ಣಸುಖದುಃಖದಾಃ ।\nಆಗಮಾಪಾಯಿನೋಽನಿತ್ಯಾಸ್ತಾಂಸ್ತಿತಿಕ್ಷಸ್ವ ಭಾರತ ॥",
    "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ |\nāgamāpāyino 'nityās tāṁs titikṣasva bhārata ||",
    n(
      "The meeting of the senses with their objects brings cold and heat, pleasure and pain. They come and go and do not last — bear them patiently, O Bharata.",
      "ಇಂದ್ರಿಯಗಳು ವಿಷಯಗಳೊಡನೆ ಸೇರುವುದರಿಂದ ಚಳಿ-ಬಿಸಿಲು, ಸುಖ-ದುಃಖಗಳು ಉಂಟಾಗುತ್ತವೆ. ಅವು ಬಂದು ಹೋಗುವ ಅನಿತ್ಯಗಳು; ಓ ಭಾರತ, ಅವನ್ನು ತಾಳ್ಮೆಯಿಂದ ಸಹಿಸಿಕೊ.",
    ),
  ),

  // ── Sri Vishnu Sahasranama ──
  v(
    "vs-shuklambara",
    VS("Dhyana", "ಧ್ಯಾನ"),
    "ಶುಕ್ಲಾಂಬರಧರಂ ವಿಷ್ಣುಂ ಶಶಿವರ್ಣಂ ಚತುರ್ಭುಜಮ್ ।\nಪ್ರಸನ್ನವದನಂ ಧ್ಯಾಯೇತ್ ಸರ್ವವಿಘ್ನೋಪಶಾಂತಯೇ ॥",
    "śuklāmbara-dharaṁ viṣṇuṁ śaśi-varṇaṁ catur-bhujam |\nprasanna-vadanaṁ dhyāyet sarva-vighnopaśāntaye ||",
    n(
      "Meditate on Vishnu, clad in white, bright as the moon, four-armed and gracious of face, for the removal of every obstacle.",
      "ಶ್ವೇತವಸ್ತ್ರಧಾರಿಯಾದ, ಚಂದ್ರನಂತೆ ಬೆಳಗುವ, ನಾಲ್ಕು ಭುಜಗಳುಳ್ಳ, ಪ್ರಸನ್ನವದನನಾದ ವಿಷ್ಣುವನ್ನು ಎಲ್ಲ ವಿಘ್ನಗಳ ನಿವಾರಣೆಗಾಗಿ ಧ್ಯಾನಿಸಬೇಕು.",
    ),
  ),
  v(
    "vs-shantakaram",
    VS("Dhyana", "ಧ್ಯಾನ"),
    "ಶಾಂತಾಕಾರಂ ಭುಜಗಶಯನಂ ಪದ್ಮನಾಭಂ ಸುರೇಶಂ\nವಿಶ್ವಾಧಾರಂ ಗಗನಸದೃಶಂ ಮೇಘವರ್ಣಂ ಶುಭಾಂಗಮ್ ।\nಲಕ್ಷ್ಮೀಕಾಂತಂ ಕಮಲನಯನಂ ಯೋಗಿಭಿರ್ಧ್ಯಾನಗಮ್ಯಂ\nವಂದೇ ವಿಷ್ಣುಂ ಭವಭಯಹರಂ ಸರ್ವಲೋಕೈಕನಾಥಮ್ ॥",
    "śāntākāraṁ bhujaga-śayanaṁ padma-nābhaṁ sureśaṁ\nviśvādhāraṁ gagana-sadṛśaṁ megha-varṇaṁ śubhāṅgam |\nlakṣmī-kāntaṁ kamala-nayanaṁ yogibhir dhyāna-gamyaṁ\nvande viṣṇuṁ bhava-bhaya-haraṁ sarva-lokaika-nātham ||",
    n(
      "I bow to Vishnu — serene of form, resting on the serpent, lotus-naveled, Lord of the gods, support of the universe, vast as the sky, dark as a rain cloud, auspicious of body, beloved of Lakshmi, lotus-eyed, reached by yogis in meditation, who removes the fear of worldly existence, the one Lord of all the worlds.",
      "ಶಾಂತಸ್ವರೂಪನೂ, ಆದಿಶೇಷನ ಮೇಲೆ ಪವಡಿಸಿರುವವನೂ, ನಾಭಿಯಲ್ಲಿ ಕಮಲವುಳ್ಳವನೂ, ದೇವತೆಗಳ ಒಡೆಯನೂ, ವಿಶ್ವಕ್ಕೆ ಆಧಾರನೂ, ಆಕಾಶದಂತೆ ವ್ಯಾಪಿಸಿರುವವನೂ, ಮೇಘವರ್ಣನೂ, ಮಂಗಳಾಂಗನೂ, ಲಕ್ಷ್ಮೀಕಾಂತನೂ, ಕಮಲನಯನನೂ, ಯೋಗಿಗಳಿಗೆ ಧ್ಯಾನದಿಂದ ಗೋಚರಿಸುವವನೂ, ಸಂಸಾರಭಯವನ್ನು ಹೋಗಲಾಡಿಸುವವನೂ, ಸರ್ವಲೋಕಗಳ ಏಕೈಕ ನಾಥನೂ ಆದ ವಿಷ್ಣುವಿಗೆ ವಂದಿಸುತ್ತೇನೆ.",
    ),
  ),
  v(
    "vs-1",
    VS("Verse 1", "ಶ್ಲೋಕ 1"),
    "ವಿಶ್ವಂ ವಿಷ್ಣುರ್ವಷಟ್ಕಾರೋ ಭೂತಭವ್ಯಭವತ್ಪ್ರಭುಃ ।\nಭೂತಕೃದ್ಭೂತಭೃದ್ಭಾವೋ ಭೂತಾತ್ಮಾ ಭೂತಭಾವನಃ ॥",
    "viśvaṁ viṣṇur vaṣaṭkāro bhūta-bhavya-bhavat-prabhuḥ |\nbhūta-kṛd bhūta-bhṛd bhāvo bhūtātmā bhūta-bhāvanaḥ ||",
    n(
      "He is the universe, the all-pervading Vishnu, the One invoked in sacrifice, Lord of past, future and present; He creates and sustains all beings, He is existence itself, the Self of all beings and the source from which they grow.",
      "ಅವನೇ ವಿಶ್ವ, ಸರ್ವವ್ಯಾಪಿ ವಿಷ್ಣು, ಯಜ್ಞದಲ್ಲಿ ಆಹ್ವಾನಿಸಲ್ಪಡುವ ವಷಟ್ಕಾರ; ಭೂತ-ಭವಿಷ್ಯತ್-ವರ್ತಮಾನಗಳ ಒಡೆಯ; ಜೀವಿಗಳನ್ನು ಸೃಷ್ಟಿಸಿ ಪೋಷಿಸುವವನು; ಸತ್ತಾಸ್ವರೂಪನು; ಎಲ್ಲ ಜೀವಿಗಳ ಆತ್ಮ ಮತ್ತು ಅವುಗಳ ಉದ್ಭವಸ್ಥಾನ.",
    ),
  ),
  v(
    "vs-2",
    VS("Verse 2", "ಶ್ಲೋಕ 2"),
    "ಪೂತಾತ್ಮಾ ಪರಮಾತ್ಮಾ ಚ ಮುಕ್ತಾನಾಂ ಪರಮಾ ಗತಿಃ ।\nಅವ್ಯಯಃ ಪುರುಷಃ ಸಾಕ್ಷೀ ಕ್ಷೇತ್ರಜ್ಞೋಽಕ್ಷರ ಏವ ಚ ॥",
    "pūtātmā paramātmā ca muktānāṁ paramā gatiḥ |\navyayaḥ puruṣaḥ sākṣī kṣetra-jño 'kṣara eva ca ||",
    n(
      "The pure Self, the Supreme Self, the highest goal of the liberated; the imperishable Purusha, the witness, the knower of the field, the undecaying.",
      "ಪರಿಶುದ್ಧ ಆತ್ಮ, ಪರಮಾತ್ಮ, ಮುಕ್ತರಿಗೆ ಪರಮಗತಿ; ಅವ್ಯಯನಾದ ಪುರುಷ, ಸಾಕ್ಷಿ, ಕ್ಷೇತ್ರಜ್ಞ ಮತ್ತು ಅಕ್ಷರ.",
    ),
  ),
  v(
    "vs-4",
    VS("Verse 4", "ಶ್ಲೋಕ 4"),
    "ಸರ್ವಃ ಶರ್ವಃ ಶಿವಃ ಸ್ಥಾಣುರ್ಭೂತಾದಿರ್ನಿಧಿರವ್ಯಯಃ ।\nಸಂಭವೋ ಭಾವನೋ ಭರ್ತಾ ಪ್ರಭವಃ ಪ್ರಭುರೀಶ್ವರಃ ॥",
    "sarvaḥ śarvaḥ śivaḥ sthāṇur bhūtādir nidhir avyayaḥ |\nsambhavo bhāvano bhartā prabhavaḥ prabhur īśvaraḥ ||",
    n(
      "He is all, the remover of sins, the auspicious, the steadfast; the origin of beings, the imperishable treasure; He who appears by His own will, the giver of fruits, the sustainer, the source, the master, the Lord.",
      "ಅವನೇ ಸರ್ವ, ಪಾಪಹರನಾದ ಶರ್ವ, ಮಂಗಳಕರ ಶಿವ, ಸ್ಥಿರನಾದ ಸ್ಥಾಣು; ಭೂತಗಳ ಆದಿ, ಅವ್ಯಯ ನಿಧಿ; ತನ್ನಿಚ್ಛೆಯಿಂದ ಅವತರಿಸುವವನು, ಫಲದಾತ, ಪೋಷಕ, ಮೂಲ, ಪ್ರಭು ಮತ್ತು ಈಶ್ವರ.",
    ),
  ),
  v(
    "vs-ramarama",
    VS("Phala Shruti", "ಫಲಶ್ರುತಿ"),
    "ಶ್ರೀ ರಾಮ ರಾಮ ರಾಮೇತಿ ರಮೇ ರಾಮೇ ಮನೋರಮೇ ।\nಸಹಸ್ರನಾಮ ತತ್ತುಲ್ಯಂ ರಾಮನಾಮ ವರಾನನೇ ॥",
    "śrī rāma rāma rāmeti rame rāme manorame |\nsahasra-nāma tat-tulyaṁ rāma-nāma varānane ||",
    n(
      "(Shiva to Parvati:) O fair-faced one, I delight in the enchanting Rama, chanting \"Sri Rama Rama Rama\" — the name of Rama equals the thousand names.",
      "(ಶಿವನು ಪಾರ್ವತಿಗೆ:) ಓ ಸುಂದರಿ, \"ಶ್ರೀರಾಮ ರಾಮ ರಾಮ\" ಎಂದು ಮನೋಹರನಾದ ರಾಮನಲ್ಲಿ ನಾನು ರಮಿಸುತ್ತೇನೆ; ರಾಮನಾಮವು ಸಹಸ್ರನಾಮಕ್ಕೆ ಸಮಾನ.",
    ),
  ),
  v(
    "vs-vanamali",
    VS("Closing", "ಸಮಾಪ್ತಿ"),
    "ವನಮಾಲೀ ಗದೀ ಶಾರ್ಙ್ಗೀ ಶಂಖೀ ಚಕ್ರೀ ಚ ನಂದಕೀ ।\nಶ್ರೀಮಾನ್ನಾರಾಯಣೋ ವಿಷ್ಣುರ್ವಾಸುದೇವೋಽಭಿರಕ್ಷತು ॥",
    "vanamālī gadī śārṅgī śaṅkhī cakrī ca nandakī |\nśrīmān nārāyaṇo viṣṇur vāsudevo 'bhirakṣatu ||",
    n(
      "May Sriman Narayana — Vishnu, Vasudeva — who wears the forest garland and bears the mace, the Sharnga bow, the conch, the discus and the Nandaka sword, protect us.",
      "ವನಮಾಲೆಯನ್ನು ಧರಿಸಿದ, ಗದೆ, ಶಾರ್ಙ್ಗ ಧನುಸ್ಸು, ಶಂಖ, ಚಕ್ರ ಮತ್ತು ನಂದಕ ಖಡ್ಗಧಾರಿಯಾದ ಶ್ರೀಮನ್ನಾರಾಯಣ ವಿಷ್ಣು ವಾಸುದೇವನು ನಮ್ಮನ್ನು ರಕ್ಷಿಸಲಿ.",
    ),
  ),
  v(
    "vs-navasudeva",
    VS("Phala Shruti", "ಫಲಶ್ರುತಿ"),
    "ನ ವಾಸುದೇವಭಕ್ತಾನಾಮಶುಭಂ ವಿದ್ಯತೇ ಕ್ವಚಿತ್ ।\nಜನ್ಮಮೃತ್ಯುಜರಾವ್ಯಾಧಿಭಯಂ ನೈವೋಪಜಾಯತೇ ॥",
    "na vāsudeva-bhaktānām aśubhaṁ vidyate kvacit |\njanma-mṛtyu-jarā-vyādhi-bhayaṁ naivopajāyate ||",
    n(
      "For the devotees of Vasudeva there is no misfortune anywhere; the fear of birth, death, old age and disease never arises in them.",
      "ವಾಸುದೇವನ ಭಕ್ತರಿಗೆ ಎಲ್ಲಿಯೂ ಅಶುಭವಿಲ್ಲ; ಜನ್ಮ, ಮೃತ್ಯು, ಮುಪ್ಪು, ರೋಗಗಳ ಭಯ ಅವರಿಗೆ ಉಂಟಾಗುವುದೇ ಇಲ್ಲ.",
    ),
  ),
  v(
    "vs-akashat",
    VS("Phala Shruti", "ಫಲಶ್ರುತಿ"),
    "ಆಕಾಶಾತ್ಪತಿತಂ ತೋಯಂ ಯಥಾ ಗಚ್ಛತಿ ಸಾಗರಮ್ ।\nಸರ್ವದೇವನಮಸ್ಕಾರಃ ಕೇಶವಂ ಪ್ರತಿ ಗಚ್ಛತಿ ॥",
    "ākāśāt patitaṁ toyaṁ yathā gacchati sāgaram |\nsarva-deva-namaskāraḥ keśavaṁ prati gacchati ||",
    n(
      "As all the rain that falls from the sky flows to the ocean, so every salutation offered to any deity reaches Keshava.",
      "ಆಕಾಶದಿಂದ ಬಿದ್ದ ನೀರೆಲ್ಲ ಸಮುದ್ರವನ್ನೇ ಸೇರುವಂತೆ, ಯಾವ ದೇವರಿಗೆ ಮಾಡಿದ ನಮಸ್ಕಾರವೂ ಕೇಶವನನ್ನೇ ತಲುಪುತ್ತದೆ.",
    ),
  ),
  v(
    "vs-kayena",
    VS("Samarpana", "ಸಮರ್ಪಣೆ"),
    "ಕಾಯೇನ ವಾಚಾ ಮನಸೇಂದ್ರಿಯೈರ್ವಾ ಬುದ್ಧ್ಯಾತ್ಮನಾ ವಾ ಪ್ರಕೃತೇಃ ಸ್ವಭಾವಾತ್ ।\nಕರೋಮಿ ಯದ್ಯತ್ಸಕಲಂ ಪರಸ್ಮೈ ನಾರಾಯಣಾಯೇತಿ ಸಮರ್ಪಯಾಮಿ ॥",
    "kāyena vācā manasendriyair vā buddhyātmanā vā prakṛteḥ svabhāvāt |\nkaromi yad yat sakalaṁ parasmai nārāyaṇāyeti samarpayāmi ||",
    n(
      "Whatever I do with body, speech, mind or senses, with intellect or self, or by the bent of my nature — all of it I offer to the Supreme, to Narayana.",
      "ದೇಹ, ಮಾತು, ಮನಸ್ಸು, ಇಂದ್ರಿಯಗಳು, ಬುದ್ಧಿ, ಆತ್ಮ ಅಥವಾ ಸ್ವಭಾವದಿಂದ ನಾನು ಏನೇನು ಮಾಡುತ್ತೇನೋ ಅದೆಲ್ಲವನ್ನೂ ಪರಮಾತ್ಮನಾದ ನಾರಾಯಣನಿಗೆ ಸಮರ್ಪಿಸುತ್ತೇನೆ.",
    ),
  ),

  // ── Nalayira Divya Prabandham ──
  v(
    "dp-poigai",
    n("Mudhal Tiruvandhadhi 1 · Poigai Alwar", "ಮುದಲ್ ತಿರುವಂದಾದಿ 1 · ಪೊಯ್ಗೈ ಆಳ್ವಾರ್"),
    "ವೈಯಂ ತಗಳಿಯಾ ವಾರ್ಕಡಲೇ ನೆಯ್ಯಾಗ\nವೆಯ್ಯ ಕದಿರೋನ್ ವಿಳಕ್ಕಾಗ — ಸೆಯ್ಯ\nಸುಡರಾಳಿಯಾನ್ ಅಡಿಕ್ಕೇ ಸೂಟ್ಟಿನೇನ್ ಸೊಲ್ಮಾಲೈ\nಇಡರಾಳಿ ನೀಂಗುಗವೇ ಎನ್ರು",
    "vaiyam tagaḷiyā vārkaḍalē neyyāga\nveyya kadirōṉ viḷakkāga — seyya\nsuḍarāḻiyāṉ aḍikkē sūṭṭiṉēṉ solmālai\niḍarāḻi nīṅgugavē eṉṟu",
    n(
      "With the earth as the lamp, the wide ocean as its ghee and the blazing Sun as its flame, I have laid this garland of words at the feet of the Lord who holds the radiant discus — that the ocean of sorrow may pass away.",
      "ಭೂಮಿಯೇ ಹಣತೆ, ವಿಶಾಲ ಸಾಗರವೇ ತುಪ್ಪ, ಉರಿಯುವ ಸೂರ್ಯನೇ ದೀಪವಾಗಿ — ತೇಜೋಮಯ ಚಕ್ರಧಾರಿಯ ಪಾದಗಳಿಗೆ ಈ ಪದಮಾಲೆಯನ್ನು ಅರ್ಪಿಸಿದೆ, ದುಃಖಸಾಗರ ದೂರವಾಗಲಿ ಎಂದು.",
    ),
    "வையம் தகளியா வார்கடலே நெய்யாக\nவெய்ய கதிரோன் விளக்காக — செய்ய\nசுடராழியான் அடிக்கே சூட்டினேன் சொல்மாலை\nஇடராழி நீங்குகவே என்று",
  ),
  v(
    "dp-bhoothath",
    n("Irandam Tiruvandhadhi 1 · Bhoothathalwar", "ಇರಂಡಾಮ್ ತಿರುವಂದಾದಿ 1 · ಭೂತತ್ತಾಳ್ವಾರ್"),
    "ಅನ್ಬೇ ತಗಳಿಯಾ ಆರ್ವಮೇ ನೆಯ್ಯಾಗ\nಇನ್ಬುರುಗು ಸಿಂದೈ ಇಡುತಿರಿಯಾ — ನನ್ಬುರುಗಿ\nಞಾನಚ್ ಚುಡರ್ವಿಳಕ್ಕು ಏಟ್ರಿನೇನ್ ನಾರಣರ್ಕು\nಞಾನತ್ ತಮಿಳ್ಪುರಿಂದ ನಾನ್",
    "aṉbē tagaḷiyā ārvamē neyyāga\niṉburugu sindai iḍutiriyā — naṉburugi\nñāṉac cuḍarviḷakku ēṟṟiṉēṉ nāraṇaṟku\nñāṉat tamiḻpurinda nāṉ",
    n(
      "With love as the lamp, longing as the ghee and a mind melting in joy as the wick, I — who cherish the Tamil of wisdom — have lit the bright lamp of knowledge for Narayana.",
      "ಪ್ರೇಮವೇ ಹಣತೆ, ಹಂಬಲವೇ ತುಪ್ಪ, ಆನಂದದಲ್ಲಿ ಕರಗುವ ಮನಸ್ಸೇ ಬತ್ತಿಯಾಗಿ — ಜ್ಞಾನದ ತಮಿಳನ್ನು ಅರಿತ ನಾನು ನಾರಾಯಣನಿಗಾಗಿ ಜ್ಞಾನದೀಪವನ್ನು ಬೆಳಗಿದೆ.",
    ),
    "அன்பே தகளியா ஆர்வமே நெய்யாக\nஇன்புருகு சிந்தை இடுதிரியா — நன்புருகி\nஞானச் சுடர்விளக்கு ஏற்றினேன் நாரணற்கு\nஞானத் தமிழ்புரிந்த நான்",
  ),
  v(
    "dp-pey",
    n("Moondram Tiruvandhadhi 1 · Peyalwar", "ಮೂನ್ರಾಮ್ ತಿರುವಂದಾದಿ 1 · ಪೇಯಾಳ್ವಾರ್"),
    "ತಿರುಕ್ಕಂಡೇನ್ ಪೊನ್ಮೇನಿ ಕಂಡೇನ್ ತಿಗಳುಂ\nಅರುಕ್ಕನ್ ಅಣಿನಿರಮುಂ ಕಂಡೇನ್ — ಸೆರುಕ್ಕಿಳರುಂ\nಪೊನ್ನಾಳಿ ಕಂಡೇನ್ ಪುರಿಸಂಗಂ ಕೈಕ್ಕಂಡೇನ್\nಎನ್ನಾಳಿ ವಣ್ಣನ್ಪಾಲ್ ಇನ್ರು",
    "tirukkaṇḍēṉ poṉmēṉi kaṇḍēṉ tigaḻum\narukkaṉ aṇiniṟamum kaṇḍēṉ — serukkiḷarum\npoṉṉāḻi kaṇḍēṉ purisaṅgam kaikkaṇḍēṉ\neṉṉāḻi vaṇṇaṉpāl iṉṟu",
    n(
      "Today, in my Lord whose hue is the ocean's, I saw Sri (Lakshmi); I saw His golden form and its radiance like the blazing Sun; I saw the golden discus fierce in battle and the spiral conch in His hand.",
      "ಇಂದು ಸಾಗರವರ್ಣನಾದ ನನ್ನ ಸ್ವಾಮಿಯಲ್ಲಿ ಶ್ರೀ ಲಕ್ಷ್ಮಿಯನ್ನು ಕಂಡೆ; ಅವನ ಸ್ವರ್ಣಮಯ ದಿವ್ಯ ವಿಗ್ರಹವನ್ನೂ ಸೂರ್ಯನಂತೆ ಬೆಳಗುವ ಕಾಂತಿಯನ್ನೂ ಕಂಡೆ; ಯುದ್ಧದಲ್ಲಿ ಪ್ರಜ್ವಲಿಸುವ ಸುವರ್ಣ ಚಕ್ರವನ್ನೂ ಕೈಯಲ್ಲಿನ ಶಂಖವನ್ನೂ ಕಂಡೆ.",
    ),
    "திருக்கண்டேன் பொன்மேனி கண்டேன் திகழும்\nஅருக்கன் அணிநிறமும் கண்டேன் — செருக்கிளரும்\nபொன்னாழி கண்டேன் புரிசங்கம் கைக்கண்டேன்\nஎன்னாழி வண்ணன்பால் இன்று",
  ),
  v(
    "dp-agalagillen",
    n("Tiruvaimozhi 6.10.10 · Nammalwar", "ತಿರುವಾಯ್ಮೊಳಿ 6.10.10 · ನಮ್ಮಾಳ್ವಾರ್"),
    "ಅಗಲಗಿಲ್ಲೇನ್ ಇರೈಯುಂ ಎನ್ರು ಅಲರ್ಮೇಲ್ ಮಂಗೈ ಉರೈ ಮಾರ್ಬಾ\nನಿಗರಿಲ್ ಪುಗಳಾಯ್ ಉಲಗಂ ಮೂನ್ರುಡೈಯಾಯ್ ಎನ್ನೈ ಆಳ್ವಾನೇ\nನಿಗರಿಲ್ ಅಮರರ್ ಮುನಿಕ್ಕಣಂಗಳ್ ವಿರುಂಬುಂ ತಿರುವೇಂಗಡತ್ತಾನೇ\nಪುಗಲ್ ಒನ್ರಿಲ್ಲಾ ಅಡಿಯೇನ್ ಉನ್ ಅಡಿಕ್ಕೀಳ್ ಅಮರ್ಂದು ಪುಗುಂದೇನೇ",
    "agalagillēṉ iṟaiyum eṉṟu alarmēl maṅgai uṟai mārbā\nnigaril pugaḻāy ulagam mūṉṟuḍaiyāy eṉṉai āḷvāṉē\nnigaril amarar muṉikkaṇaṅgaḷ virumbum tiruvēṅgaḍattāṉē\npugal oṉṟillā aḍiyēṉ uṉ aḍikkīḻ amarndu pugundēṉē",
    n(
      "O Lord on whose chest Alarmel Mangai dwells, saying \"I cannot leave Him even for a moment\"; O You of matchless glory, Master of the three worlds, my Ruler; O Lord of Tiruvenkatam, longed for by peerless gods and hosts of sages — I, Your servant with no other refuge, have come and settled at Your feet.",
      "\"ಕ್ಷಣಕಾಲವೂ ಅಗಲಲಾರೆ\" ಎಂದು ಅಲರ್ಮೇಲ್ ಮಂಗೈ (ಶ್ರೀ ಪದ್ಮಾವತಿ) ನೆಲೆಸಿರುವ ವಕ್ಷಸ್ಥಳದವನೇ, ಸಾಟಿಯಿಲ್ಲದ ಕೀರ್ತಿಯುಳ್ಳವನೇ, ಮೂರು ಲೋಕಗಳ ಒಡೆಯನೇ, ನನ್ನನ್ನು ಆಳುವವನೇ, ದೇವತೆಗಳೂ ಮುನಿಗಣಗಳೂ ಬಯಸುವ ತಿರುವೇಂಕಟನಾಥನೇ — ಬೇರೆ ಆಶ್ರಯವಿಲ್ಲದ ಈ ದಾಸನು ನಿನ್ನ ಪಾದಗಳಡಿಯಲ್ಲಿ ಶರಣಾಗಿ ನೆಲೆಸಿದ್ದೇನೆ.",
    ),
    "அகலகில்லேன் இறையும் என்று அலர்மேல் மங்கை உறை மார்பா\nநிகரில் புகழாய் உலகம் மூன்றுடையாய் என்னை ஆள்வானே\nநிகரில் அமரர் முனிக்கணங்கள் விரும்பும் திருவேங்கடத்தானே\nபுகல் ஒன்றில்லா அடியேன் உன் அடிக்கீழ் அமர்ந்து புகுந்தேனே",
  ),
  v(
    "dp-kulasekhara",
    n("Perumal Tirumozhi 4.9 · Kulasekhara Alwar", "ಪೆರುಮಾಳ್ ತಿರುಮೊಳಿ 4.9 · ಕುಲಶೇಖರ ಆಳ್ವಾರ್"),
    "ಸೆಡಿಯಾಯ ವಲ್ವಿನೈಗಳ್ ತೀರ್ಕ್ಕುಂ ತಿರುಮಾಲೇ\nನೆಡಿಯಾನೇ ವೇಂಗಡವಾ ನಿನ್ಕೋಯಿಲಿನ್ ವಾಸಲ್\nಅಡಿಯಾರುಂ ವಾನವರುಂ ಅರಂಬೈಯರುಂ ಕಿಡಂದಿಯಂಗುಂ\nಪಡಿಯಾಯ್ಕ್ ಕಿಡಂದು ಉನ್ ಪವಳವಾಯ್ ಕಾಣ್ಬೇನೇ",
    "seḍiyāya valviṉaigaḷ tīrkkum tirumālē\nneḍiyāṉē vēṅgaḍavā niṉkōyiliṉ vāsal\naḍiyārum vāṉavarum arambaiyarum kiḍandiyaṅgum\npaḍiyāyk kiḍandu uṉ pavaḷavāy kāṇbēṉē",
    n(
      "O Tirumal who clears the dense thicket of strong karma, O lofty Lord of Venkatam — let me lie as a step at the threshold of Your temple, where devotees, gods and celestial maidens come and go, and gaze upon Your coral lips.",
      "ದಟ್ಟ ಪೊದೆಯಂತಿರುವ ಘೋರ ಕರ್ಮಗಳನ್ನು ನಾಶಮಾಡುವ ತಿರುಮಾಲನೇ, ಮಹೋನ್ನತನಾದ ವೇಂಕಟನಾಥನೇ — ಭಕ್ತರು, ದೇವತೆಗಳು, ಅಪ್ಸರೆಯರು ಓಡಾಡುವ ನಿನ್ನ ದೇವಾಲಯದ ಹೊಸ್ತಿಲಿನ ಮೆಟ್ಟಿಲಾಗಿ ಬಿದ್ದುಕೊಂಡು ನಿನ್ನ ಹವಳದಂತಹ ತುಟಿಗಳನ್ನು ಕಾಣುವೆನು.",
    ),
    "செடியாய வல்வினைகள் தீர்க்கும் திருமாலே\nநெடியானே வேங்கடவா நின்கோயிலின் வாசல்\nஅடியாரும் வானவரும் அரம்பையரும் கிடந்தியங்கும்\nபடியாய்க் கிடந்து உன் பவளவாய் காண்பேனே",
  ),
  v(
    "dp-narayana",
    n("Periya Tirumozhi 1.1.9 · Tirumangai Alwar", "ಪೆರಿಯ ತಿರುಮೊಳಿ 1.1.9 · ತಿರುಮಂಗೈ ಆಳ್ವಾರ್"),
    "ಕುಲಂ ತರುಂ ಸೆಲ್ವಂ ತಂದಿಡುಂ ಅಡಿಯಾರ್ ಪಡುತುಯರ್ ಆಯಿನ ಎಲ್ಲಾಂ\nನಿಲಂತರಂ ಸೆಯ್ಯುಂ ನೀಳ್ವಿಸುಂಬು ಅರುಳುಂ ಅರುಳೊಡು ಪೆರುನಿಲಂ ಅಳಿಕ್ಕುಂ\nವಲಂತರುಂ ಮಟ್ರುಂ ತಂದಿಡುಂ ಪೆಟ್ರ ತಾಯಿನುಂ ಆಯಿನ ಸೆಯ್ಯುಂ\nನಲಂತರುಂ ಸೊಲ್ಲೈ ನಾನ್ ಕಂಡುಕೊಂಡೇನ್ ನಾರಾಯಣಾ ಎನ್ನುಂ ನಾಮಂ",
    "kulam tarum selvam tandiḍum aḍiyār paḍuduyar āyiṉa ellām\nnilantaram seyyum nīḷvisumbu aruḷum aruḷoḍu perunilam aḷikkum\nvalantarum maṟṟum tandiḍum peṟṟa tāyiṉum āyiṉa seyyum\nnalantarum sollai nāṉ kaṇḍukoṇḍēṉ nārāyaṇā eṉṉum nāmam",
    n(
      "It gives noble kinship and wealth; it levels every sorrow devotees suffer; it grants the vast heaven and, with grace, the wide earth; it gives strength and all else; it does more good than the mother who bore us — I have found the word that brings all good: the name \"Narayana\".",
      "ಅದು ಉತ್ತಮ ಕುಲವನ್ನೂ ಸಂಪತ್ತನ್ನೂ ಕೊಡುತ್ತದೆ; ಭಕ್ತರ ದುಃಖಗಳನ್ನೆಲ್ಲ ನೆಲಸಮ ಮಾಡುತ್ತದೆ; ಪರಮಪದವನ್ನೂ ಕೃಪೆಯಿಂದ ಭೂಮಂಡಲವನ್ನೂ ಕರುಣಿಸುತ್ತದೆ; ಬಲವನ್ನೂ ಮತ್ತೆಲ್ಲವನ್ನೂ ನೀಡುತ್ತದೆ; ಹೆತ್ತ ತಾಯಿಗಿಂತಲೂ ಹೆಚ್ಚು ಹಿತ ಮಾಡುತ್ತದೆ — ಎಲ್ಲ ಮಂಗಳಗಳನ್ನು ಕೊಡುವ ಆ ಶಬ್ದವನ್ನು ನಾನು ಕಂಡುಕೊಂಡೆ: \"ನಾರಾಯಣ\" ಎಂಬ ನಾಮ.",
    ),
    "குலம் தரும் செல்வம் தந்திடும் அடியார் படுதுயர் ஆயின எல்லாம்\nநிலந்தரம் செய்யும் நீள்விசும்பு அருளும் அருளொடு பெருநிலம் அளிக்கும்\nவலந்தரும் மற்றும் தந்திடும் பெற்ற தாயினும் ஆயின செய்யும்\nநலந்தரும் சொல்லை நான் கண்டுகொண்டேன் நாராயணா என்னும் நாமம்",
  ),
  v(
    "dp-varanam",
    n("Nachiyar Tirumozhi 6.1 · Sri Andal (Goda Devi)", "ನಾಚ್ಚಿಯಾರ್ ತಿರುಮೊಳಿ 6.1 · ಶ್ರೀ ಆಂಡಾಳ್ (ಗೋದಾದೇವಿ)"),
    "ವಾರಣಂ ಆಯಿರಂ ಸೂಳ ವಲಂಸೆಯ್ದು\nನಾರಣ ನಂಬಿ ನಡಕ್ಕಿನ್ರಾನ್ ಎನ್ರೆದಿರ್\nಪೂರಣ ಪೊರ್ಕುಡಂ ವೈತ್ತುಪ್ ಪುರಮೆಂಗುಂ\nತೋರಣಂ ನಾಟ್ಟಕ್ ಕನಾಕ್ಕಂಡೇನ್ ತೋಳೀ ನಾನ್",
    "vāraṇam āyiram sūḻa valamseydu\nnāraṇa nambi naḍakkiṉṟāṉ eṉṟedir\npūraṇa poṟkuḍam vaittup puṟameṅgum\ntōraṇam nāṭṭak kaṉākkaṇḍēṉ tōḻī nāṉ",
    n(
      "My friend, I dreamt that Narayana Nambi came walking in procession with a thousand elephants circling Him, and that full golden pots were set out to welcome Him and festoons raised everywhere.",
      "ಓ ಗೆಳತಿ, ಸಾವಿರ ಆನೆಗಳು ಸುತ್ತುವರಿದು ಪ್ರದಕ್ಷಿಣೆ ಮಾಡುತ್ತಿರಲು ನಾರಣ ನಂಬಿ ನಡೆದು ಬರುತ್ತಿದ್ದಾನೆಂದು, ಅವನನ್ನು ಎದುರುಗೊಳ್ಳಲು ಪೂರ್ಣಕುಂಭಗಳನ್ನಿಟ್ಟು ಎಲ್ಲೆಡೆ ತೋರಣಗಳನ್ನು ಕಟ್ಟಿದಂತೆ ನಾನು ಕನಸು ಕಂಡೆ.",
    ),
    "வாரணம் ஆயிரம் சூழ வலம்செய்து\nநாரண நம்பி நடக்கின்றான் என்றெதிர்\nபூரண பொற்குடம் வைத்துப் புறமெங்கும்\nதோரணம் நாட்டக் கனாக்கண்டேன் தோழீ நான்",
  ),
  v(
    "dp-tiruppavai-29",
    n("Tiruppavai 29 · Sri Andal (Goda Devi)", "ತಿರುಪ್ಪಾವೈ 29 · ಶ್ರೀ ಆಂಡಾಳ್ (ಗೋದಾದೇವಿ)"),
    "ಇಟ್ರೈಪ್ ಪರೈಕೊಳ್ವಾನ್ ಅನ್ರು ಕಾಣ್ ಗೋವಿಂದಾ\nಎಟ್ರೈಕ್ಕುಂ ಏಳೇಳ್ ಪಿರವಿಕ್ಕುಂ ಉನ್ದನ್ನೋಡು\nಉಟ್ರೋಮೇ ಆವೋಂ ಉನಕ್ಕೇ ನಾಂ ಆಟ್ಸೆಯ್ವೋಂ\nಮಟ್ರೈ ನಂ ಕಾಮಂಗಳ್ ಮಾಟ್ರೇಲೋರ್ ಎಂಬಾವಾಯ್",
    "iṟṟaip paṟaikoḷvāṉ aṉṟu kāṇ gōvindā\neṟṟaikkum ēḻēḻ piṟavikkum uṉtaṉṉōḍu\nuṟṟōmē āvōm uṉakkē nām āṭceyvōm\nmaṟṟai nam kāmaṅgaḷ māṟṟēlōr embāvāy",
    n(
      "O Govinda, we have not come only to receive the drum today. For all time, through seven times seven births, we shall be bound to You alone and serve You alone — take away every other desire of ours.",
      "ಓ ಗೋವಿಂದ, ಇಂದು ಕೇವಲ \"ಪರೈ\" (ವಾದ್ಯ) ಪಡೆಯಲು ನಾವು ಬಂದಿಲ್ಲ. ಎಂದೆಂದಿಗೂ, ಏಳೇಳು ಜನ್ಮಗಳಲ್ಲೂ ನಿನ್ನೊಡನೆಯೇ ಸಂಬಂಧಿಗಳಾಗಿರುವೆವು; ನಿನಗೆ ಮಾತ್ರವೇ ಸೇವೆ ಮಾಡುವೆವು — ನಮ್ಮ ಬೇರೆಲ್ಲ ಬಯಕೆಗಳನ್ನು ಹೋಗಲಾಡಿಸು.",
    ),
    "இற்றைப் பறைகொள்வான் அன்று காண் கோவிந்தா\nஎற்றைக்கும் ஏழேழ் பிறவிக்கும் உன்தன்னோடு\nஉற்றோமே ஆவோம் உனக்கே நாம் ஆட்செய்வோம்\nமற்றை நம் காமங்கள் மாற்றேலோர் எம்பாவாய்",
  ),
  v(
    "dp-pacchaimamalai",
    n("Tirumalai 2 · Thondaradippodi Alwar", "ತಿರುಮಾಲೈ 2 · ತೊಂಡರಡಿಪ್ಪೊಡಿ ಆಳ್ವಾರ್"),
    "ಪಚ್ಚೈಮಾ ಮಲೈಪೋಲ್ ಮೇನಿ ಪವಳವಾಯ್ ಕಮಲಚ್ ಚೆಂಗಣ್\nಅಚ್ಚುದಾ ಅಮರರ್ ಏರೇ ಆಯರ್ದಂ ಕೊಳುಂದೇ ಎನ್ನುಂ\nಇಚ್ಚುವೈ ತವಿರ ಯಾನ್ಪೋಯ್ ಇಂದಿರ ಲೋಗಂ ಆಳುಂ\nಅಚ್ಚುವೈ ಪೆರಿನುಂ ವೇಂಡೇನ್ ಅರಂಗಮಾ ನಗರುಳಾನೇ",
    "paccaimā malaipōl mēṉi pavaḷavāy kamalac ceṅgaṇ\naccudā amarar ēṟē āyardam koḻundē eṉṉum\niccuvai tavira yāṉpōy indira lōgam āḷum\naccuvai peṟiṉum vēṇḍēṉ araṅgamā nagaruḷāṉē",
    n(
      "O Lord of great Srirangam! A form like a vast green mountain, coral lips, lotus-red eyes — \"O Achyuta, Lord of the gods, tender shoot of the cowherds!\" Leaving the sweetness of calling You thus, I would not want even the joy of ruling Indra's world.",
      "ಓ ಶ್ರೀರಂಗನಾಥನೇ! ಹಸಿರು ಮಹಾಪರ್ವತದಂತಹ ದೇಹ, ಹವಳದಂತಹ ತುಟಿ, ಕಮಲದಂತೆ ಕೆಂಪಾದ ಕಣ್ಣುಗಳು — \"ಅಚ್ಯುತ, ದೇವತೆಗಳ ಒಡೆಯ, ಗೋಪಾಲಕರ ಕುಡಿಯೇ\" ಎಂದು ನಿನ್ನನ್ನು ಕರೆಯುವ ಈ ಸವಿಯನ್ನು ಬಿಟ್ಟು, ಇಂದ್ರಲೋಕವನ್ನು ಆಳುವ ಸುಖ ಸಿಕ್ಕರೂ ನಾನು ಬಯಸುವುದಿಲ್ಲ.",
    ),
    "பச்சைமா மலைபோல் மேனி பவளவாய் கமலச் செங்கண்\nஅச்சுதா அமரர் ஏறே ஆயர்தம் கொழுந்தே என்னும்\nஇச்சுவை தவிர யான்போய் இந்திர லோகம் ஆளும்\nஅச்சுவை பெறினும் வேண்டேன் அரங்கமா நகருளானே",
  ),
];

const byId = (id: string) => VERSES.find((x) => x.id === id)!;

// Verses kept for their occasions; they never appear in the daily rotation,
// so an occasion can't repeat a verse shown a few days before or after it.
export const OCCASION = {
  goda: "dp-varanam",
  varadaraja: "dp-pey",
  gitaJayanti: "bg-18-66",
  vaikunthaEkadashi: "bg-18-65",
  ramaNavami: "vs-ramarama",
  tiruvadipooram: "dp-tiruppavai-29",
} as const;
export type OccasionKey = keyof typeof OCCASION;
const RESERVED = new Set<string>(Object.values(OCCASION));

/** The occasion a day's verse is chosen for, if any. */
export function occasionFor(observances: Observance[]): OccasionKey | null {
  const has = (test: (o: Observance) => boolean) => observances.some(test);
  if (has((o) => o.kind === "utsava" && o.key === "goda")) return "goda";
  if (has((o) => o.kind === "utsava" && o.key === "varadaraja")) return "varadaraja";
  if (has((o) => o.kind === "festival" && o.masa === 8 && o.tithi === 10)) return "gitaJayanti";
  if (has((o) => o.kind === "vaikunthaEkadashi")) return "vaikunthaEkadashi";
  if (has((o) => o.kind === "festival" && o.masa === 0 && o.tithi === 8)) return "ramaNavami";
  if (has((o) => o.kind === "tirunakshatram" && o.index === 4)) return "tiruvadipooram";
  return null;
}

// The rotation: every other verse exactly once, the three sources spread
// evenly through it, so no verse comes back until all the others have been read.
const pool = (prefix: string) => VERSES.filter((x) => x.id.startsWith(prefix) && !RESERVED.has(x.id)).map((x) => x.id);
const ROTATION = [pool("bg-"), pool("vs-"), pool("dp-")]
  .flatMap((ids, source) => ids.map((id, i) => ({ id, at: (i + 0.5) / ids.length, source })))
  .sort((a, b) => a.at - b.at || a.source - b.source)
  .map((x) => x.id);

/**
 * The verse for a day without the database: the occasion's verse, else a
 * fixed rotation of the verses above. The site uses the full collection in
 * Supabase (verse_for_day), which never repeats a verse until all are read;
 * this is only its fallback.
 */
export function verseForDay(date: string, observances: Observance[]): Verse {
  const occasion = occasionFor(observances);
  if (occasion) return byId(OCCASION[occasion]);
  return byId(ROTATION[dayNumber(date) % ROTATION.length]);
}

function dayNumber(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}
