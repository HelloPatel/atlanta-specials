import PrintCenter from '../components/print/PrintCenter';
import { PageHeader } from '../components/ui';

export default function PrintExport() {
  return (
    <div>
      <PageHeader
        eyebrow="Paper"
        title="Print and Export"
        subtitle="Generate place cards, table assignments, and guest lists as PDFs."
      />
      <PrintCenter />
    </div>
  );
}
