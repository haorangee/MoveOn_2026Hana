import type { ImageSourcePropType } from 'react-native';

export type MvpCharacterGender = 'male' | 'female';

export type MvpCharacterId =
  | 'male-01'
  | 'male-02'
  | 'male-03'
  | 'male-04'
  | 'male-05'
  | 'male-06'
  | 'male-07'
  | 'male-08'
  | 'male-09'
  | 'male-10'
  | 'female-01'
  | 'female-02'
  | 'female-03'
  | 'female-04'
  | 'female-05'
  | 'female-06'
  | 'female-07'
  | 'female-08'
  | 'female-09'
  | 'female-10';

export interface MvpCharacterCatalogItem {
  id: MvpCharacterId;
  gender: MvpCharacterGender;
  displayName: string;
  source: ImageSourcePropType;
}

export type MvpPetSpecies = 'dog' | 'cat' | 'hamster' | 'squirrel';

export type MvpPetId =
  | 'dog-bichon'
  | 'dog-shiba'
  | 'dog-poodle'
  | 'cat-american-shorthair'
  | 'cat-siamese'
  | 'cat-calico'
  | 'hamster-golden'
  | 'squirrel';

export interface MvpPetCatalogItem {
  id: MvpPetId;
  species: MvpPetSpecies;
  displayName: string;
  source: ImageSourcePropType;
}
