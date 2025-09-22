import { defineQuery, IWorld } from 'bitecs';
import { Input } from '../types/ecs';

export class InputSystem {
  private inputQuery = defineQuery([Input]);
  private keys: Set<string> = new Set();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      e.preventDefault();
    });

    // 포커스를 잃었을 때 모든 키 상태를 초기화
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  execute(world: IWorld) {
    const entities = this.inputQuery(world);

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // WASD 키와 화살표 키 지원
      Input.up[eid] = (this.keys.has('KeyW') || this.keys.has('ArrowUp')) ? 1 : 0;
      Input.down[eid] = (this.keys.has('KeyS') || this.keys.has('ArrowDown')) ? 1 : 0;
      Input.left[eid] = (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ? 1 : 0;
      Input.right[eid] = (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ? 1 : 0;
    }
  }

  destroy() {
    // 이벤트 리스너 정리는 실제로는 더 복잡하게 구현해야 함
    this.keys.clear();
  }
}