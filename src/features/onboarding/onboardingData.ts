import type { ImageSource } from 'expo-image';

export type CharacterId = 'daily' | 'cozy' | 'casual' | 'neat' | 'ropan';
export type PetSpecies = 'dog' | 'cat' | 'rabbit';

export type CharacterOption = {
  id: CharacterId;
  name: string;
  description: string;
  image: ImageSource;
};

export type PetOption = {
  id: PetSpecies;
  name: string;
  description: string;
  image: ImageSource;
};

export const characterOptions: CharacterOption[] = [
  {
    id: 'daily',
    name: '내추럴 데일리',
    description: '편안하고 현실적인 무드',
    image: require('../../../assets/images/characters/daily.png'),
  },
  {
    id: 'cozy',
    name: '코지 스웨터',
    description: '따뜻하고 포근한 분위기',
    image: require('../../../assets/images/characters/cozy.png'),
  },
  {
    id: 'casual',
    name: '심플 캐주얼',
    description: '활동적이고 가벼운 스타일',
    image: require('../../../assets/images/characters/casual.png'),
  },
  {
    id: 'neat',
    name: '차분 니트룩',
    description: '잔잔하고 단정한 무드',
    image: require('../../../assets/images/characters/neat.png'),
  },
  {
    id: 'ropan',
    name: '로맨틱 로판',
    description: '우아하고 로맨틱한 분위기',
    image: require('../../../assets/images/characters/ropan.png'),
  },
];

export const petOptions: PetOption[] = [
  {
    id: 'dog',
    name: '강아지',
    description: '다정하고 활발한 친구',
    image: require('../../../assets/images/pets/dog.png'),
  },
  {
    id: 'cat',
    name: '고양이',
    description: '차분하고 호기심 많은 친구',
    image: require('../../../assets/images/pets/cat.png'),
  },
  {
    id: 'rabbit',
    name: '토끼',
    description: '조용하고 포근한 친구',
    image: require('../../../assets/images/pets/rabbit.png'),
  },
];

export function getCharacterOption(id: CharacterId) {
  return characterOptions.find((option) => option.id === id) ?? characterOptions[0];
}

export function getPetOption(id: PetSpecies) {
  return petOptions.find((option) => option.id === id) ?? petOptions[0];
}
