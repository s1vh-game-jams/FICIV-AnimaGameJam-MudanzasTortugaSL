import type { GameNavigation } from '../app/navigation';
import type { AudioManager } from './audioManager';

/** Native Tab/mouse focus shares selection with arrows, without rebuilding focused links. */
export function bindMenuFocus(root: HTMLElement, navigation: GameNavigation, audio: AudioManager): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-menu-index]')) {
    button.addEventListener('focus', () => {
      const index = Number(button.dataset.menuIndex);
      if (navigation.options[index]?.disabled || index === navigation.selected) return;
      navigation.selected = index;
      audio.playUI('move');
      for (const option of root.querySelectorAll<HTMLButtonElement>('[data-menu-index]')) {
        const selected = Number(option.dataset.menuIndex) === index;
        option.classList.toggle('selected', selected);
        const arrow = option.querySelector('.selection-arrow');
        if (arrow) arrow.textContent = selected ? '►' : '';
      }
    });
  }
}
