import { RangeAssignRulesPanel } from '../../../components/routes/RangeAssignRulesPanel';
import type { RangeAssignRule } from '../../../lib/rangeAssignRules';
import type { Client, User, Vehicle } from '../../../types';
import { ImportExcelPreviewFooter } from './ImportExcelPreviewFooter';
import { ImportExcelPreviewOrdersTable } from './ImportExcelPreviewOrdersTable';
import { ImportExcelPreviewRouteFields } from './ImportExcelPreviewRouteFields';
import { ImportExcelPreviewSummary } from './ImportExcelPreviewSummary';
import type { ImportExcelPreview, ImportExcelPreviewRow } from './importExcelPreviewTypes';

export function ImportExcelPreviewPanel({
  preview,
  previewRows,
  visibleRows,
  showAllRows,
  onToggleShowAllRows,
  clients,
  accountClientId,
  onAccountClientIdChange,
  routeSequence,
  onRouteSequenceChange,
  parsedRouteSequence,
  duplicateSequenceError,
  suggestedRouteSequence,
  excelRouteNumber,
  routeName,
  onRouteNameChange,
  routeDate,
  onRouteDateChange,
  assignRules,
  onAssignRulesChange,
  onApplyRules,
  drivers,
  vehiclesSorted,
  rowDriverId,
  onRowDriverIdChange,
  rowVehicleId,
  onRowVehicleIdChange,
  assignBusy,
  assignProgress,
  confirmLoading,
  onConfirm,
  onClose,
  onClearConfirmError,
}: {
  preview: ImportExcelPreview;
  previewRows: ImportExcelPreviewRow[];
  visibleRows: ImportExcelPreviewRow[];
  showAllRows: boolean;
  onToggleShowAllRows: () => void;
  clients: Client[];
  accountClientId: string;
  onAccountClientIdChange: (id: string) => void;
  routeSequence: string;
  onRouteSequenceChange: (value: string) => void;
  parsedRouteSequence: number | null;
  duplicateSequenceError: boolean;
  suggestedRouteSequence: number;
  excelRouteNumber: string | null;
  routeName: string;
  onRouteNameChange: (value: string) => void;
  routeDate: string;
  onRouteDateChange: (value: string) => void;
  assignRules: RangeAssignRule[];
  onAssignRulesChange: (rules: RangeAssignRule[]) => void;
  onApplyRules: () => void;
  drivers: User[];
  vehiclesSorted: Vehicle[];
  rowDriverId: Record<number, string>;
  onRowDriverIdChange: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
  rowVehicleId: Record<number, string>;
  onRowVehicleIdChange: (updater: (prev: Record<number, string>) => Record<number, string>) => void;
  assignBusy: boolean;
  assignProgress: { done: number; total: number } | null;
  confirmLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onClearConfirmError: () => void;
}) {
  return (
    <>
      <ImportExcelPreviewSummary preview={preview} />

      <ImportExcelPreviewRouteFields
        preview={preview}
        clients={clients}
        accountClientId={accountClientId}
        onAccountClientIdChange={onAccountClientIdChange}
        routeSequence={routeSequence}
        onRouteSequenceChange={onRouteSequenceChange}
        parsedRouteSequence={parsedRouteSequence}
        duplicateSequenceError={duplicateSequenceError}
        suggestedRouteSequence={suggestedRouteSequence}
        excelRouteNumber={excelRouteNumber}
        routeName={routeName}
        onRouteNameChange={onRouteNameChange}
        routeDate={routeDate}
        onRouteDateChange={onRouteDateChange}
        onClearConfirmError={onClearConfirmError}
      />

      <RangeAssignRulesPanel
        total={previewRows.length}
        rules={assignRules}
        onRulesChange={(next) => {
          onAssignRulesChange(next);
          if (next.length === 0) {
            onRowDriverIdChange(() => ({}));
            onRowVehicleIdChange(() => ({}));
          }
        }}
        onApplyRules={onApplyRules}
        drivers={drivers}
        vehicles={vehiclesSorted}
      />

      {preview.driver_name_hint && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          <span className="font-medium">Chofer en el Excel:</span>{' '}
          <span translate="no">{preview.driver_name_hint}</span>
          {' '}(solo referencia, asígnalo desde el panel de pedidos)
        </p>
      )}

      <ImportExcelPreviewOrdersTable
        previewRows={previewRows}
        visibleRows={visibleRows}
        showAllRows={showAllRows}
        onToggleShowAllRows={onToggleShowAllRows}
        drivers={drivers}
        vehiclesSorted={vehiclesSorted}
        rowDriverId={rowDriverId}
        onRowDriverIdChange={onRowDriverIdChange}
        rowVehicleId={rowVehicleId}
        onRowVehicleIdChange={onRowVehicleIdChange}
      />

      <ImportExcelPreviewFooter
        previewRowCount={previewRows.length}
        confirmLoading={confirmLoading}
        assignBusy={assignBusy}
        parsedRouteSequence={parsedRouteSequence}
        assignProgress={assignProgress}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    </>
  );
}
