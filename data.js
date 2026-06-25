// Hanuman Chalisa — verse data
// type: "section" (heading), "doha", or "chaupai"
// hi: Devanagari text, en: transliteration
// For doha/chaupai, "hi" / "en" may contain two lines split by "\n".

const CHALISA = [
  { type: "section", hi: "॥ दोहा ॥", en: "|| Doha ||" },

  {
    type: "doha",
    hi: "श्रीगुरु चरन सरोज रज, निजमन मुकुरु सुधारि।\nबरनउं रघुबर बिमल जसु, जो दायक फल चारि॥",
    en: "Shri Guru Charan Saroj Raj, Nija Manu Mukura Sudhari |\nBaranau Raghuvar Bimal Jasu, Jo Dayaku Phala Chari ||"
  },
  {
    type: "doha",
    hi: "बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार।\nबल बुधि बिद्या देहु मोहिं, हरहु कलेस बिकार॥",
    en: "Budheeheen Tanu Jannike, Sumiro Pavan Kumara |\nBal Buddhi Vidya Dehoo Mohee, Harahu Kalesh Vikaar ||"
  },

  { type: "section", hi: "॥ चौपाई ॥", en: "|| Chaupai ||" },

  {
    type: "chaupai",
    hi: "जय हनुमान ज्ञान गुन सागर।\nजय कपीस तिहुं लोक उजागर॥",
    en: "Jai Hanuman Gyan Gun Sagar |\nJai Kapis Tihun Lok Ujagar ||"
  },
  {
    type: "chaupai",
    hi: "राम दूत अतुलित बल धामा।\nअंजनि-पुत्र पवनसुत नामा॥",
    en: "Ram Doot Atulit Bal Dhama |\nAnjani Putra Pavan Sut Nama ||"
  },
  {
    type: "chaupai",
    hi: "महाबीर बिक्रम बजरंगी।\nकुमति निवार सुमति के संगी॥",
    en: "Mahabir Vikram Bajrangi |\nKumati Nivar Sumati Ke Sangi ||"
  },
  {
    type: "chaupai",
    hi: "कंचन बरन बिराज सुबेसा।\nकानन कुण्डल कुँचित केसा॥",
    en: "Kanchan Varan Viraj Subesa |\nKanan Kundal Kunchit Kesha ||"
  },
  {
    type: "chaupai",
    hi: "हाथ बज्र औ ध्वजा बिराजे।\nकांधे मूंज जनेउ साजे॥",
    en: "Hath Vajra Aur Dhwaja Viraje |\nKaandhe Moonj Janeu Saaje ||"
  },
  {
    type: "chaupai",
    hi: "शंकर सुवन केसरी नंदन।\nतेज प्रताप महा जग वंदन॥",
    en: "Sankar Suvan Kesri Nandan |\nTej Prataap Maha Jag Vandan ||"
  },
  {
    type: "chaupai",
    hi: "बिद्यावान गुनी अति चातुर।\nराम काज करिबे को आतुर॥",
    en: "Vidyavaan Guni Ati Chatur |\nRam Kaj Karibe Ko Aatur ||"
  },
  {
    type: "chaupai",
    hi: "प्रभु चरित्र सुनिबे को रसिया।\nराम लखन सीता मन बसिया॥",
    en: "Prabhu Charitra Sunibe Ko Rasiya |\nRam Lakhan Sita Man Basiya ||"
  },
  {
    type: "chaupai",
    hi: "सूक्ष्म रूप धरि सियहिं दिखावा।\nबिकट रूप धरि लंक जरावा॥",
    en: "Sukshma Roop Dhari Siyahi Dikhava |\nVikat Roop Dhari Lank Jalava ||"
  },
  {
    type: "chaupai",
    hi: "भीम रूप धरि असुर संहारे।\nरामचन्द्र के काज संवारे॥",
    en: "Bhim Roop Dhari Asur Sanhare |\nRamachandra Ke Kaj Sanvare ||"
  },
  {
    type: "chaupai",
    hi: "लाय सजीवन लखन जियाये।\nश्री रघुबीर हरषि उर लाये॥",
    en: "Laye Sanjivan Lakhan Jiyaye |\nShri Raghuvir Harashi Ur Laye ||"
  },
  {
    type: "chaupai",
    hi: "रघुपति कीन्ही बहुत बड़ाई।\nतुम मम प्रिय भरतहि सम भाई॥",
    en: "Raghupati Kinhi Bahut Badai |\nTum Mama Priya Bharat-Hi-Sam Bhai ||"
  },
  {
    type: "chaupai",
    hi: "सहस बदन तुम्हरो जस गावैं।\nअस कहि श्रीपति कण्ठ लगावैं॥",
    en: "Sahas Badan Tumharo Yash Gaave |\nAs Kahi Shripati Kanth Lagaave ||"
  },
  {
    type: "chaupai",
    hi: "सनकादिक ब्रह्मादि मुनीसा।\nनारद सारद सहित अहीसा॥",
    en: "Sankadhik Brahmaadi Muneesa |\nNarad Sarad Sahit Aheesa ||"
  },
  {
    type: "chaupai",
    hi: "जम कुबेर दिगपाल जहां ते।\nकबि कोबिद कहि सके कहां ते॥",
    en: "Yam Kuber Dikpaal Jahan Te |\nKavi Kovid Kahi Sake Kahan Te ||"
  },
  {
    type: "chaupai",
    hi: "तुम उपकार सुग्रीवहिं कीन्हा।\nराम मिलाय राज पद दीन्हा॥",
    en: "Tum Upkar Sugreevahin Keenha |\nRam Milaye Rajpad Deenha ||"
  },
  {
    type: "chaupai",
    hi: "तुम्हरो मंत्र बिभीषन माना।\nलंकेश्वर भए सब जग जाना॥",
    en: "Tumhro Mantra Vibheeshan Maana |\nLankeshwar Bhaye Sab Jag Jana ||"
  },
  {
    type: "chaupai",
    hi: "जुग सहस्र जोजन पर भानु।\nलील्यो ताहि मधुर फल जानू॥",
    en: "Yug Sahasra Yojan Par Bhanu |\nLeelyo Tahi Madhur Phal Janu ||"
  },
  {
    type: "chaupai",
    hi: "प्रभु मुद्रिका मेलि मुख माहीं।\nजलधि लांघि गये अचरज नाहीं॥",
    en: "Prabhu Mudrika Meli Mukh Mahee |\nJaladhi Langhi Gaye Achraj Nahee ||"
  },
  {
    type: "chaupai",
    hi: "दुर्गम काज जगत के जेते।\nसुगम अनुग्रह तुम्हरे तेते॥",
    en: "Durgam Kaj Jagat Ke Jete |\nSugam Anugraha Tumhre Tete ||"
  },
  {
    type: "chaupai",
    hi: "राम दुआरे तुम रखवारे।\nहोत न आज्ञा बिनु पैसारे॥",
    en: "Ram Duwaare Tum Rakhvare |\nHot Na Agya Binu Paisare ||"
  },
  {
    type: "chaupai",
    hi: "सब सुख लहै तुम्हारी सरना।\nतुम रच्छक काहू को डर ना॥",
    en: "Sab Sukh Lahai Tumhari Sarna |\nTum Rakshak Kahu Ko Darna ||"
  },
  {
    type: "chaupai",
    hi: "आपन तेज सम्हारो आपै।\nतीनों लोक हांक तें कांपै॥",
    en: "Aapan Tej Samharo Aapai |\nTeenon Lok Hank Te Kanpai ||"
  },
  {
    type: "chaupai",
    hi: "भूत पिसाच निकट नहिं आवै।\nमहाबीर जब नाम सुनावै॥",
    en: "Bhoot Pisaach Nikat Nahin Aavai |\nMahavir Jab Naam Sunavai ||"
  },
  {
    type: "chaupai",
    hi: "नासै रोग हरे सब पीरा।\nजपत निरन्तर हनुमत बीरा॥",
    en: "Nase Rog Harae Sab Peera |\nJapat Nirantar Hanumat Beera ||"
  },
  {
    type: "chaupai",
    hi: "संकट तें हनुमान छुड़ावै।\nमन क्रम बचन ध्यान जो लावै॥",
    en: "Sankat Se Hanuman Chhudavai |\nMan Kram Vachan Dhyan Jo Lavai ||"
  },
  {
    type: "chaupai",
    hi: "सब पर राम तपस्वी राजा।\nतिन के काज सकल तुम साजा॥",
    en: "Sab Par Ram Tapasvee Raja |\nTin Ke Kaj Sakal Tum Saja ||"
  },
  {
    type: "chaupai",
    hi: "और मनोरथ जो कोई लावै।\nसोई अमित जीवन फल पावै॥",
    en: "Aur Manorath Jo Koi Lavai |\nSoi Amit Jeevan Phal Pavai ||"
  },
  {
    type: "chaupai",
    hi: "चारों जुग परताप तुम्हारा।\nहै परसिद्ध जगत उजियारा॥",
    en: "Charon Jug Partap Tumhara |\nHai Parsiddh Jagat Ujiyara ||"
  },
  {
    type: "chaupai",
    hi: "साधु संत के तुम रखवारे।\nअसुर निकन्दन राम दुलारे॥",
    en: "Sadhu Sant Ke Tum Rakhware |\nAsur Nikandan Ram Dulare ||"
  },
  {
    type: "chaupai",
    hi: "अष्टसिद्धि नौ निधि के दाता।\nअस बर दीन जानकी माता॥",
    en: "Ashta Siddhi Nav Nidhi Ke Data |\nAs Var Deen Janki Mata ||"
  },
  {
    type: "chaupai",
    hi: "राम रसायन तुम्हरे पासा।\nसदा रहो रघुपति के दासा॥",
    en: "Ram Rasayan Tumhare Pasa |\nSada Raho Raghupati Ke Dasa ||"
  },
  {
    type: "chaupai",
    hi: "तुह्मरे भजन राम को पावै।\nजनम जनम के दुख बिसरावै॥",
    en: "Tumhare Bhajan Ram Ko Pavai |\nJanam Janam Ke Dukh Bisraavai ||"
  },
  {
    type: "chaupai",
    hi: "अंत काल रघुबर पुर जाई।\nजहां जन्म हरिभक्त कहाई॥",
    en: "Antkaal Raghuvar Pur Jayee |\nJahan Janam Hari Bhakt Kahayee ||"
  },
  {
    type: "chaupai",
    hi: "और देवता चित्त न धरई।\nहनुमत सेइ सर्ब सुख करई॥",
    en: "Aur Devta Chitt Na Dharahin |\nHanumat Sei Sarv Sukh Karahin ||"
  },
  {
    type: "chaupai",
    hi: "सङ्कट कटै मिटै सब पीरा।\nजो सुमिरै हनुमत बलबीरा॥",
    en: "Sankat Kate Mite Sab Peera |\nJo Sumirai Hanumat Balbeera ||"
  },
  {
    type: "chaupai",
    hi: "जय जय जय हनुमान गोसाईं।\nकृपा करहु गुरुदेव की नाईं॥",
    en: "Jai Jai Jai Hanuman Gosain |\nKripa Karahun Gurudev Ki Nayin ||"
  },
  {
    type: "chaupai",
    hi: "जो सत बार पाठ कर कोई।\nछूटहि बन्दि महा सुख होई॥",
    en: "Jo Shat Bar Path Kare Koi |\nChhutahin Bandi Maha Sukh Hoi ||"
  },
  {
    type: "chaupai",
    hi: "जो यह पढ़ै हनुमान चालीसा।\nहोय सिद्धि साखी गौरीसा॥",
    en: "Jo Yeh Padhe Hanuman Chalisa |\nHoye Siddhi Saakhi Gaureesa ||"
  },
  {
    type: "chaupai",
    hi: "तुलसीदास सदा हरि चेरा।\nकीजै नाथ हृदय महं डेरा॥",
    en: "Tulsidas Sada Hari Chera |\nKeejai Nath Hriday Mahn Dera ||"
  },

  { type: "section", hi: "॥ दोहा ॥", en: "|| Doha ||" },

  {
    type: "doha",
    hi: "पवन तनय संकट हरन, मंगल मूरति रूप।\nराम लखन सीता सहित, हृदय बसहु सुर भूप॥",
    en: "Pavan Tanay Sankat Harana, Mangala Murati Roop |\nRam Lakhan Sita Sahita, Hriday Basahu Soor Bhoop ||"
  }
];
