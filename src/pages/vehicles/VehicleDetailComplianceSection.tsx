import type { VehicleDocument, VehicleDocumentKind } from '../../types';
import {
  COMPLIANCE_SUPPORTS_DOCUMENT_UPLOAD,
  COMPLIANCE_TO_DOCUMENT_KIND,
  type VehicleComplianceDetailItem,
} from '../../lib/vehicleCompliance';
import { VehicleComplianceDocumentCard } from '../../components/vehicles/VehicleComplianceDocumentCard';

export function VehicleDetailComplianceSection({
  complianceItems,
  documentsByKind,
  onUpload,
  onDeleteDocument,
}: {
  complianceItems: VehicleComplianceDetailItem[];
  documentsByKind: Map<VehicleDocumentKind, VehicleDocument>;
  onUpload: (kind: VehicleDocumentKind, file: File) => Promise<void>;
  onDeleteDocument: (kind: VehicleDocumentKind) => Promise<void>;
}) {
  return (
    <section aria-labelledby="vehicle-compliance-heading">
      <div className="mb-3">
        <h2 id="vehicle-compliance-heading" className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Documentación y vencimientos
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
          Mantención, permiso de circulación y revisión técnica. Puedes adjuntar foto o PDF en cada tarjeta.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {complianceItems.map((item) => {
          const docKind = COMPLIANCE_TO_DOCUMENT_KIND[item.kind];
          const allowUpload = COMPLIANCE_SUPPORTS_DOCUMENT_UPLOAD.includes(item.kind);
          return (
            <VehicleComplianceDocumentCard
              key={item.kind}
              item={item}
              allowUpload={allowUpload}
              document={documentsByKind.get(docKind)}
              onUpload={(file) => onUpload(docKind, file)}
              onDelete={() => onDeleteDocument(docKind)}
            />
          );
        })}
      </div>
    </section>
  );
}
