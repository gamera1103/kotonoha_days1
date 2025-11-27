
import { CardData, CardType, CharacterData, LocationData, LocationType, TimeSlot, SchoolEvent, CharacterExpression, CharacterAssets } from './types';

export const MAX_HAND_SIZE = 10;
export const MAX_SLOTS = 6;
export const MAX_TURNS = 5;
export const MOVES_PER_DAY = 10;

// Affection Limits
export const MAX_AFFECTION = 500;
export const MIN_AFFECTION = -500;

// Title Video
export const TITLE_VIDEO_URL = "https://cdn.pixabay.com/video/2022/11/17/139266-772922650_tiny.mp4";

// Fixed Locations that appear every event
export const FIXED_LOCATIONS = [LocationType.Classroom, LocationType.Corridor];

// Composition Helper for AI Backgrounds
const BG_COMPOSITION_PROMPT = ", visual novel background art, static camera angle, perfectly horizontal horizon, vanishing point at top 30% of image (high horizon line), wide angle lens, spacious foreground floor (40% of image), empty scene, no humans, anime style, Makoto Shinkai style, highly detailed, 8k";

// Helper to generate a placeholder asset map for demo purposes
// In production, these would be local paths like '/assets/reina/summer_happy.png'
const createAssetMap = (baseUrl: string): CharacterAssets => {
    const expressions: CharacterExpression[] = ['normal', 'happy', 'sad', 'angry', 'blush', 'bored', 'lookaway', 'annoyed'];
    
    // For this demo, we use the same base URL. 
    // User should replace these with actual unique file paths.
    const summerMap: Record<string, string> = {};
    const winterMap: Record<string, string> = {};
    
    expressions.forEach(exp => {
        summerMap[exp] = `${baseUrl}?s=summer&e=${exp}`; // Demo parameter
        winterMap[exp] = `${baseUrl}?s=winter&e=${exp}`; // Demo parameter
    });

    return {
        profile: `${baseUrl}?type=profile`,
        ending: `${baseUrl}?type=ending`,
        summer: summerMap as Record<CharacterExpression, string>,
        winter: winterMap as Record<CharacterExpression, string>
    };
};

export const SPECIAL_COMBOS: Record<string, string[][]> = {
    reina: [['ctx_game', 'act4'], ['rom1', 'v_trust'], ['ctx_anime', 'act3'], ['sl1', 'sl3']], 
    akane: [['sch3', 'act4'], ['ctx_sea', 'act1'], ['rom6', 'v_support'], ['sl6', 'act2']], 
    shiori: [['ctx_book', 'act5'], ['ctx_music', 'v_feel'], ['rom8', 'v_promise'], ['sch6', 'rom9']]
};

export const getRandomFallbackImage = (keywords: string[]) => {
    // Returns a generic Unsplash image based on keywords if AI fails
    const keywordString = keywords.join(',');
    return `https://source.unsplash.com/800x600/?${keywordString}`; 
};

export const SCHOOL_EVENTS: SchoolEvent[] = [
  { id: 'evt_april', month: 4, title: '一学期 始業式', description: '新しい学年の始まり。桜が舞う季節。' },
  { id: 'evt_may', month: 5, title: '中間テスト', description: '勉強も恋も忙しい時期。' },
  { id: 'evt_june', month: 6, title: '衣替え・梅雨', description: '雨の日の相合傘チャンス。' },
  { id: 'evt_july', month: 7, title: '期末テスト', description: '夏休み前の最後の試練。' },
  { id: 'evt_august', month: 8, title: '夏休み', description: '海、祭り、花火大会。思い出作りの季節。' },
  { id: 'evt_sept', month: 9, title: '二学期 始業式', description: '日焼けした笑顔に再会。' },
  { id: 'evt_oct', month: 10, title: '文化祭', description: 'クラスの出し物や後夜祭のダンス。' },
  { id: 'evt_nov', month: 11, title: '修学旅行', description: '非日常の中で深まる絆。' },
  { id: 'evt_dec', month: 12, title: 'クリスマス', description: '冬休み前の特別な夜。' },
  { id: 'evt_jan', month: 1, title: '三学期 始業式', description: '最後の学期の始まり。' },
  { id: 'evt_feb', month: 2, title: 'バレンタイン', description: '想いを伝える日。' },
  { id: 'evt_march', month: 3, title: '卒業式', description: '別れと旅立ち、そして告白の時。' },
];

export const LOCATION_TAG_MAP: Record<string, string[]> = {
    [LocationType.Classroom]: ['School', 'Study', 'Talk'],
    [LocationType.Rooftop]: ['Sky', 'Talk', 'Skip'],
    [LocationType.Corridor]: ['School', 'Talk', 'Move'],
    [LocationType.Station]: ['City', 'Shop', 'Travel'],
    [LocationType.Park]: ['Nature', 'Play', 'Relax'],
    [LocationType.Library]: ['Book', 'Study', 'Quiet'],
    [LocationType.Gym]: ['Sport', 'Action', 'Sweat'],
    [LocationType.Cafe]: ['Food', 'Drink', 'Sweet', 'Date'],
    [LocationType.Mall]: ['Shop', 'Date', 'Fashion', 'Play'],
    [LocationType.Pool]: ['Water', 'Summer', 'Swim', 'Date'],
    [LocationType.AmusementPark]: ['Fun', 'Date', 'Play', 'Scream'],
    [LocationType.Beach]: ['Sea', 'Summer', 'Nature', 'Travel'],
    [LocationType.Shrine]: ['Pray', 'Tradition', 'Wish', 'Quiet'],
    [LocationType.Karaoke]: ['Music', 'Sing', 'Play', 'Loud'],
    [LocationType.Arcade]: ['Game', 'Play', 'Fun', 'Noise'],
    [LocationType.ConvenienceStore]: ['Food', 'Buy', 'Late', 'Snack'],
    [LocationType.Bookstore]: ['Book', 'Quiet', 'Culture', 'Shop'],
    [LocationType.FastFood]: ['Food', 'Cheap', 'Talk', 'Date'],
    [LocationType.Riverbank]: ['Nature', 'Walk', 'Sunset', 'Talk'],
    [LocationType.Aquarium]: ['Fish', 'Date', 'Quiet', 'Blue']
};

export const RESPONSE_CARDS: CardData[] = [
  { id: 'resp_yes', text: 'はい', type: CardType.AuxVerb, tags: ['Response', 'Positive', 'Agreement'], rarity: 1 },
  { id: 'resp_yeah', text: 'うん', type: CardType.AuxVerb, tags: ['Response', 'Positive', 'Agreement', 'Casual'], rarity: 1 },
  { id: 'resp_ok', text: 'わかった', type: CardType.AuxVerb, tags: ['Response', 'Positive', 'Accept'], rarity: 1 },
  { id: 'resp_nice', text: 'いいね', type: CardType.Adjective, tags: ['Response', 'Positive', 'Praise'], rarity: 1 },
  { id: 'resp_no', text: 'いいえ', type: CardType.AuxVerb, tags: ['Response', 'Negative', 'Denial'], rarity: 1 },
  { id: 'resp_nah', text: 'いや', type: CardType.AuxVerb, tags: ['Response', 'Negative', 'Denial', 'Casual'], rarity: 1 },
  { id: 'resp_cant', text: '無理', type: CardType.Adjective, tags: ['Response', 'Negative', 'Denial'], rarity: 1 },
  { id: 'resp_wait', text: '待って', type: CardType.Verb, tags: ['Response', 'Wait'], rarity: 1 },
  { id: 'resp_think', text: '考えさせて', type: CardType.Verb, tags: ['Response', 'Wait'], rarity: 1 },
];

export const CONTEXT_NOUNS: CardData[] = [
    { id: 'ctx_movie', text: '映画', type: CardType.Noun, tags: ['Hobby', 'Culture'], rarity: 2 },
    { id: 'ctx_book', text: '本', type: CardType.Noun, tags: ['Hobby', 'Culture', 'Book'], rarity: 2 },
    { id: 'ctx_game', text: 'ゲーム', type: CardType.Noun, tags: ['Hobby', 'Play'], rarity: 2 },
    { id: 'ctx_music', text: '音楽', type: CardType.Noun, tags: ['Hobby', 'Culture'], rarity: 2 },
    { id: 'ctx_manga', text: '漫画', type: CardType.Noun, tags: ['Hobby', 'Subculture'], rarity: 2 },
    { id: 'ctx_oshi', text: '推し', type: CardType.Noun, tags: ['Hobby', 'Subculture', 'Love'], rarity: 2 },
    { id: 'ctx_anime', text: 'アニメ', type: CardType.Noun, tags: ['Hobby', 'Subculture'], rarity: 2 },
    { id: 'ctx_cafe', text: 'カフェ', type: CardType.Noun, tags: ['Place', 'Food', 'Drink'], rarity: 2 },
    { id: 'ctx_ramen', text: 'ラーメン', type: CardType.Noun, tags: ['Food', 'Meal'], rarity: 2 },
    { id: 'ctx_curry', text: 'カレー', type: CardType.Noun, tags: ['Food', 'Meal'], rarity: 2 },
    { id: 'ctx_sweets', text: 'スイーツ', type: CardType.Noun, tags: ['Food', 'Snack', 'Sweet'], rarity: 2 },
    { id: 'ctx_sea', text: '海', type: CardType.Noun, tags: ['Place', 'Nature', 'Travel', 'Sea'], rarity: 2 },
    { id: 'ctx_park', text: '公園', type: CardType.Noun, tags: ['Place', 'Nature'], rarity: 2 },
    { id: 'ctx_karaoke', text: 'カラオケ', type: CardType.Noun, tags: ['Place', 'Play'], rarity: 2 },
    { id: 'ctx_onsen', text: '温泉', type: CardType.Noun, tags: ['Place', 'Travel', 'Relax'], rarity: 2 },
    { id: 'ctx_kyoto', text: '京都', type: CardType.Noun, tags: ['Place', 'Travel'], rarity: 2 },
    { id: 'ctx_disney', text: '遊園地', type: CardType.Noun, tags: ['Place', 'Date', 'Fun'], rarity: 2 },
    { id: 'ctx_shopping', text: '買い物', type: CardType.Noun, tags: ['Action', 'Date', 'Shop'], rarity: 2 },
];

export const CARD_DATABASE: CardData[] = [
  ...RESPONSE_CARDS,
  ...CONTEXT_NOUNS,
  { id: 'pn1', text: '私', type: CardType.Noun, tags: ['Person', 'Self'], rarity: 1 },
  { id: 'pn2', text: '僕', type: CardType.Noun, tags: ['Person', 'Self'], rarity: 1 },
  { id: 'pn4', text: 'あなた', type: CardType.Noun, tags: ['Person', 'Partner'], rarity: 1 },
  { id: 'pn5', text: '君', type: CardType.Noun, tags: ['Person', 'Partner'], rarity: 1 },
  { id: 'sch1', text: '宿題', type: CardType.Noun, tags: ['School', 'Study', 'Boring'], rarity: 1 },
  { id: 'sch2', text: 'テスト', type: CardType.Noun, tags: ['School', 'Study', 'Scary'], rarity: 1 },
  { id: 'sch3', text: '部活', type: CardType.Noun, tags: ['School', 'Activity', 'Sport'], rarity: 1 },
  { id: 'sch4', text: '先生', type: CardType.Noun, tags: ['School', 'Person'], rarity: 1 },
  { id: 'sch5', text: 'サボる', type: CardType.Verb, tags: ['School', 'Bad', 'Action'], rarity: 2 },
  { id: 'sch6', text: '保健室', type: CardType.Noun, tags: ['School', 'Place', 'Secret'], rarity: 2 },
  { id: 'sch7', text: 'お弁当', type: CardType.Noun, tags: ['School', 'Food', 'Lunch'], rarity: 1 },
  { id: 'sch8', text: '購買', type: CardType.Noun, tags: ['School', 'Food'], rarity: 1 },
  { id: 'sch9', text: 'クラス', type: CardType.Noun, tags: ['School'], rarity: 1 },
  { id: 'sl1', text: 'マジで', type: CardType.Adverb, tags: ['Slang', 'Emphasis'], rarity: 1 },
  { id: 'sl2', text: 'ヤバい', type: CardType.Adjective, tags: ['Slang', 'Emotion'], rarity: 1 },
  { id: 'sl3', text: 'ウケる', type: CardType.Verb, tags: ['Slang', 'Fun'], rarity: 1 },
  { id: 'sl4', text: 'ダルい', type: CardType.Adjective, tags: ['Slang', 'Negative', 'Tired'], rarity: 1 },
  { id: 'sl5', text: '眠い', type: CardType.Adjective, tags: ['Emotion', 'Tired', 'Night', 'Morning'], rarity: 1 },
  { id: 'sl6', text: 'お腹すいた', type: CardType.Adjective, tags: ['Emotion', 'Food'], rarity: 1 },
  { id: 'sl7', text: '無理', type: CardType.Adjective, tags: ['Negative', 'Denial'], rarity: 1 },
  { id: 'sl8', text: '最高', type: CardType.Noun, tags: ['Positive', 'Emotion'], rarity: 1 },
  { id: 'sl9', text: '微妙', type: CardType.Adjective, tags: ['Negative', 'Uncertain'], rarity: 1 },
  { id: 'act1', text: '行く', type: CardType.Verb, tags: ['Action', 'Move'], rarity: 1 },
  { id: 'act2', text: '食べる', type: CardType.Verb, tags: ['Action', 'Food'], rarity: 1 },
  { id: 'act3', text: '見る', type: CardType.Verb, tags: ['Action'], rarity: 1 },
  { id: 'act4', text: '遊ぶ', type: CardType.Verb, tags: ['Action', 'Fun', 'Play'], rarity: 1 },
  { id: 'act5', text: '話す', type: CardType.Verb, tags: ['Action', 'Communicate', 'Talk'], rarity: 1 },
  { id: 'act6', text: '帰る', type: CardType.Verb, tags: ['Action', 'Move', 'Home'], rarity: 1 },
  { id: 'act7', text: '待つ', type: CardType.Verb, tags: ['Action', 'Time'], rarity: 1 },
  { id: 'act8', text: '貸して', type: CardType.Verb, tags: ['Action', 'Request'], rarity: 2 },
  { id: 'act9', text: '教えて', type: CardType.Verb, tags: ['Action', 'Request', 'Study'], rarity: 2 },
  { id: 'v_think', text: '思う', type: CardType.Verb, tags: ['Action', 'Thought'], rarity: 1 },
  { id: 'v_feel', text: '感じる', type: CardType.Verb, tags: ['Action', 'Feeling'], rarity: 1 },
  { id: 'v_trust', text: '信じる', type: CardType.Verb, tags: ['Action', 'Trust'], rarity: 2 },
  { id: 'v_promise', text: '約束する', type: CardType.Verb, tags: ['Action', 'Promise'], rarity: 2 },
  { id: 'v_worry', text: '心配する', type: CardType.Verb, tags: ['Action', 'Care'], rarity: 2 },
  { id: 'v_support', text: '応援する', type: CardType.Verb, tags: ['Action', 'Support'], rarity: 2 },
  { id: 'v_know', text: '知ってる', type: CardType.Verb, tags: ['Action', 'Knowledge'], rarity: 1 },
  { id: 'adj_happy', text: '嬉しい', type: CardType.Adjective, tags: ['Emotion', 'Positive'], rarity: 1 },
  { id: 'adj_sad', text: '寂しい', type: CardType.Adjective, tags: ['Emotion', 'Negative'], rarity: 1 },
  { id: 'adj_fun', text: '楽しい', type: CardType.Adjective, tags: ['Emotion', 'Positive'], rarity: 1 },
  { id: 'adj_cute', text: 'かわいい', type: CardType.Adjective, tags: ['Description', 'Positive'], rarity: 1 },
  { id: 'adj_cool', text: 'かっこいい', type: CardType.Adjective, tags: ['Description', 'Positive'], rarity: 1 },
  { id: 'rom1', text: '好き', type: CardType.Noun, tags: ['Emotion', 'Love'], rarity: 3 },
  { id: 'rom2', text: '気になってる', type: CardType.Verb, tags: ['Emotion', 'Love'], rarity: 3 },
  { id: 'rom3', text: 'デート', type: CardType.Noun, tags: ['Event', 'Love', 'Date'], rarity: 2 },
  { id: 'rom4', text: '手', type: CardType.Noun, tags: ['Body', 'Love'], rarity: 2 },
  { id: 'rom5', text: 'つなぐ', type: CardType.Verb, tags: ['Action', 'Love'], rarity: 2 },
  { id: 'rom6', text: '抱きしめる', type: CardType.Verb, tags: ['Action', 'Love', 'Deep'], rarity: 3 },
  { id: 'rom7', text: 'キス', type: CardType.Noun, tags: ['Action', 'Love', 'Deep'], rarity: 3 },
  { id: 'rom8', text: 'ずっと', type: CardType.Adverb, tags: ['Time', 'Love'], rarity: 2 },
  { id: 'rom9', text: '信じて', type: CardType.Verb, tags: ['Emotion', 'Trust'], rarity: 2 },
  { id: 'tm1', text: 'いつか', type: CardType.Adverb, tags: ['Time', 'Future'], rarity: 2 },
  { id: 'tm2', text: 'あの時', type: CardType.Noun, tags: ['Time', 'Past', 'Memory'], rarity: 2 },
  { id: 'tm3', text: '今度', type: CardType.Noun, tags: ['Time', 'Future', 'Promise'], rarity: 1 },
  { id: 'tm4', text: 'これから', type: CardType.Adverb, tags: ['Time', 'Future'], rarity: 1 },
  { id: 'tm5', text: 'また', type: CardType.Adverb, tags: ['Time', 'Repeat'], rarity: 1 },
  { id: 'tm6', text: '週末', type: CardType.Noun, tags: ['Time', 'Holiday'], rarity: 1 },
  { id: 'tm7', text: '放課後', type: CardType.Noun, tags: ['Time', 'School'], rarity: 1 },
  { id: 'prt1', text: 'が', type: CardType.Particle, tags: ['Grammar'], rarity: 1 },
  { id: 'prt2', text: 'を', type: CardType.Particle, tags: ['Grammar'], rarity: 1 },
  { id: 'prt3', text: 'に', type: CardType.Particle, tags: ['Grammar'], rarity: 1 },
  { id: 'prt4', text: 'と', type: CardType.Particle, tags: ['Grammar'], rarity: 1 },
  { id: 'prt5', text: 'は', type: CardType.Particle, tags: ['Grammar'], rarity: 1 },
  { id: 'prt6', text: 'の', type: CardType.Particle, tags: ['Grammar'], rarity: 1 },
  { id: 'prt7', text: 'で', type: CardType.Particle, tags: ['Grammar'], rarity: 1 },
  { id: 'aux1', text: 'したい', type: CardType.AuxVerb, tags: ['Grammar', 'Desire'], rarity: 1 },
  { id: 'aux2', text: 'だね', type: CardType.AuxVerb, tags: ['Grammar', 'Agreement'], rarity: 1 },
  { id: 'aux3', text: 'かな', type: CardType.AuxVerb, tags: ['Grammar', 'Question'], rarity: 1 },
  { id: 'aux4', text: 'です', type: CardType.AuxVerb, tags: ['Grammar', 'Polite'], rarity: 1 },
  { id: 'aux5', text: 'ない', type: CardType.AuxVerb, tags: ['Grammar', 'Negative'], rarity: 1 },
];

export const CHARACTER_SITUATIONS: Record<string, { default: string[], [key: string]: string[] }> = {
    reina: {
        default: [
            "レイナは腕を組んで、何か考え事をしているようだ。",
            "レイナがスマホをいじりながら、小さくため息をついている。",
            "レイナと目が合ったが、すぐにそらされてしまった。",
            "「……何？ 私に用？」レイナが不機嫌そうにこちらを見た。",
            "レイナは髪をいじりながら、こちらをチラチラ見ている。",
            "ふと視線を感じて振り返ると、レイナがこちらを見ていた。",
            "レイナは手鏡を取り出して、前髪を気にしている。",
            "「……別に、アンタを待ってたわけじゃないから。」",
            "レイナが足でリズムをとっている。少しイライラしているようだ。",
            "遠くでレイナが誰かと話しているのが見えた。"
        ],
        [LocationType.Classroom]: [
            "教室の窓際で、レイナが退屈そうに外を眺めている。",
            "レイナが机に突っ伏して寝たふりをしている。",
            "友達と話していたレイナが、こちらに気づいて口をつぐんだ。",
            "「……うるさいわね、教室くらい静かにできないの？」",
            "レイナは教科書を開いているが、目は全く動いていない。",
            "放課後の教室に一人、レイナが残っていた。",
            "「……まだ帰らないの？ 変なヤツ。」",
            "レイナが黒板の落書きを消している。",
            "教室の隅でレイナがこっそりゲーム機を触っていた。",
            "「あ、アンタ。……宿題、見せてくれない？」"
        ],
        [LocationType.Corridor]: [
            "廊下の角で、急いで歩いてきたレイナと鉢合わせた。",
            "レイナが廊下の手すりに寄りかかって、校庭を見下ろしている。",
            "「……邪魔。そこ退いて。」",
            "自販機の前で、レイナが飲み物を買うか迷っている。",
            "廊下の向こうからレイナが歩いてくる。目が合うと逸らされた。",
            "レイナが先生に呼び止められて、面倒くさそうにしている。",
            "掲示板の前でレイナが何かを確認している。",
            "「……今のチャイム、予鈴？ 本鈴？」"
        ],
        [LocationType.Rooftop]: [
            "風に吹かれながら、レイナがフェンス越しに遠くを見ている。",
            "「……ここなら静かだと思ったのに。アンタも来たの？」",
            "レイナが空を見上げて、何かを口ずさんでいる。",
            "「……サボり？ 私も似たようなものだけど。」",
            "屋上のベンチで、レイナが目を閉じて日向ぼっこをしている。",
            "「……空が青すぎて、なんかムカつく。」",
            "レイナのスカートが風になびいている。",
            "「……ここ、私の特等席なんだけど。」"
        ]
    },
    akane: {
        default: [
            "「あ、見っけ！ おーい！」アカネが大きく手を振っている。",
            "アカネがスキップしながらこちらに向かってきた。",
            "アカネはストレッチをしている。いつも元気だ。",
            "「ねえねえ、ちょっと聞いてよ！」",
            "アカネが何かを食べている。幸せそうな顔だ。",
            "「よっ！ 調子はどう？」アカネが背中を叩いてきた。",
            "アカネが鼻歌を歌いながら歩いている。",
            "「あー、暇だなー！ 何か面白いことない？」",
            "アカネが靴紐を結び直している。",
            "遠くからアカネの笑い声が聞こえてきた。"
        ],
        [LocationType.Classroom]: [
            "アカネが教室の後ろで、クラスメイトと騒いでいる。",
            "「お腹すいたー！ 早弁しちゃおっかな？」",
            "アカネが机の上でバランスをとろうとしている。",
            "「宿題やった？ 私、全然やってない！」",
            "アカネが掃除用具をマイクにして歌っている。",
            "「あ、消しゴム貸して！ 落としちゃってさー。」",
            "休み時間の教室で、アカネが腕相撲大会を開いている。",
            "「次の授業、移動教室だっけ？ 忘れてた！」",
            "アカネが窓から顔を出して、外の部活に声をかけている。",
            "「ねえ、私の席どこだっけ？ ……冗談だよ！」"
        ],
        [LocationType.Gym]: [
            "体育館中に、バッシュのスキール音とアカネの声が響いている。",
            "「ナイスパス！」アカネが汗を拭いながら叫んだ。",
            "アカネがバスケットボールを指で回している。",
            "「あ、見てた？ 今のシュート、すごくなかった？」",
            "アカネが床に座り込んで、水分補給をしている。",
            "「一緒にバスケやろうよ！ 人数が足りないんだ！」",
            "体育館の隅で、アカネが筋トレをしている。",
            "「ふー、いい汗かいたー！」"
        ]
    },
    shiori: {
        default: [
            "シオリは本に夢中で、こちらに気づいていない。",
            "「あ……先輩。こんにちは。」シオリが小さく会釈した。",
            "シオリが何かをメモしている。真剣な表情だ。",
            "シオリはビクッとして、本を胸に抱きしめた。",
            "「……あの、私の顔に何かついていますか？」",
            "シオリが遠くを見つめて、ぼーっとしている。",
            "「……あっ、すみません。考え事をしていて……。」",
            "シオリの周りだけ、時間がゆっくり流れているようだ。",
            "シオリが小さな声で独り言を言っている。",
            "足元に落ちたしおりを、シオリが拾おうとしている。"
        ],
        [LocationType.Classroom]: [
            "騒がしい教室の中で、シオリだけが静かに本を読んでいる。",
            "「……次の授業の予習をしています。」",
            "シオリが日直の仕事を一人でこなしている。",
            "「……先輩、教科書を忘れましたか？ 見せましょうか？」",
            "教室の隅で、シオリが窓の外の鳥を目で追っている。",
            "「……あまり大きな声は、苦手です。」",
            "シオリが机の中を整理している。",
            "「……教室は、少し落ち着きません。」",
            "休み時間、シオリは誰とも話さずに座っている。",
            "「……あ、先輩。……いえ、なんでもないです。」"
        ],
        [LocationType.Library]: [
            "シオリが高い棚の本を取ろうとして、背伸びをしている。",
            "「……静かにしてください。ここは図書室です。」",
            "シオリがカウンターで貸出の処理をしている。",
            "窓際で読書をしているシオリの横顔が綺麗だ。",
            "「……この本、先輩も好きなんですか？」",
            "図書室の独特な紙の匂いの中に、シオリがいる。",
            "「……新しい本が入りましたよ。読みますか？」",
            "シオリが本の整理をしながら、楽しそうに微笑んでいる。",
            "「……ここは、私の聖域なんです。」",
            "「先輩も、本を読むのが好きなんですね。」"
        ]
    }
};

export const WAITING_QUESTIONS: Record<string, string[]> = {
    reina: [
        "……ねえ、アンタは私のこと、どう思ってるの？",
        "べ、別にアンタのこと待ってたわけじゃないんだからね。",
        "退屈なんだけど。なんか面白い話ないわけ？",
        "……私の顔に何かついてる？ ジロジロ見ないでよ。",
        "ふん、次はアンタが何言うか、当ててあげよっか？",
        "ねえ、今度の休みって空いてる？ ……聞いてみただけよ。",
        "アンタって、好きなタイプとかあるわけ？",
        "……はぁ。なんか甘いものでも食べたい気分。",
        "ねえ、私の新しい髪飾り、気づかない？ ……鈍感。",
        "アンタ、他の女子ともそんな風に話すの？",
        "……ちょっと、こっち来なさいよ。話があるの。",
        "ねえ、もし世界が終わるとしたら、最後に何食べる？"
    ],
    akane: [
        "ねえねえ！ 今度の休み、私と一緒にどっか行かない？",
        "あーあ、体動かしたいなー！ 競争しよっか？",
        "キミってさ、私のこと……どういう風に見てる？",
        "お腹すいたー！ 購買のパン、一緒に買いに行かない？",
        "じーっ……あはは、顔赤いよ？ どうしたの？",
        "ねえ、悩み事とかない？ 私でよければ聞くよ！",
        "今度、部活の試合あるんだ！ 応援に来てくれる？",
        "キミって意外と力持ち？ 腕相撲しよっか！",
        "あー！ アイス食べたい！ コンビニ行こうよ！",
        "ねえ、私のいいところってどこだと思う？",
        "キミと一緒にいると、なんかワクワクするんだよね！",
        "スポーツとか見るの好き？ 私、観戦も好きなんだ！"
    ],
    shiori: [
        "あの……先輩は、どんな本が好きなんですか？",
        "……先輩といっしょにいると、なんだか落ち着きます。",
        "その……私のこと、迷惑じゃ……ないですか？",
        "あっ、今、猫の声が聞こえたような気がします……。",
        "……先輩のこと、もっと知りたいなって、思ってます……。",
        "……先輩は、休日とかは何をされているんですか？",
        "おすすめの本があるんです。……読んでくれませんか？",
        "……あの、眼鏡、変じゃないですか？",
        "先輩は、静かな場所と賑やかな場所、どっちが好きですか？",
        "……もしよかったら、今度……いえ、なんでもないです。",
        "……私、先輩の役に立てていますか？",
        "……先輩の笑顔を見ると、なんだか安心します。"
    ]
};

export const CHARACTERS: Record<string, CharacterData> = {
  reina: {
    id: 'reina',
    name: '神崎 レイナ',
    grade: 3,
    positiveTags: ['Game', 'Anime', 'Indoor', 'Night', 'Fun', 'Romance', 'Cute', 'Compliment', 'Secret', 'Sweet', 'Cat', 'Future', 'Slang', 'Date'],
    negativeTags: ['Sports', 'Crowd', 'Morning', 'Boring', 'Study', 'Crowded', 'Loud'],
    affection: 0,
    description: "腰まで届く艶やかな黒髪と、神秘的な紫の瞳を持つ美少女。一見クールで近寄りがたい雰囲気だが、心を許した相手には不器用な優しさを見せる。",
    visualTraits: "Long black hair, straight, violet eyes, sharp look, black ribbon hair accessory, stylish wear",
    secrets: ["実は恋愛シミュレーションゲームにハマっている", "可愛いぬいぐるみを集めている", "素直になれない自分に悩んでいる"],
    worries: ["卒業後の進路が決まっていない", "本当の自分を周りに見せられない", "このままずっと一人なんじゃないかという不安"],
    hobbiesDetail: "深夜アニメの実況、レトロゲーム収集、猫カフェ巡り",
    tone: "ツンデレ",
    voiceConfig: "Puck",
    fallbackImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
    waitingMessages: WAITING_QUESTIONS.reina,
    meetingStory: "4月の始業式の日、遅刻ギリギリで廊下を走っていた時にぶつかってしまったのが出会い。",
    assets: createAssetMap('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop'),
    height: "162cm",
    birthday: "11月15日",
    bloodType: "A型"
  },
  akane: {
    id: 'akane',
    name: '日向 アカネ',
    grade: 2,
    positiveTags: ['Sports', 'Outdoor', 'Active', 'Morning', 'Food', 'Sea', 'Energy', 'Fun', 'Action', 'Future', 'Strong', 'Summer', 'Meat', 'Swim'],
    negativeTags: ['Study', 'Indoor', 'Boring', 'Mystery', 'Night', 'Quiet', 'Negative', 'Weak'],
    affection: 0,
    description: "明るい茶色のショートカットが似合う、活発なスポーツ少女。少し日焼けした肌と琥珀色の瞳がチャームポイント。",
    visualTraits: "Short brown hair, energetic smile, amber eyes, slightly tanned skin, sporty look, band-aid on cheek",
    secrets: ["実は怪談がすごく苦手", "料理が壊滅的に下手", "足を怪我してタイムが伸び悩んでいる"],
    worries: ["部活の記録が伸びない", "ガサツだと思われていないか心配", "勉強がついていけない"],
    hobbiesDetail: "朝のランニング、食べ歩き、スニーカー収集",
    tone: "元気、活発",
    voiceConfig: "Kore",
    fallbackImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop",
    waitingMessages: WAITING_QUESTIONS.akane,
    meetingStory: "5月の体育祭の練習中、準備体操をサボっていたところを彼女に見つかり、無理やり一緒に走らされたのがきっかけ。",
    assets: createAssetMap('https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop'),
    height: "158cm",
    birthday: "7月20日",
    bloodType: "O型"
  },
  shiori: {
    id: 'shiori',
    name: '月島 シオリ',
    grade: 1,
    positiveTags: ['Study', 'Book', 'Indoor', 'Quiet', 'Cat', 'Art', 'Gentle', 'Mystery', 'Memory', 'Serious', 'Library', 'Tea', 'Winter', 'Tradition'],
    negativeTags: ['Sports', 'Loud', 'Crowd', 'Active', 'Sea', 'Energy', 'Funny', 'Scary', 'Slang'],
    affection: 0,
    description: "透き通るような銀髪のボブカットと、知的な眼鏡が印象的な図書委員。内気で物静かな性格。",
    visualTraits: "Silver bob hair, glasses, blue eyes, shy expression, holding a book, petite, gentle look",
    secrets: ["ネットで小説を書いている", "眼鏡を外すと美人", "実は大胆な妄想癖がある"],
    worries: ["人と話すのが苦手で友達が少ない", "自分の作品に自信が持てない", "先輩（プレイヤー）に釣り合わないと思っている"],
    hobbiesDetail: "読書、小説執筆、紅茶を淹れること",
    tone: "内気、丁寧",
    voiceConfig: "Fenrir",
    fallbackImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
    waitingMessages: WAITING_QUESTIONS.shiori,
    meetingStory: "図書室の奥まった席で、高いところにある本を取れずに困っていた彼女を助けたのが最初の出会い。",
    assets: createAssetMap('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop'),
    height: "154cm",
    birthday: "2月28日",
    bloodType: "AB型"
  }
};

export const CHARACTER_FEELINGS: Record<string, { range: [number, number], messages: string[] }[]> = {
    reina: [
        { range: [-500, -250], messages: ["正直、顔も見たくないんだけど。", "アンタとは合わないみたいね。"] },
        { range: [-249, 0], messages: ["……ふーん。", "別に、普通だけど。"] },
        { range: [1, 200], messages: ["……悪くないんじゃない？", "アンタと話すの、意外と嫌いじゃないかも。"] },
        { range: [201, 399], messages: ["……ねえ、次はいつ会えるの？", "アンタのこと、もっと知りたいって思う。"] },
        { range: [400, 500], messages: ["……大好き。言わせないでよ、バカ。", "アンタなしじゃ、もうダメかも。"] }
    ],
    akane: [
        { range: [-500, -250], messages: ["うーん、ちょっと合わないかも。", "キミとはリズムが狂っちゃうな。"] },
        { range: [-249, 0], messages: ["んー、まあまあかな？", "元気？ 調子はどう？"] },
        { range: [1, 200], messages: ["キミといると楽しいね！", "今度、競争しよっか！"] },
        { range: [201, 399], messages: ["キミに会うと、元気が出るの！", "ねえねえ、次はどこ行く？"] },
        { range: [400, 500], messages: ["キミのこと、愛してる！", "世界一のカップルになろうよ！"] }
    ],
    shiori: [
        { range: [-500, -250], messages: ["……近寄らないでください。", "怖いです……。"] },
        { range: [-249, 0], messages: ["……あ、こんにちは。", "……本を読んでいます。"] },
        { range: [1, 200], messages: ["……先輩とお話しするの、少し楽しいです。", "この本、先輩におすすめです。"] },
        { range: [201, 399], messages: ["……先輩のこと、考えてばかりいます。", "もっと、先輩の声が聞きたいです。"] },
        { range: [400, 500], messages: ["……愛しています、先輩。", "私、先輩なしでは生きられません。"] }
    ]
};

export const LOCATIONS: Record<LocationType | string, LocationData & { availableMonths?: number[], prompt?: string }> = {
  [LocationType.Classroom]: { 
    id: LocationType.Classroom, 
    name: '教室', 
    bgUrl: 'https://drive.google.com/uc?export=view&id=1npQoppeoFZWIN9pNzcSVDPwuPPFHR_79', // Google Drive Direct Link
    bgmTheme: 'calm',
    prompt: "High school classroom interior, desks and chairs arranged in rows, chalkboard, sunlight streaming through windows" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Rooftop]: { 
    id: LocationType.Rooftop, 
    name: '屋上', 
    bgUrl: 'assets/bg/bg_rooftop.png',
    bgmTheme: 'happy',
    prompt: "School rooftop, chain link fence, blue sky with large clouds, concrete floor" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Corridor]: { 
    id: LocationType.Corridor, 
    name: '廊下', 
    bgUrl: 'assets/bg/bg_corridor.png',
    bgmTheme: 'calm',
    prompt: "High school corridor, lockers lining the wall, polished floor reflecting light" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Station]: { 
    id: LocationType.Station, 
    name: '駅前', 
    bgUrl: 'assets/bg/bg_station.png',
    bgmTheme: 'happy',
    prompt: "Train station square, fountain in the center, city buildings in background, paved ground" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Park]: { 
    id: LocationType.Park, 
    name: '公園', 
    bgUrl: 'assets/bg/bg_park.png',
    bgmTheme: 'happy',
    prompt: "Spacious public park, jungle gym, clock tower, green trees, dirt ground" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Library]: {
    id: LocationType.Library,
    name: '図書室',
    bgUrl: 'assets/bg/bg_library.png',
    bgmTheme: 'calm',
    prompt: "Quiet library interior, tall bookshelves filled with books, wooden tables" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Gym]: {
    id: LocationType.Gym,
    name: '体育館',
    bgUrl: 'assets/bg/bg_gym.png',
    bgmTheme: 'happy',
    prompt: "School gymnasium interior, basketball hoop, polished wooden floor" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Cafe]: {
    id: LocationType.Cafe,
    name: 'カフェ',
    bgUrl: 'assets/bg/bg_cafe.png',
    bgmTheme: 'calm',
    availableMonths: [4, 5, 6, 9, 10, 11, 12, 1, 2, 3],
    prompt: "Stylish cafe interior, wooden tables and chairs, coffee counter" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Mall]: {
    id: LocationType.Mall,
    name: 'モール',
    bgUrl: 'assets/bg/bg_mall.png',
    bgmTheme: 'happy',
    availableMonths: [5, 6, 7, 8, 12, 1],
    prompt: "Inside a shopping mall, atrium, glass windows, bright lights, tiled floor" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Pool]: {
    id: LocationType.Pool,
    name: 'プール',
    bgUrl: 'assets/bg/bg_pool.png',
    bgmTheme: 'happy',
    availableMonths: [6, 7, 8, 9],
    prompt: "School swimming pool, sparkling blue water, poolside tiles" + BG_COMPOSITION_PROMPT
  },
  [LocationType.AmusementPark]: {
    id: LocationType.AmusementPark,
    name: '遊園地',
    bgUrl: 'assets/bg/bg_amusement_park.png',
    bgmTheme: 'happy',
    availableMonths: [5, 8, 10, 11, 12, 3],
    prompt: "Amusement park, ferris wheel in background, paved path" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Beach]: {
    id: LocationType.Beach,
    name: '海',
    bgUrl: 'assets/bg/bg_beach.png',
    bgmTheme: 'happy',
    availableMonths: [7, 8],
    prompt: "Sandy beach, ocean horizon, blue sea, summer clouds" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Shrine]: {
    id: LocationType.Shrine,
    name: '神社',
    bgUrl: 'assets/bg/bg_shrine.png',
    bgmTheme: 'calm',
    availableMonths: [1, 12],
    prompt: "Japanese shinto shrine, torii gate, stone steps" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Karaoke]: {
    id: LocationType.Karaoke,
    name: 'カラオケ',
    bgUrl: 'assets/bg/bg_karaoke.png',
    bgmTheme: 'happy',
    availableMonths: [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
    prompt: "Karaoke box room, monitor screen, sofa, table with drinks" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Arcade]: {
    id: LocationType.Arcade,
    name: 'ゲーセン',
    bgUrl: 'assets/bg/bg_arcade.png',
    bgmTheme: 'tense',
    availableMonths: [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
    prompt: "Game arcade interior, neon lights, colorful carpet" + BG_COMPOSITION_PROMPT
  },
  [LocationType.ConvenienceStore]: {
    id: LocationType.ConvenienceStore,
    name: 'コンビニ',
    bgUrl: 'assets/bg/bg_convenience_store.png',
    bgmTheme: 'calm',
    availableMonths: [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
    prompt: "Convenience store front, lit sign, night time, parking lot" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Bookstore]: {
    id: LocationType.Bookstore,
    name: '本屋',
    bgUrl: 'assets/bg/bg_bookstore.png',
    bgmTheme: 'calm',
    availableMonths: [4, 5, 6, 9, 10, 11, 1, 2],
    prompt: "Bookstore interior, shelves of magazines and manga, wooden floor" + BG_COMPOSITION_PROMPT
  },
  [LocationType.FastFood]: {
    id: LocationType.FastFood,
    name: 'バーガー店',
    bgUrl: 'assets/bg/bg_fast_food.png',
    bgmTheme: 'happy',
    availableMonths: [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
    prompt: "Fast food restaurant interior, tables and booth seats, bright lighting" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Riverbank]: {
    id: LocationType.Riverbank,
    name: '河川敷',
    bgUrl: 'assets/bg/bg_riverbank.png',
    bgmTheme: 'melancholy',
    availableMonths: [4, 5, 6, 9, 10],
    prompt: "Grassy riverbank, sunset, river reflecting sky, slope" + BG_COMPOSITION_PROMPT
  },
  [LocationType.Aquarium]: {
    id: LocationType.Aquarium,
    name: '水族館',
    bgUrl: 'assets/bg/bg_aquarium.png',
    bgmTheme: 'calm',
    availableMonths: [7, 8, 12, 2, 3],
    prompt: "Aquarium tunnel, blue water tank, fish swimming, dim blue lighting" + BG_COMPOSITION_PROMPT
  }
};

export const TIME_LABELS: Record<TimeSlot, string> = {
  [TimeSlot.Morning]: '8:00',
  [TimeSlot.Lunch]: '12:30',
  [TimeSlot.AfterSchool]: '15:30',
  [TimeSlot.Night]: '20:00',
};