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