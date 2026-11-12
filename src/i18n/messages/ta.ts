import type { Messages } from "./en";

/**
 * Tamil UI strings. DRAFTS: none of these has been reviewed by a native speaker.
 * Each line carries TODO(ta-review); remove it only after a native speaker approves that line.
 * Count what is left: grep -c "TODO(ta-review)" src/i18n/messages/ta.ts
 */
export const ta: Messages = {
  siteName: "Elephant Archive Sri Lanka", // TODO(ta-review): brand name kept in English; confirm whether a Tamil form is wanted
  tagline: "இலங்கையின் யானைகள் பற்றிய திறந்த, குறிச்சொல்லிடப்பட்ட பதிவு", // TODO(ta-review)
  nav: {
    menu: "பட்டி", // TODO(ta-review)
    contribute: "பங்களியுங்கள்", // TODO(ta-review)
    language: "மொழி", // TODO(ta-review)
  },
  home: {
    heroTitle: "ஒவ்வொரு யானைக்கும் அறிய வேண்டிய ஒரு கதை உண்டு", // TODO(ta-review)
    heroBody: "வாழ்க்கைகள், இழப்புகள், மீட்புகள் மற்றும் வரலாறு, ஒவ்வொன்றும் அதன் மூலத்துடனும் எவ்வளவு சரிபார்க்கப்பட்டது என்பதுடனும்.", // TODO(ta-review)
    heroCta: "பதிவை ஆராயுங்கள்", // TODO(ta-review)
  },
  herd: {
    pause: "இடைநிறுத்து", // TODO(ta-review)
    play: "இயக்கு", // TODO(ta-review)
  },
  fact: {
    didYouKnow: "உங்களுக்குத் தெரியுமா?", // TODO(ta-review)
    flip: "இது எங்கிருந்து வந்தது?", // TODO(ta-review)
    back: "பின்செல்", // TODO(ta-review)
    source: "மூலம்", // TODO(ta-review)
    share: "அட்டையைப் பகிர்", // TODO(ta-review)
  },
  footer: {
    legal: "இந்தக் காப்பகம் அறிவைப் பரப்புகிறது. இது ஒரு குற்றச்சாட்டோ சட்ட ஆலோசனையோ அல்ல.", // TODO(ta-review)
    linksLabel: "இந்தக் காப்பகம் பற்றி", // TODO(ta-review)
  },
  evidence: {
    groupLabel: "சான்று குறிச்சொற்கள்", // TODO(ta-review)
    sourceTypePrefix: "மூல வகை:", // TODO(ta-review)
    verificationPrefix: "சரிபார்ப்பு:", // TODO(ta-review)
    sourceType: {
      official: "அதிகாரப்பூர்வம்", // TODO(ta-review)
      court_record: "நீதிமன்றப் பதிவு", // TODO(ta-review)
      academic: "கல்வியியல்", // TODO(ta-review)
      news: "செய்தி", // TODO(ta-review)
      organisation: "அமைப்பு", // TODO(ta-review)
      community: "சமூகம்", // TODO(ta-review)
      social_media: "சமூக ஊடகம்", // TODO(ta-review)
      unverified: "சரிபார்க்கப்படாத மூலம்", // TODO(ta-review)
    },
    verification: {
      verified: "சரிபார்க்கப்பட்டது", // TODO(ta-review)
      multiple_outlets: "பல ஊடகங்களில் அறிவிக்கப்பட்டது", // TODO(ta-review)
      single_source: "ஒற்றை மூலம்", // TODO(ta-review)
      disputed: "சர்ச்சைக்குரியது", // TODO(ta-review)
      unverified: "சரிபார்க்கப்படாதது", // TODO(ta-review)
    },
  },
  sources: {
    heading: "மூலங்கள்", // TODO(ta-review)
    published: "வெளியிடப்பட்டது", // TODO(ta-review)
    offline: "அச்சு அல்லது இணையமற்ற மூலம்", // TODO(ta-review)
    openOriginal: "மூலப் பக்கத்தைத் திறக்கவும்", // TODO(ta-review)
    openArchived: "காப்பகப் பிரதியைத் திறக்கவும்", // TODO(ta-review)
    offSite: "(வேறு இணையதளத்தில் திறக்கும்)", // TODO(ta-review)
    linkStatus: {
      removed: "வெளியீட்டாளர் இந்தப் பக்கத்தை நீக்கியுள்ளார்.", // TODO(ta-review)
      unreachable: "கடைசியாகச் சரிபார்த்தபோது இந்தப் பக்கத்தை அணுக முடியவில்லை.", // TODO(ta-review)
      corrected: "நாங்கள் முதலில் மேற்கோள் காட்டிய பின் வெளியீட்டாளர் இந்தப் பக்கத்தைத் திருத்தியுள்ளார்.", // TODO(ta-review)
    },
    archiveKept: "பதிவைச் சரிபார்க்க எங்கள் காப்பகப் பிரதி வைக்கப்பட்டுள்ளது.", // TODO(ta-review)
    conflictHeading: "மூலங்கள் வெவ்வேறு எண்ணிக்கைகளைத் தருகின்றன", // TODO(ta-review)
    conflictBody: "ஒவ்வொரு எண்ணிக்கையையும் அதன் தேதியுடன் காட்டுகிறோம். அவற்றில் ஒன்றை நாங்கள் தேர்ந்தெடுப்பதில்லை.", // TODO(ta-review)
  },
  dataLimits: {
    heading: "இந்தத் தரவின் வரம்புகள்", // TODO(ta-review)
    kind: {
      gap: "தரவில் இடைவெளி", // TODO(ta-review)
      unconfirmed: "காரணம் உறுதிப்படுத்தப்படவில்லை", // TODO(ta-review)
      conflict: "முரண்படும் எண்ணிக்கைகள்", // TODO(ta-review)
    },
    conflictNote: "ஒவ்வொரு எண்ணிக்கையும் அதன் தேதியுடன் காட்டப்படுகிறது. அவற்றில் ஒன்றை நாங்கள் தேர்ந்தெடுப்பதில்லை.", // TODO(ta-review)
    readMore: "மேலும் படிக்க", // TODO(ta-review)
    lastChecked: "கடைசியாகச் சரிபார்த்தது", // TODO(ta-review)
    methodLink: "சான்றுகளை நாங்கள் எவ்வாறு குறிக்கிறோம்", // TODO(ta-review)
    correctionLink: "விடுபட்ட பதிவு அல்லது திருத்தத்தைத் தெரிவிக்கவும்", // TODO(ta-review)
  },
  header: {
    home: "Elephant Archive Sri Lanka, முகப்பு", // TODO(ta-review): brand name kept in English, as in siteName
  },
  menu: {
    close: "பட்டியை மூடு", // TODO(ta-review)
    sectionsLabel: "பிரிவுகள்", // TODO(ta-review)
    moreHeading: "மேலும்", // TODO(ta-review)
    sections: {
      elephants: {
        title: "யானைகள்", // TODO(ta-review)
        description: "தனிப்பட்ட யானைகளும் அவற்றின் வாழ்க்கைக் கதைகளும்.", // TODO(ta-review)
      },
      deaths: {
        title: "இறப்புகளும் காரணங்களும்", // TODO(ta-review)
        description: "ஆண்டு, காரணம், மாவட்டம் வாரியாக யானை இறப்புகள், மூலங்களுடன்.", // TODO(ta-review)
      },
      rescues: {
        title: "மீட்பும் பராமரிப்பும்", // TODO(ta-review)
        description: "அறிவிக்கப்பட்டபடி மீட்புகள், சிகிச்சை மற்றும் பராமரிப்பு.", // TODO(ta-review)
      },
      courtCases: {
        title: "நீதிமன்ற வழக்குகள்", // TODO(ta-review)
        description: "யானைகள் தொடர்பான வழக்குகள்; நீதிமன்றம் தீர்ப்பளிக்கும் வரை குற்றச்சாட்டுகளாகவே விவரிக்கப்படும்.", // TODO(ta-review) TODO(lawyer-review)
      },
      governmentActions: {
        title: "அரசாங்க நடவடிக்கைகள்", // TODO(ta-review)
        description: "காலப்போக்கில் சட்டங்கள், வர்த்தமானிகள், கொள்கைகள் மற்றும் திட்டங்கள்.", // TODO(ta-review)
      },
      history: {
        title: "வரலாறும் பண்பாடும்", // TODO(ta-review)
        description: "அரச காலம் முதல் இன்று வரை இலங்கையின் யானைகள்.", // TODO(ta-review)
      },
      communityStories: {
        title: "சமூகக் கதைகள்", // TODO(ta-review)
        description: "விவசாயிகள், கிராமவாசிகள் மற்றும் பிறர் தங்கள் சொந்த வார்த்தைகளில், ஒப்புதலுடன்.", // TODO(ta-review)
      },
    },
    secondary: {
      sources: "தரவும் மூலங்களும்", // TODO(ta-review)
      methodology: "முறையியலும் குறிச்சொற்களும்", // TODO(ta-review)
      contribute: "பங்களிக்க / திருத்த", // TODO(ta-review)
      about: "எங்களைப் பற்றி", // TODO(ta-review)
      contact: "தொடர்புகொள்ள", // TODO(ta-review)
    },
  },
  readMore: {
    more: "மேலும் படிக்க", // TODO(ta-review)
    less: "குறைவாகக் காட்டு", // TODO(ta-review)
  },
  toc: {
    onThisPage: "இந்தப் பக்கத்தில்", // TODO(ta-review)
  },
  legalNotice: {
    label: "சட்ட அறிவிப்பு", // TODO(ta-review)
    deaths:
      "இந்தப் பதிவு அறிவைப் பரப்புகிறது. பட்டியலிடப்பட்ட மூலங்கள் தெரிவிக்கும் விதத்திலேயே இது இறப்புகளை விவரிக்கிறது. இது எந்தவொரு நபருக்கோ சமூகத்துக்கோ எதிரான குற்றச்சாட்டோ சட்ட ஆலோசனையோ அல்ல. இடங்கள் மாவட்ட அளவில் மட்டுமே காட்டப்படுகின்றன.", // TODO(ta-review) TODO(lawyer-review)
    court:
      "இந்தக் காப்பகம் பொது அறிவுக்காகத் தகவல்களைப் பகிர்கிறது. இது குற்றச்சாட்டோ சட்ட ஆலோசனையோ அல்ல. வழக்குகளில் பெயரிடப்பட்டவர்கள், நீதிமன்றம் அவர்களைக் குற்றவாளிகள் எனத் தீர்ப்பளிக்கும் வரை நிரபராதிகளாகவே கருதப்படுகிறார்கள்.", // TODO(ta-review) TODO(lawyer-review)
    short: "பொது அறிவுக்காக மட்டுமே; குற்றச்சாட்டோ சட்ட ஆலோசனையோ அல்ல.", // TODO(ta-review) TODO(lawyer-review)
  },
  translation: {
    partlyHeading: "இந்தப் பக்கம் தமிழில் பகுதியளவு மொழிபெயர்க்கப்பட்டுள்ளது", // TODO(ta-review)
    partlyBody: '"ஆங்கிலத்தில் காட்டப்படுகிறது" எனக் குறிக்கப்பட்ட பகுதிகளின் தமிழ் மொழிபெயர்ப்பு, தமிழைத் தாய்மொழியாகக் கொண்ட ஒருவரின் ஒப்புதலுக்காகக் காத்திருக்கிறது.', // TODO(ta-review)
    missingHeading: "இந்தப் பக்கம் இன்னும் தமிழில் மொழிபெயர்க்கப்படவில்லை", // TODO(ta-review)
    missingBody: "தமிழைத் தாய்மொழியாகக் கொண்ட ஒருவர் மொழிபெயர்த்து ஒப்புதல் அளிக்கும் வரை கீழே ஆங்கிலத்தில் காட்டப்படுகிறது.", // TODO(ta-review)
    readInEnglish: "முழுப் பக்கத்தையும் ஆங்கிலத்தில் படியுங்கள்", // TODO(ta-review)
    helpTranslate: "இந்தப் பக்கத்தை மொழிபெயர்க்க உதவுங்கள்", // TODO(ta-review)
    shownInEnglish: "ஆங்கிலத்தில் காட்டப்படுகிறது", // TODO(ta-review)
    reviewed: "தமிழைத் தாய்மொழியாகக் கொண்ட ஒருவரால் மொழிபெயர்ப்பு மதிப்பாய்வு செய்யப்பட்டது", // TODO(ta-review)
  },
};
