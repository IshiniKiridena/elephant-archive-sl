import type { Messages } from "./en";

/**
 * Sinhala UI strings. DRAFTS: none of these has been reviewed by a native speaker.
 * Each line carries TODO(si-review); remove it only after a native speaker approves that line.
 * Count what is left: grep -c "TODO(si-review)" src/i18n/messages/si.ts
 */
export const si: Messages = {
  siteName: "Elephant Archive Sri Lanka", // TODO(si-review): brand name kept in English; confirm whether a Sinhala form is wanted
  tagline: "ශ්‍රී ලංකාවේ අලි ඇතුන් පිළිබඳ විවෘත, ලේබල් කළ වාර්තාවක්", // TODO(si-review)
  nav: {
    menu: "මෙනුව", // TODO(si-review)
    contribute: "දායක වන්න", // TODO(si-review)
    language: "භාෂාව", // TODO(si-review)
  },
  home: {
    heroTitle: "සෑම අලියෙකුටම දැනගත යුතු කතාවක් ඇත", // TODO(si-review)
    heroBody: "ජීවිත, අහිමි වීම්, බේරා ගැනීම් සහ ඉතිහාසය, එක් එක් එහි මූලාශ්‍රය සහ කොතරම් දුරට පරීක්ෂා කර ඇත්ද යන්න සමඟ.", // TODO(si-review)
    heroCta: "වාර්තාව ගවේෂණය කරන්න", // TODO(si-review)
  },
  herd: {
    pause: "නවත්වන්න", // TODO(si-review)
    play: "ධාවනය කරන්න", // TODO(si-review)
  },
  fact: {
    didYouKnow: "ඔබ දන්නවාද?", // TODO(si-review)
    flip: "මෙය කොහෙන්ද?", // TODO(si-review)
    back: "ආපසු", // TODO(si-review)
    source: "මූලාශ්‍රය", // TODO(si-review)
    share: "කාඩ්පත බෙදාගන්න", // TODO(si-review)
  },
  footer: {
    legal: "මෙම සංරක්ෂණාගාරය දැනුම බෙදා හරියි. එය චෝදනාවක් හෝ නීති උපදෙස් නොවේ.", // TODO(si-review)
    linksLabel: "මෙම සංරක්ෂණාගාරය ගැන", // TODO(si-review)
  },
  evidence: {
    groupLabel: "සාක්ෂි ලේබල්", // TODO(si-review)
    sourceTypePrefix: "මූලාශ්‍ර වර්ගය:", // TODO(si-review)
    verificationPrefix: "සත්‍යාපනය:", // TODO(si-review)
    sourceType: {
      official: "නිල", // TODO(si-review)
      court_record: "අධිකරණ වාර්තාව", // TODO(si-review)
      academic: "ශාස්ත්‍රීය", // TODO(si-review)
      news: "පුවත්", // TODO(si-review)
      organisation: "සංවිධානය", // TODO(si-review)
      community: "ප්‍රජාව", // TODO(si-review)
      social_media: "සමාජ මාධ්‍ය", // TODO(si-review)
      unverified: "සත්‍යාපනය නොකළ මූලාශ්‍රය", // TODO(si-review)
    },
    verification: {
      verified: "සත්‍යාපිතයි", // TODO(si-review)
      multiple_outlets: "මාධ්‍ය කිහිපයක වාර්තා වී ඇත", // TODO(si-review)
      single_source: "එක් මූලාශ්‍රයක්", // TODO(si-review)
      disputed: "මතභේදාත්මක", // TODO(si-review)
      unverified: "සත්‍යාපනය නොකළ", // TODO(si-review)
    },
  },
  sources: {
    heading: "මූලාශ්‍ර", // TODO(si-review)
    published: "ප්‍රකාශිත", // TODO(si-review)
    offline: "මුද්‍රිත හෝ නොබැඳි මූලාශ්‍රයක්", // TODO(si-review)
    openOriginal: "මුල් පිටපත විවෘත කරන්න", // TODO(si-review)
    openArchived: "සංරක්ෂිත පිටපත විවෘත කරන්න", // TODO(si-review)
    offSite: "(වෙනත් වෙබ් අඩවියක් විවෘත වේ)", // TODO(si-review)
    linkStatus: {
      removed: "ප්‍රකාශකයා මෙම පිටුව ඉවත් කර ඇත.", // TODO(si-review)
      unreachable: "අප අවසන් වරට පරීක්ෂා කළ විට මෙම පිටුවට ළඟා විය නොහැකි විය.", // TODO(si-review)
      corrected: "අප මුලින්ම උපුටා දැක්වූ පසු ප්‍රකාශකයා මෙම පිටුව නිවැරදි කර ඇත.", // TODO(si-review)
    },
    archiveKept: "වාර්තාව තවමත් පරීක්ෂා කළ හැකි වන පරිදි අපගේ සංරක්ෂිත පිටපත තබා ඇත.", // TODO(si-review)
    conflictHeading: "මූලාශ්‍ර වෙනස් සංඛ්‍යා දක්වයි", // TODO(si-review)
    conflictBody: "අපි සෑම සංඛ්‍යාවක්ම එහි දිනය සමඟ පෙන්වමු. අපි ඒවා අතරින් එකක් තෝරා නොගනිමු.", // TODO(si-review)
  },
  dataLimits: {
    heading: "මෙම දත්තවල සීමා", // TODO(si-review)
    kind: {
      gap: "දත්තවල හිඩැසක්", // TODO(si-review)
      unconfirmed: "හේතුව තහවුරු කර නැත", // TODO(si-review)
      conflict: "එකිනෙකට වෙනස් සංඛ්‍යා", // TODO(si-review)
    },
    conflictNote: "සෑම සංඛ්‍යාවක්ම එහි දිනය සමඟ පෙන්වා ඇත. අපි ඒවා අතරින් එකක් තෝරා නොගනිමු.", // TODO(si-review)
    readMore: "තවත් කියවන්න", // TODO(si-review)
    lastChecked: "අවසන් වරට පරීක්ෂා කළේ", // TODO(si-review)
    methodLink: "අපි සාක්ෂි ලේබල් කරන ආකාරය", // TODO(si-review)
    correctionLink: "අතුරුදහන් වාර්තාවක් හෝ නිවැරදි කිරීමක් වාර්තා කරන්න", // TODO(si-review)
  },
  header: {
    home: "Elephant Archive Sri Lanka, මුල් පිටුව", // TODO(si-review): brand name kept in English, as in siteName
  },
  menu: {
    close: "මෙනුව වසන්න", // TODO(si-review)
    sectionsLabel: "කොටස්", // TODO(si-review)
    moreHeading: "තවත්", // TODO(si-review)
    sections: {
      elephants: {
        title: "අලි ඇතුන්", // TODO(si-review)
        description: "එක් එක් අලියා සහ ඔවුන්ගේ ජීවන කතා.", // TODO(si-review)
      },
      deaths: {
        title: "මරණ සහ හේතු", // TODO(si-review)
        description: "වසර, හේතුව සහ දිස්ත්‍රික්කය අනුව අලි මරණ, මූලාශ්‍ර සමඟ.", // TODO(si-review)
      },
      rescues: {
        title: "බේරා ගැනීම් සහ රැකවරණය", // TODO(si-review)
        description: "වාර්තා වූ පරිදි බේරා ගැනීම්, ප්‍රතිකාර සහ රැකවරණය.", // TODO(si-review)
      },
      courtCases: {
        title: "අධිකරණ නඩු", // TODO(si-review)
        description: "අලි සම්බන්ධ නඩු; අධිකරණයක් වරදකරු කරන තුරු චෝදිත ලෙස විස්තර කෙරේ.", // TODO(si-review) TODO(lawyer-review)
      },
      governmentActions: {
        title: "රජයේ ක්‍රියාමාර්ග", // TODO(si-review)
        description: "කාලයත් සමඟ නීති, ගැසට්, ප්‍රතිපත්ති සහ වැඩසටහන්.", // TODO(si-review)
      },
      history: {
        title: "ඉතිහාසය සහ සංස්කෘතිය", // TODO(si-review)
        description: "රාජධානි යුගයේ සිට අද දක්වා ශ්‍රී ලංකාවේ අලි ඇතුන්.", // TODO(si-review)
      },
      communityStories: {
        title: "ප්‍රජා කතා", // TODO(si-review)
        description: "ගොවීන්, ගම්වාසීන් සහ අනෙකුත් අය ඔවුන්ගේම වචනවලින්, කැමැත්ත ඇතිව.", // TODO(si-review)
      },
    },
    secondary: {
      sources: "දත්ත සහ මූලාශ්‍ර", // TODO(si-review)
      methodology: "ක්‍රමවේදය සහ ලේබල්", // TODO(si-review)
      contribute: "දායක වන්න / නිවැරදි කරන්න", // TODO(si-review)
      about: "අප ගැන", // TODO(si-review)
      contact: "අප අමතන්න", // TODO(si-review)
    },
  },
  readMore: {
    more: "තවත් කියවන්න", // TODO(si-review)
    less: "අඩුවෙන් පෙන්වන්න", // TODO(si-review)
  },
  toc: {
    onThisPage: "මෙම පිටුවේ", // TODO(si-review)
  },
  legalNotice: {
    label: "නීතිමය දැනුම්දීම", // TODO(si-review)
    deaths:
      "මෙම වාර්තාව දැනුම බෙදා හරියි. එය ලැයිස්තුගත මූලාශ්‍ර වාර්තා කරන ආකාරයටම මරණ විස්තර කරයි. එය කිසිදු පුද්ගලයෙකුට හෝ ප්‍රජාවකට එරෙහි චෝදනාවක් හෝ නීති උපදෙස් නොවේ. ස්ථාන පෙන්වන්නේ දිස්ත්‍රික්ක මට්ටමින් පමණි.", // TODO(si-review) TODO(lawyer-review)
    court:
      "මෙම සංරක්ෂණාගාරය මහජන දැනුම සඳහා තොරතුරු බෙදා ගනී. එය චෝදනාවක් හෝ නීති උපදෙස් නොවේ. නඩුවල නම් සඳහන් වන පුද්ගලයින්, අධිකරණයක් විසින් වරදකරුවන් කරන තුරු නිර්දෝෂී යැයි සැලකේ.", // TODO(si-review) TODO(lawyer-review)
    short: "මහජන දැනුම සඳහා පමණි; චෝදනාවක් හෝ නීති උපදෙස් නොවේ.", // TODO(si-review) TODO(lawyer-review)
  },
  translation: {
    partlyHeading: "මෙම පිටුව සිංහලට අර්ධ වශයෙන් පරිවර්තනය කර ඇත", // TODO(si-review)
    partlyBody: '"ඉංග්‍රීසියෙන් පෙන්වා ඇත" ලෙස සලකුණු කළ කොටස්වල සිංහල පරිවර්තනය, සිංහල මව් භාෂාව වූවෙකුගේ අනුමැතිය බලාපොරොත්තුවෙන් සිටී.', // TODO(si-review)
    missingHeading: "මෙම පිටුව තවමත් සිංහලට පරිවර්තනය කර නැත", // TODO(si-review)
    missingBody: "සිංහල මව් භාෂාව වූවෙකු එය පරිවර්තනය කර අනුමත කරන තෙක් පහතින් ඉංග්‍රීසියෙන් පෙන්වා ඇත.", // TODO(si-review)
    readInEnglish: "සම්පූර්ණ පිටුව ඉංග්‍රීසියෙන් කියවන්න", // TODO(si-review)
    helpTranslate: "මෙම පිටුව පරිවර්තනය කිරීමට උදව් කරන්න", // TODO(si-review)
    shownInEnglish: "ඉංග්‍රීසියෙන් පෙන්වා ඇත", // TODO(si-review)
    reviewed: "පරිවර්තනය සිංහල මව් භාෂාව වූවෙකු විසින් සමාලෝචනය කර ඇත", // TODO(si-review)
  },
};
