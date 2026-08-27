import type { useRouteImportStore } from '../../../store/useRouteImportStore';

export type ImportExcelPreview = NonNullable<
  ReturnType<typeof useRouteImportStore.getState>['preview']
>;
export type ImportExcelPreviewRow = ImportExcelPreview['rows'][number];
