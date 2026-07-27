import type {
  MvpPetCatalogItem,
  MvpPetId,
  MvpPetSpecies,
} from '../types/customization';

export const DEFAULT_MVP_PET_ID: MvpPetId = 'dog-bichon';

export const MVP_PET_ASSETS = {
  'dog-bichon': require('../../../../assets/images/pets/mvp/pet-dog-bichon-v1.png'),
  'dog-shiba': require('../../../../assets/images/pets/mvp/pet-dog-shiba-v1.png'),
  'dog-poodle': require('../../../../assets/images/pets/mvp/pet-dog-poodle-v1.png'),
  'cat-american-shorthair': require('../../../../assets/images/pets/mvp/pet-cat-american-shorthair-v1.png'),
  'cat-siamese': require('../../../../assets/images/pets/mvp/pet-cat-siamese-v1.png'),
  'cat-calico': require('../../../../assets/images/pets/mvp/pet-cat-calico-v1.png'),
  'hamster-golden': require('../../../../assets/images/pets/mvp/pet-hamster-golden-v1.png'),
  squirrel: require('../../../../assets/images/pets/mvp/pet-squirrel-v1.png'),
} as const;

export const MVP_PET_IDS = Object.keys(MVP_PET_ASSETS) as MvpPetId[];

export const MVP_PET_CATALOG: MvpPetCatalogItem[] = [
  {
    id: 'dog-bichon',
    species: 'dog',
    displayName: '비숑',
    source: MVP_PET_ASSETS['dog-bichon'],
  },
  {
    id: 'dog-shiba',
    species: 'dog',
    displayName: '시바견',
    source: MVP_PET_ASSETS['dog-shiba'],
  },
  {
    id: 'dog-poodle',
    species: 'dog',
    displayName: '푸들',
    source: MVP_PET_ASSETS['dog-poodle'],
  },
  {
    id: 'cat-american-shorthair',
    species: 'cat',
    displayName: '아메리칸 숏헤어',
    source: MVP_PET_ASSETS['cat-american-shorthair'],
  },
  {
    id: 'cat-siamese',
    species: 'cat',
    displayName: '샴고양이',
    source: MVP_PET_ASSETS['cat-siamese'],
  },
  {
    id: 'cat-calico',
    species: 'cat',
    displayName: '코리안 숏헤어',
    source: MVP_PET_ASSETS['cat-calico'],
  },
  {
    id: 'hamster-golden',
    species: 'hamster',
    displayName: '골든햄스터',
    source: MVP_PET_ASSETS['hamster-golden'],
  },
  {
    id: 'squirrel',
    species: 'squirrel',
    displayName: '다람쥐',
    source: MVP_PET_ASSETS.squirrel,
  },
];

const DEFAULT_PET_BY_SPECIES = {
  dog: 'dog-bichon',
  cat: 'cat-american-shorthair',
  hamster: 'hamster-golden',
  squirrel: 'squirrel',
} as const satisfies Record<MvpPetSpecies, MvpPetId>;

export function isMvpPetId(value: unknown): value is MvpPetId {
  return typeof value === 'string' && value in MVP_PET_ASSETS;
}

export function isMvpPetSpecies(value: unknown): value is MvpPetSpecies {
  return typeof value === 'string' && value in DEFAULT_PET_BY_SPECIES;
}

export function getDefaultMvpPetIdBySpecies(petSpecies: unknown): MvpPetId {
  return isMvpPetSpecies(petSpecies)
    ? DEFAULT_PET_BY_SPECIES[petSpecies]
    : DEFAULT_MVP_PET_ID;
}

export function getMvpPetCatalogItem(petId: unknown, petSpecies?: unknown) {
  const resolvedId = isMvpPetId(petId)
    ? petId
    : getDefaultMvpPetIdBySpecies(petSpecies);

  return MVP_PET_CATALOG.find((item) => item.id === resolvedId)
    ?? MVP_PET_CATALOG[0];
}

export function getMvpPetAsset(petId: unknown, petSpecies?: unknown) {
  return getMvpPetCatalogItem(petId, petSpecies).source;
}
