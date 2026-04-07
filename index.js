const cron = require('node-cron');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

// ── ROOMS ─────────────────────────────────────────────────────────────
const ROOMS = {
  'iran-war-2026':   { title:'War on Iran',            keywords:['iran','iranian','tehran','khamenei','irgc','natanz','fordow','hormuz','persian gulf','iran war','iran strike'] },
  'isr-pal':         { title:'War in Gaza',            keywords:['gaza','hamas','israel','israeli','palestinian','west bank','idf','rafah','netanyahu','ceasefire','occupied'] },
  'ukraine-russia':  { title:'Ukraine War',            keywords:['ukraine','ukrainian','russia','russian','zelensky','putin','kyiv','nato ukraine','crimea','donbas'] },
  'sudan-war':       { title:'Sudan Crisis',           keywords:['sudan','sudanese','khartoum','rsf','darfur','sudan war','sudan crisis','sudan famine'] },
  'myanmar-war':     { title:'Myanmar',                keywords:['myanmar','burma','burmese','rohingya','junta','tatmadaw','myanmar coup'] },
  'us-china':        { title:'US vs China',            keywords:['us china','china trade','china tariff','south china sea','xi jinping','china sanctions','china decoupling'] },
  'iran':            { title:'Iran & the US',          keywords:['iran sanctions','jcpoa','iran nuclear deal','iran diplomacy','iran economy','iran protests'] },
  'taiwan-strait':   { title:'Taiwan',                 keywords:['taiwan','taiwanese','taipei','strait of taiwan','china taiwan','pla taiwan','taiwan independence'] },
  'nato-expansion':  { title:'NATO',                   keywords:['nato','article 5','nato expansion','nato summit','transatlantic','nato ukraine','nato russia'] },
  'brics-rise':      { title:'BRICS',                  keywords:['brics','global south','dedollarization','multipolar','brics summit','brics expansion'] },
  'arctic-race':     { title:'Arctic Race',            keywords:['arctic','greenland','svalbard','northern sea route','arctic oil','arctic military','arctic sovereignty'] },
  'middle-east':     { title:'Middle East',            keywords:['saudi arabia','saudi','riyadh','abu dhabi','gulf states','hezbollah','houthi','yemen','lebanon war'] },
  'trump':           { title:'Trump',                  keywords:['trump indictment','trump trial','trump prosecution','espionage act','trump criminal','trump charges','trump conviction'] },
  'us-election-2026':{ title:'US Midterms',            keywords:['midterm','2026 election','us election','congress election','senate race','house race'] },
  'us-immigration':  { title:'Immigration',            keywords:['us immigration','border crisis','deportation','ice raids','undocumented','migrant border','southern border'] },
  'us-economy':      { title:'US Economy',             keywords:['us economy','us tariff','us inflation','federal reserve','us gdp','us recession','powell fed'] },
  'us-supreme-court':{ title:'Supreme Court',          keywords:['supreme court','scotus','supreme court ruling','abortion ruling','gun ruling'] },
  'ai-reg':          { title:'AI Regulation',          keywords:['ai regulation','eu ai act','ai law','artificial intelligence regulation','ai governance','ai policy'] },
  'ai-race':         { title:'AI Race',                keywords:['openai','anthropic','google gemini','gpt','claude ai','llm','large language model','ai race','deepseek'] },
  'big-tech':        { title:'Big Tech',               keywords:['google antitrust','apple antitrust','meta antitrust','amazon antitrust','big tech','tech monopoly'] },
  'social-media':    { title:'Social Media',           keywords:['twitter x','facebook','instagram','social media','misinformation','content moderation','elon musk twitter'] },
  'tiktok-ban':      { title:'TikTok',                 keywords:['tiktok','bytedance','tiktok us','tiktok ban','tiktok china','tiktok divest'] },
  'crypto':          { title:'Crypto',                 keywords:['bitcoin','ethereum','crypto','cryptocurrency','blockchain','defi','crypto regulation','sec crypto'] },
  'space-race':      { title:'Space',                  keywords:['spacex','nasa','moon mission','starship','space station','space race','space launch','artemis'] },
  'climate':         { title:'Climate Crisis',         keywords:['climate change','global warming','carbon emissions','net zero','ipcc','climate crisis','extreme weather','sea level'] },
  'energy-transition':{ title:'Energy',               keywords:['renewable energy','solar power','wind power','energy transition','fossil fuels','oil price','energy crisis','nuclear energy'] },
  'cop-climate':     { title:'COP',                    keywords:['cop30','cop29','cop climate','unfccc','paris agreement','climate pledge','emissions target'] },
  'global-economy':  { title:'Global Economy',        keywords:['global economy','world economy','imf','world bank','global recession','economic growth','global inflation'] },
  'trade-wars':      { title:'Trade Wars',             keywords:['trade war','tariff','trade deficit','wto','trade sanctions','trade deal','protectionism'] },
  'debt-crisis':     { title:'Debt Crisis',            keywords:['sovereign debt','debt crisis','debt default','imf bailout','debt restructuring','fiscal crisis'] },
  'food-security':   { title:'Food Crisis',            keywords:['food security','food crisis','famine','hunger','food prices','wheat supply','food shortage','malnutrition'] },
  'pandemic-prep':   { title:'Pandemic Prep',          keywords:['pandemic','who pandemic','disease outbreak','mpox','bird flu','h5n1','pandemic preparedness'] },
  'mental-health':   { title:'Mental Health',          keywords:['mental health','depression','anxiety','suicide rate','mental health crisis','youth mental health'] },
  'drug-policy':     { title:'Drug Policy',            keywords:['drug policy','drug legalisation','cannabis','fentanyl','opioid','drug decriminalization','war on drugs'] },
  'free-speech':     { title:'Free Speech',            keywords:['free speech','censorship','content moderation','cancel culture','first amendment','online freedom','hate speech'] },
  'gender-rights':   { title:'Gender Rights',          keywords:['trans rights','transgender','gender identity','gender medicine','trans ban','lgbtq rights'] },
  'migration-crisis':{ title:'Migration',              keywords:['migration','refugee','asylum seeker','migrants europe','channel crossing','mediterranean migrants','displacement'] },
  'inequality':      { title:'Inequality',             keywords:['inequality','wealth gap','billionaire','poverty','wealth tax','income inequality','social mobility'] },
  'press-freedom':   { title:'Press Freedom',          keywords:['press freedom','journalist jailed','media censorship','journalist killed','rsf','free press'] },
  'china-domestic':  { title:'China',                  keywords:['china economy','xi jinping','chinese politics','china property','evergrande','china growth','china crackdown'] },
  'russia-domestic': { title:'Russia',                 keywords:['russia economy','russia sanctions','russia opposition','navalny','russia repression','russian ruble'] },
  'india-politics':  { title:'India',                  keywords:['modi','india election','bjp','india economy','hindu nationalism','india china','india pakistan'] },
  'europe-politics': { title:'Europe',                 keywords:['european union','eu politics','far right europe','macron','scholz','meloni','europe election','populism europe'] },
  'africa-politics': { title:'Africa',                 keywords:['africa','sahel','coup africa','mali','niger','burkina faso','africa china','african union'] },
  'latin-america':   { title:'Latin America',          keywords:['latin america','mexico','brazil lula','argentina milei','venezuela','colombia','chile','central america'] },
  'un-reform':       { title:'UN',                     keywords:['united nations','un security council','un reform','un veto','general assembly','un peacekeeping'] },
  'icc-war-crimes':  { title:'War Crimes',             keywords:['icc','international criminal court','war crimes','genocide','crimes against humanity','icc arrest warrant'] },
  'who-reform':      { title:'WHO',                    keywords:['world health organization','who reform','who pandemic treaty','global health','who funding','tedros'] }
};

// ── RSS FEEDS ─────────────────────────────────────────────────────────
const RSS_FEEDS = [
  // ── GLOBAL TIER 1 — Major international news ─────────────────────
  { name:'Al Jazeera English',        url:'https://www.aljazeera.com/xml/rss/all.xml' },
  { name:'BBC World',                 url:'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name:'BBC US & Canada',           url:'http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml' },
  { name:'BBC Middle East',           url:'http://feeds.bbci.co.uk/news/world/middle_east/rss.xml' },
  { name:'BBC Europe',                url:'http://feeds.bbci.co.uk/news/world/europe/rss.xml' },
  { name:'Reuters World',             url:'https://feeds.reuters.com/reuters/worldnews' },
  { name:'Reuters Business',          url:'https://feeds.reuters.com/reuters/businessNews' },
  { name:'Reuters Politics',          url:'https://feeds.reuters.com/Reuters/PoliticsNews' },
  { name:'AP Top News',               url:'https://feeds.apnews.com/rss/apf-topnews' },
  { name:'AP World News',             url:'https://feeds.apnews.com/rss/apf-intlnews' },
  { name:'AFP via France24',          url:'https://www.france24.com/en/rss' },
  { name:'DW English',                url:'https://rss.dw.com/rdf/rss-en-all' },
  { name:'DW Middle East',            url:'https://rss.dw.com/xml/rss-en-middleeast' },
  { name:'NPR News',                  url:'https://feeds.npr.org/1001/rss.xml' },
  { name:'NPR World',                 url:'https://feeds.npr.org/1004/rss.xml' },
  { name:'Guardian World',            url:'https://www.theguardian.com/world/rss' },
  { name:'Guardian US',               url:'https://www.theguardian.com/us-news/rss' },
  { name:'Guardian Environment',      url:'https://www.theguardian.com/environment/rss' },
  { name:'Guardian Technology',       url:'https://www.theguardian.com/technology/rss' },
  { name:'Guardian Politics',         url:'https://www.theguardian.com/politics/rss' },

  // ── US POLITICS & POLICY ──────────────────────────────────────────
  { name:'Politico',                  url:'https://rss.politico.com/politics-news.xml' },
  { name:'Politico Europe',           url:'https://www.politico.eu/feed/' },
  { name:'The Hill',                  url:'https://thehill.com/feed/' },
  { name:'Axios',                     url:'https://api.axios.com/feed/' },
  { name:'Vox',                       url:'https://www.vox.com/rss/index.xml' },
  { name:'The Atlantic',              url:'https://www.theatlantic.com/feed/all/' },
  { name:'Slate',                     url:'https://feeds.slate.com/slate/all' },
  { name:'Semafor',                   url:'https://www.semafor.com/feed' },
  { name:'ProPublica',                url:'https://feeds.propublica.org/propublica/main' },
  { name:'The Intercept',             url:'https://theintercept.com/feed/?rss' },

  // ── ANALYSIS & FOREIGN POLICY ─────────────────────────────────────
  { name:'Foreign Policy',            url:'https://foreignpolicy.com/feed/' },
  { name:'Foreign Affairs',           url:'https://www.foreignaffairs.com/rss.xml' },
  { name:'Atlantic Council',          url:'https://www.atlanticcouncil.org/feed/' },
  { name:'Lawfare',                   url:'https://www.lawfaremedia.org/rss.xml' },
  { name:'War on the Rocks',          url:'https://warontherocks.com/feed/' },
  { name:'Responsible Statecraft',    url:'https://responsiblestatecraft.org/feed/' },
  { name:'The National Interest',     url:'https://nationalinterest.org/rss.xml' },
  { name:'Council on Foreign Relations', url:'https://www.cfr.org/rss/region/all' },
  { name:'Brookings',                 url:'https://www.brookings.edu/feed/' },
  { name:'Carnegie Endowment',        url:'https://carnegieendowment.org/rss/solr.xml' },
  { name:'RAND',                      url:'https://www.rand.org/pubs/rss.xml' },
  { name:'Wilson Center',             url:'https://www.wilsoncenter.org/feed' },
  { name:'Chatham House',             url:'https://www.chathamhouse.org/rss.xml' },
  { name:'ECFR',                      url:'https://ecfr.eu/feed/' },
  { name:'ICG Crisis Group',          url:'https://www.crisisgroup.org/rss.xml' },

  // ── MIDDLE EAST ───────────────────────────────────────────────────
  { name:'Middle East Eye',           url:'https://www.middleeasteye.net/rss' },
  { name:'Haaretz English',           url:'https://www.haaretz.com/srv/haaretz-eng.xml' },
  { name:'Jerusalem Post',            url:'https://www.jpost.com/rss/rssfeedsfrontpage.aspx' },
  { name:'Arab News',                 url:'https://www.arabnews.com/rss.xml' },
  { name:'Al-Monitor',                url:'https://www.al-monitor.com/rss' },
  { name:'Mondoweiss',                url:'https://mondoweiss.net/feed/' },
  { name:'972 Magazine',              url:'https://www.972mag.com/feed/' },
  { name:'Iran International',        url:'https://www.iranintl.com/en/rss' },
  { name:'Middle East Monitor',       url:'https://www.middleeastmonitor.com/feed/' },

  // ── EUROPE ────────────────────────────────────────────────────────
  { name:'EUobserver',                url:'https://euobserver.com/feed' },
  { name:'Euronews',                  url:'https://feeds.feedburner.com/euronews/en/news/' },
  { name:'EU Politics',               url:'https://www.politico.eu/feed/' },
  { name:'Der Spiegel International', url:'https://www.spiegel.de/international/index.rss' },
  { name:'Le Monde Diplomatique',     url:'https://mondediplo.com/feed/full' },
  { name:'openDemocracy',             url:'https://www.opendemocracy.net/en/rss.xml' },

  // ── RUSSIA & EASTERN EUROPE ───────────────────────────────────────
  { name:'Meduza English',            url:'https://meduza.io/en/rss/all' },
  { name:'Moscow Times',              url:'https://www.themoscowtimes.com/rss/news' },
  { name:'Kyiv Independent',          url:'https://kyivindependent.com/feed/' },

  // ── ASIA & PACIFIC ────────────────────────────────────────────────
  { name:'South China Morning Post',  url:'https://www.scmp.com/rss/91/feed' },
  { name:'The Diplomat',              url:'https://thediplomat.com/feed/' },
  { name:'Nikkei Asia',               url:'https://asia.nikkei.com/rss/feed/nar' },
  { name:'The Wire India',            url:'https://thewire.in/feed' },
  { name:'Straits Times',             url:'https://www.straitstimes.com/news/world/rss.xml' },
  { name:'Asia Times',                url:'https://asiatimes.com/feed/' },
  { name:'Radio Free Asia',           url:'https://www.rfa.org/english/rss2.xml' },

  // ── AFRICA ────────────────────────────────────────────────────────
  { name:'Africa Report',             url:'https://www.theafricareport.com/feed/' },
  { name:'AllAfrica',                 url:'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf' },
  { name:'African Arguments',         url:'https://africanarguments.org/feed/' },
  { name:'Daily Maverick',            url:'https://www.dailymaverick.co.za/feed/' },
  { name:'Mail & Guardian Africa',    url:'https://mg.co.za/feed/' },

  // ── LATIN AMERICA ─────────────────────────────────────────────────
  { name:'NACLA',                     url:'https://nacla.org/rss.xml' },
  { name:'Americas Quarterly',        url:'https://www.americasquarterly.org/feed/' },
  { name:'LASA Forum',                url:'https://lasaweb.org/feed/' },

  // ── TECHNOLOGY & AI ───────────────────────────────────────────────
  { name:'MIT Tech Review',           url:'https://www.technologyreview.com/feed/' },
  { name:'Wired',                     url:'https://www.wired.com/feed/rss' },
  { name:'Ars Technica',              url:'https://feeds.arstechnica.com/arstechnica/index' },
  { name:'The Verge',                 url:'https://www.theverge.com/rss/index.xml' },
  { name:'TechCrunch',                url:'https://feeds.feedburner.com/TechCrunch/' },
  { name:'Rest of World',             url:'https://restofworld.org/feed/latest' },
  { name:'Protocol (via archive)',    url:'https://www.protocol.com/feeds/feed.rss' },

  // ── ECONOMICS & FINANCE ───────────────────────────────────────────
  { name:'The Economist',             url:'https://www.economist.com/international/rss.xml' },
  { name:'Project Syndicate',         url:'https://www.project-syndicate.org/rss' },
  { name:'Naked Capitalism',          url:'https://www.nakedcapitalism.com/feed' },
  { name:'Bloomberg Opinion',         url:'https://feeds.bloomberg.com/politics/news.rss' },
  { name:'FT World',                  url:'https://www.ft.com/world?format=rss' },

  // ── CLIMATE & ENVIRONMENT ─────────────────────────────────────────
  { name:'Carbon Brief',              url:'https://www.carbonbrief.org/feed' },
  { name:'Climate Home News',         url:'https://www.climatechangenews.com/feed/' },
  { name:'Inside Climate News',       url:'https://insideclimatenews.org/feed/' },
  { name:'Grist',                     url:'https://grist.org/feed/' },
  { name:'DeSmog',                    url:'https://www.desmog.com/feed/' },
  { name:'E&E News',                  url:'https://www.eenews.net/rss/eenewspm' },

  // ── HUMAN RIGHTS & JUSTICE ───────────────────────────────────────
  { name:'Human Rights Watch',        url:'https://www.hrw.org/rss' },
  { name:'Amnesty International',     url:'https://www.amnesty.org/en/feed/' },
  { name:'International Justice Monitor', url:'https://www.ijmonitor.org/feed/' },
  { name:'The New Humanitarian',      url:'https://www.thenewhumanitarian.org/rss.xml' },
  { name:'ICRC',                      url:'https://www.icrc.org/en/rss' },

  // ── INVESTIGATIVE & ACCOUNTABILITY ───────────────────────────────
  { name:'Bellingcat',                url:'https://www.bellingcat.com/feed/' },
  { name:'The Bureau of Investigative Journalism', url:'https://www.thebureauinvestigates.com/feed' },
  { name:'OCCRP',                     url:'https://www.occrp.org/en/feed' },
  { name:'Intercept',                 url:'https://theintercept.com/feed/?rss' },
  { name:'Democracy Now',             url:'https://www.democracynow.org/democracynow.rss' },

  // ── LEFT PERSPECTIVE ─────────────────────────────────────────────
  { name:'Jacobin',                   url:'https://jacobin.com/feed/' },
  { name:'The Nation',                url:'https://www.thenation.com/feed/?post_type=article' },
  { name:'In These Times',            url:'https://inthesetimes.com/feed' },
  { name:'Current Affairs',           url:'https://www.currentaffairs.org/feed' },
  { name:'Truthout',                  url:'https://truthout.org/feed/' },

  // ── RIGHT/CONSERVATIVE PERSPECTIVE ───────────────────────────────
  { name:'National Review',           url:'https://www.nationalreview.com/feed/' },
  { name:'The Dispatch',              url:'https://thedispatch.com/feed/' },
  { name:'The Bulwark',               url:'https://www.thebulwark.com/feed/' },
  { name:'Commentary',                url:'https://www.commentary.org/feed/' },
  { name:'City Journal',              url:'https://www.city-journal.org/feed' },
  { name:'Quillette',                 url:'https://quillette.com/feed/' },

  // ── ACADEMIC & LONG-FORM ─────────────────────────────────────────
  { name:'The Conversation',          url:'https://theconversation.com/global/articles.atom' },
  { name:'Aeon',                      url:'https://aeon.co/feed.rss' },
  { name:'Boston Review',             url:'https://bostonreview.net/feed/' },
  { name:'Dissent',                   url:'https://www.dissentmagazine.org/feed' },
  { name:'NYRB',                      url:'https://feeds.feedburner.com/nybooks' },

  // ── SUBSTACK — GEOPOLITICS ────────────────────────────────────────
  { name:'Caitlin Johnstone',         url:'https://caitlinjohnstone.substack.com/feed' },
  { name:'Responsible Statecraft Sub',url:'https://responsiblestatecraft.substack.com/feed' },
  { name:'The Ops Desk',              url:'https://theopsdesk.substack.com/feed' },
  { name:'Pearls and Irritations',    url:'https://johnmenadue.com/feed/' },
  { name:'Tangle News',               url:'https://www.readtangle.com/feed' },

  // ── SUBSTACK — US POLITICS ────────────────────────────────────────
  { name:'Heather Cox Richardson',    url:'https://heathercoxrichardson.substack.com/feed' },
  { name:'Robert Reich',              url:'https://robertreich.substack.com/feed' },
  { name:'Judd Legum Popular Info',   url:'https://popular.info/feed' },
  { name:'Bari Weiss Free Press',     url:'https://www.thefp.com/feed' },
  { name:'The Ink',                   url:'https://the.ink/feed' },
  { name:'Slow Boring',               url:'https://www.slowboring.com/feed' },

  // ── SUBSTACK — TECHNOLOGY & AI ───────────────────────────────────
  { name:'Ben Thompson Stratechery',  url:'https://stratechery.com/feed/' },
  { name:'Import AI',                 url:'https://importai.substack.com/feed' },
  { name:'Gary Marcus',               url:'https://garymarcus.substack.com/feed' },
  { name:'Platformer',                url:'https://www.platformer.news/feed' },
  { name:'Noah Smith Noahpinion',     url:'https://noahpinion.substack.com/feed' },
  { name:'Doomberg',                  url:'https://doomberg.substack.com/feed' },
  { name:'Heatmap News',              url:'https://heatmap.news/feed' },

  // ── SUBSTACK — MIDDLE EAST & CONFLICT ────────────────────────────
  { name:'Josh Hammer',               url:'https://joshhammer.substack.com/feed' },
  { name:'Puck News',                 url:'https://puck.news/feed/' },
  { name:'Grid News',                 url:'https://gridnews.substack.com/feed' },

  // ── PODCASTS WITH TRANSCRIPTS/ARTICLES ───────────────────────────
  { name:'Crooked Media',             url:'https://crooked.com/feed/podcast' },
  { name:'Chapo Trap House',          url:'https://feeds.simplecast.com/lU7NMoZR' },

  // ── GLOBAL SOUTH & NON-WESTERN ───────────────────────────────────
  { name:'Peoples Dispatch',          url:'https://peoplesdispatch.org/feed/' },
  { name:'Tricontinental',            url:'https://thetricontinental.org/feed/' },
  { name:'Global Voices',             url:'https://globalvoices.org/feed/' },
  { name:'The Eastern Herald',        url:'https://theeasternherald.com/feed/' },

  // ── PRESS FREEDOM & MEDIA ─────────────────────────────────────────
  { name:'Committee to Protect Journalists', url:'https://cpj.org/feed/' },
  { name:'RSF Reporters Without Borders', url:'https://rsf.org/en/rss' },
  { name:'Columbia Journalism Review', url:'https://www.cjr.org/feed' },
  { name:'Nieman Lab',                url:'https://www.niemanlab.org/feed/' },

  // ── SCIENCE & HEALTH ──────────────────────────────────────────────
  { name:'Nature News',               url:'https://www.nature.com/nature.rss' },
  { name:'Science',                   url:'https://www.science.org/rss/news_current.xml' },
  { name:'STAT News',                 url:'https://www.statnews.com/feed/' },
  { name:'Undark',                    url:'https://undark.org/feed/' },

  // ── NUCLEAR & SECURITY ────────────────────────────────────────────
  { name:'Arms Control Association',  url:'https://www.armscontrol.org/rss.xml' },
  { name:'Bulletin of Atomic Scientists', url:'https://thebulletin.org/feed/' },
  { name:'Just Security',             url:'https://www.justsecurity.org/feed/' },
  { name:'Stimson Center',            url:'https://www.stimson.org/feed/' },
];

// ── SUPABASE HELPERS ──────────────────────────────────────────────────
function sbHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function sbFetch(table, params) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + (params || ''), { headers: sbHeaders() });
  return res.json();
}

async function sbUpsert(table, data) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: Object.assign({}, sbHeaders(), { 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify(data)
  });
  return res.status;
}

// ── RSS FETCHER ───────────────────────────────────────────────────────
async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ARGUS/1.0' },
      signal: AbortSignal.timeout(10000)
    });
    const xml = await res.text();
    const items = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const i = m[1];
      const title = (i.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || i.match(/<title>(.*?)<\/title>/))?.[1]?.trim();
      const link  = (i.match(/<link>(.*?)<\/link>/) || i.match(/<link href="(.*?)"/))?.[1]?.trim();
      const desc  = (i.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || i.match(/<description>(.*?)<\/description>/))?.[1]?.trim();
      if (title && link) items.push({
        title: title.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),
        url: link,
        description: desc ? desc.replace(/<[^>]+>/g,'').substring(0,500) : ''
      });
    }
    return items;
  } catch(e) {
    return [];
  }
}

// ── ROOM MATCHER ──────────────────────────────────────────────────────
function assignRoom(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  let best = null, bestScore = 0;
  for (const id of Object.keys(ROOMS)) {
    let score = 0;
    for (const kw of ROOMS[id].keywords) { if (text.includes(kw)) score++; }
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return bestScore >= 1 ? best : null;
}

// ── CLAUDE CLASSIFIER ─────────────────────────────────────────────────
async function classifyWithClaude(title, desc, source, roomId, fullText) {
  const room = ROOMS[roomId];
  const textForAnalysis = fullText ? fullText.slice(0, 2000) : desc;
  const prompt = 'You are the classification engine of ARGUS — a worldview-mapping intelligence system. Be direct. State what the article actually argues.\n\nROOM: ' + room.title + '\n\nARTICLE:\nTitle: ' + title + '\nSource: ' + source + '\nContent: ' + textForAnalysis + '\n\nReturn ONLY valid JSON:\n{"narrative":"analytical|humanitarian|security|policy|legal|diplomatic|investigative|economic|geopolitical|political|ideological|factual","stance":"brief position","summary":"2-3 concrete sentences","assessment":"2-3 sentences honest quality evaluation","rank_reason":"one sentence","penalties":[],"dim_reasoning":5.0,"dim_evidence":5.0,"dim_originality":5.0,"dim_nuance":5.0,"dim_clarity":5.0,"dim_fairness":5.0,"dim_depth":5.0,"ai_score":5.0,"ai_confidence":70}\n\nSCORING: All dims 0-10. ai_score = weighted avg. Most articles 4-7. Reserve 8+ for exceptional thinking.';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    if (data.error) return null;
    return JSON.parse((data.content?.[0]?.text || '').replace(/```json|```/g,'').trim());
  } catch(e) { return null; }
}

// ── ROOM ARTICLE GENERATOR ────────────────────────────────────────────
async function generateRoomArticle(roomId, roomTitle, articles) {
  if (!articles || articles.length < 2) return null;
  const artList = articles.slice(0,12).map((a,i) =>
    (i+1) + '. "' + a.title + '" by ' + a.source +
    ' (AI: ' + (a.ai_score||0) + '/10, Perspective: ' + (a.narrative||'unknown') + ')\n   ' + (a.summary||'')
  ).join('\n\n');

  const prompt = 'You are the editorial intelligence of ARGUS - a worldview-mapping system.\n\nExpose the structure beneath the coverage. Be direct. No softening.\n\nAnswer:\n1. What is actually happening - stripped of narrative\n2. Which worldviews conflict and why\n3. What each perspective gets right and refuses to see\n4. Where the key disagreement lies\n5. What is not being covered\n6. The structural truth beneath events\n\nARTICLES:\n' + artList + '\n\nReturn ONLY valid JSON no markdown no backticks:\n{"headline":"Sharp declarative truth. No softening.","standfirst":"2 sentences. Core conflict. Direct.","body":"6-8 paragraphs. Name sources. Show clashes. State what top perspectives see that others miss. End with structural truth.","narrative_split":"One sentence per cluster - what it emphasizes and cannot see.","missing":"What angle is absent and why that absence is revealing."}';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await r.json();
    if (data.error) return null;
    return JSON.parse((data.content?.[0]?.text || '').replace(/```json|```/g,'').trim());
  } catch(e) { return null; }
}


// ── NARRATIVE PROMPT MAPS ────────────────────────────────────────────
// One strong visual metaphor per narrative type
// Style: stark graphic, political poster, Saul Bass inspired
// Rule: one idea, one image, instantly readable

// Pure object/texture prompts — no scenes, no people, no figures
// Each is a physical thing that can be photographed or abstracted
// Short, specific, impossible to misinterpret as human
const NARRATIVE_PROMPTS = {
  'security':      'extreme macro photograph of barbed wire against pitch black, single red light source, razor sharp focus, no people',
  'humanitarian':  'aerial view of empty plastic chairs arranged in rows on cracked concrete, harsh daylight, long shadows, no people',
  'analytical':    'close-up of a compass on graph paper, ink bleeding into grid lines, high contrast black and white with red needle',
  'diplomatic':    'two empty glasses on a bare table, condensation rings overlapping, one tipped slightly, stark overhead light',
  'economic':      'macro photograph of worn coins and crumpled paper currency, extreme close-up texture, near-black background',
  'legal':         'close-up of a broken wax seal on aged paper, red wax fragments scattered, dramatic raking light',
  'investigative': 'single manila envelope on a black surface, one corner torn open, harsh spotlight from above, deep shadows',
  'geopolitical':  'cracked dry earth aerial view, deep fissures forming irregular borders, red dust at crack edges',
  'political':     'empty metal folding chair under a single harsh spotlight, everything else in darkness',
  'ideological':   'torn photograph down the middle, the two halves slightly misaligned, cold blue light on left, warm red on right',
  'policy':        'architectural blueprint close-up, some lines crossed out in red, corner burned away, harsh light',
  'factual':       'broken mirror fragments on dark surface, each shard reflecting different light angles, cold and clinical'
};

// ── IMAGE GENERATION ──────────────────────────────────────────────────
async function generateArticleImage(article) {
  if (!FAL_KEY) return null;

  const narrative = article.narrative || 'analytical';
  const basePrompt = NARRATIVE_PROMPTS[narrative] || NARRATIVE_PROMPTS['analytical'];

  const prompt = basePrompt + '. Editorial photography style. No human figures. No faces. No text. No logos. Cinematic. High contrast. The image should feel like it belongs on the cover of a serious international news magazine.';

  console.log('  🎨 Generating image for:', article.title?.substring(0,50));

  try {
    const r = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': 'Key ' + FAL_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 25,
        num_images: 1,
        enable_safety_checker: true
      })
    });

    const data = await r.json();
    if (data.images && data.images[0]) {
      console.log('  ✅ Image generated:', data.images[0].url?.substring(0,60));
      return data.images[0].url;
    }
    console.warn('  ⚠️  No image in response:', JSON.stringify(data).substring(0,200));
    return null;
  } catch(e) {
    console.warn('  ⚠️  Image gen failed:', e.message);
    return null;
  }
}

// ── WINNER IMAGE UPDATER ──────────────────────────────────────────────
async function updateWinnerImages() {
  console.log('\n🎨 Updating winner images...');

  const rooms = await sbFetch('rooms', 'select=id');
  if (!Array.isArray(rooms)) return;

  for (const room of rooms) {
    // Get the #1 article in this room
    const winners = await sbFetch('articles',
      'room_id=eq.' + room.id + '&order=ai_score.desc&limit=1&select=id,title,narrative,room_id,ai_image_url'
    );
    if (!Array.isArray(winners) || winners.length === 0) continue;

    const winner = winners[0];

    // Skip if already has an image
    if (winner.ai_image_url) {
      console.log('  ⏭️  Already has image:', room.id);
      continue;
    }

    const imageUrl = await generateArticleImage(winner);
    if (!imageUrl) continue;

    // Save image URL to article
    await fetch(SUPABASE_URL + '/rest/v1/articles?id=eq.' + winner.id, {
      method: 'PATCH',
      headers: sbHeaders(),
      body: JSON.stringify({ ai_image_url: imageUrl })
    });

    console.log('  ✅ Winner image saved for room:', room.id);
    await new Promise(r => setTimeout(r, 1000));
  }
}

// ── MAIN PIPELINE ─────────────────────────────────────────────────────
async function runPipeline() {
  console.log('\n🚀 Pipeline starting:', new Date().toISOString());
  let totalFetched = 0, totalNew = 0, totalClassified = 0, totalSaved = 0;

  for (const feed of RSS_FEEDS) {
    const items = await fetchRSS(feed.url);
    totalFetched += items.length;

    for (const item of items.slice(0, 5)) {
      const roomId = assignRoom(item.title, item.description);
      if (!roomId) continue;

      const existing = await sbFetch('articles', 'url=eq.' + encodeURIComponent(item.url) + '&select=id');
      if (Array.isArray(existing) && existing.length > 0) continue;

      totalNew++;

      // Fetch full text via Jina.ai (free, no key needed)
      let fullText = null;
      try {
        const jinaRes = await fetch('https://r.jina.ai/' + item.url, {
          headers:{'Accept':'text/plain','X-Return-Format':'text','X-Timeout':'6'},
          signal: AbortSignal.timeout(7000)
        });
        if (jinaRes.ok) {
          const raw = await jinaRes.text();
          fullText = raw.slice(0, 4000).trim() || null;
        }
      } catch(e) { /* silent fail */ }

      const c = await classifyWithClaude(item.title, item.description, feed.name, roomId, fullText);
      if (!c) continue;
      totalClassified++;

      // Get rank
      const roomArts = await sbFetch('articles', 'room_id=eq.' + roomId + '&select=ai_score');
      let rank = 1;
      if (Array.isArray(roomArts)) {
        for (const a of roomArts) { if ((a.ai_score||0) >= c.ai_score) rank++; }
      }

      const artId = 'rss-' + Buffer.from(item.url).toString('base64').replace(/[^a-zA-Z0-9]/g,'').slice(0,20);
      const status = await sbUpsert('articles', {
        id: artId, room_id: roomId, room_rank: rank,
        title: item.title, source: feed.name, url: item.url,
        human_quality: 0, human_trust: 0, human_votes: 0,
        ai_score: c.ai_score, ai_confidence: c.ai_confidence,
        narrative: c.narrative, stance: c.stance, rank_reason: c.rank_reason,
        dim_reasoning: c.dim_reasoning, dim_evidence: c.dim_evidence,
        dim_originality: c.dim_originality, dim_nuance: c.dim_nuance,
        dim_clarity: c.dim_clarity, dim_fairness: c.dim_fairness, dim_depth: c.dim_depth,
        penalties: c.penalties || [], summary: c.summary, assessment: c.assessment,
        full_text: fullText || null,
        gap: null, gap_value: 0, is_scored: true, is_community: false
      });

      if (status === 201 || status === 200) {
        totalSaved++;
        console.log('  ✅ Saved:', item.title.substring(0,50), '→', roomId, '(AI:', c.ai_score + ')');
      }
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log('📊 Pipeline complete:', { totalFetched, totalNew, totalClassified, totalSaved });
  return { totalFetched, totalNew, totalClassified, totalSaved };
}

// ── ROOM ARTICLES ─────────────────────────────────────────────────────
async function runRoomArticles() {
  console.log('\n📝 Room articles starting:', new Date().toISOString());
  const rooms = await sbFetch('rooms', 'select=id,title');
  if (!Array.isArray(rooms)) return;

  const today = new Date().toISOString().split('T')[0];

  for (const room of rooms) {
    const articles = await sbFetch('articles',
      'room_id=eq.' + room.id + '&order=ai_score.desc&limit=20&select=title,source,ai_score,narrative,stance,summary'
    );
    if (!Array.isArray(articles) || articles.length < 2) continue;

    // Skip if already generated today
    const existing = await sbFetch('room_articles', 'room_id=eq.' + room.id + '&updated_date=eq.' + today + '&select=id');
    if (Array.isArray(existing) && existing.length > 0) {
      console.log('  ⏭️  Already current:', room.id);
      continue;
    }

    console.log('  ✍️  Generating:', room.id, '(' + articles.length + ' articles)');
    const article = await generateRoomArticle(room.id, room.title, articles);
    if (!article) continue;

    await sbUpsert('room_articles', {
      room_id: room.id,
      headline: article.headline,
      standfirst: article.standfirst,
      body: article.body,
      key_tensions: article.key_tensions || [],
      missing_voice: article.missing_voice,
      updated_date: today,
      article_count: articles.length
    });

    console.log('  ✅ Room article saved:', room.id);
    await new Promise(r => setTimeout(r, 800));
  }
  console.log('📝 Room articles complete');
}

// ── SCHEDULER ────────────────────────────────────────────────────────
console.log('🌍 ARGUS service starting...');
console.log('📡 Pipeline: every 4 hours');
console.log('📝 Room articles: daily at 6am UTC');
const FAL_KEY = process.env.FAL_KEY;
console.log('Environment:', SUPABASE_URL ? '✅ Supabase connected' : '❌ Missing SUPABASE_URL');
console.log('Image gen:', FAL_KEY ? '✅ fal.ai connected' : '⚠️  No FAL_KEY (images disabled)');

// Run pipeline every 4 hours
cron.schedule('0 */4 * * *', async () => {
  try {
    await runPipeline();
    await updateWinnerImages();
  }
  catch(e) { console.error('Pipeline error:', e.message); }
});

// Run room articles daily at 6am UTC
cron.schedule('0 6 * * *', async () => {
  try { await runRoomArticles(); }
  catch(e) { console.error('Room articles error:', e.message); }
});

// Run both immediately on startup
(async () => {
  try {
    await runPipeline();
    await updateWinnerImages();
    await runRoomArticles();
  } catch(e) {
    console.error('Startup run error:', e.message);
  }
})();

// Keep process alive
console.log('✅ Service running. Press Ctrl+C to stop.');
