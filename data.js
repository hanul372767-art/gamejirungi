/**
 * 지렁이 영양소 탐험 (Nutrient Worm Adventure)
 * 10대 영양소 및 식품 데이터베이스
 */

const NUTRIENTS = {
  carbohydrate: {
    id: 'carbohydrate',
    name: '탄수화물',
    shortName: '탄수화물',
    icon: '🌾',
    color: '#F59E0B', // 주황/황금색
    bgColor: 'rgba(245, 158, 11, 0.15)',
    description: '우리 몸의 주된 에너지원! 두뇌 활동에 필수적이에요 (4kcal/g)',
    targetQuota: 4 // 다음 영양소로 넘어가기 위한 목표 섭취 수
  },
  protein: {
    id: 'protein',
    name: '단백질',
    shortName: '단백질',
    icon: '🥩',
    color: '#EF4444', // 빨강
    bgColor: 'rgba(239, 68, 68, 0.15)',
    description: '근육, 뼈, 혈액 등 신체 조직을 구성하고 면역 물질을 만들어요 (4kcal/g)',
    targetQuota: 4
  },
  fat: {
    id: 'fat',
    name: '지방',
    shortName: '지방',
    icon: '🧈',
    color: '#EAB308', // 노랑
    bgColor: 'rgba(234, 179, 8, 0.15)',
    description: '가장 많은 에너지를 내며 체온 유지와 내부 장기를 보호해요 (9kcal/g)',
    targetQuota: 3
  },
  vitaminA: {
    id: 'vitaminA',
    name: '비타민 A',
    shortName: '비타민 A',
    icon: '🥕',
    color: '#F97316', // 밝은 주황
    bgColor: 'rgba(249, 115, 22, 0.15)',
    description: '어두운 곳에서 시력을 유지해주고(야맹증 예방), 피부와 점막을 보호해요',
    targetQuota: 3
  },
  vitaminB: {
    id: 'vitaminB',
    name: '비타민 B',
    shortName: '비타민 B',
    icon: '🥚',
    color: '#8B5CF6', // 보라
    bgColor: 'rgba(139, 92, 246, 0.15)',
    description: '영양소가 에너지를 내도록 대사를 돕고 신경계를 튼튼하게 해요 (각기병 예방)',
    targetQuota: 4
  },
  vitaminC: {
    id: 'vitaminC',
    name: '비타민 C',
    shortName: '비타민 C',
    icon: '🍊',
    color: '#10B981', // 에메랄드/그린
    bgColor: 'rgba(16, 185, 129, 0.15)',
    description: '콜라겐 합성을 돕고 면역력을 높여 상처 회복과 피로 해소에 좋아요 (괴혈병 예방)',
    targetQuota: 3
  },
  vitaminD: {
    id: 'vitaminD',
    name: '비타민 D',
    shortName: '비타민 D',
    icon: '🍄',
    color: '#3B82F6', // 블루
    bgColor: 'rgba(59, 130, 246, 0.15)',
    description: '칼슘 흡수를 도와 뼈와 치아를 단단하게 만들어줘요 (구루병 예방)',
    targetQuota: 3
  },
  calcium: {
    id: 'calcium',
    name: '칼슘',
    shortName: '칼슘',
    icon: '🦴',
    color: '#06B6D4', // 시안
    bgColor: 'rgba(6, 182, 212, 0.15)',
    description: '뼈와 치아를 구성하는 핵심 무기질이며 근육 수축과 신경 전달을 도와요',
    targetQuota: 3
  },
  iron: {
    id: 'iron',
    name: '철',
    shortName: '철(철분)',
    icon: '🩸',
    color: '#DC2626', // 진빨강
    bgColor: 'rgba(220, 38, 38, 0.15)',
    description: '혈액 속 헤모글로빈을 만들어 온몸 구석구석 산소를 운반해요 (빈혈 예방)',
    targetQuota: 3
  },
  sodium: {
    id: 'sodium',
    name: '나트륨',
    shortName: '나트륨',
    icon: '🧂',
    color: '#64748B', // 슬레이트 그레이
    bgColor: 'rgba(100, 116, 139, 0.15)',
    description: '체액의 삼투압과 수분 균형을 조절해요. 과다 섭취는 피해야 해요!',
    targetQuota: 3
  }
};

/**
 * 10대 영양소 매핑 식품 목록
 * 요청된 모든 식품 항목 반영 및 과학적 다중 영양소 태그 지정
 */
const FOOD_ITEMS = [
  // 1) 탄수화물 계열
  { id: 'grains', name: '곡류', icon: '🌾', nutrients: ['carbohydrate'] },
  { id: 'noodles', name: '국수', icon: '🍜', nutrients: ['carbohydrate'] },
  { id: 'bread', name: '빵', icon: '🍞', nutrients: ['carbohydrate'] },
  { id: 'potato', name: '감자', icon: '🥔', nutrients: ['carbohydrate'] },
  { id: 'sweet_potato', name: '고구마', icon: '🍠', nutrients: ['carbohydrate'] },
  { id: 'rice_cake', name: '떡', icon: '🍡', nutrients: ['carbohydrate'] },
  { id: 'fruit', name: '과일', icon: '🍇', nutrients: ['carbohydrate', 'vitaminC'] },
  { id: 'fruit_group', name: '과일류', icon: '🍎', nutrients: ['carbohydrate', 'vitaminC'] },
  { id: 'sugar', name: '설탕', icon: '🍬', nutrients: ['carbohydrate'] },
  { id: 'honey', name: '꿀', icon: '🍯', nutrients: ['carbohydrate'] },
  { id: 'chocolate', name: '초콜릿', icon: '🍫', nutrients: ['carbohydrate', 'fat'] },
  { id: 'candy', name: '사탕', icon: '🍭', nutrients: ['carbohydrate'] },
  { id: 'vegetables', name: '채소류', icon: '🥗', nutrients: ['carbohydrate', 'vitaminA', 'vitaminC'] },
  { id: 'seaweed', name: '해조류', icon: '🌿', nutrients: ['carbohydrate', 'calcium'] },
  { id: 'mixed_grains', name: '잡곡류', icon: '🥣', nutrients: ['carbohydrate', 'vitaminB'] },

  // 2) 단백질 계열
  { id: 'beef', name: '쇠고기', icon: '🥩', nutrients: ['protein', 'iron'] },
  { id: 'pork', name: '돼지고기', icon: '🥓', nutrients: ['protein', 'vitaminB'] },
  { id: 'chicken', name: '닭고기', icon: '🍗', nutrients: ['protein'] },
  { id: 'fish', name: '생선', icon: '🐟', nutrients: ['protein'] },
  { id: 'egg', name: '달걀', icon: '🥚', nutrients: ['protein', 'vitaminB', 'vitaminD'] },
  { id: 'beans', name: '콩', icon: '🫘', nutrients: ['protein', 'vitaminB'] },
  { id: 'tofu', name: '두부', icon: '🧊', nutrients: ['protein'] },
  { id: 'soy_milk', name: '두유', icon: '🥛', nutrients: ['protein'] },

  // 3) 지방 계열
  { id: 'butter', name: '버터', icon: '🧈', nutrients: ['fat'] },
  { id: 'pork_fat', name: '돼지비계', icon: '🥓', nutrients: ['fat'] },
  { id: 'beef_tallow', name: '쇠기름', icon: '🛢️', nutrients: ['fat'] },
  { id: 'sesame_oil', name: '참기름', icon: '🍶', nutrients: ['fat'] },
  { id: 'perilla_oil', name: '들기름', icon: '🍾', nutrients: ['fat'] },
  { id: 'olive_oil', name: '올리브유', icon: '🫒', nutrients: ['fat'] },
  { id: 'nuts', name: '견과류', icon: '🥜', nutrients: ['fat', 'protein'] },
  { id: 'blue_fish_oil', name: '등 푸른 생선(기름)', icon: '🐟', nutrients: ['fat', 'protein'] },

  // 4) 비타민 A 계열
  { id: 'beef_liver', name: '쇠간', icon: '🥩', nutrients: ['vitaminA', 'vitaminB', 'vitaminD', 'iron'] },
  { id: 'egg_yolk', name: '달걀노른자', icon: '🍳', nutrients: ['vitaminA', 'iron', 'vitaminD'] },
  { id: 'carrot', name: '당근', icon: '🥕', nutrients: ['vitaminA'] },
  { id: 'pumpkin', name: '단호박', icon: '🎃', nutrients: ['vitaminA'] },
  { id: 'tomato', name: '토마토', icon: '🍅', nutrients: ['vitaminA', 'vitaminC'] },

  // 5) 비타민 B 계열 (추가 고유식품)
  { id: 'brown_rice', name: '현미', icon: '🌾', nutrients: ['vitaminB', 'carbohydrate'] },
  { id: 'milk', name: '우유', icon: '🥛', nutrients: ['vitaminB', 'vitaminD', 'calcium'] },
  { id: 'yogurt', name: '요구르트', icon: '🍶', nutrients: ['vitaminB', 'calcium'] },
  { id: 'cheese', name: '치즈', icon: '🧀', nutrients: ['vitaminB', 'calcium'] },
  { id: 'meat', name: '육류', icon: '🍖', nutrients: ['vitaminB', 'protein'] },

  // 6) 비타민 C 계열
  { id: 'tangerine', name: '귤', icon: '🍊', nutrients: ['vitaminC'] },
  { id: 'strawberry', name: '딸기', icon: '🍓', nutrients: ['vitaminC'] },
  { id: 'spinach', name: '시금치', icon: '🥬', nutrients: ['vitaminC', 'iron'] },
  { id: 'pepper', name: '고추', icon: '🌶️', nutrients: ['vitaminC'] },

  // 7) 비타민 D 계열
  { id: 'mushroom', name: '버섯', icon: '🍄', nutrients: ['vitaminD'] },

  // 8) 칼슘 계열
  { id: 'dairy_products', name: '우유 및 유제품', icon: '🥛', nutrients: ['calcium', 'vitaminB'] },
  { id: 'bone_in_fish', name: '뼈째 먹는 생선', icon: '🐟', nutrients: ['calcium', 'protein'] },

  // 9) 철 계열
  { id: 'green_vegetables', name: '녹색 채소', icon: '🥦', nutrients: ['iron', 'vitaminA', 'vitaminC'] },

  // 10) 나트륨 계열
  { id: 'salt', name: '소금', icon: '🧂', nutrients: ['sodium'] },
  { id: 'ramen', name: '라면', icon: '🍜', nutrients: ['sodium', 'carbohydrate'] },
  { id: 'ketchup', name: '케첩', icon: '🥫', nutrients: ['sodium'] },
  { id: 'sauces', name: '장류(된장/고추장/간장)', icon: '🏺', nutrients: ['sodium'] }
];

// 영양소 목록 순서 (게임 라운드 진행용)
const NUTRIENT_ORDER = [
  'carbohydrate',
  'protein',
  'fat',
  'vitaminA',
  'vitaminB',
  'vitaminC',
  'vitaminD',
  'calcium',
  'iron',
  'sodium'
];
