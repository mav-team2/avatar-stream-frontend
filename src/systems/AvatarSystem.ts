import { defineQuery, IWorld } from 'bitecs';
import { Position, Avatar, Movement, Input } from '../types/ecs';
import { AvatarDirection } from '../types/avatar';

export class AvatarSystem {
  private avatarQuery = defineQuery([Position, Avatar, Movement]);
  private inputQuery = defineQuery([Input, Position, Avatar, Movement]);

  execute(world: IWorld, deltaTime: number) {
    this.processInput(world);
    this.updateMovement(world, deltaTime);
  }

  private processInput(world: IWorld) {
    const entities = this.inputQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      const inputUp = Input.up[eid];
      const inputDown = Input.down[eid];
      const inputLeft = Input.left[eid];
      const inputRight = Input.right[eid];

      let newDirection = AvatarDirection.CENTER;
      let isMoving = 0;

      if (inputUp) {
        newDirection = AvatarDirection.BACK;
        Movement.targetY[eid] = Position.y[eid] - Movement.velocity[eid];
        isMoving = 1;
      } else if (inputDown) {
        newDirection = AvatarDirection.FRONT;
        Movement.targetY[eid] = Position.y[eid] + Movement.velocity[eid];
        isMoving = 1;
      }

      if (inputLeft) {
        newDirection = AvatarDirection.LEFT;
        Movement.targetX[eid] = Position.x[eid] - Movement.velocity[eid];
        isMoving = 1;
      } else if (inputRight) {
        newDirection = AvatarDirection.RIGHT;
        Movement.targetX[eid] = Position.x[eid] + Movement.velocity[eid];
        isMoving = 1;
      }

      // 대각선 이동 처리
      if ((inputUp || inputDown) && (inputLeft || inputRight)) {
        const speed = Movement.velocity[eid] * 0.707; // √2로 나누어 대각선 속도 정규화

        if (inputUp) {
          Movement.targetY[eid] = Position.y[eid] - speed;
        } else if (inputDown) {
          Movement.targetY[eid] = Position.y[eid] + speed;
        }

        if (inputLeft) {
          Movement.targetX[eid] = Position.x[eid] - speed;
        } else if (inputRight) {
          Movement.targetX[eid] = Position.x[eid] + speed;
        }
      }

      Avatar.currentDirection[eid] = newDirection;
      Movement.isMoving[eid] = isMoving;

      // 입력이 없으면 이동을 멈춤
      if (!inputUp && !inputDown && !inputLeft && !inputRight) {
        Movement.targetX[eid] = Position.x[eid];
        Movement.targetY[eid] = Position.y[eid];
        Movement.isMoving[eid] = 0;
        Avatar.currentDirection[eid] = AvatarDirection.CENTER;
      }
    }
  }

  private updateMovement(world: IWorld, deltaTime: number) {
    const entities = this.avatarQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      if (!Movement.isMoving[eid]) continue;

      const currentX = Position.x[eid];
      const currentY = Position.y[eid];
      const targetX = Movement.targetX[eid];
      const targetY = Movement.targetY[eid];

      const deltaX = targetX - currentX;
      const deltaY = targetY - currentY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < 1) {
        // 목표에 도달
        Position.x[eid] = targetX;
        Position.y[eid] = targetY;
        Movement.isMoving[eid] = 0;
        Avatar.currentDirection[eid] = AvatarDirection.CENTER;
      } else {
        // 목표를 향해 이동
        const speed = Movement.velocity[eid] * deltaTime;
        const normalizedX = deltaX / distance;
        const normalizedY = deltaY / distance;

        Position.x[eid] += normalizedX * speed;
        Position.y[eid] += normalizedY * speed;
      }
    }
  }
}