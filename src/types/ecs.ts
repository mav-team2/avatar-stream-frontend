import { defineComponent, Types } from 'bitecs';

export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});

export const Scale = defineComponent({
  x: Types.f32,
  y: Types.f32
});

export const Rotation = defineComponent({
  angle: Types.f32
});

export const Sprite = defineComponent({
  imageId: Types.ui32,
  width: Types.f32,
  height: Types.f32,
  sourceX: Types.f32,
  sourceY: Types.f32,
  sourceWidth: Types.f32,
  sourceHeight: Types.f32
});

export const Renderable = defineComponent({});

export const Avatar = defineComponent({
  id: Types.ui32,
  currentDirection: Types.ui8
});

export const Movement = defineComponent({
  velocity: Types.f32,
  targetX: Types.f32,
  targetY: Types.f32,
  isMoving: Types.ui8
});

export const Input = defineComponent({
  up: Types.ui8,
  down: Types.ui8,
  left: Types.ui8,
  right: Types.ui8
});

export const NetworkId = defineComponent({
  userId: Types.ui32
});

export const EventQueue = defineComponent({
  eventCount: Types.ui32
});

export const RemoteAvatar = defineComponent({
  isRemote: Types.ui8
});