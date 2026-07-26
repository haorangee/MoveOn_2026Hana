import type {
  MvpCharacterCatalogItem,
  MvpCharacterGender,
  MvpCharacterId,
} from '../types/customization';

export const DEFAULT_MVP_CHARACTER_ID: MvpCharacterId = 'female-01';

export const MVP_CHARACTER_ASSETS = {
  'male-01': require('../../../../assets/images/characters/mvp/male/character-male-01.png'),
  'male-02': require('../../../../assets/images/characters/mvp/male/character-male-02.png'),
  'male-03': require('../../../../assets/images/characters/mvp/male/character-male-03.png'),
  'male-04': require('../../../../assets/images/characters/mvp/male/character-male-04.png'),
  'male-05': require('../../../../assets/images/characters/mvp/male/character-male-05.png'),
  'male-06': require('../../../../assets/images/characters/mvp/male/character-male-06.png'),
  'male-07': require('../../../../assets/images/characters/mvp/male/character-male-07.png'),
  'male-08': require('../../../../assets/images/characters/mvp/male/character-male-08.png'),
  'male-09': require('../../../../assets/images/characters/mvp/male/character-male-09.png'),
  'male-10': require('../../../../assets/images/characters/mvp/male/character-male-10.png'),
  'female-01': require('../../../../assets/images/characters/mvp/female/character-female-01.png'),
  'female-02': require('../../../../assets/images/characters/mvp/female/character-female-02.png'),
  'female-03': require('../../../../assets/images/characters/mvp/female/character-female-03.png'),
  'female-04': require('../../../../assets/images/characters/mvp/female/character-female-04.png'),
  'female-05': require('../../../../assets/images/characters/mvp/female/character-female-05.png'),
  'female-06': require('../../../../assets/images/characters/mvp/female/character-female-06.png'),
  'female-07': require('../../../../assets/images/characters/mvp/female/character-female-07.png'),
  'female-08': require('../../../../assets/images/characters/mvp/female/character-female-08.png'),
  'female-09': require('../../../../assets/images/characters/mvp/female/character-female-09.png'),
  'female-10': require('../../../../assets/images/characters/mvp/female/character-female-10.png'),
} as const;

export const MVP_CHARACTER_IDS = Object.keys(MVP_CHARACTER_ASSETS) as MvpCharacterId[];

function getCharacterGender(id: MvpCharacterId): MvpCharacterGender {
  return id.startsWith('male-') ? 'male' : 'female';
}

function getCharacterIndex(id: MvpCharacterId) {
  return Number(id.split('-')[1] ?? '1');
}

export const MVP_CHARACTER_CATALOG: MvpCharacterCatalogItem[] = MVP_CHARACTER_IDS.map((id) => {
  const gender = getCharacterGender(id);
  const displayGender = gender === 'male' ? '남자' : '여자';

  return {
    id,
    gender,
    displayName: `${displayGender} 캐릭터 ${getCharacterIndex(id)}`,
    source: MVP_CHARACTER_ASSETS[id],
  };
});

export function isMvpCharacterId(value: unknown): value is MvpCharacterId {
  return typeof value === 'string' && value in MVP_CHARACTER_ASSETS;
}

export function getMvpCharacterCatalogItem(characterId: unknown) {
  const resolvedId = isMvpCharacterId(characterId)
    ? characterId
    : DEFAULT_MVP_CHARACTER_ID;

  return MVP_CHARACTER_CATALOG.find((item) => item.id === resolvedId)
    ?? MVP_CHARACTER_CATALOG[0];
}

export function getMvpCharacterAsset(characterId: unknown) {
  return getMvpCharacterCatalogItem(characterId).source;
}
