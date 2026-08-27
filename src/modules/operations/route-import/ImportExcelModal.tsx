import { Modal } from '../../../components/ui/Modal';
import { ImportExcelErrorAlerts } from './ImportExcelErrorAlerts';
import { ImportExcelFileDropzone } from './ImportExcelFileDropzone';
import { ImportExcelFormatPicker } from './ImportExcelFormatPicker';
import { ImportExcelPreviewPanel } from './ImportExcelPreviewPanel';
import { ImportExcelSuccessStep } from './ImportExcelSuccessStep';
import { useImportExcelModal } from './useImportExcelModal';

export function ImportExcelModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const m = useImportExcelModal(open, onClose, onImported);

  if (!open) return null;

  return (
    <Modal open={open} onClose={m.handleClose} title="Importar desde Excel" size="2xl">
      <div className="space-y-5">
        {m.step !== 'done' && (
          <ImportExcelFormatPicker
            formatId={m.formatId}
            formatAutoPicked={m.formatAutoPicked}
            excelFormats={m.excelFormats}
            formatEval={m.formatEval}
            formatSelectOptions={m.formatSelectOptions}
            previewLoading={m.previewLoading}
            confirmLoading={m.confirmLoading}
            evaluateLoading={m.evaluateLoading}
            onFormatChange={m.handleFormatChange}
          />
        )}

        {m.step !== 'done' && (
          <ImportExcelFileDropzone
            fileInputRef={m.fileInputRef}
            file={m.file}
            previewLoading={m.previewLoading}
            confirmLoading={m.confirmLoading}
            evaluateLoading={m.evaluateLoading}
            onFileChange={(e) => void m.handleFileChange(e)}
          />
        )}

        <ImportExcelErrorAlerts
          previewError={m.previewError}
          confirmError={m.confirmError}
          duplicateSequenceError={m.duplicateSequenceError}
        />

        {m.step === 'done' && m.lastResult && (
          <ImportExcelSuccessStep
            lastResult={m.lastResult}
            parsedRouteSequence={m.parsedRouteSequence}
            preview={m.preview}
            onClose={m.handleClose}
          />
        )}

        {m.step === 'preview' && m.preview && (
          <ImportExcelPreviewPanel
            preview={m.preview}
            previewRows={m.previewRows}
            visibleRows={m.visibleRows}
            showAllRows={m.showAllRows}
            onToggleShowAllRows={() => m.setShowAllRows((v) => !v)}
            clients={m.clients}
            accountClientId={m.accountClientId}
            onAccountClientIdChange={m.setAccountClientId}
            routeSequence={m.routeSequence}
            onRouteSequenceChange={m.setRouteSequence}
            parsedRouteSequence={m.parsedRouteSequence}
            duplicateSequenceError={m.duplicateSequenceError}
            suggestedRouteSequence={m.suggestedRouteSequence}
            excelRouteNumber={m.excelRouteNumber}
            routeName={m.routeName}
            onRouteNameChange={m.setRouteName}
            routeDate={m.routeDate}
            onRouteDateChange={m.setRouteDate}
            assignRules={m.assignRules}
            onAssignRulesChange={m.setAssignRules}
            onApplyRules={m.applyRules}
            drivers={m.drivers}
            vehiclesSorted={m.vehiclesSorted}
            rowDriverId={m.rowDriverId}
            onRowDriverIdChange={m.setRowDriverId}
            rowVehicleId={m.rowVehicleId}
            onRowVehicleIdChange={m.setRowVehicleId}
            assignBusy={m.assignBusy}
            assignProgress={m.assignProgress}
            confirmLoading={m.confirmLoading}
            onConfirm={m.handleConfirm}
            onClose={m.handleClose}
            onClearConfirmError={m.clearConfirmError}
          />
        )}
      </div>
    </Modal>
  );
}
