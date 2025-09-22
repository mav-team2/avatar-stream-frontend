export enum AvatarDirection {
  CENTER = 0,
  BACK = 1,
  FRONT = 2,
  LEFT = 3,
  RIGHT = 4
}

export const AVATAR_DIRECTION_NAMES = {
  [AvatarDirection.CENTER]: 'center',
  [AvatarDirection.BACK]: 'back',
  [AvatarDirection.FRONT]: 'front',
  [AvatarDirection.LEFT]: 'left',
  [AvatarDirection.RIGHT]: 'right'
} as const;

export interface AvatarAsset {
  id: number;
  direction: AvatarDirection;
  image: HTMLImageElement;
  url: string;
}

export const getAvatarImageUrl = (id: number, direction: AvatarDirection): string => {
  const directionName = AVATAR_DIRECTION_NAMES[direction];
  return `https://d2pxh9orknb8as.cloudfront.net/${id}/${directionName}.png`;
};