// helloman-service/index.js
// Self-contained background service for Helloman.ai
// Runs on Railway — no time limits, no manual intervention
// Schedule: articles every 4 hours, room synthesis daily at 6am UTC

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
  { name:'Al Jazeera',               url:'https://www.aljazeera.com/xml/rss/all.xml' },
  { name:'BBC World',                url:'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name:'BBC US & Canada',          url:'http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml' },
  { name:'The Guardian World',       url:'https://www.theguardian.com/world/rss' },
  { name:'Reuters World',            url:'https://feeds.reuters.com/reuters/worldnews' },
  { name:'Reuters Business',         url:'https://feeds.reuters.com/reuters/businessNews' },
  { name:'DW News',                  url:'https://rss.dw.com/rdf/rss-en-all' },
  { name:'France 24',                url:'https://www.france24.com/en/rss' },
  { name:'NPR News',                 url:'https://feeds.npr.org/1001/rss.xml' },
  { name:'Associated Press',         url:'https://feeds.apnews.com/rss/apf-topnews' },
  { name:'Foreign Policy',           url:'https://foreignpolicy.com/feed/' },
  { name:'Foreign Affairs',          url:'https://www.foreignaffairs.com/rss.xml' },
  { name:'Atlantic Council',         url:'https://www.atlanticcouncil.org/feed/' },
  { name:'Lawfare',                  url:'https://www.lawfaremedia.org/rss.xml' },
  { name:'The Intercept',            url:'https://theintercept.com/feed/?rss' },
  { name:'Responsible Statecraft',   url:'https://responsiblestatecraft.org/feed/' },
  { name:'The Atlantic',             url:'https://www.theatlantic.com/feed/all/' },
  { name:'Politico',                 url:'https://rss.politico.com/politics-news.xml' },
  { name:'Vox',                      url:'https://www.vox.com/rss/index.xml' },
  { name:'Middle East Eye',          url:'https://www.middleeasteye.net/rss' },
  { name:'Haaretz',                  url:'https://www.haaretz.com/srv/haaretz-eng.xml' },
  { name:'MIT Tech Review',          url:'https://www.technologyreview.com/feed/' },
  { name:'Wired',                    url:'https://www.wired.com/feed/rss' },
  { name:'Ars Technica',             url:'https://feeds.arstechnica.com/arstechnica/index' },
  { name:'The Verge',                url:'https://www.theverge.com/rss/index.xml' },
  { name:'The Economist',            url:'https://www.economist.com/international/rss.xml' },
  { name:'Project Syndicate',        url:'https://www.project-syndicate.org/rss' },
  { name:'Carbon Brief',             url:'https://www.carbonbrief.org/feed' },
  { name:'Guardian Environment',     url:'https://www.theguardian.com/environment/rss' },
  { name:'The Diplomat',             url:'https://thediplomat.com/feed/' },
  { name:'Human Rights Watch',       url:'https://www.hrw.org/rss' },
  { name:'Amnesty International',    url:'https://www.amnesty.org/en/feed/' },
  { name:'Africa Report',            url:'https://www.theafricareport.com/feed/' },
  { name:'NACLA Latin America',      url:'https://nacla.org/rss.xml' },
  { name:'Heather Cox Richardson',   url:'https://heathercoxrichardson.substack.com/feed' },
  { name:'Robert Reich',             url:'https://robertreich.substack.com/feed' },
  { name:'The Bulwark',              url:'https://www.thebulwark.com/feed/' },
  { name:'Bari Weiss Free Press',    url:'https://www.thefp.com/feed' },
  { name:'Ben Thompson Stratechery', url:'https://stratechery.com/feed/' },
  { name:'Import AI',                url:'https://importai.substack.com/feed' },
  { name:'Gary Marcus',              url:'https://garymarcus.substack.com/feed' },
  { name:'Platformer',               url:'https://www.platformer.news/feed' },
  { name:'Noah Smith Noahpinion',    url:'https://noahpinion.substack.com/feed' },
  { name:'Heatmap News',             url:'https://heatmap.news/feed' },
  { name:'Mondoweiss',               url:'https://mondoweiss.net/feed/' },
  { name:'972 Magazine',             url:'https://www.972mag.com/feed/' },
  { name:'Bellingcat',               url:'https://www.bellingcat.com/feed/' },
  { name:'The Conversation',         url:'https://theconversation.com/global/articles.atom' },
  { name:'openDemocracy',            url:'https://www.opendemocracy.net/en/rss.xml' },
  { name:'Jacobin',                  url:'https://jacobin.com/feed/' },
  { name:'National Review',          url:'https://www.nationalreview.com/feed/' },
  { name:'The Dispatch',             url:'https://thedispatch.com/feed/' },
  { name:'Democracy Now',            url:'https://www.democracynow.org/democracynow.rss' },
  { name:'Judd Legum Popular Info',  url:'https://popular.info/feed' },
  { name:'Tangle News',              url:'https://www.readtangle.com/feed' },
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
      headers: { 'User-Agent': 'Helloman.ai/1.0' },
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
async function classifyWithClaude(title, desc, source, roomId) {
  const room = ROOMS[roomId];
  const prompt = 'Classify this news article for Helloman.ai.\n\nROOM: ' + room.title + '\n\nARTICLE:\nTitle: ' + title + '\nSource: ' + source + '\nDescription: ' + desc + '\n\nReturn ONLY valid JSON:\n{"narrative":"analytical|humanitarian|security|policy|legal|diplomatic|investigative|economic|geopolitical|political|ideological|factual","stance":"brief position","summary":"2-3 concrete sentences","assessment":"2-3 sentences honest quality evaluation","rank_reason":"one sentence","penalties":[],"dim_reasoning":5.0,"dim_evidence":5.0,"dim_originality":5.0,"dim_nuance":5.0,"dim_clarity":5.0,"dim_fairness":5.0,"dim_depth":5.0,"ai_score":5.0,"ai_confidence":70}\n\nSCORING: All dims 0-10. ai_score = weighted avg. Most articles 4-7. Reserve 8+ for exceptional thinking.';
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

  const prompt = 'You are the editorial voice of Helloman.ai — a platform that reveals how the same reality is interpreted differently.\n\nWrite a ROOM SYNTHESIS for: ' + roomTitle + '\n\nThis is NOT a news summary. Map how perspectives diverge. Name sources. Show clashes. Point out what nobody covers. Be intellectually courageous.\n\nARTICLES:\n' + artList + '\n\nReturn ONLY valid JSON:\n{"headline":"Sharp synthesis headline capturing core tension","standfirst":"2-3 sentences. Most important thing to understand about coverage. Concrete.","body":"6-8 paragraphs. Name sources. Show agreement and clash. Include what highest-scoring argue, what lowest-scoring argue, what is entirely missing, and one philosophical zoom-out.","key_tensions":["specific tension between named sources","tension 2","tension 3"],"missing_voice":"Single most important perspective not represented"}';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
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

const NARRATIVE_SCENES = {
  'security':      'a single iron gate casting a long shadow across empty ground, the gate half open, light and darkness in perfect tension',
  'humanitarian':  'an empty chair at a table set for many, one glass tipped on its side, stillness and absence',
  'analytical':    'a perfect geometric grid dissolving at one corner, order meeting entropy at a single point',
  'diplomatic':    'two chairs facing each other across a vast empty floor, neither occupied, the space between them everything',
  'economic':      'a single scale perfectly balanced, one side holding a stone, the other holding smoke',
  'legal':         'a tall doorway with no door, light beyond it, a long shadow falling back into darkness',
  'investigative': 'a spotlight illuminating a single piece of paper on an otherwise empty floor',
  'geopolitical':  'a horizon line with two suns, casting shadows in opposite directions',
  'political':     'an empty podium, microphone still vibrating, the crowd implied by their absence',
  'ideological':   'a single vertical line dividing the frame, left side light, right side dark, a crack running through it',
  'policy':        'a blueprint pinned to a wall, one corner peeling away to reveal nothing behind it',
  'factual':       'a magnifying glass over a surface that reflects something different than what it magnifies'
};

const NARRATIVE_COLORS = {
  'security':      '#cc2200',
  'humanitarian':  '#cc0066',
  'analytical':    '#0099bb',
  'diplomatic':    '#007744',
  'economic':      '#cc7700',
  'legal':         '#6633aa',
  'investigative': '#0099bb',
  'geopolitical':  '#cc4400',
  'political':     '#8833aa',
  'ideological':   '#cc0022',
  'policy':        '#cc8800',
  'factual':       '#445566'
};

// ── IMAGE GENERATION ──────────────────────────────────────────────────
async function generateArticleImage(article) {
  if (!FAL_KEY) return null;

  const narrative = article.narrative || 'analytical';
  const scene = NARRATIVE_SCENES[narrative] || NARRATIVE_SCENES['analytical'];

  const prompt = `Stark editorial illustration. Graphic design style. Bold flat shapes. High contrast. Near-black background. The image shows: ${scene}. Single dominant color accent. Deep red as the only warm accent element. No faces. No text. No flags. No recognizable symbols or logos. Clean composition. Powerful negative space. Political poster aesthetic. Saul Bass inspired. Simple. Austere. Thought-provoking. The image should feel like the cover of a serious magazine — immediate, symbolic, unambiguous. Matte finish. No gradients. No texture noise. No decorative elements.`;

  console.log('  🎨 Generating image for:', article.title?.substring(0,50));

  try {
    const r = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': 'Key ' + FAL_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
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

    for (const item of items.slice(0, 2)) {
      const roomId = assignRoom(item.title, item.description);
      if (!roomId) continue;

      const existing = await sbFetch('articles', 'url=eq.' + encodeURIComponent(item.url) + '&select=id');
      if (Array.isArray(existing) && existing.length > 0) continue;

      totalNew++;
      const c = await classifyWithClaude(item.title, item.description, feed.name, roomId);
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
      'room_id=eq.' + room.id + '&order=ai_score.desc&limit=12&select=title,source,ai_score,narrative,stance,summary'
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
console.log('🌍 Helloman.ai service starting...');
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
