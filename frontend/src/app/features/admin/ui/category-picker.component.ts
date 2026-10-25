import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';

interface Choice {
  /** The category it sets, null for none. */
  value: string | null;
  label: string;
  count: number | null;
  kind: 'existing' | 'new' | 'none';
}

/**
 * A category field: type to filter the categories there are, pick one with the
 * mouse or the arrow keys, or take what was typed as a new one.
 */
@Component({
  selector: 'app-ad-category-picker',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="field" [class.is-open]="open()">
      <input
        #box
        type="text"
        role="combobox"
        autocomplete="off"
        [id]="inputId()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="inputId() + '-list'"
        [attr.aria-activedescendant]="
          open() && choices().length ? inputId() + '-' + active() : null
        "
        [attr.maxlength]="maxLength()"
        [placeholder]="'Ohne Kategorie'"
        [value]="query()"
        (focus)="show()"
        (click)="show()"
        (input)="onInput($event)"
        (keydown)="onKey($event)"
        (blur)="commit()"
      />
      @if (query()) {
        <button
          type="button"
          class="clear"
          aria-label="Kategorie entfernen"
          (mousedown)="$event.preventDefault()"
          (click)="pick(null)"
        >
          <css-icon icon="close" size="xs"></css-icon>
        </button>
      }
      <button
        type="button"
        class="toggle"
        tabindex="-1"
        aria-hidden="true"
        (mousedown)="$event.preventDefault()"
        (click)="open() ? hide() : show(); box.focus()"
      >
        <span class="chev"></span>
      </button>
    </div>
    @if (open() && choices().length) {
      <ul class="list" role="listbox" [id]="inputId() + '-list'">
        @for (
          choice of choices();
          track choice.label + choice.kind;
          let i = $index
        ) {
          <li
            role="option"
            [id]="inputId() + '-' + i"
            [class.is-active]="active() === i"
            [class.is-current]="
              choice.kind === 'existing' && choice.value === value()
            "
            [attr.data-kind]="choice.kind"
            [attr.aria-selected]="choice.value === value()"
            (mousedown)="$event.preventDefault()"
            (mouseenter)="active.set(i)"
            tabindex="-1"
            (click)="pick(choice.value)"
            (keydown.enter)="pick(choice.value)"
          >
            @switch (choice.kind) {
              @case ('new') {
                <css-icon icon="add" size="xs"></css-icon>
                <span class="name">«{{ choice.label }}» neu anlegen</span>
              }
              @case ('none') {
                <span class="name">Ohne Kategorie</span>
              }
              @default {
                <span class="name">{{ choice.label }}</span>
                <span class="count">{{ choice.count }}</span>
                @if (choice.value === value()) {
                  <css-icon class="check" icon="checkmark" size="xs"></css-icon>
                }
              }
            }
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
    }
    .field {
      display: flex;
      align-items: center;
      height: 38px;
      padding: 0 4px 0 12px;
      border: 1px solid rgba(0, 50, 125, 0.18);
      border-radius: 9px;
      background: #fff;
      transition:
        border-color 0.12s ease,
        box-shadow 0.12s ease;
    }
    .field:focus-within {
      border-color: #0078bb;
      box-shadow: 0 0 0 3px rgba(0, 120, 187, 0.16);
    }
    input {
      flex: 1;
      min-width: 0;
      height: 100%;
      padding: 0;
      border: 0;
      outline: 0;
      background: none;
      color: #00327d;
      font: inherit;
      font-size: 14px;
    }
    input::placeholder {
      color: #7d95b9;
    }
    .clear,
    .toggle {
      display: grid;
      flex: none;
      place-items: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: 7px;
      background: none;
      color: #7d95b9;
      cursor: pointer;
    }
    .clear:hover,
    .toggle:hover {
      background: #f3f6fa;
      color: #00327d;
    }
    .chev {
      width: 7px;
      height: 7px;
      margin-top: -3px;
      border-right: 1.5px solid currentColor;
      border-bottom: 1.5px solid currentColor;
      transform: rotate(45deg);
      transition: transform 0.15s ease;
    }
    .is-open .chev {
      margin-top: 3px;
      transform: rotate(225deg);
    }
    .list {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      left: 0;
      z-index: 30;
      display: grid;
      gap: 1px;
      max-height: 264px;
      margin: 0;
      padding: 6px;
      overflow-y: auto;
      border: 1px solid rgba(0, 50, 125, 0.1);
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 18px 40px -16px rgba(0, 50, 125, 0.4);
      list-style: none;
    }
    li {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 36px;
      padding: 0 10px;
      border-radius: 8px;
      color: #00327d;
      font-size: 14px;
      cursor: pointer;
    }
    li.is-active {
      background: #f3f6fa;
    }
    li.is-current {
      font-weight: 700;
    }
    li[data-kind='new'] {
      color: #0078bb;
      font-weight: 500;
    }
    li[data-kind='none'] {
      position: relative;
      margin-top: 11px;
      color: #4d70a4;
    }
    /* The line above «none» stands apart from its hover. */
    li[data-kind='none']::before {
      content: '';
      position: absolute;
      top: -6px;
      right: 4px;
      left: 4px;
      height: 1px;
      background: rgba(0, 50, 125, 0.08);
    }
    .name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .count {
      color: #7d95b9;
      font-size: 12.5px;
      font-weight: 400;
      font-variant-numeric: tabular-nums;
    }
    .check {
      color: #00327d;
    }
  `,
})
export class AdCategoryPickerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The category set now, '' for none. */
  readonly value = input('');
  /** The categories there are, with how many questions each has. */
  readonly categories = input<{ name: string; count: number }[]>([]);
  readonly inputId = input('category');
  readonly maxLength = input(50);
  readonly changed = output<string>();

  protected readonly open = signal(false);
  protected readonly active = signal(0);
  /** What is in the field while typing; follows the value otherwise. */
  private readonly typed = signal<string | null>(null);
  protected readonly query = computed(() => this.typed() ?? this.value());

  protected readonly choices = computed<Choice[]>(() => {
    const typed = this.typed();
    const term = (typed ?? '').trim().toLocaleLowerCase('de-CH');
    const list: Choice[] = this.categories()
      .filter((c) => !term || c.name.toLocaleLowerCase('de-CH').includes(term))
      .map((c) => ({
        value: c.name,
        label: c.name,
        count: c.count,
        kind: 'existing',
      }));
    const exact = this.categories().some(
      (c) => c.name.toLocaleLowerCase('de-CH') === term,
    );
    if (term && !exact) {
      list.unshift({
        value: typed!.trim(),
        label: typed!.trim(),
        count: null,
        kind: 'new',
      });
    }
    if (this.value()) {
      list.push({ value: null, label: '', count: null, kind: 'none' });
    }
    return list;
  });

  @HostListener('document:mousedown', ['$event'])
  protected onOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.hide();
    }
  }

  protected show(): void {
    this.open.set(true);
    const current = this.choices().findIndex((c) => c.value === this.value());
    this.active.set(Math.max(0, current));
  }

  protected hide(): void {
    this.open.set(false);
  }

  protected onInput(event: Event): void {
    this.typed.set((event.target as HTMLInputElement).value);
    this.open.set(true);
    this.active.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.choices().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open()) {
          this.show();
        } else if (count) {
          this.active.set((this.active() + 1) % count);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count) {
          this.active.set((this.active() - 1 + count) % count);
        }
        break;
      case 'Enter':
        if (this.open() && count) {
          event.preventDefault();
          this.pick(this.choices()[this.active()]!.value);
        }
        break;
      case 'Escape':
        if (this.open()) {
          // Closes the list only, not the drawer around it.
          event.preventDefault();
          event.stopPropagation();
          this.typed.set(null);
          this.hide();
        }
        break;
    }
  }

  /** Leaving the field keeps what was typed. */
  protected commit(): void {
    const typed = this.typed();
    if (typed !== null) {
      this.pick(typed.trim() || null);
    }
    this.hide();
  }

  protected pick(value: string | null): void {
    this.typed.set(null);
    this.hide();
    this.changed.emit(value ?? '');
  }
}
