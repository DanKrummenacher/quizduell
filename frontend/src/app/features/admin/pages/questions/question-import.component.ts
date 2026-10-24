import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  inject,
  output,
  signal,
} from '@angular/core';
import '@css-ch/components/icon';
import { ADMIN_LIMITS } from '../../../../core/contracts/admin.contract';
import { AdminApi } from '../../core/admin-api.service';
import { AdminData } from '../../core/admin-data.service';
import { ConfirmService } from '../../core/confirm.service';
import {
  CSV_COLUMNS,
  download,
  type ImportPreview,
  previewImport,
} from '../../core/csv';
import { formatInt, plural } from '../../core/format';
import { NotifyService } from '../../core/notify.service';
import { AutofocusDirective } from '../../ui/autofocus.directive';
import { messageOf } from './questions.component';

const PREVIEW_ROWS = 200;

const TEMPLATE =
  '\uFEFF' +
  [
    CSV_COLUMNS.join(';'),
    'Wie viele Kantone hat die Schweiz?;26;23;20;24;A;Schweiz;ja',
    'Welche Zahl folgt? 1, 1, 2, 3, 5, 8, …;11;12;13;15;C;Logik;ja',
  ].join('\r\n') +
  '\r\n';

/** Imports questions from a CSV file after checking every row. */
@Component({
  selector: 'app-question-import',
  imports: [AutofocusDirective],
  templateUrl: './question-import.component.html',
  styleUrl: './question-import.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class QuestionImportComponent {
  readonly closed = output<void>();

  private readonly api = inject(AdminApi);
  private readonly data = inject(AdminData);
  private readonly notify = inject(NotifyService);
  private readonly confirm = inject(ConfirmService);

  protected readonly formatInt = formatInt;
  protected readonly limit = ADMIN_LIMITS.importRows;
  protected readonly fileName = signal<string | null>(null);
  protected readonly preview = signal<ImportPreview | null>(null);
  protected readonly skipDuplicates = signal(true);
  protected readonly dragging = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly summary = computed(() => {
    const rows = this.preview()?.rows ?? [];
    const invalid = rows.filter((row) => row.problem).length;
    const duplicates = rows.filter((row) => !row.problem && row.duplicate).length;
    const ready = rows.filter(
      (row) => !row.problem && !(row.duplicate && this.skipDuplicates()),
    ).length;
    return { total: rows.length, invalid, duplicates, ready };
  });

  protected readonly rows = computed(() =>
    (this.preview()?.rows ?? []).slice(0, PREVIEW_ROWS).map((row) => ({
      ...row,
      status: row.problem
        ? 'error'
        : row.duplicate
          ? this.skipDuplicates()
            ? 'skip'
            : 'duplicate'
          : 'ok',
    })),
  );

  protected readonly hiddenRows = computed(() =>
    Math.max(0, (this.preview()?.rows.length ?? 0) - PREVIEW_ROWS),
  );

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.confirm.request()) {
      this.closed.emit();
    }
  }

  protected onSkip(event: Event): void {
    this.skipDuplicates.set((event.target as HTMLInputElement).checked);
  }

  protected downloadTemplate(): void {
    download('playduelio-vorlage.csv', TEMPLATE);
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      void this.read(file);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      void this.read(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected reset(): void {
    this.fileName.set(null);
    this.preview.set(null);
    this.error.set(null);
  }

  private async read(file: File): Promise<void> {
    this.error.set(null);
    if (file.size > 5_000_000) {
      this.error.set('Die Datei ist grösser als 5 MB.');
      return;
    }
    const bytes = await file.arrayBuffer();
    let text = new TextDecoder('utf-8').decode(bytes);
    // Excel on Windows often saves CSV in Windows-1252.
    if (text.includes('�')) {
      text = new TextDecoder('windows-1252').decode(bytes);
    }
    const preview = previewImport(text, this.data.questions.value() ?? []);
    if (!preview.error && preview.rows.length > this.limit) {
      this.error.set(
        `Die Datei enthält ${formatInt(preview.rows.length)} Fragen. Pro Import gehen höchstens ${formatInt(this.limit)} – bitte aufteilen.`,
      );
      return;
    }
    this.fileName.set(file.name);
    this.preview.set(preview);
  }

  protected async import(): Promise<void> {
    const rows = (this.preview()?.rows ?? []).filter(
      (row) => !row.problem && !(row.duplicate && this.skipDuplicates()),
    );
    if (!rows.length || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      const result = await this.api.importQuestions({
        questions: rows.map((row) => row.question),
        skipDuplicates: this.skipDuplicates(),
      });
      await this.data.reloadQuestions();
      this.notify.success(
        `${plural(result.imported, 'Frage', 'Fragen')} importiert` +
          (result.skipped ? `, ${formatInt(result.skipped)} übersprungen` : ''),
      );
      this.closed.emit();
    } catch (error) {
      this.error.set(messageOf(error));
    } finally {
      this.busy.set(false);
    }
  }
}
